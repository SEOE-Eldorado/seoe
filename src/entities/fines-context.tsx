"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@entities/auth-context"
import { db } from "@shared/api/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp, writeBatch } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import type { Fine } from "@shared/types"

// Re-export Fine so existing consumers that import it from here still work
export type { Fine }

interface FinesContextType {
  fines: Fine[]
  payFine: (id: string) => Promise<void>
  appealFine: (id: string) => Promise<void>
  getPendingFines: () => Fine[]
  getTotalPendingAmount: () => number
  issueFine: (fineData: Omit<Fine, "id" | "status" | "date" | "dueDate" | "createdAt" | "cancelledAt" | "cancelledBy" | "cancelReason" | "paidAt" | "notes" | "inspectorId" | "inspectorName">) => Promise<void>
}

const FinesContext = createContext<FinesContextType | undefined>(undefined)

export function FinesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: fines = [], isLoading } = useQuery({
    queryKey: ['fines', user?.id],
    queryFn: async () => {
      if (!user) return []
      const q = query(collection(db, "fines"), where("userId", "==", user.id))
      const snapshot = await getDocs(q)
      const fetchedFines: Fine[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        fetchedFines.push({
          id: doc.id,
          userId: data.userId,
          vehiclePlate: data.vehiclePlate,
          type: data.type,
          amount: data.amount,
          reason: data.reason ?? data.description ?? "",
          description: data.description ?? data.reason ?? "",
          location: data.location ?? "",
          date: data.date?.toDate?.() ?? new Date(),
          status: data.status,
          dueDate: data.dueDate?.toDate?.() ?? undefined,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          notes: data.notes,
          inspectorId: data.inspectorId,
          inspectorName: data.inspectorName,
          cancelledAt: data.cancelledAt?.toDate?.() ?? undefined,
          cancelledBy: data.cancelledBy,
          cancelReason: data.cancelReason,
          paidAt: data.paidAt?.toDate?.() ?? undefined,
        } as Fine)
      })
      return fetchedFines
    },
    enabled: !!user,
  })

  // To prevent UI blocking forever if user isn't logged in
  const loading = user ? isLoading : false;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fines', user?.id] })

  const payFineMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return
      // We initialize functions here
      const functions = getFunctions(undefined, 'us-central1')
      const payFineFn = httpsCallable(functions, 'payFine')
      await payFineFn({ fineId: id })
    },
    onSuccess: invalidate,
    onError: (error: any) => {
      console.error("Error paying fine", error)
      throw new Error(error.message || "Error al procesar el pago")
    }
  })

  const appealFineMutation = useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, "fines", id), { status: 'contested' })
    },
    onSuccess: invalidate,
  })

  const issueFineMutation = useMutation({
    mutationFn: async (fineData: Omit<Fine, "id" | "status" | "date" | "dueDate" | "createdAt" | "cancelledAt" | "cancelledBy" | "cancelReason" | "paidAt" | "notes" | "inspectorId" | "inspectorName">) => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const batch = writeBatch(db);

      // 1. Create the fine document
      const fineRef = doc(collection(db, "fines"));
      batch.set(fineRef, {
        ...fineData,
        reason: fineData.reason || fineData.description || "",
        description: fineData.description || fineData.reason || "",
        status: "pending",
        date: Timestamp.fromDate(now),
        dueDate: Timestamp.fromDate(dueDate),
        createdAt: Timestamp.fromDate(now),
        inspectorId: user?.id,
        inspectorName: user?.name ?? undefined,
      });

      // 2. Create a notification for the affected user so they are alerted immediately
      const notifRef = doc(collection(db, "notifications"));
      const fineTypeLabels: Record<string, string> = {
        overtime: "Exceso de tiempo",
        no_payment: "Sin pago registrado",
        wrong_zone: "Zona incorrecta",
        expired_meter: "Medidor vencido",
      };
      batch.set(notifRef, {
        userId: fineData.userId,
        type: "fine",
        title: "⚠️ Multa recibida",
        message: `Se registró una multa de $${fineData.amount} en ${fineData.location}. Motivo: ${fineData.type ? fineTypeLabels[fineData.type] : fineData.reason ?? fineData.description ?? ''}. Vence el ${dueDate.toLocaleDateString("es-AR")}.`,
        priority: "high",
        actionUrl: "/fines",
        date: Timestamp.fromDate(now),
        read: false,
      });

      await batch.commit();
    },
    onSuccess: () => {
      // Invalidate all fines queries since this is typically done by inspector
      queryClient.invalidateQueries({ queryKey: ['fines'] })
    }
  })

  const getPendingFines = () => fines.filter((f) => f.status === "pending")
  const getTotalPendingAmount = () => fines.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0)

  return (
    <FinesContext.Provider value={{
      fines,
      payFine: async (id) => await payFineMutation.mutateAsync(id),
      appealFine: async (id) => await appealFineMutation.mutateAsync(id),
      getPendingFines,
      getTotalPendingAmount,
      issueFine: async (fineData) => await issueFineMutation.mutateAsync(fineData)
    }}>
      {!loading && children}
    </FinesContext.Provider>
  )
}

export function useFines() {
  const context = useContext(FinesContext)
  if (context === undefined) {
    throw new Error("useFines must be used within a FinesProvider")
  }
  return context
}
