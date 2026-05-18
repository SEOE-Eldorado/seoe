"use client"

import { useState, useEffect } from "react"
import { useVehicles } from "@entities/vehicles-context"
import { useParking } from "@entities/parking-context"
import { useAuth } from "@entities/auth-context"
import { useSettings } from "@entities/settings-context"
import { useQuery } from "@tanstack/react-query"
import { LocationMap } from "@widgets/location-map"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shared/ui/atoms/sheet"

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/atoms/alert"
import { CheckCircle2, ChevronLeft, ChevronRight, Car, MapPin, AlertCircle } from "lucide-react"

interface StartParkingPageProps {
    onBack: () => void
    onSuccess: () => void
    initialLocation?: { latitude: number; longitude: number; address?: string } | null
}

export function StartParkingPage({ onBack, onSuccess, initialLocation }: StartParkingPageProps) {
    const { user } = useAuth()
    const { vehicles, getDefaultVehicle } = useVehicles()
    const { startParking } = useParking()

    const [hours, setHours] = useState(2)
    const [loading, setLoading] = useState(false)
    const [location, setLocation] = useState(initialLocation || null)
    const [error, setError] = useState<string | null>(null)

    // Vehicle Selection State
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
    const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false)

    useEffect(() => {
        if (initialLocation) {
            setLocation(initialLocation)
        }
    }, [initialLocation])

    useEffect(() => {
        // Only fetch if we don't have a location yet
        if (!location && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords

                    let address = "Ubicación actual"
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        const data = await response.json()
                        if (data.address) {
                            const road = data.address.road || "";
                            const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || "";

                            if (road && city) {
                                address = `${road}, ${city}`;
                            } else if (road) {
                                address = road;
                            } else if (city) {
                                address = city;
                            }
                        }
                    } catch (e) {
                        console.error("Reverse geocoding failed", e)
                    }

                    setLocation({ latitude, longitude, address })
                },
                (error) => {
                    console.error("Error getting location", error)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            )
        }
    }, [location])

    // Init selected vehicle
    useEffect(() => {
        if (!selectedVehicleId) {
            const def = getDefaultVehicle()
            if (def) setSelectedVehicleId(def.id)
        }
    }, [getDefaultVehicle])

    const { settings, isOperatingTime, isLocationInAnyZone, getZoneAtLocation, calculateCost } = useSettings()
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || getDefaultVehicle()

    const { data: exemption } = useQuery({
        queryKey: ['exemption', selectedVehicle?.licensePlate],
        queryFn: async () => {
            if (!selectedVehicle?.licensePlate) return null
            const { collection, query, where, getDocs } = await import("firebase/firestore")
            const { db } = await import("@shared/api/firebase")
            const q = query(collection(db, "exemptions"), where("plate", "==", selectedVehicle.licensePlate))
            const snap = await getDocs(q)
            if (snap.empty) return null
            return snap.docs[0].data() as any
        },
        enabled: !!selectedVehicle?.licensePlate,
        staleTime: 1000 * 60 * 5, // 5 min cache
    })

    const isExempt = (() => {
        if (!exemption) return false
        if (exemption.type === "disability") return true
        if (exemption.type === "resident") {
            const currentAddress = location?.address?.toLowerCase() || ""
            const streets = (exemption.exemptedStreets || "").toLowerCase().split(',').map((s: string) => s.trim())
            return streets.some((s: string) => s && currentAddress.includes(s))
        }
        return false
    })()

    const calculatedCost = calculateCost(hours, 0, location?.latitude, location?.longitude)
    const totalCost = isExempt ? 0 : calculatedCost
    const isInZone = isLocationInAnyZone(location?.latitude, location?.longitude)
    const maxHours = 8
    const isFreeNow = !isOperatingTime()

    // Calculate end time
    const endTime = new Date()
    endTime.setHours(endTime.getHours() + hours)
    const endTimeStr = endTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

    const handleDecreaseTime = () => {
        if (hours > 0.5) setHours(hours - 0.5)
    }

    const handleIncreaseTime = () => {
        if (hours < maxHours) setHours(hours + 0.5)
    }

    const handleStartParking = async () => {
        if (!selectedVehicle) return

        // 1. Check if starting within hours
        if (!isOperatingTime()) {
            setError("No se puede iniciar el estacionamiento fuera del horario operativo.")
            return
        }

        // 2. Check if ending within hours
        if (!isOperatingTime(endTime)) {
            setError("El estacionamiento no puede finalizar fuera del horario operativo. Ajusta la duración.")
            return
        }

        setLoading(true)
        setError(null)
        try {
            const currentZone = getZoneAtLocation(location?.latitude, location?.longitude)
            const zoneName = currentZone?.name || "Estacionamiento"
            const streetAddress = location?.address || "Ubicación detectada"

            await startParking(selectedVehicle.id, zoneName, streetAddress, hours, totalCost, location?.latitude, location?.longitude)
            onSuccess()
        } catch (error) {
            console.error("Error starting parking:", error)
            setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar el estacionamiento.")
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (h: number) => {
        const hrs = Math.floor(h)
        const mins = (h % 1) * 60
        return `${hrs}:${mins.toString().padStart(2, "0")}`
    }

    return (
        <div className="relative flex h-dvh w-full flex-col bg-neutral-bg font-display no-scrollbar overflow-hidden">
            {/* Map Section with overlaid detection pill */}
            <div className="h-[28vh] w-full shrink-0 relative overflow-hidden">
                <LocationMap location={location} className="h-full w-full focus:outline-none" />
                
                {/* Back button */}
                <div className="absolute top-12 left-6 z-20">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center size-11 rounded-full bg-white shadow-lg text-neutral-text active:scale-90 transition-all"
                    >
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                    </button>
                </div>

                {/* Detected Location Pill - Rounded Floating Style */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-20">
                    <div className="bg-white rounded-full py-4 px-6 shadow-xl border border-border flex items-center gap-4 transition-all">
                        <div className="size-11 bg-neutral-bg rounded-full flex items-center justify-center text-neutral-text/70 shrink-0">
                            <span className="material-symbols-outlined text-2xl">location_on</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-neutral-text/40 tracking-widest uppercase mb-0.5">UBICACIÓN DETECTADA</span>
                            <span className="text-sm font-bold text-neutral-text truncate pr-2">
                                {location?.address || "Detectando..."}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section - White Sheet Design */}
            <div className="flex-1 bg-white rounded-t-[10px] relative -mt-5 z-30 flex flex-col w-full shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-6 pb-safe overflow-hidden">
                <div className="w-full flex justify-center py-4">
                    <div className="h-1.5 w-14 rounded-full bg-neutral-bg"></div>
                </div>

                {/* Exemption / Alerts */}
                {isExempt && (
                    <div className="mb-6 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary-green text-2xl">verified</span>
                        <div className="flex flex-col">
                            <p className="text-xs font-black text-primary-green uppercase tracking-tight">Beneficio Aplicado</p>
                            <p className="text-[10px] font-bold text-primary-green/60 uppercase">
                                {exemption?.type === 'disability' ? 'Discapacidad' : 'Residente'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Vehicle Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-neutral-text text-lg font-black tracking-tight">Tu Vehículo</h3>
                        <button
                            onClick={() => setIsVehicleSheetOpen(true)}
                            className="text-neutral-text/60 text-sm font-bold active:scale-95 transition-all"
                        >
                            Cambiar
                        </button>
                    </div>
                    <div
                        onClick={() => setIsVehicleSheetOpen(true)}
                        className="bg-white border-2 border-neutral-bg rounded-4xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-neutral-bg rounded-full flex items-center justify-center text-neutral-text/50">
                                <span className="material-symbols-outlined text-3xl">directions_car</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-text font-black text-xl tracking-tighter">
                                        {selectedVehicle?.licensePlate || "Sin vehículo"}
                                    </span>
                                    <span className="bg-neutral-bg text-neutral-text/40 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                        ARG
                                    </span>
                                </div>
                                <span className="text-neutral-text/40 text-[11px] font-bold uppercase tracking-tight">
                                    {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Selecciona un vehículo"}
                                </span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-neutral-text/20 group-hover:text-primary-green transition-colors">edit</span>
                    </div>
                </div>

                {/* Duration Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-neutral-text text-lg font-black tracking-tight">Tiempo</h3>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                            <span className="material-symbols-outlined text-yellow-600 text-[16px]">schedule</span>
                            <p className="text-yellow-600 text-[11px] font-black uppercase tracking-tight">Vence {endTimeStr} hs</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-8 py-2">
                         <div className="flex items-center justify-between w-full max-w-[280px]">
                            <button
                                onClick={handleDecreaseTime}
                                disabled={hours <= 0.5}
                                className="size-16 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-text/70 active:scale-90 transition-all disabled:opacity-30 disabled:scale-100 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-3xl font-bold">remove</span>
                            </button>
                            
                            <div className="flex flex-col items-center">
                                <span className="text-5xl font-black text-neutral-text tracking-tighter tabular-nums leading-none">
                                    {formatTime(hours)}
                                </span>
                                <span className="text-[11px] font-black text-neutral-text/30 uppercase tracking-[0.2em] mt-2">
                                    HORAS
                                </span>
                            </div>

                            <button
                                onClick={handleIncreaseTime}
                                disabled={hours >= maxHours}
                                className="size-16 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-text shadow-sm active:scale-90 transition-all disabled:opacity-30 disabled:scale-100"
                            >
                                <span className="material-symbols-outlined text-3xl font-bold">add</span>
                            </button>
                         </div>
                    </div>
                </div>

                <div className="h-px bg-neutral-bg w-full mb-4"></div>

                {/* Pricing & Footer Action */}
                <div className="mt-auto">
                    <div className="flex flex-col gap-1 mb-6">
                        <div className="flex justify-between items-center">
                            <p className="text-neutral-text/40 text-[11px] font-black uppercase tracking-widest">Costo estipulado</p>
                            <p className="text-neutral-text font-black uppercase text-[11px] tracking-tight">SEGÚN TRAMO</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-neutral-text font-black text-lg tracking-tight">Total a pagar</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-neutral-text/30 text-2xl font-black">$</span>
                                <span className="text-neutral-text text-5xl font-black tracking-tighter tabular-nums leading-none">
                                    {totalCost.toLocaleString("es-AR")},00
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-3xl flex items-start gap-4 animate-shake">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-xs font-bold text-red-500 leading-tight">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleStartParking}
                        disabled={loading || !selectedVehicle}
                        className="w-full bg-primary-green hover:brightness-110 active:scale-[0.98] text-white font-black text-xl h-18 rounded-[6px] shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                    >
                        <span>{loading ? "INICIANDO..." : "Iniciar Estacionamiento"}</span>
                        {!loading && <span className="material-symbols-outlined text-2xl">arrow_forward</span>}
                    </button>
                    
                    <p className="text-center text-[10px] font-bold text-neutral-text/30 uppercase tracking-tight mt-4">
                        Al iniciar aceptas los términos y condiciones
                    </p>
                </div>
            </div>

            {/* Vehicle Selection Sheet */}
            <Sheet open={isVehicleSheetOpen} onOpenChange={setIsVehicleSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[10px] p-0 max-h-[85vh] bg-white border-none shadow-2xl">
                    <SheetHeader className="p-8 pb-4">
                        <SheetTitle className="text-2xl font-black tracking-tight text-neutral-text">Seleccionar Vehículo</SheetTitle>
                    </SheetHeader>
                    <div className="px-8 pb-10 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                        {vehicles.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => {
                                    setSelectedVehicleId(v.id)
                                    setIsVehicleSheetOpen(false)
                                }}
                                className={`flex items-center gap-5 p-6 rounded-4xl border-2 transition-all active:scale-[0.98] ${selectedVehicleId === v.id
                                    ? "bg-emerald-50 border-primary-green/30"
                                    : "bg-neutral-bg border-transparent"
                                    }`}
                            >
                                <div className={`size-14 rounded-full flex items-center justify-center ${selectedVehicleId === v.id ? "bg-primary-green text-white" : "bg-white text-neutral-text/30"}`}>
                                    <span className="material-symbols-outlined text-3xl">directions_car</span>
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <span className={`font-black text-2xl tracking-tighter leading-none ${selectedVehicleId === v.id ? "text-primary-green" : "text-neutral-text"}`}>
                                        {v.licensePlate}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-text/40 uppercase tracking-tight mt-1 truncate">
                                        {v.brand} {v.model}
                                    </span>
                                </div>
                                {selectedVehicleId === v.id && (
                                    <div className="ml-auto">
                                        <span className="material-symbols-outlined text-primary-green text-3xl">check_circle</span>
                                    </div>
                                )}
                            </button>
                        ))}
                        
                        {vehicles.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                <div className="size-20 bg-neutral-bg rounded-full flex items-center justify-center text-neutral-text/20 mb-4">
                                    <span className="material-symbols-outlined text-5xl">no_transport</span>
                                </div>
                                <h4 className="font-black text-lg text-neutral-text">No tienes vehículos</h4>
                                <p className="text-sm font-bold text-neutral-text/40 mt-1 uppercase tracking-tighter">Agrega uno en el menú lateral para continuar</p>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
