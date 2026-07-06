"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@shared/api/firebase"
import { Loader2, AlertCircle, Car } from "lucide-react"

interface Zone {
    id: string
    name: string
    basePrice?: number
    pricePerHour?: number
}

const FUNCTION_URL = "https://us-central1-seoe-67101.cloudfunctions.net/createGuestParkingPayment"

export function GuestParkingPage() {
    const [plate, setPlate] = useState("")
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState("")
    const [zonePrice, setZonePrice] = useState(80)
    const [hours, setHours] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ── Load zones ───────────────────────────────────────────────────
    useEffect(() => {
        const loadZones = async () => {
            try {
                const snapshot = await getDocs(collection(db, "zones"))
                const zonesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    basePrice: doc.data().basePrice,
                    pricePerHour: doc.data().pricePerHour,
                }))
                setZones(zonesData)
                if (zonesData.length > 0) {
                    setSelectedZone(zonesData[0].name)
                    if (zonesData[0].pricePerHour) setZonePrice(zonesData[0].pricePerHour)
                }
            } catch (err) {
                console.error("Error loading zones:", err)
                setError("No se pudieron cargar las zonas. Verificá la conexión.")
            }
        }
        loadZones()

        // Check if we came back from a cancellation
        const params = new URLSearchParams(window.location.search)
        if (params.get("canceled") === "true") {
            setError("El pago fue cancelado. Podés intentar de nuevo.")
        }
        // Clean URL params
        if (params.has("canceled") && window.history.replaceState) {
            window.history.replaceState({}, document.title, "/iniciar")
        }
    }, [])

    const handleZoneChange = (zoneName: string) => {
        setSelectedZone(zoneName)
        const zone = zones.find(z => z.name === zoneName)
        if (zone?.pricePerHour) setZonePrice(zone.pricePerHour)
    }

    const handleDecreaseTime = () => {
        if (hours > 0.5) setHours(hours - 0.5)
    }

    const handleIncreaseTime = () => {
        if (hours < 8) setHours(hours + 0.5)
    }

    const totalCost = Math.round(hours * zonePrice)

    const formatTime = (h: number) => {
        const hrs = Math.floor(h)
        const mins = Math.round((h % 1) * 60)
        return `${hrs}:${mins.toString().padStart(2, "0")}`
    }

    // ── Submit → Macro Click ─────────────────────────────────────────
    const handleSubmit = async () => {
        const cleanPlate = plate.toUpperCase().replace(/\s/g, "")
        if (!cleanPlate || cleanPlate.length < 4) {
            setError("Ingresá una patente válida (ej: ABC-123)")
            return
        }
        if (!selectedZone) {
            setError("Seleccioná una zona")
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    zone: selectedZone,
                    hours,
                    costPerHour: zonePrice,
                    address: selectedZone,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Error al procesar el pago")
            }

            // POST form to Macro Click → browser navigates there
            const form = document.createElement("form")
            form.method = "POST"
            form.action = data.url

            for (const [key, value] of Object.entries(data.fields)) {
                const input = document.createElement("input")
                input.type = "hidden"
                input.name = key
                input.value = value as string
                form.appendChild(input)
            }

            document.body.appendChild(form)
            form.submit()
            // Page will navigate to Macro Click — code after this won't run

        } catch (err: any) {
            setError(err.message || "Error de conexión. Intentalo de nuevo.")
            setSubmitting(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="min-h-dvh bg-[#0D2742] flex flex-col font-display">
            {/* Header */}
            <div className="px-6 pt-14 pb-6">
                <div className="flex items-center gap-4 mb-1">
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Car className="size-5 text-white" />
                    </div>
                    <div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">SEOE</p>
                        <h1 className="text-white text-xl font-black tracking-tight">Estacionamiento Invitado</h1>
                    </div>
                </div>
                <p className="text-white/40 text-xs font-bold mt-2 uppercase tracking-tight">
                    Sin registro • Pago con Macro Click
                </p>
            </div>

            {/* Form */}
            <div className="flex-1 bg-white rounded-t-[32px] px-6 pt-8 pb-8 flex flex-col">
                {/* Plate */}
                <div className="mb-6">
                    <label className="text-[10px] font-black text-neutral-text/40 uppercase tracking-widest block mb-3">
                        Patente del vehículo
                    </label>
                    <div className="relative">
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-text/30" />
                        <input
                            type="text"
                            value={plate}
                            onChange={e => setPlate(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            placeholder="ABC-123"
                            maxLength={8}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-neutral-bg text-xl font-black text-neutral-text uppercase tracking-wider placeholder:text-neutral-text/20 placeholder:tracking-tight focus:outline-none focus:border-primary-green/50 focus:bg-emerald-50/30 transition-all"
                            disabled={submitting}
                        />
                    </div>
                </div>

                {/* Zone */}
                <div className="mb-6">
                    <label className="text-[10px] font-black text-neutral-text/40 uppercase tracking-widest block mb-3">
                        Zona
                    </label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text/30 text-2xl">location_on</span>
                        <select
                            value={selectedZone}
                            onChange={e => handleZoneChange(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-neutral-bg text-base font-bold text-neutral-text appearance-none bg-white focus:outline-none focus:border-primary-green/50 focus:bg-emerald-50/30 transition-all disabled:opacity-50"
                            disabled={submitting || zones.length === 0}
                        >
                            {zones.length === 0 && <option value="">Cargando zonas...</option>}
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name} — ${z.pricePerHour}/h</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-neutral-text/30 text-2xl pointer-events-none">expand_more</span>
                    </div>
                </div>

                {/* Time */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-neutral-text/40 uppercase tracking-widest">Duración</label>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                            <span className="material-symbols-outlined text-yellow-600 text-[16px]">schedule</span>
                            <p className="text-yellow-600 text-[11px] font-black uppercase tracking-tight">
                                Hasta {new Date(Date.now() + hours * 3600000).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 py-2">
                        <button
                            onClick={handleDecreaseTime}
                            disabled={hours <= 0.5 || submitting}
                            className="size-16 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-text/70 active:scale-90 transition-all disabled:opacity-30 disabled:scale-100 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-3xl font-bold">remove</span>
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-5xl font-black text-neutral-text tracking-tighter tabular-nums leading-none">{formatTime(hours)}</span>
                            <span className="text-[11px] font-black text-neutral-text/30 uppercase tracking-[0.2em] mt-2">HORAS</span>
                        </div>
                        <button
                            onClick={handleIncreaseTime}
                            disabled={hours >= 8 || submitting}
                            className="size-16 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-text shadow-sm active:scale-90 transition-all disabled:opacity-30 disabled:scale-100"
                        >
                            <span className="material-symbols-outlined text-3xl font-bold">add</span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-neutral-bg w-full mb-6" />

                {/* Price */}
                <div className="flex flex-col gap-1 mb-6">
                    <div className="flex justify-between items-center">
                        <p className="text-neutral-text/40 text-[11px] font-black uppercase tracking-widest">{formatTime(hours)}h × ${zonePrice}/h</p>
                        <p className="text-neutral-text font-black uppercase text-[11px] tracking-tight">SEGÚN ZONA</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-neutral-text font-black text-lg tracking-tight">Total a pagar</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-neutral-text/30 text-2xl font-black">$</span>
                            <span className="text-neutral-text text-5xl font-black tracking-tighter tabular-nums leading-none">
                                {totalCost.toLocaleString("es-AR")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-3xl flex items-start gap-4 animate-in fade-in">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-500 leading-tight">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !plate.trim() || !selectedZone}
                    className="w-full bg-primary-green hover:brightness-110 active:scale-[0.98] text-white font-black text-xl h-18 rounded-[6px] shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 mt-auto"
                >
                    {submitting ? (
                        <><Loader2 className="size-6 animate-spin" /><span>PROCESANDO...</span></>
                    ) : (
                        <><span className="material-symbols-outlined text-2xl">credit_card</span><span>Pagar con Macro Click</span></>
                    )}
                </button>

                <p className="text-center text-[10px] font-bold text-neutral-text/30 uppercase tracking-tight mt-4">
                    Al pagar aceptas los términos y condiciones
                </p>
            </div>
        </div>
    )
}
