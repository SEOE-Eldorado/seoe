"use client"

import { useEffect, useRef } from "react"
import { useParking } from "@entities/parking-context"
import { useAuth } from "@entities/auth-context"
import { useFines } from "@entities/fines-context"
import { useNotifications } from "@entities/notifications-context"
import { db } from "@shared/api/firebase"
import { doc, updateDoc } from "firebase/firestore"

// Helper in the same file to play sound
function playNotificationSound() {
  if (typeof window !== "undefined") {
    try {
      const audio = new Audio("/notification.mp3")
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignorar errores si el navegador bloquea autoplay
      })
    } catch (error) {
      // Ignorar errores de audio
    }
  }
}

export function AlertsMonitor() {
  const { activeSessions, getRemainingTime } = useParking()
  const { user } = useAuth()
  const { getPendingFines } = useFines()
  const { addNotification } = useNotifications()

  // Sets to track sent alerts per session ID
  const alert15Sent = useRef<Set<string>>(new Set())
  const alert10Sent = useRef<Set<string>>(new Set())
  const alert5Sent = useRef<Set<string>>(new Set())

  const lowBalanceSent = useRef(false)
  const fineRemindersSent = useRef<Set<string>>(new Set())

  // Reset flags for sessions that are no longer active/present? 
  // Actually, we can just keep them growing or clear them if effective cleanup needed.
  // For simplicity, we just keep them. If user refreshes, they reset.

  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // 1. Parking Alerts (Loop all sessions)
      activeSessions.forEach(session => {
        if (session.status === "active") {
          const remaining = getRemainingTime(session)
          if (remaining) {
            const totalMinutes = remaining.hours * 60 + remaining.minutes

            // 15 min alert
            if (totalMinutes <= 15 && totalMinutes > 10 && !alert15Sent.current.has(session.id)) {
              addNotification({
                customId: `parking_expiring_${session.id}_15min`,
                type: "parking_expiring",
                title: "⏰ Tu estacionamiento está por vencer",
                message: `Quedan ${totalMinutes} minutos para el vehículo ${session.vehiclePlate}. Considera extender tu tiempo.`,
              })
              alert15Sent.current.add(session.id)
              playNotificationSound()
            }

            // 10 min alert
            if (totalMinutes <= 10 && totalMinutes > 5 && !alert10Sent.current.has(session.id)) {
              addNotification({
                customId: `parking_expiring_${session.id}_10min`,
                type: "parking_expiring",
                title: "⚠️ Estacionamiento próximo a expirar",
                message: `Solo quedan ${totalMinutes} minutos para ${session.vehiclePlate}. ¡Extiende tu tiempo ahora!`,
              })
              alert10Sent.current.add(session.id)
              playNotificationSound()
            }

            // 5 min alert
            if (totalMinutes <= 5 && totalMinutes > 0 && !alert5Sent.current.has(session.id)) {
              addNotification({
                customId: `parking_expiring_${session.id}_5min`,
                type: "parking_expiring",
                title: "🚨 ¡URGENTE! Estacionamiento por expirar",
                message: `Solo quedan ${totalMinutes} minutos para ${session.vehiclePlate}. ¡Extiende AHORA para evitar multas!`,
                priority: "urgent"
              })
              alert5Sent.current.add(session.id)
              playNotificationSound()
              playNotificationSound()
            }

            // Expired alert
            if (totalMinutes <= 0) {
              // Update status to 'expired' automatically
              try {
                const sessionRef = doc(db, "parking_sessions", session.id)
                updateDoc(sessionRef, { status: "expired" })
              } catch (e) {
                console.error("Error setting session to expired:", e)
              }

              addNotification({
                customId: `parking_expired_${session.id}`,
                type: "parking_expired",
                title: "🏁 Tiempo finalizado",
                message: `El tiempo para ${session.vehiclePlate} ha finalizado.`,
              })
              playNotificationSound()
            }
          }
        }
      })

      // 2. Low Balance Alert (Once per day)
      if (user.balance < 50 && !lowBalanceSent.current) {
        const today = new Date().toISOString().split('T')[0]
        addNotification({
          customId: `low_balance_${user.id}_${today}`,
          type: "system",
          title: "💰 Saldo bajo",
          message: `Tu saldo es de $${user.balance}. Recarga para evitar inconvenientes.`,
        })
        lowBalanceSent.current = true
      }

      // Reset balance flag if recharge
      if (user.balance >= 50) {
        lowBalanceSent.current = false
      }

      // 3. Fines Reminders
      const pendingFines = getPendingFines()
      pendingFines.forEach((fine) => {
        const daysUntilDue = Math.ceil((fine.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        // 3 days due
        if (daysUntilDue <= 3 && daysUntilDue > 0 && !fineRemindersSent.current.has(fine.id)) {
          addNotification({
            customId: `fine_reminder_${fine.id}_3days`,
            type: "fine",
            title: "📋 Multa próxima a vencer",
            message: `Tienes una multa de $${fine.amount} que vence en ${daysUntilDue} día${daysUntilDue !== 1 ? "s" : ""}. ¡Paga ahora!`,
          })
          fineRemindersSent.current.add(fine.id)
          playNotificationSound()
        }

        // Today due
        if (daysUntilDue === 0 && !fineRemindersSent.current.has(`${fine.id}-today`)) {
          addNotification({
            customId: `fine_reminder_${fine.id}_today`,
            type: "fine",
            title: "⚠️ Multa vence HOY",
            message: `Tu multa de $${fine.amount} vence hoy. Evita recargos adicionales.`,
          })
          fineRemindersSent.current.add(`${fine.id}-today`)
          playNotificationSound()
        }
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [user, activeSessions, getRemainingTime, addNotification, getPendingFines])

  return null
}
