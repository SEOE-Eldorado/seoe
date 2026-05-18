"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@shared/ui/atoms/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shared/ui/atoms/dialog"
import { Car, ArrowRight, Sparkles } from "lucide-react"

interface WelcomeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onNavigateToVehicles: () => void
}

export function WelcomeModal({ open, onOpenChange, onNavigateToVehicles }: WelcomeModalProps) {
    const handleGoToVehicles = () => {
        onOpenChange(false)
        onNavigateToVehicles()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-linear-to-br from-emerald-900 via-emerald-950 to-[#003B2A] text-white border-0 rounded-sm overflow-hidden p-0 gap-0">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center p-8 pt-10">
                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className="size-24 rounded-sm bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20">
                            <Car className="size-12 text-white" strokeWidth={2} />
                        </div>
                        <div className="absolute -top-2 -right-2 size-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg animate-bounce">
                            <Sparkles className="size-4 text-amber-900" />
                        </div>
                    </div>

                    <DialogHeader className="text-center space-y-3 pb-4">
                        <DialogTitle className="text-3xl font-extrabold text-white tracking-tight">
                            ¡Bienvenido a SEOE!
                        </DialogTitle>
                        <DialogDescription className="text-white/80 text-base leading-relaxed max-w-xs mx-auto">
                            Antes de comenzar a usar el sistema de estacionamiento, necesitamos que cargues al menos un vehículo.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Steps */}
                    <div className="w-full bg-white/10 rounded-sm p-4 mb-6 backdrop-blur-sm border border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-sm bg-white/20 flex items-center justify-center shrink-0">
                                <span className="text-lg font-bold">1</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white">Cargá tu vehículo</p>
                                <p className="text-xs text-white/60">Patente, marca y modelo</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="w-full sm:flex-col sm:space-y-0 gap-3">
                        <Button
                            onClick={handleGoToVehicles}
                            className="w-full h-14 bg-white text-emerald-950 hover:bg-white/90 font-bold text-base rounded-sm shadow-xl shadow-black/10 group"
                        >
                            Cargar mi Vehículo
                            <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-xs text-white/50 hover:text-white/80 transition-colors pt-2"
                        >
                            Lo haré más tarde
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
