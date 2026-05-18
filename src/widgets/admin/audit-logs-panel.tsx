"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Button } from "@shared/ui/atoms/button"
import {
    Activity,
    Search,
    User,
    Calendar,
    Settings,
    ShieldAlert,
    FileText,
    DollarSign,
    Filter,
    Clock,
    ArrowUpDown,
    Eye,
    ChevronRight,
    SearchCode
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@shared/ui/atoms/dialog"

interface AuditLog {
    id: string
    adminName: string
    action: string
    details: string
    timestamp: Timestamp
    targetId?: string
    metadata?: any
}

export function AuditLogsPanel() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterAction, setFilterAction] = useState<string>("all")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    useEffect(() => {
        const q = query(
            collection(db, "audit_logs"),
            orderBy("timestamp", "desc"),
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: AuditLog[] = []
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as AuditLog)
            })
            setLogs(data)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const filteredLogs = useMemo(() => {
        let result = logs

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(log =>
                log.adminName.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term) ||
                log.action.toLowerCase().includes(term)
            )
        }

        if (filterAction !== "all") {
            if (filterAction === "settings") {
                result = result.filter(log => log.action.includes("config") || log.action.includes("rate") || log.action.includes("zone"))
            } else if (filterAction === "users") {
                result = result.filter(log => log.action.includes("user") || log.action.includes("role") || log.action.includes("block"))
            } else if (filterAction === "finance") {
                result = result.filter(log => log.action.includes("fine") || log.action.includes("payment") || log.action.includes("refund"))
            }
        }

        return result
    }, [logs, searchTerm, filterAction])

    const getActionType = (action: string) => {
        if (action.includes("config") || action.includes("rate")) return { label: "Config", color: "bg-slate-100 text-slate-600", icon: Settings }
        if (action.includes("user") || action.includes("role")) return { label: "Usuarios", color: "bg-blue-100 text-blue-700", icon: User }
        if (action.includes("fine")) return { label: "Multas", color: "bg-amber-100 text-amber-700", icon: FileText }
        if (action.includes("payment") || action.includes("refund")) return { label: "Finanzas", color: "bg-emerald-100 text-emerald-700", icon: DollarSign }
        return { label: "Sistema", color: "bg-slate-100 text-slate-500", icon: Activity }
    }

    const formatFullDate = (ts: Timestamp) => {
        return ts.toDate().toLocaleString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-lg w-1/4" />
                <div className="h-96 bg-slate-50 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Logs de Auditoría</h3>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Registro histórico de todas las operaciones administrativas</p>
                </div>
                <div className="size-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <ShieldAlert className="size-6 text-slate-400" />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-slate-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por administrador, acción o detalle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 rounded-lg bg-white border-slate-200 text-sm"
                        />
                    </div>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="w-full lg:w-56 h-10 rounded-lg bg-white border-slate-200 text-sm">
                            <div className="flex items-center gap-2">
                                <Filter className="size-3.5 text-slate-400" />
                                <SelectValue placeholder="Todas las categorías" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            <SelectItem value="settings">Configuración / Tasas</SelectItem>
                            <SelectItem value="users">Gestión de Usuarios</SelectItem>
                            <SelectItem value="finance">Finanzas y Multas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Administrador</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Detalles</th>
                                <th className="px-6 py-4 text-right">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Activity className="size-12" />
                                            <p className="font-bold text-sm text-slate-500">Sin registros de auditoría</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const actionInfo = getActionType(log.action);
                                    return (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                        <Clock className="size-3 text-slate-400" />
                                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString("es-AR") : '-'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold ml-4.5 opacity-70">
                                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <User className="size-3.5 text-slate-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{log.adminName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${actionInfo.color} hover:${actionInfo.color} border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider inline-flex items-center gap-1`}>
                                                    <actionInfo.icon className="size-2.5" />
                                                    {log.action.replace(/_/g, " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 min-w-[250px]">
                                                <span className="text-xs font-medium text-slate-600 leading-normal">{log.details}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 gap-2 font-bold text-[10px] uppercase tracking-wider"
                                                >
                                                    <SearchCode className="size-3.5" />
                                                    Ver JSON
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Últimos {filteredLogs.length} eventos registrados
                    </p>
                    <Button variant="ghost" size="sm" className="text-[11px] font-bold text-primary gap-1">
                        Ver historial completo <ChevronRight className="size-3" />
                    </Button>
                </div>
            </div>

            {/* JSON Metadata Viewer Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <SearchCode className="size-5 text-slate-500" /> Detalles del Evento
                        </DialogTitle>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <Calendar className="size-3.5" /> {selectedLog && formatFullDate(selectedLog.timestamp)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <User className="size-3.5" /> {selectedLog?.adminName}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        <p className="text-sm text-slate-700 font-bold mb-4">{selectedLog?.details}</p>

                        <div className="bg-[#1e293b] rounded-xl p-5 overflow-auto max-h-[400px] border border-slate-800 shadow-inner">
                            <pre className="text-[12px] font-mono text-emerald-400 leading-relaxed no-scrollbar">
                                {selectedLog && JSON.stringify(selectedLog.metadata || { message: "Sin metadata adicional" }, null, 4)}
                            </pre>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button
                            onClick={() => setSelectedLog(null)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-lg"
                        >
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
