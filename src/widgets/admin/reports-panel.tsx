"use client"

import { useState, useMemo } from "react"
import { db } from "@shared/api/firebase"
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@shared/ui/atoms/select"
import {
 FileBarChart,
 Download,
 Calendar,
 Filter,
 TrendingUp,
 DollarSign,
 AlertTriangle,
 BarChart3,
 Clock,
 Zap,
 Users
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"
import { useSettings } from "@entities/settings-context"

type ReportType = "revenue" | "fines" | "occupancy"

export function ReportsPanel() {
 const { toast } = useToast()
 const { zones } = useSettings()
 const [loading, setLoading] = useState(false)
 const [reportType, setReportType] = useState<ReportType>("revenue")
 const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
 const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
 const [selectedZone, setSelectedZone] = useState("all")

 const handleGenerateReport = async () => {
 setLoading(true)
 try {
 const start = new Date(startDate + "T00:00:00")
 const end = new Date(endDate + "T23:59:59")

 let data: any[] = []
 let headers: string[] = []
 let filename = ""

 if (reportType === "revenue") {
 const q = query(
 collection(db, "parking_sessions"),
 where("status", "==", "completed"),
 where("endTime", ">=", Timestamp.fromDate(start)),
 where("endTime", "<=", Timestamp.fromDate(end))
 )
 const snapshot = await getDocs(q)
 data = snapshot.docs.map(doc => {
 const d = doc.data()
 return {
 id: doc.id,
 plate: d.plate,
 startTime: d.startTime?.toDate().toLocaleString(),
 endTime: d.endTime?.toDate().toLocaleString(),
 duration: d.durationMinutes + " min",
 cost: d.totalCost || 0,
 zone: zones.find(z => z.id === d.zoneId)?.name || "N/A"
 }
 })

 if (selectedZone !== "all") {
 data = data.filter(d => d.zone === zones.find(z => z.id === selectedZone)?.name)
 }

 headers = ["ID", "Patente", "Inicio", "Fin", "Duración", "Costo", "Zona"]
 filename = `reporte_recaudacion_${startDate}_a_${endDate}.csv`

 } else if (reportType === "fines") {
 const q = query(
 collection(db, "fines"),
 where("issuedAt", ">=", Timestamp.fromDate(start)),
 where("issuedAt", "<=", Timestamp.fromDate(end))
 )
 const snapshot = await getDocs(q)
 data = snapshot.docs.map(doc => {
 const d = doc.data()
 return {
 id: doc.id,
 plate: d.plate,
 reason: d.reason,
 amount: d.amount || 0,
 inspector: d.inspectorName || "N/A",
 date: d.issuedAt?.toDate().toLocaleString(),
 status: d.status
 }
 })
 headers = ["ID", "Patente", "Motivo", "Monto", "Inspector", "Fecha", "Estado"]
 filename = `reporte_multas_${startDate}_a_${endDate}.csv`

 } else if (reportType === "occupancy") {
 const q = query(
 collection(db, "parking_sessions"),
 where("startTime", ">=", Timestamp.fromDate(start)),
 where("startTime", "<=", Timestamp.fromDate(end))
 )
 const snapshot = await getDocs(q)
 data = snapshot.docs.map(doc => {
 const d = doc.data()
 return {
 id: doc.id,
 zone: zones.find(z => z.id === d.zoneId)?.name || "N/A",
 plate: d.plate,
 hour: d.startTime?.toDate().getHours() + ":00",
 status: d.status
 }
 })
 headers = ["ID", "Zona", "Patente", "Hora Inicio", "Estado"]
 filename = `reporte_ocupacion_${startDate}_a_${endDate}.csv`
 }

 if (data.length === 0) {
 toast({
 title: "Sin datos",
 description: "No se encontraron registros para el período seleccionado.",
 variant: "destructive"
 })
 return
 }

 // Generate CSV
 const csvRows = [headers.join(",")]
 data.forEach(item => {
 csvRows.push(Object.values(item).map(val => `"${val}"`).join(","))
 })
 const csvContent = csvRows.join("\n")

 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
 const url = URL.createObjectURL(blob)
 const link = document.createElement("a")
 link.setAttribute("href", url)
 link.setAttribute("download", filename)
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)

 toast({
 title: "Reporte Generado",
 description: `Se han exportado ${data.length} registros.`
 })

 } catch (error) {
 console.error("Error generating report:", error)
 toast({
 title: "Error",
 description: "Hubo un problema al generar el reporte.",
 variant: "destructive"
 })
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-bold text-primary">Reportes Exportables</h3>
 <p className="text-xs font-medium text-accent">Análisis de datos y auditoría municipal</p>
 </div>
 <div className="size-12 rounded-sm bg-emerald-500/10 flex items-center justify-center">
 <FileBarChart className="size-6 text-emerald-600" />
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Configuration Card */}
 <Card className="lg:col-span-1 border border-slate-200 rounded-sm-[2.5rem] bg-white overflow-hidden">
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Reporte</Label>
 <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
 <SelectTrigger className="h-12 rounded-sm">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="revenue">Recaudación</SelectItem>
 <SelectItem value="fines">Multas Emitidas</SelectItem>
 <SelectItem value="occupancy">Ocupación / Tráfico</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Desde</Label>
 <div className="relative">
 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
 <Input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="pl-11 h-12 rounded-sm"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Hasta</Label>
 <div className="relative">
 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
 <Input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="pl-11 h-12 rounded-sm"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Zona (Opcional)</Label>
 <Select value={selectedZone} onValueChange={setSelectedZone}>
 <SelectTrigger className="h-12 rounded-sm">
 <SelectValue placeholder="Todas las zonas" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todas las zonas</SelectItem>
 {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>

 <Button
 onClick={handleGenerateReport}
 disabled={loading}
 className="w-full h-14 rounded-sm font-black text-sm uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700"
 >
 {loading ? "Procesando..." : "Descargar CSV"}
 {!loading && <Download className="size-4 ml-2" />}
 </Button>
 </div>
 </Card>

 {/* Insight Cards */}
 <div className="lg:col-span-2 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Card className="border border-slate-200 rounded-sm bg-linear-to-br from-primary to-primary/90 text-white p-6">
 <TrendingUp className="size-8 mb-4 opacity-50" />
 <h4 className="text-2xl font-black mb-1">Análisis de Períodos</h4>
 <p className="text-xs text-white/70 font-medium">Exporta datos históricos para comparar el rendimiento entre meses o feriados.</p>
 </Card>
 <Card className="border border-slate-200 rounded-sm bg-amber-500 text-white p-6">
 <Zap className="size-8 mb-4 opacity-50" />
 <h4 className="text-2xl font-black mb-1">Optimización de Zonas</h4>
 <p className="text-xs text-white/70 font-medium">Usa el reporte de ocupación para identificar qué zonas necesitan más inspectores en horarios pico.</p>
 </Card>
 </div>

 <Card className="border border-slate-200 rounded-sm bg-white p-6">
 <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
 Consejos de Reportería
 </h4>
 <div className="space-y-6">
 <div className="flex gap-4">
 <div className="size-10 rounded-sm bg-slate-50 flex items-center justify-center shrink-0">
 <DollarSign className="size-5 text-emerald-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-primary">Consiliación Financiera</p>
 <p className="text-[11px] text-slate-500">Compara la recaudación total con los depósitos bancarios de los puntos de venta externos.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <div className="size-10 rounded-sm bg-slate-50 flex items-center justify-center shrink-0">
 <AlertTriangle className="size-5 text-amber-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-primary">Control de Infracciones</p>
 <p className="text-[11px] text-slate-500">Analiza los motivos más comunes de multas para realizar campañas de concientización vial.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <div className="size-10 rounded-sm bg-slate-50 flex items-center justify-center shrink-0">
 <Users className="size-5 text-blue-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-primary">Auditoría de Personal</p>
 <p className="text-[11px] text-slate-500">Cruza el reporte de multas con el de actividad de inspectores para evaluar productividad.</p>
 </div>
 </div>
 </div>
 </Card>
 </div>
 </div>
 </div>
 )
}
