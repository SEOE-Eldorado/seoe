"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@shared/ui/atoms/sheet"
import { useNotifications } from "@entities/notifications-context"
import { useAuth } from "@entities/auth-context"
import { ScrollArea } from "@shared/ui/atoms/scroll-area"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { useHaptic } from "@shared/lib/hooks/use-haptic"
import { useRouter } from "next/navigation"

interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const router = useRouter()
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications()
  const { user, updatePreferences } = useAuth()
  const { trigger: haptic } = useHaptic()
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")

  // Initialize from user preferences or defaults
  const [pushEnabled, setPushEnabled] = useState(user?.preferences?.pushEnabled ?? true)
  const [reminderTime, setReminderTime] = useState(user?.preferences?.reminderTime ?? 10)

  // Keep local state in sync with user profile updates
  useEffect(() => {
    if (user?.preferences) {
      setPushEnabled(user.preferences.pushEnabled)
      setReminderTime(user.preferences.reminderTime)
    }
  }, [user?.preferences])

  const handlePushToggle = async (enabled: boolean) => {
    haptic("light")
    setPushEnabled(enabled)

    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        // If denied, we revert the toggle (or keep it off in DB)
        setPushEnabled(false)
        await updatePreferences({ pushEnabled: false })
        return
      }
    }

    await updatePreferences({ pushEnabled: enabled })
  }

  const handleReminderChange = async (time: number) => {
    haptic("light")
    setReminderTime(time)
    await updatePreferences({ reminderTime: time })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleTabChange = (tab: "active" | "history") => {
    haptic("light")
    setActiveTab(tab)
  }

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      haptic("light")
      markAsRead(id)
    }
  }

  const handleActionClick = (type: string) => {
    haptic("medium")
    onOpenChange(false)
    if (type === "fine") router.push("/dashboard/fines")
    if (type === "parking_expiring") router.push("/dashboard/active-parking")
    if (type === "parking_expired") router.push("/dashboard/fines")
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Ahora"
    if (minutes < 60) return `hace ${minutes} min`
    if (hours < 24) return `hace ${hours}h`
    return `hace ${days}d`
  }

  const getNotificationStyle = (type: string, priority?: string) => {
    if (priority === "urgent" || type === "fine" || type === "parking_expired") {
      return {
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-red-100 dark:border-red-900/50",
        accent: "bg-red-500",
        text: "text-red-700 dark:text-red-400",
        icon: "fi-sr-circle-exclamation",
        label: "Crítico",
      }
    }
    if (priority === "high" || type === "parking_expiring") {
      return {
        bg: "bg-orange-50 dark:bg-orange-950/20",
        border: "border-orange-100 dark:border-orange-900/50",
        accent: "bg-orange-500",
        text: "text-orange-700 dark:text-orange-400",
        icon: "fi-sr-alarm-clock",
        label: "Alerta",
      }
    }
    if (type === "payment" || type === "payment_success" || type === "parking_started") {
      return {
        bg: "bg-green-50 dark:bg-green-950/20",
        border: "border-green-100 dark:border-green-900/50",
        accent: "bg-primary",
        text: "text-primary dark:text-green-400",
        icon: "fi-sr-check-circle",
        label: "Éxito",
      }
    }
    return {
      bg: "bg-card",
      border: "border-border",
      accent: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      icon: "fi-sr-info",
      label: "Info",
    }
  }

  // Filter notifications based on tab
  // Active: Unread
  // History: Read
  const activeNotifications = notifications.filter(n => !n.read)
  const historyNotifications = notifications.filter(n => n.read)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full h-[95vh] rounded-t-[5px] p-0 bg-background border-t border-border/50 shadow-2xl overflow-hidden focus-visible:outline-none">
        {/* ... existing header code ... */}
        <VisuallyHidden>
          <SheetTitle>Panel de Notificaciones</SheetTitle>
          <SheetDescription>Ver y gestionar tus notificaciones</SheetDescription>
        </VisuallyHidden>

        {/* Drag Handle */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-transparentz-20 flex justify-center items-center">
          <div className="w-12 h-1.5 rounded-full bg-border/60 mt-2"></div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-6 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between px-6 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Recordatorios</h1>
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center size-8 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground"
            >
              <i className="fi fi-rr-cross-small text-xl flex items-center"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex p-1 bg-muted/50 rounded-sm">
              <button
                onClick={() => handleTabChange("active")}
                className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all ${activeTab === "active"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Activos
                {activeNotifications.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] rounded-full bg-primary/10 text-primary">
                    {activeNotifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange("history")}
                className={`flex-1 py-2 text-xs font-bold rounded-sm transition-all ${activeTab === "history"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Historial
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <ScrollArea className="h-[calc(95vh-8rem)]">
          <main className="flex-1 px-5 pt-6 pb-24">
            {activeTab === "active" ? (
              <>
                {/* Notifications Section */}
                <section className="mb-8">
                  {activeNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <div className="size-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 shadow-inner">
                        <i className="fi fi-rr-bell text-muted-foreground text-4xl flex items-center"></i>
                      </div>
                      <p className="font-bold text-foreground mb-1 text-lg">Estás al día</p>
                      <p className="text-sm text-muted-foreground max-w-[200px] leading-snug">No tienes nuevas notificaciones por el momento</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeNotifications.map((notification) => {
                        const style = getNotificationStyle(notification.type, notification.priority)
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.read)}
                            className={`group relative overflow-hidden rounded-sm bg-card shadow-sm border ${style.border} transition-all active:scale-[0.98] cursor-pointer`}
                          >
                            {/* Status Indicator Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent}`}></div>

                            <div className="p-5 pl-5">
                              {/* Header */}
                              <div className="flex justify-between items-start mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                                  {style.label}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground/70">
                                  {formatTime(notification.date)}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="pr-6">
                                <h3 className={`text-base font-bold leading-tight mb-1 text-foreground ${!notification.read ? "pr-2" : ""}`}>
                                  {notification.title}
                                  {!notification.read && <span className="ml-2 inline-block size-2 rounded-full bg-primary align-middle"></span>}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {notification.message}
                                </p>
                              </div>

                              {/* Actions area */}
                              <div className="mt-4 flex gap-2">
                                {(notification.type === "fine" || notification.priority === "urgent") ? (
                                  <button onClick={() => handleActionClick("fine")} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:scale-95 transition-all text-red-600 font-bold py-2.5 rounded-sm text-xs border border-red-200/50">
                                    <span>VER DETALLES</span>
                                  </button>
                                ) : notification.type === "parking_expiring" ? (
                                  <button onClick={() => handleActionClick("parking_expiring")} className="flex-1 flex items-center justify-center gap-2 bg-primary hover:brightness-110 active:scale-95 transition-all text-primary-foreground font-bold py-2.5 rounded-sm text-xs shadow-lg shadow-primary/20">
                                    <span>EXTENDER AHORA</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                haptic("light")
                                clearNotification(notification.id)
                              }}
                              className="absolute top-2 right-2 size-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground/50 hover:text-destructive transition-all"
                            >
                              <i className="fi fi-rr-cross-small text-lg flex items-center"></i>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                {/* Alert Preferences Section */}
                <section className="mb-8">
                  <h2 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider px-1">Configuración Rápida</h2>
                  <div className="rounded-sm bg-card p-5 shadow-sm border border-border">
                    {/* Push notifications toggle */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
                          <i className="fi fi-sr-bell-ring text-lg flex items-center"></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">Notificaciones Push</span>
                          <span className="text-xs text-muted-foreground">Alertas en tiempo real</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushEnabled}
                          onChange={(e) => handlePushToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Reminder time selector */}
                    <div>
                      <p className="text-xs font-semibold mb-3 text-foreground">Avisarme antes de:</p>
                      <div className="flex gap-2">
                        {[5, 10, 15].map((time) => (
                          <button
                            key={time}
                            onClick={() => handleReminderChange(time)}
                            className={`flex-1 py-2 px-3 rounded-sm text-xs font-bold border transition-all ${reminderTime === time
                              ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                              : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                              }`}
                          >
                            {time} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* History Tab */
              <section className="space-y-4">
                {historyNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                    <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <i className="fi fi-rr-time-past text-muted-foreground text-4xl flex items-center"></i>
                    </div>
                    <p className="font-bold text-foreground mb-1 text-lg">Sin historial</p>
                    <p className="text-sm text-muted-foreground">No tienes notificaciones antiguas</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {historyNotifications.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-sm bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer opacity-70 hover:opacity-100"
                        onClick={() => {
                          // Maybe mark as unread or just view? For now nothing significant except haptic
                          haptic("light")
                        }}
                      >
                        <div
                          className={`size-10 rounded-full flex items-center justify-center shrink-0 ${item.type === "payment" ? "bg-green-100 text-green-600" : item.type === "fine" ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <i
                            className={`fi ${item.type === "payment"
                              ? "fi-sr-check-circle"
                              : item.type === "fine"
                                ? "fi-sr-file-circle-exclamation"
                                : "fi-rr-bell"
                              } text-lg flex items-center`}
                          ></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-foreground">{item.title}</p>
                          <p className="text-[11px] font-medium text-muted-foreground truncate">{formatTime(item.date)}</p>
                        </div>
                        {/* Removed amount display as strict Notification interface doesn't guarantee it */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(item.id)
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <i className="fi fi-rr-cross-small text-lg"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
