"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"
import type { Fine } from "@shared/types"

// ── useAllFines (admin: all fines, not filtered by user) ──
export function useAllFines() {
  return useQuery({
    queryKey: ["fines", "all"],
    queryFn: async () => {
      const q = query(collection(db, "fines"), orderBy("date", "desc"))
      const snapshot = await getDocs(q)
      const fines: Fine[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        fines.push({
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
      return fines
    },
  })
}

// ── useCancelFine (admin: cancel a fine) ──
export function useCancelFine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fineId, reason }: { fineId: string; reason: string }) => {
      const fineRef = doc(db, "fines", fineId)
      await updateDoc(fineRef, {
        status: "cancelled",
        cancelledAt: Timestamp.now(),
        cancelledBy: "admin",
        cancelReason: reason,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines", "all"] })
    },
  })
}

// ── useMarkFinePaid (admin: mark fine as paid) ──
export function useMarkFinePaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fineId: string) => {
      const fineRef = doc(db, "fines", fineId)
      await updateDoc(fineRef, {
        status: "paid",
        paidAt: Timestamp.now(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fines", "all"] })
    },
  })
}
