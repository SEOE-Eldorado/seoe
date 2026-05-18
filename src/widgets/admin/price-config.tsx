"use client"

import { useState } from "react"
import { useSettings } from "@entities/settings-context"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/atoms/card"
import { Label } from "@shared/ui/atoms/label"
import {
    DollarSign,
    Clock,
    Calendar,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    TrendingUp,
    ShieldCheck,
    Coins,
    History,
    Zap,
    Sun,
    Moon,
    ArrowRight
} from "lucide-react"
import { useToast } from "@shared/lib/hooks/use-toast"

export function PriceConfig() {
    const { settings, updateSettings } = useSettings()
    const { toast } = useToast()

    const [rate1, setRate1] = useState(settings?.rates?.tier1?.toString() || "50")
    const [rate2, setRate2] = useState(settings?.rates?.tier2?.toString() || "85")
    const [rate3, setRate3] = useState(settings?.rates?.tier3?.toString() || "130")

    // Sessions
    const [morningStart, setMorningStart] = useState(settings?.operatingHours?.morning?.start || "08:00")
    const [morningEnd, setMorningEnd] = useState(settings?.operatingHours?.morning?.end || "12:00")
    const [afternoonStart, setAfternoonStart] = useState(settings?.operatingHours?.afternoon?.start || "16:00")
    const [afternoonEnd, setAfternoonEnd] = useState(settings?.operatingHours?.afternoon?.end || "20:00")

    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateSettings({
                rates: {
                    tier1: parseFloat(rate1),
                    tier2: parseFloat(rate2),
                    tier3: parseFloat(rate3)
                },
                operatingHours: {
                    morning: { start: morningStart, end: morningEnd },
                    afternoon: { start: afternoonStart, end: afternoonEnd }
                }
            })
            toast({
                title: "Configuración Actualizada",
                description: "Los nuevos precios y horarios ya están en vigencia.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo sincronizar con el servidor.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    if (!settings) return null

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header section with description */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tarifas y Precios</h3>
                    <p className="text-sm font-medium text-slate-500 tracking-tight">Control de costos por tiempo y franjas horarias operativas</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 rounded-xl gap-2 shadow-lg shadow-slate-200 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Rates and Hours */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Rates Section */}
                    <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Coins className="size-3.5" /> Estructura de Costos
                            </h4>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { label: "1ra y 2da Media Hora", val: rate1, set: setRate1, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: "3ra y 4ta Media Hora", val: rate2, set: setRate2, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "5ta en adelante", val: rate3, set: setRate3, color: "text-violet-600", bg: "bg-violet-50" }
                                ].map((tier, i) => (
                                    <div key={i} className="space-y-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-6 rounded-md ${tier.bg} flex items-center justify-center`}>
                                                <DollarSign className={`size-3.5 ${tier.color}`} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tier.label}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                                            <input
                                                type="number"
                                                value={tier.val}
                                                onChange={(e) => tier.set(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-xl font-black text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operating Hours Section */}
                    <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="size-3.5" /> Franjas de Cobro
                            </h4>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Morning Shift */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                                            <Sun className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase">Turno Mañana</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Inicio de operaciones</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Entrada</Label>
                                            <input
                                                type="time"
                                                value={morningStart}
                                                onChange={(e) => setMorningStart(e.target.value)}
                                                className="w-full px-4 h-11 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-1 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                        <ArrowRight className="size-4 text-slate-200 mt-6" />
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Salida</Label>
                                            <input
                                                type="time"
                                                value={morningEnd}
                                                onChange={(e) => setMorningEnd(e.target.value)}
                                                className="w-full px-4 h-11 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-1 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Afternoon Shift */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                            <Moon className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase">Turno Tarde</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Cierre del sistema</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Entrada</Label>
                                            <input
                                                type="time"
                                                value={afternoonStart}
                                                onChange={(e) => setAfternoonStart(e.target.value)}
                                                className="w-full px-4 h-11 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-1 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                        <ArrowRight className="size-4 text-slate-200 mt-6" />
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Salida</Label>
                                            <input
                                                type="time"
                                                value={afternoonEnd}
                                                onChange={(e) => setAfternoonEnd(e.target.value)}
                                                className="w-full px-4 h-11 bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-700 focus:ring-1 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Summary / Context */}
                <div className="space-y-6">
                    <Card className="border-none bg-slate-900 text-white rounded-xl overflow-hidden shadow-xl p-6 relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                            <History className="size-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Zap className="size-5 text-[#f97316]" />
                                </div>
                                <h5 className="font-black tracking-tight text-lg">Resumen de Política</h5>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
                                    <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
                                    <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                                        Las tarifas son progresivas. El sistema calcula automáticamente el salto de franja según el tiempo de permanencia del vehículo.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
                                    <AlertCircle className="size-5 text-amber-400 shrink-0" />
                                    <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                                        Fuera de los rangos horarios definidos, el estacionamiento es <span className="text-white font-bold underline underline-offset-4 decoration-amber-400">libre y gratuito</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-center opacity-40">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic">Seguridad Administrativa SEOE</p>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center text-center gap-2">
                        <TrendingUp className="size-10 text-slate-200" />
                        <p className="text-xs font-bold text-slate-400">Los cambios realizados aquí impactan en el cálculo de saldo de todos los usuarios de forma inmediata.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
