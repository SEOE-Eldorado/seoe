"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@shared/api/firebase"
import { useAuth } from "@entities/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import { Input } from "@shared/ui/atoms/input"
import { Button } from "@shared/ui/atoms/button"
import { Search, FileText, Calendar, DollarSign, TrendingUp, Printer, Filter } from "lucide-react"
import { printFineTicket } from "@shared/lib/sunmi-printer"

interface InspectorFine {
    id: string
    vehiclePlate: string
    type: string
    amount: number
    status: string
    createdAt: any
    actaNumber?: string
    location?: string
    description?: string
    inspectorId?: string
    inspectorName?: string
}

/**
 * Componente "Mis Multas" para inspectores.
 * Lista solo las multas emitidas por el inspector actual,
 * con estadísticas y opción de reimprimir comprobantes.
 */
export function InspectorMyFines() {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all")

    // Query: multas emitidas por este inspector
    const { data: myFines = [], isLoading } = useQuery({
        queryKey: ['inspector-my-fines', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            const finesRef = collection(db, "fines")
            // Firestore: filtramos por inspectorId y ordenamos por fecha desc
            const q = query(
                finesRef,
                where("inspectorId", "==", user.id),
                orderBy("createdAt", "desc"),
                limit(200)
            )
            const snapshot = await getDocs(q)
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InspectorFine[]
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 min
    })

    // Filtros aplicados
    const filteredFines = useMemo(() => {
        return myFines.filter(f => {
            const matchSearch = !searchTerm ||
                f.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.actaNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchStatus = statusFilter === "all" || f.status === statusFilter
            return matchSearch && matchStatus
        })
    }, [myFines, searchTerm, statusFilter])

    // Estadísticas
    const stats = useMemo(() => {
        const totalAmount = myFines.reduce((acc, f) => acc + (f.amount || 0), 0)
        const paidAmount = myFines
            .filter(f => f.status === "paid")
            .reduce((acc, f) => acc + (f.amount || 0), 0)
        const pendingAmount = myFines
            .filter(f => f.status === "pending")
            .reduce((acc, f) => acc + (f.amount || 0), 0)
        const byStatus = {
            pending: myFines.filter(f => f.status === "pending").length,
            paid: myFines.filter(f => f.status === "paid").length,
            cancelled: myFines.filter(f => f.status === "cancelled").length,
        }
        // Multas de hoy
        const today = new Date().toISOString().slice(0, 10)
        const todayCount = myFines.filter(f => {
            const fDate = f.createdAt?.toDate?.() ? f.createdAt.toDate().toISOString().slice(0, 10) : null
            return fDate === today
        }).length
        return { total: myFines.length, totalAmount, paidAmount, pendingAmount, byStatus, todayCount }
    }, [myFines])

    const handleReprint = (fine: InspectorFine) => {
        printFineTicket({
            plate: fine.vehiclePlate,
            type: fine.type,
            amount: fine.amount,
            location: fine.location || "N/A",
            date: new Date(fine.createdAt?.toDate?.() || Date.now()).toLocaleString('es-AR'),
            inspectorName: user?.name,
            actaNumber: fine.actaNumber || "N/A",
            qrData: `https://seoe.eldorado.gob.ar/payment?plate=${encodeURIComponent(fine.vehiclePlate)}&amount=${fine.amount}`,
        }).catch(console.error)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="size-12 border-[5px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Mis Multas</h3>
                <p className="text-sm font-medium text-slate-500">Multas emitidas por tu turno — reimprimir comprobantes y ver estadísticas</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <FileText className="size-3.5 text-orange-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hoy</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stats.todayCount}</p>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="size-3.5 text-blue-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Emitidas</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <DollarSign className="size-3.5 text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cobrado</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">${stats.paidAmount.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <DollarSign className="size-3.5 text-amber-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pendiente</span>
                        </div>
                        <p className="text-2xl font-black text-amber-600">${stats.pendingAmount.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por patente o número de acta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-slate-200"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "pending", "paid", "cancelled"] as const).map(s => (
                        <Button
                            key={s}
                            variant={statusFilter === s ? "default" : "outline"}
                            onClick={() => setStatusFilter(s)}
                            className="capitalize rounded-xl h-11"
                            size="sm"
                        >
                            {s === "all" ? "Todas" : s === "pending" ? "Pendientes" : s === "paid" ? "Pagadas" : "Canceladas"}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            <div className="space-y-2">
                {filteredFines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <FileText className="size-12 text-slate-200 mb-3" />
                        <p className="text-sm font-bold text-slate-400">
                            {myFines.length === 0 ? "Aún no emitiste multas" : "No hay multas con esos filtros"}
                        </p>
                    </div>
                ) : (
                    filteredFines.map(fine => (
                        <div
                            key={fine.id}
                            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="size-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                                        {fine.vehiclePlate?.slice(0, 3) || "---"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 truncate">{fine.vehiclePlate}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span className="font-mono">{fine.actaNumber || "Sin acta"}</span>
                                            <span>•</span>
                                            <span className="capitalize">{fine.type?.replace("_", " ")}</span>
                                            <span>•</span>
                                            <span>
                                                {fine.createdAt?.toDate?.()
                                                    ? new Date(fine.createdAt.toDate()).toLocaleDateString('es-AR')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">${(fine.amount || 0).toLocaleString()}</p>
                                        <Badge className={`text-[9px] font-black uppercase ${
                                            fine.status === "paid"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                : fine.status === "cancelled"
                                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                        }`}>
                                            {fine.status === "paid" ? "Pagada" : fine.status === "cancelled" ? "Cancelada" : "Pendiente"}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleReprint(fine)}
                                        title="Reimprimir comprobante"
                                        className="size-9 rounded-lg border-slate-200"
                                    >
                                        <Printer className="size-4 text-slate-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
