"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, Timestamp } from "firebase/firestore"
import type { User } from "@shared/types"

// ── useAllUsers (admin) ──
export function useAllUsers() {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const users: User[] = []
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User)
      })
      return users
    },
  })
}

// ── useUpdateUser (admin) ──
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      await updateDoc(doc(db, "users", userId), data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] })
    },
  })
}

// ── useUpdateUserRole (admin) ──
export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await updateDoc(doc(db, "users", userId), { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "all"] })
    },
  })
}
