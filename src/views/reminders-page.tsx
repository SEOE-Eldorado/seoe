"use client"

import { useState } from "react"
import { useParking } from "@entities/parking-context"
import { useNotifications } from "@entities/notifications-context"
import { useRouter } from "next/navigation"

interface RemindersPageProps {
    onExtendParking?: () => void
}

export function RemindersPage({ onExtendParking }: RemindersPageProps) {
    const { activeSession, getRemainingTime } = useParking()
    const { notifications, markAsRead } = useNotifications()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<"active" | "history">("active")
    const [pushEnabled, setPushEnabled] = useState(true)
    const [reminderTime, setReminderTime] = useState(10)

    const remainingTime = getRemainingTime()
    const isUrgent = remainingTime && remainingTime.hours === 0 && remainingTime.minutes <= 10

    // Mock history data
    const historyItems = [
        { id: 1, title: "Estacionamiento finalizado", subtitle: "Ayer, 18:30 hs • 2 horas", amount: -450, type: "history" },
        { id: 2, title: "Pago confirmado", subtitle: "Ayer, 14:15 hs • Recarga", amount: 2000, type: "payment" },
    ]

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text font-display overflow-hidden relative no-scrollbar">
            {/* Premium Header */}
            <header className="shrink-0 flex flex-col bg-white border-b border-border/50 z-20">
                <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">chevron_left</span>
                        </button>
                        <h1 className="text-xl font-black tracking-tighter">Alertas</h1>
                    </div>
                    <button className="flex items-center justify-center size-11 rounded-full bg-neutral-bg text-neutral-text/40 hover:text-neutral-text transition-all">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                </div>

                {/* Custom Tabs */}
                <div className="flex px-6 pb-4 gap-2">
                    <button
                        onClick={() => setActiveTab("active")}
                        className={`flex-1 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === "active"
                                ? "bg-primary-green text-white shadow-lg shadow-primary-green/20"
                                : "bg-neutral-bg text-neutral-text/30 hover:text-neutral-text"
                        }`}
                    >
                        Activas
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === "history"
                                ? "bg-primary-green text-white shadow-lg shadow-primary-green/20"
                                : "bg-neutral-bg text-neutral-text/30 hover:text-neutral-text"
                        }`}
                    >
                        Historial
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 pt-8 pb-32 no-scrollbar">
                {activeTab === "active" ? (
                    <div className="space-y-10">
                        {/* Active Alerts Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h2 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">Alertas en curso</h2>
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="bg-primary-green/10 text-primary-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        {notifications.filter(n => !n.read).length} NUEVA{notifications.filter(n => !n.read).length > 1 ? "S" : ""}
                                    </span>
                                )}
                            </div>

                            {/* Urgent Card - Active parking expiring soon */}
                            {activeSession && isUrgent && (
                                <div className="relative overflow-hidden rounded-[8px] bg-white shadow-2xl shadow-orange-500/10 border border-orange-100 transition-all hover:scale-[1.01]">
                                    <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-1 opacity-10">
                                        <span className="material-symbols-outlined text-6xl">timer</span>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center gap-2 text-orange-500 mb-6">
                                            <span className="material-symbols-outlined text-lg font-black animate-pulse">priority_high</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Finaliza muy pronto</span>
                                        </div>
                                        
                                        <div className="flex gap-6 items-center mb-8">
                                            <div className="flex-1">
                                                <h3 className="text-4xl font-black tracking-tighter text-neutral-text mb-2 text-balance leading-none">
                                                    {remainingTime?.minutes || 0} <span className="text-lg opacity-30">min</span>
                                                </h3>
                                                <div className="flex items-center gap-1.5 opacity-50">
                                                    <span className="material-symbols-outlined text-sm font-black">location_on</span>
                                                    <p className="text-[11px] font-black uppercase tracking-widest truncate max-w-[120px]">{activeSession.address}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Map Thumbnail */}
                                            <div className="size-20 shrink-0 rounded-[6px] overflow-hidden bg-neutral-bg border border-border relative">
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center grayscale opacity-80"
                                                    style={{
                                                        backgroundImage:
                                                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBhwdXwEE83qLhLRSQWrFwnVM4ENp20tBGoMjKCcmLDxfU0bt-U5PftYgvxBQXTw-kFQ_ItriqWOUEy6TZAVcmeT-EYIJN2L5QbLrW73Ma85vhi6M2Q0G1PnpvOtHEhTtwSCRK4bNN0rOPasxH8LWcWOaLoWh0FVQFto-G4XWx6Zst2C_QXnU-TJaTjE7Q_wQwP37fRS7CKIsqlBXsG8L_sSDUwtgZT2rcbaJCGu6ZmqtRQ8WZxf_FSyAZK0LnSI9cICt0sE5jYiGE')",
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="size-4 bg-primary-green rounded-full border-2 border-white shadow-lg animate-ping"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={onExtendParking}
                                            className="w-full flex items-center justify-center gap-3 bg-neutral-text text-white font-black py-5 rounded-[6px] text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                            EXTENDER AHORA
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Active parking - not urgent */}
                            {activeSession && !isUrgent && (
                                <div className="rounded-[8px] bg-white shadow-sm border border-border p-6 flex items-center gap-5 hover:bg-neutral-bg/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border group-hover:border-primary-green/20 group-hover:bg-primary-green/5 transition-all">
                                        <span className="material-symbols-outlined text-neutral-text/20 group-hover:text-primary-green transition-all">local_parking</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-neutral-text tracking-tight uppercase">{activeSession.zone}</p>
                                        <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">
                                            {remainingTime?.hours}H {remainingTime?.minutes}M RESTANTES
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-neutral-text/10 group-hover:text-neutral-text transition-all">chevron_right</span>
                                </div>
                            )}

                            {/* No active alerts */}
                            {!activeSession && (
                                <div className="rounded-[8px] bg-white shadow-sm border border-border border-dashed p-10 flex flex-col items-center text-center">
                                    <div className="size-20 rounded-full bg-neutral-bg flex items-center justify-center mb-6 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/10 text-4xl">notifications_off</span>
                                    </div>
                                    <p className="text-sm font-black text-neutral-text tracking-tight uppercase mb-2">Sin alertas activas</p>
                                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest leading-loose max-w-[200px]">Las alertas aparecerán cuando tengas una sesión en curso</p>
                                </div>
                            )}
                        </section>

                        {/* Quick Settings Section */}
                        <section>
                            <h2 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-5 px-1">Preferencias</h2>
                            <div className="bg-white rounded-[8px] shadow-sm border border-border overflow-hidden">
                                {/* Toggle Row */}
                                <div className="flex items-center justify-between p-6 border-b border-border/50">
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                            <span className="material-symbols-outlined text-neutral-text/20">notifications_active</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-neutral-text tracking-tight uppercase">Push</span>
                                            <span className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">Alertas en pantalla</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPushEnabled(!pushEnabled)}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pushEnabled ? 'bg-primary-green' : 'bg-neutral-bg border-border/50'}`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-200 ease-in-out ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>

                                {/* Reminder Time Selector */}
                                <div className="p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 mb-4 px-1">Avisarme antes de:</p>
                                    <div className="flex gap-2 p-1.5 bg-neutral-bg rounded-[6px] border border-border">
                                        {[5, 10, 15].map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setReminderTime(time)}
                                                className={`flex-1 py-3 px-4 rounded-[4.5px] text-[10px] font-black uppercase tracking-tighter transition-all ${reminderTime === time
                                                        ? "bg-white text-neutral-text shadow-sm border border-border"
                                                        : "text-neutral-text/30 hover:text-neutral-text"
                                                    }`}
                                            >
                                                {time} min
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    /* History Tab Content */
                    <section>
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h2 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">Historial reciente</h2>
                            <button className="text-[10px] font-black text-primary-green uppercase tracking-widest">Ver todo</button>
                        </div>
                        <div className="space-y-3">
                            {historyItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-5 p-6 rounded-[8px] bg-white shadow-sm border border-border hover:bg-neutral-bg/30 transition-all cursor-pointer group"
                                >
                                    <div
                                        className={`size-12 rounded-2xl flex items-center justify-center border transition-all ${
                                            item.type === "history" 
                                                ? "bg-neutral-bg border-border text-neutral-text/20" 
                                                : "bg-primary-green/5 border-primary-green/20 text-primary-green"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {item.type === "history" ? "schedule" : "check_circle"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-neutral-text tracking-tight uppercase truncate">{item.title}</p>
                                        <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1 truncate">{item.subtitle}</p>
                                    </div>
                                    <span
                                        className={`text-sm font-black tracking-tight ${item.amount > 0 ? "text-primary-green" : "text-neutral-text"}`}
                                    >
                                        {item.amount > 0 ? "+" : ""}${Math.abs(item.amount).toLocaleString("es-AR")}
                                    </span>
                                </div>
                            ))}

                            {/* Empty state */}
                            {historyItems.length === 0 && (
                                <div className="rounded-[8px] bg-white shadow-sm border border-border p-10 flex flex-col items-center text-center">
                                    <div className="size-20 rounded-full bg-neutral-bg flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-neutral-text/10 text-4xl">history_toggle_off</span>
                                    </div>
                                    <p className="text-sm font-black text-neutral-text tracking-tight uppercase mb-2">Sin historial</p>
                                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest">Tú actividad de alertas aparecerá aquí</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}
