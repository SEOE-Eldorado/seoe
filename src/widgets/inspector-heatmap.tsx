"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import { Button } from "@shared/ui/atoms/button"
import { MapPin, AlertTriangle, RefreshCw, Layers } from "lucide-react"

export function InspectorHeatmap() {
    const [loading, setLoading] = useState(false)

    // Simulate loading data
    const refreshMap = () => {
        setLoading(true)
        setTimeout(() => setLoading(false), 1500)
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Mapa de Calor y Predicción</h3>
                    <p className="text-sm text-slate-500">Zonas rojas: Alta probabilidad de vehículos sin pago o expirados</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshMap} disabled={loading} className="gap-2 font-bold">
                    <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <Card className="border border-slate-100 rounded-[1.5px] overflow-hidden bg-white shadow-sm">
                <CardContent className="p-0 relative h-[60vh] min-h-[400px]">
                    {/* Simulated Map Background */}
                    <iframe
                        width="100%"
                        height="100%"
                        className="pointer-events-none"
                        style={{ border: 0, position: 'absolute', inset: 0, filter: 'grayscale(0.3) contrast(1.2)' }}
                        allowFullScreen
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-64.20%2C-31.42%2C-64.18%2C-31.40&layer=mapnik"
                    ></iframe>

                    {/* Dark overlay to make heat spots pop out */}
                    <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />

                    {/* Heatmap Overlay Spots (Simulated for Demo) */}
                    <div className="absolute top-[30%] left-[40%] text-center pointer-events-none">
                        <div className="w-32 h-32 bg-red-600/50 rounded-full blur-2xl absolute -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        <div className="w-16 h-16 bg-red-500/80 rounded-full blur-xl absolute -translate-x-1/2 -translate-y-1/2" />
                        <MapPin className="text-white size-8 absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-md z-10 -ml-1 -mt-4" />
                        <div className="absolute bg-white text-red-600 font-bold px-2 py-0.5 rounded-[1px] text-xs -translate-x-1/2 mt-2 shadow-lg z-10 tracking-widest">+12 Vencidos</div>
                    </div>

                    <div className="absolute top-[60%] left-[65%] text-center pointer-events-none">
                        <div className="w-24 h-24 bg-orange-500/50 rounded-full blur-2xl absolute -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        <div className="w-12 h-12 bg-orange-600/70 rounded-full blur-xl absolute -translate-x-1/2 -translate-y-1/2" />
                        <MapPin className="text-white size-6 absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-md z-10 -ml-1 -mt-4" />
                        <div className="absolute bg-white text-orange-600 font-bold px-2 py-0.5 rounded-[1px] text-xs -translate-x-1/2 mt-2 shadow-lg z-10 tracking-widest">+5 Alertas</div>
                    </div>

                    <div className="absolute top-[20%] left-[70%] text-center pointer-events-none">
                        <div className="w-40 h-40 bg-emerald-500/30 rounded-full blur-2xl absolute -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bg-white/90 text-emerald-700 font-bold px-2 py-0.5 rounded-[1px] text-[10px] -translate-x-1/2 mt-2 shadow-sm z-10 tracking-widest uppercase border border-emerald-100 backdrop-blur-sm">Zona Limpia</div>
                    </div>

                    {/* Filter controls layer */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                        <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 shadow-lg border border-slate-200/50 w-48">
                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5 mb-3">
                                <Layers className="size-3" /> Capas de Datos
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                        <span className="text-xs font-bold text-slate-700">Crítico (&gt;10 Vencidos)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                        <span className="text-xs font-bold text-slate-700">Alerta (1-9 Vencidos)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-slate-700">Zona Limpia</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500 text-white rounded-lg p-3 shadow-lg flex items-start gap-2 max-w-[200px] animate-pulse">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold leading-tight drop-shadow-sm">
                                Dirígete al Norte (Av. Centro). Sistema detecta agrupamiento de vehículos expirados hace 15 min.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
