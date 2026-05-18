"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@entities/auth-context"
import { db } from "@shared/api/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  setDoc,
  orderBy
} from "firebase/firestore"

export interface Notification {
  id: string
  userId: string
  type: "fine" | "parking_expiring" | "parking_expired" | "payment" | "system"
  title: string
  message: string
  date: Date
  read: boolean
  priority?: "low" | "medium" | "high" | "urgent"
  actionUrl?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "userId" | "date" | "read"> & { customId?: string }) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  getUnreadCount: () => number
  clearNotification: (id: string) => Promise<void>
  getUrgentNotifications: () => Notification[]
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.id)
      )

      const snapshot = await getDocs(q)
      const fetchedNotifs: Notification[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        fetchedNotifs.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          date: data.date?.toDate() || new Date(),
          read: data.read,
          priority: data.priority,
          actionUrl: data.actionUrl,
        } as Notification)
      })

      return fetchedNotifs.sort((a, b) => b.date.getTime() - a.date.getTime())
    },
    enabled: !!user,
    // Polling every minute to simulate real-time for notifications without onSnapshot costs.
    refetchInterval: 60000,
  })

  const loading = user ? isLoading : false;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })

  const addNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<Notification, "id" | "userId" | "date" | "read"> & { customId?: string }) => {
      if (!user) return

      let priority: "low" | "medium" | "high" | "urgent" = notification.priority || "medium"

      if (notification.type === "parking_expired") priority = "urgent"
      else if (notification.type === "parking_expiring") {
        if (notification.title.includes("5 minutos")) priority = "urgent"
        else if (notification.title.includes("10 minutos")) priority = "high"
        else priority = "medium"
      } else if (notification.type === "fine") priority = "high"
      else if (notification.type === "system" && notification.title.includes("Saldo bajo")) priority = "high"

      const notificationData = {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority,
        actionUrl: notification.actionUrl || "",
        userId: user.id,
        date: new Date(),
        read: false,
      }

      if (notification.customId) {
        await setDoc(doc(db, "notifications", notification.customId), notificationData)
      } else {
        await addDoc(collection(db, "notifications"), notificationData)
      }
    },
    onSuccess: invalidate
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await updateDoc(doc(db, "notifications", id), { read: true })
    },
    onSuccess: invalidate
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user || notifications.length === 0) return
      const batch = writeBatch(db)
      notifications.forEach(n => {
        if (!n.read) {
          const ref = doc(db, "notifications", n.id)
          batch.update(ref, { read: true })
        }
      })
      await batch.commit()
    },
    onSuccess: invalidate
  })

  const clearNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "notifications", id))
    },
    onSuccess: invalidate
  })

  const getUnreadCount = () => notifications.filter((n) => !n.read).length
  const getUrgentNotifications = () => notifications.filter((n) => !n.read && (n.priority === "urgent" || n.priority === "high"))

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification: async (n) => await addNotificationMutation.mutateAsync(n),
        markAsRead: async (id) => await markAsReadMutation.mutateAsync(id),
        markAllAsRead: async () => await markAllAsReadMutation.mutateAsync(),
        getUnreadCount,
        clearNotification: async (id) => await clearNotificationMutation.mutateAsync(id),
        getUrgentNotifications,
      }}
    >
      {!loading && children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
