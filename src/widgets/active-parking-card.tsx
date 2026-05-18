"use client"

import { useState, useEffect } from "react"
import { useParking, type ParkingSession } from "@entities/parking-context"
import { ExtendParkingDialog } from "@widgets/dialogs/extend-parking-dialog"

export function ActiveParkingCard({ session }: { session: ParkingSession }) {
    const { endParking, getRemainingTime } = useParking()
    const [remainingTime, setRemainingTime] = useState<{ hours: number; minutes: number } | null>(null)
    const [showExtendDialog, setShowExtendDialog] = useState(false)
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        if (session) {
            const updateTime = () => {
                const remaining = getRemainingTime(session)
                setRemainingTime(remaining)
                setNow(new Date())
            }
            updateTime()
            const interval = setInterval(updateTime, 1000)
            return () => clearInterval(interval)
        }
    }, [session, getRemainingTime])

    if (!session) return null

    const isExpired = session.status === "expired"

    const handleEndParking = () => {
        if (confirm("¿Estás seguro de finalizar este estacionamiento?")) {
            endParking(session.id)
        }
    }

    // Calculation for Progress Gauge
    const startTime = new Date(session.startTime).getTime()
    const endTime = new Date(session.endTime).getTime()
    const totalDuration = endTime - startTime
    const remainingMs = endTime - now.getTime()

    // Percentage Remaining
    let percentRemaining = Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100))
    if (isExpired) percentRemaining = 0

    const totalTicks = 40
    const startAngle = -40
    const endAngle = 220
    const range = endAngle - startAngle
    const step = range / totalTicks
    const radius = 140
    const targetProgress = percentRemaining / 100

    // Generate Ticks - Premium Palette
    const ticks = []
    for (let j = 0; j <= totalTicks; j++) {
        const angleDeg = startAngle + (j * step)
        const progress = j / totalTicks
        const isActive = progress <= targetProgress

        let color = '#E6F3EF' // secondary-green / border
        if (isActive && !isExpired) {
            color = progress > 0.8 ? '#F59E0B' : '#00825B' // yellow-500 : primary-green
        }

        const isCurrentValue = !isExpired && isActive && Math.abs(progress - targetProgress) < (1 / totalTicks)

        ticks.push(
            <div
                key={j}
                className={`absolute top-1/2 left-1/2 rounded-full transition-all duration-500 box-content ${isCurrentValue ? 'shadow-[0_0_12px_currentColor]' : ''}`}
                style={{
                    backgroundColor: color,
                    width: isCurrentValue ? '6px' : '4px',
                    height: isCurrentValue ? '32px' : '16px',
                    transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(-${radius}px)`,
                    zIndex: isCurrentValue ? 10 : 1,
                    color: color,
                }}
            />
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto py-2">
            {/* Gauge Container */}
            <div className="relative w-[300px] h-[300px] flex items-center justify-center -mt-4 mb-4">
                {/* Ticks */}
                <div className="absolute inset-0 pointer-events-none transform -rotate-90 scale-95">
                    {ticks}
                    <div className="absolute inset-0 m-auto w-40 h-40 border-2 border-primary-green/3 rounded-full border-dashed animate-[spin_30s_linear_infinite]"></div>
                </div>

                {/* Central Circle with Time */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <div className="relative group flex flex-col items-center">
                         <span className="text-[10px] font-black text-neutral-text/20 tracking-[0.2em] uppercase mb-3">Tiempo Restante</span>
                         <span className="text-5xl font-black text-neutral-text tracking-tighter tabular-nums leading-none">
                             {remainingTime ? `${remainingTime.hours > 0 ? remainingTime.hours + 'h ' : ''}${remainingTime.minutes}m` : '--'}
                         </span>
                         <div className={`mt-8 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isExpired ? "bg-red-50 border-red-100 text-red-600" : "bg-primary-green border-primary-green/20 text-white shadow-xl shadow-emerald-900/10"}`}>
                             {isExpired ? "Expirado" : "En curso"}
                         </div>
                    </div>
                </div>

                {!isExpired && (
                    <div className="absolute inset-0 m-auto w-44 h-44 bg-primary-green/2 blur-3xl -z-10 rounded-full animate-pulse"></div>
                )}
            </div>

            {/* Details Card - Premium Modern Style */}
            <div className="w-full space-y-5">
                <div className="bg-white rounded-[10px] p-8 border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-neutral-text/20 tracking-widest uppercase">Zona detectada</p>
                            <h2 className="text-2xl font-black text-neutral-text tracking-tight">{session.zone}</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="material-symbols-outlined text-sm text-primary-green">location_on</span>
                                <p className="text-xs font-bold text-neutral-text/40">{session.address || "Sector activo"}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <h2 className="text-3xl font-black text-primary-green tracking-tighter">
                                {Math.round(percentRemaining)}<span className="text-sm opacity-30 ml-0.5">%</span>
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-neutral-bg/50 p-4 rounded-[6px] flex flex-col items-center justify-center border border-border/50">
                            <span className="material-symbols-outlined text-neutral-text/30 text-xl mb-1.5">payments</span>
                            <span className="text-[8px] font-black text-neutral-text/20 uppercase tracking-widest mb-1">Tarifa</span>
                            <span className="text-xs font-black text-neutral-text tracking-tighter">${session.costPerHour}<span className="text-[10px] opacity-30">/h</span></span>
                        </div>
                        <div className="bg-neutral-bg/50 p-4 rounded-[6px] flex flex-col items-center justify-center border border-border/50">
                             <span className="material-symbols-outlined text-neutral-text/30 text-xl mb-1.5">schedule</span>
                            <span className="text-[8px] font-black text-neutral-text/20 uppercase tracking-widest mb-1">Fin</span>
                            <span className="text-xs font-black text-neutral-text tracking-tighter">
                                {new Date(session.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                        <div className="bg-neutral-bg/50 p-4 rounded-[6px] flex flex-col items-center justify-center border border-border/50">
                            <span className="material-symbols-outlined text-neutral-text/30 text-xl mb-1.5">monetization_on</span>
                            <span className="text-[8px] font-black text-neutral-text/20 uppercase tracking-widest mb-1">Total</span>
                            <span className="text-xs font-black text-neutral-text tracking-tighter">${session.cost}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 px-1">
                    <button
                        onClick={() => setShowExtendDialog(true)}
                        disabled={isExpired}
                        className="flex-1 bg-white border border-border text-neutral-text h-16 rounded-[6px] font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm uppercase tracking-tight shadow-sm"
                    >
                         <span className="material-symbols-outlined text-xl">add_time</span>
                        Extender
                    </button>

                    <button
                        onClick={handleEndParking}
                        className="flex-1 bg-primary-green text-white h-16 rounded-[6px] font-black shadow-xl shadow-emerald-900/10 hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm uppercase tracking-tight"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Finalizar
                    </button>
                </div>
            </div>

            <ExtendParkingDialog open={showExtendDialog} onOpenChange={setShowExtendDialog} session={session} />
        </div>
    )
}
