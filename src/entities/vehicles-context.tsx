"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useAuth } from "@entities/auth-context"
import { db } from "@shared/api/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  setDoc,
  Timestamp
} from "firebase/firestore"

export interface Vehicle {
  id: string
  userId: string
  brand: string
  model: string
  year: string
  color: string
  licensePlate: string
  isDefault: boolean
  insuranceExpiry?: string
  technicalReviewExpiry?: string
  driverLicenseExpiry?: string
}

export interface DocumentAlert {
  vehicleId: string
  vehicleName: string
  documentType: string
  expiryDate: string
  daysUntilExpiry: number
  isExpired: boolean
}

interface VehiclesContextType {
  vehicles: Vehicle[]
  addVehicle: (vehicle: Omit<Vehicle, "id" | "userId">) => Promise<void>
  removeVehicle: (id: string) => Promise<void>
  setDefaultVehicle: (id: string) => Promise<void>
  getDefaultVehicle: () => Vehicle | null
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>
  getDocumentAlerts: () => DocumentAlert[]
}

const VehiclesContext = createContext<VehiclesContextType | undefined>(undefined)

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      if (!user) return []
      const q = query(collection(db, "vehicles"), where("userId", "==", user.id))
      const snapshot = await getDocs(q)
      const fetchedVehicles: Vehicle[] = []
      snapshot.forEach((doc) => {
        fetchedVehicles.push({ id: doc.id, ...doc.data() } as Vehicle)
      })
      return fetchedVehicles
    },
    enabled: !!user,
  })

  const loading = user ? isLoading : false;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] })

  // ── Document Expiry Monitor ─────────────────────────────────────────
  // Runs once when vehicles load. Checks insurance, tech review, and driver
  // license expiry dates and creates notifications for those within 30 days.
  // Custom IDs per vehicle+document+month prevent duplicate alerts.
  useEffect(() => {
    if (!user || vehicles.length === 0) return

    const today = new Date()
    const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`

    const docChecks = [
      { type: "Seguro", field: "insuranceExpiry" as keyof Vehicle },
      { type: "Revisión Técnica", field: "technicalReviewExpiry" as keyof Vehicle },
      { type: "Licencia de Conducir", field: "driverLicenseExpiry" as keyof Vehicle },
    ]

    vehicles.forEach(async (vehicle) => {
      for (const check of docChecks) {
        const expiryStr = vehicle[check.field] as string | undefined
        if (!expiryStr) continue

        const expiryDate = new Date(expiryStr)
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays > 30) continue // not due yet — skip

        const notifKey = `doc_alert_${vehicle.id}_${check.field}_${monthKey}`
        const isExpired = diffDays < 0

        const notifData = {
          userId: user.id,
          type: "system" as const,
          title: isExpired
            ? `🟥 ${check.type} vencido — ${vehicle.licensePlate}`
            : `⚠️ ${check.type} por vencer — ${vehicle.licensePlate}`,
          message: isExpired
            ? `El ${check.type} de ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) venció hace ${Math.abs(diffDays)} días. Renoévalo a la brevedad.`
            : `El ${check.type} de ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) vence en ${diffDays} día${diffDays !== 1 ? 's' : ''} (${expiryDate.toLocaleDateString("es-AR")}).`,
          priority: (isExpired || diffDays <= 7 ? "high" : "medium") as "high" | "medium",
          actionUrl: "/vehicles",
          date: Timestamp.fromDate(today),
          read: false,
        }

        try {
          await setDoc(doc(collection(db, "notifications"), notifKey), notifData, { merge: false })
        } catch (e) {
          // If it already exists (merge: false throws on conflict), skip silently
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, user])

  const addVehicleMutation = useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, "id" | "userId">) => {
      if (!user) throw new Error("No user")
      const isDefault = vehicles.length === 0
      await addDoc(collection(db, "vehicles"), {
        ...vehicle,
        userId: user.id,
        isDefault,
        createdAt: new Date()
      })
    },
    onSuccess: invalidate
  })

  const removeVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return
      const vehicleToRemove = vehicles.find(v => v.id === id)
      await deleteDoc(doc(db, "vehicles", id))
      if (vehicleToRemove?.isDefault && vehicles.length > 1) {
        const nextDefault = vehicles.find(v => v.id !== id);
        if (nextDefault) {
          await updateDoc(doc(db, "vehicles", nextDefault.id), { isDefault: true })
        }
      }
    },
    onSuccess: invalidate
  })

  const setDefaultVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return
      const batch = writeBatch(db);
      vehicles.forEach(v => {
        const vRef = doc(db, "vehicles", v.id);
        if (v.id === id) {
          batch.update(vRef, { isDefault: true });
        } else if (v.isDefault) {
          batch.update(vRef, { isDefault: false });
        }
      });
      await batch.commit();
    },
    onSuccess: invalidate
  })

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Vehicle> }) => {
      await updateDoc(doc(db, "vehicles", id), updates)
    },
    onSuccess: invalidate
  })

  const getDefaultVehicle = () => {
    return vehicles.find((v) => v.isDefault) || vehicles[0] || null
  }

  const getDocumentAlerts = (): DocumentAlert[] => {
    const alerts: DocumentAlert[] = []
    const today = new Date()

    vehicles.forEach((vehicle) => {
      const docs = [
        { type: "Seguro", date: vehicle.insuranceExpiry },
        { type: "Revisión Técnica", date: vehicle.technicalReviewExpiry },
        { type: "Licencia de Conducir", date: vehicle.driverLicenseExpiry },
      ]

      docs.forEach((doc) => {
        if (doc.date) {
          const expiryDate = new Date(doc.date)
          const diffTime = expiryDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays <= 30) {
            alerts.push({
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
              documentType: doc.type,
              expiryDate: doc.date,
              daysUntilExpiry: diffDays,
              isExpired: diffDays < 0,
            })
          }
        }
      })
    })

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
  }

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        addVehicle: async (v) => await addVehicleMutation.mutateAsync(v),
        removeVehicle: async (id) => await removeVehicleMutation.mutateAsync(id),
        setDefaultVehicle: async (id) => await setDefaultVehicleMutation.mutateAsync(id),
        getDefaultVehicle,
        updateVehicle: async (id, updates) => await updateVehicleMutation.mutateAsync({ id, updates }),
        getDocumentAlerts,
      }}
    >
      {!loading && children}
    </VehiclesContext.Provider>
  )
}

export function useVehicles() {
  const context = useContext(VehiclesContext)
  if (context === undefined) {
    throw new Error("useVehicles must be used within a VehiclesProvider")
  }
  return context
}
