"use client"

import { useEffect, useState } from "react"
import { useNotifications } from "@entities/notifications-context"
import { useParking } from "@entities/parking-context"
import { Button } from "@shared/ui/atoms/button"
import { AlertTriangle, X, Clock, Bell } from "lucide-react"

export function UrgentAlertBanner() {
  const { getUrgentNotifications, markAsRead } = useNotifications()
  const { getRemainingTime } = useParking()
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const interval = setInterval(() => {
      const alerts = getUrgentNotifications().filter((alert) => !dismissed.has(alert.id))
      setUrgentAlerts(alerts)
    }, 5000)

    return () => clearInterval(interval)
  }, [getUrgentNotifications, dismissed])

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
    markAsRead(id)
  }

  if (urgentAlerts.length === 0) return null

  const topAlert = urgentAlerts[0]
  const remaining = getRemainingTime()
  const isExpiringSoon = remaining && remaining.hours === 0 && remaining.minutes <= 5
  const isUrgent = topAlert.priority === "urgent"

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="container max-w-md mx-auto">
        <div
          className={`rounded-xl shadow-2xl border-2 backdrop-blur-sm transition-all ${
            isUrgent
              ? "bg-destructive/95 border-destructive text-destructive-foreground"
              : "bg-amber-500/95 border-amber-500 text-amber-950"
          } ${isExpiringSoon ? "animate-pulse" : ""}`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-full p-2 ${
                  isUrgent ? "bg-destructive-foreground/20" : "bg-amber-950/20"
                } animate-in zoom-in-50 duration-500`}
              >
                {isUrgent ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1 text-balance">{topAlert.title}</h4>
                <p className="text-sm opacity-90 text-pretty mb-2">{topAlert.message}</p>
                {urgentAlerts.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Bell className="h-3.5 w-3.5 opacity-80" />
                    <span className="text-xs font-medium opacity-80">+{urgentAlerts.length - 1} alertas más</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full flex-shrink-0 ${
                  isUrgent
                    ? "hover:bg-destructive-foreground/20 text-destructive-foreground"
                    : "hover:bg-amber-950/20 text-amber-950"
                }`}
                onClick={() => handleDismiss(topAlert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
