"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import type { Exemption } from "@shared/types"

export function useAllExemptions() {
  return useQuery({
    queryKey: ["exemptions", "all"],
    queryFn: async () => {
      const q = query(collection(db, "exemptions"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exemption))
    },
  })
}

export function useCreateExemption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Exemption, "id">) => {
      await addDoc(collection(db, "exemptions"), { ...data, createdAt: Date.now() })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exemptions"] }),
  })
}

export function useUpdateExemption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Exemption> }) => {
      await updateDoc(doc(db, "exemptions", id), data as any)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exemptions"] }),
  })
}

export function useDeleteExemption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "exemptions", id))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exemptions"] }),
  })
}
