"use client"

import { useParking } from "@entities/parking-context"
import { ActiveParkingCard } from "@widgets/active-parking-card"
import { SimpleActiveParkingCard } from "@widgets/simple-active-parking-card"
import { useRouter } from "next/navigation"

export function ActiveParkingPage() {
    const router = useRouter()
    const { activeSessions } = useParking()

    if (activeSessions.length === 0) {
        return (
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-neutral-bg font-display px-8 text-center">
                <div className="size-24 rounded-full bg-white border border-border flex items-center justify-center mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-neutral-text/10 text-5xl">local_parking</span>
                </div>
                <h3 className="text-xl font-black text-neutral-text mb-2">No hay sesiones activas</h3>
                <p className="text-xs font-bold text-neutral-text/30 uppercase tracking-tight mb-8">
                    Inicia un estacionamiento para verlo aquí.
                </p>
                <button
                    onClick={() => router.back()}
                    className="w-full max-w-[200px] h-14 bg-primary-green text-white rounded-2xl font-black uppercase tracking-tight shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                >
                    Inicio
                </button>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col pb-24 max-w-md mx-auto bg-neutral-bg overflow-hidden font-display no-scrollbar">
            {/* Top App Bar - Premium Light Style */}
            <div className="sticky top-0 z-50 flex items-center bg-white/80 backdrop-blur-md px-6 py-5 justify-between border-b border-border/50">
                <button
                    onClick={() => router.back()}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl">expand_more</span>
                </button>
                <h2 className="text-lg font-black tracking-tight flex-1 text-center pr-11 text-neutral-text">
                    Estacionamientos
                </h2>
                <div className="w-0"></div>
            </div>

            <div className="flex flex-col gap-6 p-6 overflow-y-auto no-scrollbar pb-32">
                {activeSessions.map((session, index) =>
                    index === 0 ? (
                        <ActiveParkingCard key={session.id} session={session} />
                    ) : (
                        <SimpleActiveParkingCard key={session.id} session={session} />
                    )
                )}
            </div>
        </div>
    )
}
