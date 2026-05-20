"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@shared/api/firebase"
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit
} from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shared/ui/atoms/dialog"
import {
    Shield,
    MapPin,
    Activity,
    Clock,
    Search,
    Map as MapIcon,
    LocateFixed,
    CheckCircle,
    FileText,
    Car,
    ArrowUpRight,
    SearchCode,
    GanttChartSquare,
    Zap,
    MapPinOff
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"
import { useSettings } from "@entities/settings-context"
import type { User } from "@shared/types"

interface ActivityLog {
    id: string
    inspectorId: string
    inspectorName: string
    type: "plate_check" | "fine_issued" | "login" | "location_update"
    details: string
    timestamp: Timestamp
    location?: { latitude: number; longitude: number }
}

export function InspectorManagement() {
    const { toast } = useToast()
    const { zones } = useSettings()
    const [inspectors, setInspectors] = useState<User[]>([])
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    // UI state
    const [searchTerm, setSearchTerm] = useState("")
    const [activeInspector, setActiveInspector] = useState<User | null>(null)
    const [isAssignZonesOpen, setIsAssignZonesOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        // 1. Get Inspectors
        const inspectorsQuery = query(
            collection(db, "users"),
            where("role", "==", "inspector")
        )
        const unsubInspectors = onSnapshot(inspectorsQuery, (snapshot) => {
            const data: User[] = []
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as User)
            })
            setInspectors(data)
            setLoading(false)
        })

        // 2. Get Recent Activity Logs
        const logsQuery = query(
            collection(db, "inspector_activity"),
            orderBy("timestamp", "desc"),
            limit(50)
        )
        const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
            const data: ActivityLog[] = []
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as ActivityLog)
            })
            setLogs(data)
        })

        return () => {
            unsubInspectors()
            unsubLogs()
        }
    }, [])

    const filteredInspectors = useMemo(() => {
        if (!searchTerm) return inspectors
        const term = searchTerm.toLowerCase()
        return inspectors.filter(i =>
            i.name?.toLowerCase().includes(term) ||
            i.email?.toLowerCase().includes(term)
        )
    }, [inspectors, searchTerm])

    const handleAssignZones = async (inspector: User, zoneIds: string[]) => {
        setSaving(true)
        try {
            const inspectorRef = doc(db, "users", inspector.id)
            await updateDoc(inspectorRef, {
                assignedZones: zoneIds
            })
            toast({
                title: "Configuración Actualizada",
                description: `Zonas de patrullaje asignadas correctamente a ${inspector.name}.`
            })
            setIsAssignZonesOpen(false)
        } catch (error) {
            toast({
                title: "Error de Guardado",
                description: "No se pudieron sincronizar las zonas con el servidor.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const formatTime = (ts?: Timestamp) => {
        if (!ts) return "--:--"
        return ts.toDate().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-1">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />)}
                </div>
                <div className="h-96 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Cuerpo de Inspectores</h3>
                    <p className="text-sm font-medium text-slate-500 tracking-tight">Supervisión táctica y despliegue de agentes en terreno</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                    <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monitoreo Activo</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Dotación Total", val: inspectors.length, icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
                    {
                        label: "Activos Ahora",
                        val: inspectors.filter(i => i.lastActivity && (Date.now() - i.lastActivity.toMillis() < 30 * 60 * 1000)).length,
                        icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50"
                    },
                    {
                        label: "Control Patentes",
                        val: logs.filter(l => l.type === 'plate_check' && (Date.now() - l.timestamp.toMillis() < 24 * 60 * 60 * 1000)).length,
                        icon: SearchCode, color: "text-violet-600", bg: "bg-violet-50"
                    },
                    {
                        label: "Infracciones Hoy",
                        val: logs.filter(l => l.type === 'fine_issued' && (Date.now() - l.timestamp.toMillis() < 24 * 60 * 60 * 1000)).length,
                        icon: FileText, color: "text-amber-600", bg: "bg-amber-50"
                    }
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                            <div className={`size-11 rounded-lg ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <stat.icon className={`size-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{stat.val}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inspectors List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input
                            placeholder="Buscar agente por nombre o credenciales..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 rounded-xl bg-white border-slate-200 focus:ring-slate-900 text-sm shadow-xs"
                        />
                    </div>

                    <div className="grid gap-3">
                        {filteredInspectors.map((inspector) => (
                            <div key={inspector.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <Shield className="size-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 tracking-tight leading-none mb-1">{inspector.name}</h4>
                                            <p className="text-[11px] font-medium text-slate-500">{inspector.email}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                                                    {inspector.assignedZones?.length || 0} Zonas
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                                    <Clock className="size-3" /> {formatTime(inspector.lastActivity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setActiveInspector(inspector); setIsAssignZonesOpen(true); }}
                                            className="size-9 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
                                            title="Configurar Zonas"
                                        >
                                            <MapIcon className="size-4" />
                                        </button>
                                        <button
                                            className="size-9 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                                            title="Geolocalizar Agente"
                                        >
                                            <LocateFixed className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                {inspector.lastPlateCheck && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Car className="size-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Último Control:</span>
                                            <span className="text-[11px] font-black text-slate-700 font-mono tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{inspector.lastPlateCheck}</span>
                                        </div>
                                        {(Date.now() - (inspector.lastActivity?.toMillis() || 0) < 15 * 60 * 1000) && (
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-[0.2em]">En Línea</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Activity Log Panel */}
                <Card className="border border-slate-200 rounded-xl bg-white h-auto lg:h-[calc(100vh-270px)] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                            <Activity className="size-3.5 text-emerald-500 animate-pulse" /> Radar de Operaciones
                        </h4>
                        <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                        {logs.map((log) => (
                            <div key={log.id} className="relative pl-6 pb-2 border-l border-slate-100 last:pb-0">
                                <div className={`absolute left-[-5px] top-0 size-[9px] rounded-full border-2 border-white ring-2 ring-slate-50 ${log.type === 'fine_issued' ? 'bg-amber-500' :
                                        log.type === 'plate_check' ? 'bg-blue-500' :
                                            'bg-emerald-500'
                                    }`} />
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.inspectorName}</p>
                                        <span className="text-[9px] font-bold text-slate-300 font-mono">{formatTime(log.timestamp)}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                        {log.type === 'fine_issued' ?
                                            <span className="text-amber-600">Registro de infracción emitido</span> :
                                            log.type === 'plate_check' ?
                                                <span className="flex items-center gap-2">Validación de patente <span className="text-blue-600 font-mono italic underline decoration-blue-200 underline-offset-2">{log.details}</span></span> :
                                                log.details
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                                <Activity className="size-12 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest italic">Sin eventos recientes</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-2">
                            <GanttChartSquare className="size-3" />
                            Ver Archivo Log Completo
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Assign Zones Dialog */}
            <Dialog open={isAssignZonesOpen} onOpenChange={setIsAssignZonesOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
                    <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50/50">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <MapIcon className="size-5 text-slate-500" />
                                Configurar Perímetro Escoltado
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium text-slate-400 mt-1">
                                Define las zonas de patrullaje asignadas a <span className="text-slate-900 font-bold">{activeInspector?.name}</span>.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar áreas disponibles</Label>
                        <div className="space-y-2">
                            {zones.map(zone => {
                                const isAssigned = activeInspector?.assignedZones?.includes(zone.id)
                                return (
                                    <button
                                        key={zone.id}
                                        onClick={() => {
                                            if (!activeInspector) return
                                            const current = activeInspector.assignedZones || []
                                            const next = isAssigned
                                                ? current.filter(id => id !== zone.id)
                                                : [...current, zone.id]
                                            setActiveInspector({ ...activeInspector, assignedZones: next })
                                        }}
                                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group ${isAssigned
                                            ? "border-blue-600 bg-blue-50/30 text-blue-900"
                                            : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${isAssigned ? "bg-blue-600 border-blue-400 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                                                }`}>
                                                <MapPin className="size-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm tracking-tight">{zone.name}</p>
                                                <p className="text-[10px] font-medium opacity-60 line-clamp-1">{zone.description || "Perímetro configurado"}</p>
                                            </div>
                                        </div>
                                        {isAssigned && <div className="bg-blue-600 rounded-full p-1"><CheckCircle className="size-4 text-white" /></div>}
                                    </button>
                                )
                            })}
                            {zones.length === 0 && (
                                <div className="text-center py-10 opacity-30">
                                    <MapPinOff className="size-10 mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No hay zonas configuradas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAssignZonesOpen(false)}
                            className="flex-1 h-12 rounded-lg font-bold text-slate-500 hover:bg-slate-100"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => activeInspector && handleAssignZones(activeInspector, activeInspector.assignedZones || [])}
                            disabled={saving}
                            className="flex-3 h-12 rounded-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                        >
                            {saving ? <Loader2 className="animate-spin size-4" /> : "Confirmar Asignación"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Support Message */}
            <div className="bg-indigo-600 rounded-xl p-5 text-white flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                    <Shield className="size-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="size-11 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black italic text-lg shadow-sm">
                        i
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">Protocolo de Campo</p>
                        <p className="text-sm font-bold">Los inspectores solo reciben notificaciones de infracciones en sus zonas asignadas.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return <Activity className={`${className} animate-pulse`} />
}
