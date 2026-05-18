"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@shared/api/firebase"
import { collection, onSnapshot, doc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import { Textarea } from "@shared/ui/atoms/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shared/ui/atoms/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import {
    AlertTriangle,
    Search,
    Edit2,
    XCircle,
    CheckCircle,
    FileDown,
    Filter,
    Car,
    Calendar,
    User,
    Clock,
    DollarSign,
    Shield,
    BarChart3,
    ArrowUpDown,
    MoreHorizontal,
    MapPin,
    AlertCircle
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"

interface Fine {
    id: string
    plate: string
    amount: number
    reason: string
    issuedAt: Timestamp
    inspectorId: string
    inspectorName: string
    status: "pending" | "paid" | "cancelled"
    location?: { latitude: number; longitude: number }
    userId?: string
    cancelledAt?: Timestamp
    cancelledBy?: string
    cancelReason?: string
    paidAt?: Timestamp
}

interface InspectorStats {
    id: string
    name: string
    count: number
    totalAmount: number
}

export function FinesManagement() {
    const { toast } = useToast()
    const [fines, setFines] = useState<Fine[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [inspectorFilter, setInspectorFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("")

    // Edit/Cancel dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedFine, setSelectedFine] = useState<Fine | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [saving, setSaving] = useState(false)

    // Stats view
    const [showStats, setShowStats] = useState(false)

    useEffect(() => {
        const finesQuery = query(
            collection(db, "fines"),
            orderBy("issuedAt", "desc")
        )

        const unsubscribe = onSnapshot(finesQuery, (snapshot) => {
            const finesData: Fine[] = []
            snapshot.forEach(doc => {
                finesData.push({ id: doc.id, ...doc.data() } as Fine)
            })
            setFines(finesData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Get unique inspectors for filter
    const inspectors = useMemo(() => {
        const uniqueInspectors = new Map<string, string>()
        fines.forEach(f => {
            if (f.inspectorId && f.inspectorName) {
                uniqueInspectors.set(f.inspectorId, f.inspectorName)
            }
        })
        return Array.from(uniqueInspectors.entries()).map(([id, name]) => ({ id, name }))
    }, [fines])

    // Inspector stats
    const inspectorStats = useMemo((): InspectorStats[] => {
        const stats = new Map<string, InspectorStats>()
        fines.forEach(f => {
            if (f.inspectorId) {
                const existing = stats.get(f.inspectorId)
                if (existing) {
                    existing.count++
                    existing.totalAmount += f.amount || 0
                } else {
                    stats.set(f.inspectorId, {
                        id: f.inspectorId,
                        name: f.inspectorName || "Desconocido",
                        count: 1,
                        totalAmount: f.amount || 0
                    })
                }
            }
        })
        return Array.from(stats.values()).sort((a, b) => b.count - a.count)
    }, [fines])

    // Filter fines
    const filteredFines = useMemo(() => {
        let result = fines

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(f => f.plate.toLowerCase().includes(term))
        }

        if (statusFilter !== "all") {
            result = result.filter(f => f.status === statusFilter)
        }

        if (inspectorFilter !== "all") {
            result = result.filter(f => f.inspectorId === inspectorFilter)
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter)
            result = result.filter(f => {
                const fineDate = f.issuedAt?.toDate?.()
                if (!fineDate) return false
                return fineDate.toDateString() === filterDate.toDateString()
            })
        }

        return result
    }, [fines, searchTerm, statusFilter, inspectorFilter, dateFilter])

    // Stats summary
    const summary = useMemo(() => ({
        total: fines.length,
        pending: fines.filter(f => f.status === "pending").length,
        paid: fines.filter(f => f.status === "paid").length,
        cancelled: fines.filter(f => f.status === "cancelled").length,
        totalAmount: fines.reduce((sum, f) => sum + (f.amount || 0), 0),
        paidAmount: fines.filter(f => f.status === "paid").reduce((sum, f) => sum + (f.amount || 0), 0)
    }), [fines])

    const handleCancelFine = async () => {
        if (!selectedFine || !cancelReason.trim()) return

        setSaving(true)
        try {
            const fineRef = doc(db, "fines", selectedFine.id)
            await updateDoc(fineRef, {
                status: "cancelled",
                cancelledAt: Timestamp.now(),
                cancelledBy: "admin",
                cancelReason: cancelReason.trim()
            })

            toast({
                title: "Multa Anulada",
                description: `La multa para ${selectedFine.plate} ha sido anulada.`
            })
            setIsDialogOpen(false)
            setCancelReason("")
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo anular la multa.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleMarkAsPaid = async (fine: Fine) => {
        try {
            const fineRef = doc(db, "fines", fine.id)
            await updateDoc(fineRef, {
                status: "paid",
                paidAt: Timestamp.now()
            })
            toast({
                title: "Multa Pagada",
                description: `La multa para ${fine.plate} ha sido marcada como pagada.`
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado.",
                variant: "destructive"
            })
        }
    }

    const exportToCSV = () => {
        const headers = ["Patente", "Monto", "Motivo", "Inspector", "Fecha", "Estado"]
        const rows = filteredFines.map(f => [
            f.plate,
            f.amount?.toString() || "0",
            f.reason,
            f.inspectorName || "N/A",
            f.issuedAt?.toDate?.().toLocaleString("es-AR") || "",
            f.status === "pending" ? "Pendiente" : f.status === "paid" ? "Pagada" : "Anulada"
        ])

        const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `multas_${new Date().toISOString().split("T")[0]}.csv`
        link.click()

        toast({
            title: "Exportación Exitosa",
            description: `Se exportaron ${filteredFines.length} multas a CSV.`
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[10px] font-bold px-2 py-0.5">Pagada</Badge>
            case "cancelled":
                return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none text-[10px] font-bold px-2 py-0.5">Anulada</Badge>
            default:
                return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none text-[10px] font-bold px-2 py-0.5">Pendiente</Badge>
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-sm w-1/4" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-md" />)}
                </div>
                <div className="h-96 bg-slate-50 rounded-md" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Multas</h3>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Control y seguimiento de infracciones municipales</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowStats(!showStats)}
                        className={`font-bold h-10 px-4 rounded-lg transition-all ${showStats ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                    >
                        <BarChart3 className="size-4 mr-2" />
                        {showStats ? "Ver Listado" : "Ver Estadísticas"}
                    </Button>
                    <Button
                        onClick={exportToCSV}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg h-10 px-4 gap-2 shadow-sm"
                    >
                        <FileDown className="size-4" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "TOTAL EMITIDAS", value: summary.total, color: "text-slate-900" },
                    { label: "PENDIENTES PAGO", value: summary.pending, color: "text-amber-600" },
                    { label: "RECAUDADO HOY", value: `$${summary.paidAmount.toLocaleString("es-AR")}`, color: "text-emerald-600" },
                    { label: "ANULADAS", value: summary.cancelled, color: "text-slate-500" }
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                        <span className={`text-2xl font-black block tracking-tighter ${stat.color}`}>{stat.value}</span>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {showStats ? (
                /* Stats View Table */
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/10">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="size-3.5" /> Desempeño por Inspector
                        </h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Inspector</th>
                                    <th className="px-6 py-4 text-center">Cantidad Multas</th>
                                    <th className="px-6 py-4 text-right">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {inspectorStats.map((stat, index) => (
                                    <tr key={stat.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">
                                                    #{index + 1}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{stat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="outline" className="font-bold border-slate-200">{stat.count}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">${stat.totalAmount.toLocaleString("es-AR")}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Main Table View */
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Filters */}
                    <div className="p-4 border-b border-slate-100 flex flex-col lg:grid lg:grid-cols-4 gap-4 bg-slate-50/30">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input
                                placeholder="Filtrar patente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-lg bg-white border-slate-200 text-sm"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 text-sm">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="pending">Pendientes</SelectItem>
                                <SelectItem value="paid">Pagadas</SelectItem>
                                <SelectItem value="cancelled">Anuladas</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={inspectorFilter} onValueChange={setInspectorFilter}>
                            <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 text-sm">
                                <SelectValue placeholder="Inspector" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="all">Todos los inspectores</SelectItem>
                                {inspectors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="h-10 rounded-lg bg-white border-slate-200 text-sm"
                        />
                    </div>

                    {/* Table Body */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Patente / Vehículo</th>
                                    <th className="px-6 py-4">Detalle / Motivo</th>
                                    <th className="px-6 py-4">Inspector</th>
                                    <th className="px-6 py-4">Fecha y Hora</th>
                                    <th className="px-6 py-4">Monto</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredFines.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Car className="size-12" />
                                                <p className="font-bold text-sm">No se encontraron multas</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFines.map((fine) => (
                                        <tr key={fine.id} className={`group hover:bg-slate-50/50 transition-colors ${fine.status === 'cancelled' ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-lg flex items-center justify-center border border-slate-100 ${fine.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                                        <Car className="size-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 tracking-wider uppercase">{fine.plate}</span>
                                                        {getStatusBadge(fine.status)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-slate-700 leading-tight">{fine.reason}</span>
                                                    {fine.status === 'cancelled' && fine.cancelReason && (
                                                        <span className="text-[10px] text-red-500 italic font-medium">Motivo: {fine.cancelReason}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <User className="size-3 text-slate-400" />
                                                    {fine.inspectorName || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col text-[11px] font-bold text-slate-500">
                                                    <span className="flex items-center gap-1"><Calendar className="size-3 opacity-50" /> {fine.issuedAt?.toDate?.().toLocaleDateString("es-AR")}</span>
                                                    <span className="flex items-center gap-1 opacity-60"><Clock className="size-3" /> {fine.issuedAt?.toDate?.().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">${(fine.amount || 0).toLocaleString("es-AR")}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {fine.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleMarkAsPaid(fine)}
                                                            className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                                            title="Marcar como pagada"
                                                        >
                                                            <CheckCircle className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setSelectedFine(fine); setIsDialogOpen(true); }}
                                                            className="size-8 rounded-lg text-red-500 hover:bg-red-50"
                                                            title="Anular multa"
                                                        >
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Mostrando {filteredFines.length} de {fines.length} infracciones
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-slate-200">Anterior</Button>
                            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-[#f97316] text-white border-none">1</Button>
                            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-slate-200">Siguiente</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Fine Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
                    <div className="p-6 pb-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-red-600 tracking-tight flex items-center gap-2">
                                <AlertCircle className="size-5" /> Anular Multa
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-slate-500">
                                Patente: <span className="font-bold text-slate-900">{selectedFine?.plate}</span> • Monto: <span className="font-bold text-slate-900">${(selectedFine?.amount || 0).toLocaleString("es-AR")}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="p-3.5 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-red-800 leading-normal">
                                Al anular esta infracción, el registro pasará a estado inactivo y no podrá ser revertido. Se requerirá un motivo formal.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Motivo de Anulación</Label>
                            <Textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Ej: Error en carga de patente, duplicado, etc..."
                                className="min-h-24 rounded-lg border-slate-200 focus:ring-1 focus:ring-slate-300 text-sm"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-11 rounded-lg font-bold text-slate-600 border-slate-200"
                        >
                            Volver
                        </Button>
                        <Button
                            onClick={handleCancelFine}
                            disabled={saving || !cancelReason.trim()}
                            className="flex-1 h-11 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                        >
                            {saving ? "Procesando..." : "Confirmar Anulación"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
