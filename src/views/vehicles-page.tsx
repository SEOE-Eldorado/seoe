"use client"

import { useState } from "react"
import { useVehicles } from "@entities/vehicles-context"
import { AddVehiclePage } from "./add-vehicle-page"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/atoms/alert-dialog"

interface VehiclesPageProps {
  onBack: () => void
}

export function VehiclesPage() {
  const router = useRouter()
  const { vehicles, removeVehicle, setDefaultVehicle } = useVehicles()
  const [showAddPage, setShowAddPage] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Show add vehicle page
  if (showAddPage) {
    return <AddVehiclePage onBack={() => setShowAddPage(false)} />
  }

  const handleMenuToggle = (vehicleId: string) => {
    setMenuOpen(menuOpen === vehicleId ? null : vehicleId)
  }

  const handleSetDefault = (vehicleId: string) => {
    setDefaultVehicle(vehicleId)
    setMenuOpen(null)
  }

  const handleDelete = (vehicleId: string) => {
    setVehicleToDelete(vehicleId)
    setMenuOpen(null)
  }

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text font-display overflow-hidden relative no-scrollbar">
            {/* Top App Bar - Premium Design */}
            <div className="shrink-0 flex items-center bg-white px-6 py-5 border-b border-border/50 z-10">
                <button
                    onClick={() => router.back()}
                    className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all font-black shadow-sm"
                >
                    <span className="material-symbols-outlined text-2xl font-black">chevron_left</span>
                </button>
                <h2 className="text-xl font-black flex-1 text-center pr-11 tracking-tighter">Mis Vehículos</h2>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 pt-8 pb-32 gap-6 overflow-y-auto no-scrollbar">
                {/* Context Header */}
                <div className="mb-2 px-1">
                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] leading-relaxed">
                        Seleccioná la patente que deseás <br/>
                        vincular a tus sesiones activas.
                    </p>
                </div>

                {/* Empty State */}
                {vehicles.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-border rounded-[10px] shadow-sm">
                        <div className="size-24 rounded-[8px] bg-neutral-bg flex items-center justify-center mb-6 border border-border">
                            <span className="material-symbols-outlined text-4xl text-neutral-text/20 font-black">directions_car</span>
                        </div>
                        <h3 className="text-xl font-black text-neutral-text tracking-tight mb-2">Sin vehículos</h3>
                        <p className="text-[11px] font-black text-neutral-text/20 text-center max-w-[200px] uppercase tracking-widest leading-relaxed">
                            Agregá tu patente <br/> para comenzar a operar.
                        </p>
                    </div>
                ) : (
                    /* Vehicle List - Premium Cards */
                    <div className="space-y-4">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                onClick={() => !vehicle.isDefault && handleSetDefault(vehicle.id)}
                                className={`group relative flex items-center justify-between gap-5 rounded-[8px] bg-white p-6 shadow-sm border transition-all active:scale-[0.98] ${vehicle.isDefault
                                    ? "border-primary-green ring-4 ring-primary-green/3"
                                    : "border-border hover:border-neutral-text/10"
                                    }`}
                            >
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    {/* Vehicle Icon / Plate Display */}
                                    <div
                                        className={`flex items-center justify-center rounded-2xl shrink-0 size-14 border transition-all ${vehicle.isDefault
                                            ? "bg-primary-green/5 text-primary-green border-primary-green/10"
                                            : "bg-neutral-bg text-neutral-text/20 border-border"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl font-black">directions_car</span>
                                    </div>

                                    {/* Vehicle Info */}
                                    <div className="flex flex-col justify-center min-w-0">
                                        <p className={`text-xl font-black tracking-tight leading-none uppercase ${vehicle.isDefault ? "text-neutral-text" : "text-neutral-text/40"}`}>
                                            {vehicle.licensePlate}
                                        </p>
                                        <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-2 truncate">
                                            {vehicle.brand} {vehicle.model}
                                        </p>
                                    </div>
                                </div>

                                {/* Selection Indicator */}
                                <div className="shrink-0 flex items-center gap-4">
                                    {vehicle.isDefault ? (
                                        <div className="size-8 rounded-full bg-primary-green text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
                                            <span className="material-symbols-outlined text-lg font-black">check</span>
                                        </div>
                                    ) : (
                                        <div className="size-8 rounded-full border-2 border-border bg-neutral-bg" />
                                    )}
                                </div>

                                {/* Management Menu Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleMenuToggle(vehicle.id)
                                    }}
                                    className="absolute top-4 right-4 p-1.5 text-neutral-text/10 hover:text-neutral-text active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-xl">more_vert</span>
                                </button>

                                {/* Redesigned Dropdown Menu */}
                                {menuOpen === vehicle.id && (
                                    <div className="absolute top-12 right-4 z-20 bg-white border border-border rounded-[6px] shadow-2xl py-2 min-w-[200px] overflow-hidden animate-in fade-in zoom-in duration-200">
                                        {!vehicle.isDefault && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSetDefault(vehicle.id)
                                                }}
                                                className="w-full flex items-center gap-3 px-6 py-4 text-[11px] font-black text-neutral-text uppercase tracking-widest hover:bg-neutral-bg transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg text-primary-green">star</span>
                                                Predeterminar
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(vehicle.id)
                                            }}
                                            className="w-full flex items-center gap-3 px-6 py-4 text-[11px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50/50 transition-all border-t border-border/50"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                            Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Fixed Plus Button for Native Feel */}
                <div className="fixed bottom-10 left-6 right-6 z-10">
                    <button
                        onClick={() => setShowAddPage(true)}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[6px] h-18 px-5 bg-primary-green hover:brightness-110 transition-all text-white text-sm font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] border border-emerald-400/20"
                    >
                        <span className="material-symbols-outlined mr-3 text-xl">add</span>
                        Agregar nuevo vehículo
                    </button>
                </div>
            </main>

            {/* Click outside to close menu overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(null)}
                />
            )}

            {/* Delete Confirmation - Redesigned Dialog */}
            <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
                <AlertDialogContent className="w-[90%] rounded-[10px] border-none bg-white p-10 shadow-2xl">
                    <div className="size-20 rounded-[7px] bg-red-50 text-red-600 flex items-center justify-center border border-red-100 mb-8 mx-auto">
                        <span className="material-symbols-outlined text-4xl font-black tracking-widest">warning</span>
                    </div>
                    <AlertDialogHeader className="mb-8">
                        <AlertDialogTitle className="text-2xl font-black text-neutral-text text-center tracking-tight mb-3">¿Borrar patente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-[11px] font-black text-neutral-text/30 uppercase tracking-widest leading-relaxed">
                            Esta acción no se puede deshacer. <br/> El vehículo será eliminado <br/> permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-3">
                        <AlertDialogAction
                            onClick={() => {
                                if (vehicleToDelete) {
                                    removeVehicle(vehicleToDelete)
                                    setVehicleToDelete(null)
                                }
                            }}
                            className="bg-red-500 text-white font-black h-16 rounded-[6px] text-[13px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-[0.98] transition-all hover:bg-red-600 border-none"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                        <AlertDialogCancel className="bg-neutral-bg text-neutral-text/30 font-black h-14 rounded-[5px] text-[11px] uppercase tracking-widest border-none hover:bg-neutral-bg/80 active:scale-[0.98]">
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
