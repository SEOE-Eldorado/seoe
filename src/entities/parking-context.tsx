"use client"

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "@entities/auth-context"
import { useVehicles } from "@entities/vehicles-context"
import type { ParkingSession } from "@shared/types"
import { db } from "@shared/api/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { collection, query, where, getDocs, runTransaction, doc, Timestamp, setDoc, addDoc } from "firebase/firestore"

interface ParkingContextType {
  activeSessions: ParkingSession[]
  activeSession: ParkingSession | null
  startParking: (vehicleId: string, zone: string, address: string, hours: number, cost: number, lat?: number, lng?: number) => Promise<void>
  extendParking: (sessionId: string, additionalHours: number, cost: number) => Promise<void>
  endParking: (sessionId: string) => Promise<void>
  getRemainingTime: (session?: ParkingSession | null) => { hours: number; minutes: number } | null
  checkPlateStatus: (licensePlate: string) => Promise<ParkingSession | null>
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined)

export function ParkingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { vehicles } = useVehicles()
  const queryClient = useQueryClient()

  const { data: activeSessions = [], isLoading } = useQuery({
    queryKey: ['parking_sessions', user?.id],
    queryFn: async () => {
      if (!user) return []
      const q = query(
        collection(db, "parking_sessions"),
        where("userId", "==", user.id),
        where("status", "in", ["active", "expired"])
      )

      const snapshot = await getDocs(q)
      const sessions = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          userId: data.userId,
          vehicleId: data.vehicleId,
          vehiclePlate: data.vehiclePlate,
          zone: data.zone,
          address: data.address,
          startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
          cost: data.cost,
          costPerHour: data.costPerHour,
          status: data.status,
          location: data.location,
        } as ParkingSession
      })

      return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    },
    enabled: !!user,
    // Polling every minute to keep active session status updated 
    refetchInterval: 60000,
  })

  const loading = user ? isLoading : false;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['parking_sessions', user?.id] })

  // ── Parking Expiration Monitor ────────────────────────────────────────────
  // Checks every 30s whether the active session is expiring soon (5 or 10 min)
  // or has already expired, and writes a Firestore notification for the user.
  // Custom IDs prevent duplicate notifications across rerenders.
  const sentNotifRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user || activeSessions.length === 0) return

    const checkExpiry = async () => {
      for (const session of activeSessions) {
        if (session.status !== 'active') continue

        const now = new Date()
        const diff = session.endTime.getTime() - now.getTime()
        const minutesLeft = Math.floor(diff / 60000)

        const reminderTime = user.preferences?.reminderTime ?? 10
        const keyRemind = `${session.id}_expiring_${reminderTime}`
        if (minutesLeft <= reminderTime && minutesLeft > 5 && !sentNotifRef.current.has(keyRemind)) {
          sentNotifRef.current.add(keyRemind)
          try {
            await setDoc(doc(collection(db, "notifications"), keyRemind), {
              userId: user.id,
              type: "parking_expiring",
              title: "⏳ Estacionamiento por vencer",
              message: `Tu estacionamiento (${session.vehiclePlate}) vence en aproximadamente ${reminderTime} minutos. Extiende ahora para evitar una multa.`,
              priority: "high",
              actionUrl: "/activeParking",
              date: Timestamp.fromDate(now),
              read: false,
            })
          } catch (e) { console.error("notification error", e) }
        }

        // Fire 5-minute warning once per session
        const key5 = `${session.id}_expiring_5`
        if (minutesLeft <= 5 && minutesLeft > 0 && !sentNotifRef.current.has(key5)) {
          sentNotifRef.current.add(key5)
          try {
            await setDoc(doc(collection(db, "notifications"), key5), {
              userId: user.id,
              type: "parking_expiring",
              title: "🚨 Estacionamiento vence en 5 minutos",
              message: `¡Urgente! Tu estacionamiento (${session.vehiclePlate}) vence en menos de 5 minutos en ${session.zone}. Extiende ahora.`,
              priority: "urgent",
              actionUrl: "/activeParking",
              date: Timestamp.fromDate(now),
              read: false,
            })
          } catch (e) { console.error("notification error", e) }
        }

        // Fire expired notification once per session
        const keyExp = `${session.id}_expired`
        if (minutesLeft <= 0 && !sentNotifRef.current.has(keyExp)) {
          sentNotifRef.current.add(keyExp)
          try {
            await setDoc(doc(collection(db, "notifications"), keyExp), {
              userId: user.id,
              type: "parking_expired",
              title: "🔴 Estacionamiento vencido",
              message: `Tu estacionamiento para ${session.vehiclePlate} en ${session.zone} ha expirado. Finaliza o extiende la sesión para evitar una multa.`,
              priority: "urgent",
              actionUrl: "/activeParking",
              date: Timestamp.fromDate(now),
              read: false,
            })
          } catch (e) { console.error("notification error", e) }
        }
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessions, user])

  const startParkingMutation = useMutation({
    mutationFn: async ({ vehicleId, zone, address, hours, cost, lat, lng }: { vehicleId: string, zone: string, address: string, hours: number, cost: number, lat?: number, lng?: number }) => {
      if (!user) return
      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (!vehicle) throw new Error("Vehículo no encontrado")

      if (activeSessions.some(s => s.vehicleId === vehicleId && (s.status === 'active' || s.status === 'expired'))) {
        throw new Error("Este vehículo ya tiene un estacionamiento activo o expirado sin finalizar.")
      }

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.id)
        const userDoc = await transaction.get(userRef)

        if (!userDoc.exists()) throw new Error("Usuario no encontrado")

        const currentBalance = userDoc.data()?.balance || 0
        if (currentBalance < cost) {
          throw new Error("Saldo insuficiente. Por favor recarga tu billetera.")
        }

        const newSessionRef = doc(collection(db, "parking_sessions"))
        const startTime = new Date()
        const endTime = new Date(startTime.getTime() + (hours * 60 * 60 * 1000))

        transaction.update(userRef, { balance: currentBalance - cost })

        transaction.set(newSessionRef, {
          userId: user.id,
          vehicleId,
          vehiclePlate: vehicle.licensePlate,
          zone,
          address,
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          cost,
          costPerHour: cost / hours,
          status: 'active',
          location: lat && lng ? { lat, lng } : null
        })
      })
    },
    onSuccess: invalidate,
    onError: (error: any) => {
      console.error("Error starting parking", error);
      throw new Error(error.message || "Error al iniciar estacionamiento");
    }
  })

  const extendParkingMutation = useMutation({
    mutationFn: async ({ sessionId, additionalHours, cost }: { sessionId: string, additionalHours: number, cost: number }) => {
      if (!user) return
      const session = activeSessions.find(s => s.id === sessionId)
      if (!session) throw new Error("Sesión no encontrada")

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.id)
        const sessionRef = doc(db, "parking_sessions", session.id)

        const userDoc = await transaction.get(userRef)
        const sessionDoc = await transaction.get(sessionRef)

        if (!sessionDoc.exists()) throw new Error("Sesión no encontrada")
        if (sessionDoc.data()?.status !== 'active') throw new Error("La sesión no está activa")

        const currentBalance = userDoc.data()?.balance || 0
        if (currentBalance < cost) throw new Error("Saldo insuficiente")

        const currentEndTime = sessionDoc.data()?.endTime.toDate()
        const newEndTime = new Date(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000))

        transaction.update(userRef, { balance: currentBalance - cost })
        transaction.update(sessionRef, {
          endTime: Timestamp.fromDate(newEndTime),
          cost: (sessionDoc.data()?.cost || 0) + cost
        })
      })
    },
    onSuccess: invalidate,
    onError: (error: any) => {
      console.error("Error extending parking", error);
      throw new Error(error.message || "Error al extender estacionamiento");
    }
  })

  const endParkingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const sessionRef = doc(db, "parking_sessions", sessionId)
      await runTransaction(db, async (transaction) => {
        transaction.update(sessionRef, { status: 'completed' })
      })
    },
    onSuccess: invalidate,
  })

  const getRemainingTime = (sessionParam?: ParkingSession | null) => {
    const session = sessionParam !== undefined ? sessionParam : activeSessions[0]
    if (!session) return null

    const now = new Date()
    const diff = session.endTime.getTime() - now.getTime()

    if (diff <= 0) return { hours: 0, minutes: 0 }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes }
  }

  const checkPlateStatus = async (licensePlate: string): Promise<ParkingSession | null> => {
    try {
      const cleanPlate = licensePlate.toUpperCase().replace(/\s/g, "");
      const q = query(
        collection(db, "parking_sessions"),
        where("vehiclePlate", "==", cleanPlate),
        where("status", "in", ["active", "expired"])
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // If no active session, check for exemptions
        const exemptionQuery = query(collection(db, "exemptions"), where("plate", "==", cleanPlate));
        const exemptionSnap = await getDocs(exemptionQuery);

        if (!exemptionSnap.empty) {
          const exData = exemptionSnap.docs[0].data();
          const now = new Date();
          const futureDate = new Date();
          futureDate.setHours(now.getHours() + 24); // Represent as valid for the day

          return {
            id: "exemption-" + exemptionSnap.docs[0].id,
            userId: "system-exemption",
            vehicleId: "system-exemption",
            vehiclePlate: cleanPlate,
            zone: exData.type === "disability" ? "Libre (Discapacidad)" : "Beneficio Frentista",
            address: exData.type === "disability" ? "Válido en todas las zonas" : `Calles cubiertas: ${exData.exemptedStreets || "No especificadas"}`,
            startTime: now,
            endTime: futureDate,
            cost: 0,
            costPerHour: 0,
            status: "active",
          } as ParkingSession;
        }

        return null;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      return {
        id: docSnap.id,
        userId: data.userId,
        vehicleId: data.vehicleId,
        vehiclePlate: data.vehiclePlate,
        zone: data.zone,
        address: data.address,
        startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
        endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
        cost: data.cost,
        costPerHour: data.costPerHour,
        status: data.status,
        location: data.location,
      } as ParkingSession;
    } catch (error) {
      console.error("Error checking plate status:", error);
      throw error;
    }
  };

  return (
    <ParkingContext.Provider value={{
      activeSessions,
      activeSession: activeSessions[0] || null,
      startParking: async (vehicleId, zone, address, hours, cost, lat, lng) =>
        await startParkingMutation.mutateAsync({ vehicleId, zone, address, hours, cost, lat, lng }),
      extendParking: async (sessionId, additionalHours, cost) =>
        await extendParkingMutation.mutateAsync({ sessionId, additionalHours, cost }),
      endParking: async (sessionId) =>
        await endParkingMutation.mutateAsync(sessionId),
      getRemainingTime,
      checkPlateStatus
    }}>
      {!loading && children}
    </ParkingContext.Provider>
  )
}

export function useParking() {
  const context = useContext(ParkingContext)
  if (context === undefined) {
    throw new Error("useParking must be used within a ParkingProvider")
  }
  return context
}
