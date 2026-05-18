"use client"

import { useState, useEffect } from "react"
import { useParking, type ParkingSession } from "@entities/parking-context"
import { ExtendParkingDialog } from "@widgets/dialogs/extend-parking-dialog"

export function SimpleActiveParkingCard({ session }: { session: ParkingSession }) {
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

    // Calc percent for a simple progress bar
    const startTime = new Date(session.startTime).getTime()
    const endTime = new Date(session.endTime).getTime()
    const totalDuration = endTime - startTime
    const remainingMs = endTime - now.getTime()
    let percentRemaining = Math.max(0, Math.min(100, (remainingMs / totalDuration) * 100))
    if (isExpired) percentRemaining = 0

    return (
        <div className="w-full bg-white rounded-[32px] p-6 shadow-sm border border-border flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-neutral-bg flex items-center justify-center border border-border">
                        <span className="material-symbols-outlined text-neutral-text/30">directions_car</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-neutral-text leading-tight tracking-tight uppercase">{session.vehiclePlate}</h3>
                        <p className="text-[10px] text-neutral-text/30 font-black uppercase tracking-[0.15em] mt-0.5">{session.zone}</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border transition-all ${isExpired ? "bg-red-50 text-red-600 border-red-100" : "bg-primary-green/5 text-primary-green border-primary-green/10"}`}>
                    {isExpired ? "Expirado" : "Activo"}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-neutral-text/20 tracking-widest uppercase mb-1">Restante</span>
                        <span className="text-2xl font-black text-neutral-text tracking-tighter tabular-nums leading-none">
                            {remainingTime ? `${remainingTime.hours > 0 ? remainingTime.hours + 'h ' : ''}${remainingTime.minutes}m` : '--'}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-neutral-text/20 font-black uppercase tracking-widest mb-1">Fin sesión</p>
                        <span className="text-xl font-black text-neutral-text tracking-tighter">
                            {new Date(session.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                </div>

                {/* Simple Premium Progress Bar */}
                <div className="w-full h-2 bg-neutral-bg rounded-full overflow-hidden border border-border/50">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-primary-green shadow-[0_0_8px_rgba(0,130,91,0.2)]'}`}
                        style={{ width: `${percentRemaining}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setShowExtendDialog(true)}
                    disabled={isExpired}
                    className="h-14 flex items-center justify-center gap-2 rounded-[20px] bg-neutral-bg text-neutral-text font-black text-xs uppercase tracking-tight hover:bg-neutral-bg/80 transition-all active:scale-[0.98] border border-border"
                >
                    <span className="material-symbols-outlined text-lg">add_time</span>
                    Extender
                </button>
                <button
                    onClick={handleEndParking}
                    className="h-14 flex items-center justify-center gap-2 rounded-[20px] bg-primary-green text-white font-black text-xs uppercase tracking-tight shadow-md shadow-emerald-900/10 hover:brightness-110 transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Finalizar
                </button>
            </div>

            <ExtendParkingDialog open={showExtendDialog} onOpenChange={setShowExtendDialog} session={session} />
        </div>
    )
}
