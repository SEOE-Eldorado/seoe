"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, Timestamp, where } from "firebase/firestore"
import type { Transaction, PaymentSettings } from "@shared/types"

// ── Transactions ──
export function useAllTransactions() {
  return useQuery({
    queryKey: ["transactions", "all"],
    queryFn: async () => {
      const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Transaction, "id">) => {
      await addDoc(collection(db, "transactions"), {
        ...data,
        timestamp: Timestamp.now(),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  })
}

// ── Payment Settings ──
export function usePaymentSettings() {
  return useQuery({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      const q = query(collection(db, "payment_settings"))
      const snapshot = await getDocs(q)
      const settings: PaymentSettings[] = []
      snapshot.forEach(doc => settings.push({ ...doc.data() } as PaymentSettings))
      return settings[0] || { enableMacroClick: true, enableCash: true, promotions: { active: false, minAmount: 100, bonusPercentage: 10 } }
    },
  })
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<PaymentSettings>) => {
      const q = query(collection(db, "payment_settings"))
      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        await addDoc(collection(db, "payment_settings"), data)
      } else {
        await updateDoc(doc(db, "payment_settings", snapshot.docs[0].id), data as any)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentSettings"] }),
  })
}

// ── Refund transaction ──
export function useRefundTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ txId, userId }: { txId: string; userId: string }) => {
      await updateDoc(doc(db, "transactions", txId), {
        status: "refunded",
        refundedAt: Timestamp.now(),
        refundedBy: userId,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  })
}
