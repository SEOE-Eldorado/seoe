"use client"

import { useState, useEffect } from "react"
import { db } from "@shared/api/firebase"
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import { Switch } from "@shared/ui/atoms/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import {
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Clock,
    Info,
    AlertCircle,
    CheckCircle2,
    CalendarDays,
    PartyPopper,
    ShieldAlert,
    ArrowLeft,
    CalendarCheck,
    Settings2,
    Zap,
    MapPin,
    AlertTriangle,
    Edit
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"

export interface SpecialDay {
    id: string
    date: string // YYYY-MM-DD
    name: string
    type: "holiday" | "event"
    isFree: boolean
    customHours?: {
        morning: { start: string; end: string }
        afternoon: { start: string; end: string }
    }
}

export function SpecialDaysManagement() {
    const { toast } = useToast()
    const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
    const [loading, setLoading] = useState(true)

    // View State
    const [view, setView] = useState<"list" | "form">("list")
    const [editingDay, setEditingDay] = useState<SpecialDay | null>(null)
    const [saving, setSaving] = useState(false)

    // Form State
    const [date, setDate] = useState("")
    const [name, setName] = useState("")
    const [type, setType] = useState<"holiday" | "event">("holiday")
    const [isFree, setIsFree] = useState(true)
    const [morningStart, setMorningStart] = useState("08:00")
    const [morningEnd, setMorningEnd] = useState("12:00")
    const [afternoonStart, setAfternoonStart] = useState("16:00")
    const [afternoonEnd, setAfternoonEnd] = useState("20:00")

    useEffect(() => {
        const q = query(collection(db, "special_days"), orderBy("date", "asc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const days: SpecialDay[] = []
            snapshot.forEach((doc) => {
                days.push({ id: doc.id, ...doc.data() } as SpecialDay)
            })
            setSpecialDays(days)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleShowForm = (day?: SpecialDay) => {
        if (day) {
            setEditingDay(day)
            setDate(day.date)
            setName(day.name)
            setType(day.type)
            setIsFree(day.isFree)
            if (day.customHours) {
                setMorningStart(day.customHours.morning.start)
                setMorningEnd(day.customHours.morning.end)
                setAfternoonStart(day.customHours.afternoon.start)
                setAfternoonEnd(day.customHours.afternoon.end)
            }
        } else {
            setEditingDay(null)
            setDate("")
            setName("")
            setType("holiday")
            setIsFree(true)
            setMorningStart("08:00")
            setMorningEnd("12:00")
            setAfternoonStart("16:00")
            setAfternoonEnd("20:00")
        }
        setView("form")
    }

    const handleSave = async () => {
        if (!date || !name) {
            toast({
                title: "Campos incompletos",
                description: "Por favor completa la fecha y el nombre.",
                variant: "destructive"
            })
            return
        }

        setSaving(true)
        try {
            const dayData: Omit<SpecialDay, "id"> = {
                date,
                name,
                type,
                isFree,
                customHours: isFree ? undefined : {
                    morning: { start: morningStart, end: morningEnd },
                    afternoon: { start: afternoonStart, end: afternoonEnd }
                }
            }

            if (editingDay) {
                await updateDoc(doc(db, "special_days", editingDay.id), dayData)
                toast({ title: "Actualizado", description: "El día especial se ha actualizado correctamente." })
            } else {
                await addDoc(collection(db, "special_days"), dayData)
                toast({ title: "Creado", description: "El día especial se ha creado correctamente." })
            }
            setView("list")
        } catch (error) {
            console.error("Error saving special day:", error)
            toast({
                title: "Error",
                description: "No se pudo guardar el día especial.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este día?")) return

        try {
            await deleteDoc(doc(db, "special_days", id))
            toast({ title: "Eliminado", description: "El día ha sido eliminado." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-1">
                <div className="h-20 bg-slate-50 border border-slate-100 rounded-[1.25px]" />
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-[1.25px]" />)}
                </div>
            </div>
        )
    }

    if (view === "form") {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Form Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setView("list")}
                            className="rounded-[1.25px] border-slate-200 hover:bg-slate-50 shadow-none size-9"
                        >
                            <ArrowLeft className="size-4 text-slate-600" />
                        </Button>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                <CalendarCheck className="size-5 text-slate-900" />
                                {editingDay ? "Editar Día Especial" : "Configurar Nuevo Día Especial"}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Gestión de calendarios operativos y excepciones tarifarias.</p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white border border-slate-200 rounded-[1.25px] overflow-hidden shadow-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-200">
                        {/* Column 1: Core Data */}
                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Referencia Temporal</Label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">FECHA DEL EVENTO</span>
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">NOMBRE DEL DÍA</span>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ej. Feriado local, Aniversario..."
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Categorización</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger className="h-11 rounded-[1.25px] border-slate-200 focus:ring-0 shadow-none font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[1.25px] border-slate-200">
                                            <SelectItem value="holiday" className="text-sm font-bold">Feriado Nacional / Provincial</SelectItem>
                                            <SelectItem value="event" className="text-sm font-bold">Evento Especial / Corte de Calle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Operation Config */}
                        <div className="p-8 space-y-8 bg-slate-50/20">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Política Operativa</Label>
                                    <div className="p-4 rounded-[1.25px] bg-white border border-slate-200 flex items-center justify-between shadow-none">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-[0.75px] border flex items-center justify-center ${isFree ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                <Zap className="size-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">Liberar Estacionamiento</span>
                                                <span className="text-[9px] font-bold text-slate-400 tracking-tight">Costo $0 durante todo el evento</span>
                                            </div>
                                        </div>
                                        <Switch checked={isFree} onCheckedChange={setIsFree} />
                                    </div>
                                </div>

                                {!isFree && (
                                    <div className="space-y-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.1em] flex items-center gap-2">
                                            <Clock className="size-3" /> Horarios de Control Excepcionales
                                        </Label>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3 p-4 rounded-[1.25px] bg-white border border-slate-200">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Turno Mañana</span>
                                                <div className="flex items-center gap-2">
                                                    <Input type="time" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} className="h-9 rounded-[0.75px] border-slate-100 text-[10px] font-bold px-2" />
                                                    <span className="text-slate-300">-</span>
                                                    <Input type="time" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} className="h-9 rounded-[0.75px] border-slate-100 text-[10px] font-bold px-2" />
                                                </div>
                                            </div>
                                            <div className="space-y-3 p-4 rounded-[1.25px] bg-white border border-slate-200">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Turno Tarde</span>
                                                <div className="flex items-center gap-2">
                                                    <Input type="time" value={afternoonStart} onChange={(e) => setAfternoonStart(e.target.value)} className="h-9 rounded-[0.75px] border-slate-100 text-[10px] font-bold px-2" />
                                                    <span className="text-slate-300">-</span>
                                                    <Input type="time" value={afternoonEnd} onChange={(e) => setAfternoonEnd(e.target.value)} className="h-9 rounded-[0.75px] border-slate-100 text-[10px] font-bold px-2" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-100 rounded-[1.25px] p-3 flex items-start gap-3">
                                            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-amber-700 leading-tight">
                                                Los usuarios podrán pagar únicamente dentro de estos intervalos horarios durante este día especial.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setView("list")}
                            className="w-40 h-12 rounded-[1.25px] font-black text-slate-500 hover:bg-white uppercase tracking-widest text-[11px] border-slate-200 shadow-none"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-64 h-12 rounded-[1.25px] font-black bg-slate-900 hover:bg-slate-800 text-white uppercase tracking-widest text-[11px] shadow-none border border-slate-900"
                        >
                            {saving ? "PROCESANDO..." : editingDay ? "ACTUALIZAR CALENDARIO" : "CONFIRMAR DÍA ESPECIAL"}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Días Especiales</h3>
                    <p className="text-sm font-medium text-slate-500 tracking-tight">Feriados y eventos con protocolos de estacionamiento atípicos</p>
                </div>
                <Button
                    onClick={() => handleShowForm()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-5 rounded-[1.25px] gap-2 shadow-none border border-slate-900"
                >
                    <Plus className="size-5" />
                    Nuevo Período
                </Button>
            </div>

            <div className="grid gap-3">
                {specialDays.map((day) => (
                    <div key={day.id} className="bg-white border border-slate-200 rounded-[1.25px] p-5 shadow-none hover:border-slate-400 transition-all duration-300 group flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className={`size-12 rounded-[1.25px] flex items-center justify-center border ${day.isFree ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-blue-50 border-blue-100 text-blue-600"}`}>
                                {day.type === "holiday" ? <PartyPopper className="size-6" /> : <ShieldAlert className="size-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-slate-900 tracking-tight">{day.name}</h4>
                                    <Badge className={`${day.isFree ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"} border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider rounded-[0.75px]`}>
                                        {day.isFree ? "Estacionamiento Gratis" : "Configuración Especial"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <CalendarIcon className="size-3 text-slate-300" /> {new Date(day.date + "T00:00:00").toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    {!day.isFree && day.customHours && (
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                            <Clock className="size-3 text-slate-300" /> {day.customHours.morning.start} - {day.customHours.afternoon.end} (PAGO)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleShowForm(day)}
                                className="size-9 rounded-[1.25px] bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 flex items-center justify-center transition-colors"
                            >
                                <Edit className="size-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(day.id)}
                                className="size-9 rounded-[1.25px] bg-red-50/50 text-red-300 hover:text-red-600 border border-red-50 flex items-center justify-center transition-colors"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {specialDays.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[1.25px] border border-dashed border-slate-200">
                        <CalendarDays className="size-12 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400 tracking-tight">No se detectaron excepciones en el calendario</p>
                    </div>
                )}
            </div>

            {/* Protocol Notice */}
            <div className="bg-slate-900 rounded-[1.25px] p-5 text-white flex items-center justify-between relative overflow-hidden group border border-slate-900 shadow-none">
                <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                    <CalendarCheck className="size-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="size-11 rounded-[0.75px] bg-white/10 flex items-center justify-center border border-white/20">
                        <Info className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-0.5">Jerarquía de Reglas</p>
                        <p className="text-sm font-bold">Los días especiales anulan la configuración de horarios de la tarifa base.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
