"use client"

import { useState, useEffect } from "react"
import { db } from "@shared/api/firebase"
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc, query, orderBy, Timestamp } from "firebase/firestore"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    UserCircle,
    MapPin,
    Car,
    ShieldBan,
    ArrowLeft,
    CheckCircle2,
    Info,
    IdCard,
    Home
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"

export interface Exemption {
    id: string
    dni: string
    name: string
    plate: string
    type: "disability" | "resident"
    exemptedStreets?: string // Comma-separated or straightforward text for streets
    createdAt: number
}

export function ExemptionsManagement() {
    const { toast } = useToast()
    const [exemptions, setExemptions] = useState<Exemption[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // View State
    const [view, setView] = useState<"list" | "form">("list")
    const [editingExemption, setEditingExemption] = useState<Exemption | null>(null)
    const [saving, setSaving] = useState(false)

    // Form State
    const [dni, setDni] = useState("")
    const [name, setName] = useState("")
    const [plate, setPlate] = useState("")
    const [type, setType] = useState<"disability" | "resident">("disability")
    const [exemptedStreets, setExemptedStreets] = useState("")

    useEffect(() => {
        const q = query(collection(db, "exemptions"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Exemption[] = []
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as Exemption)
            })
            setExemptions(items)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleShowForm = (exemption?: Exemption) => {
        if (exemption) {
            setEditingExemption(exemption)
            setDni(exemption.dni)
            setName(exemption.name)
            setPlate(exemption.plate)
            setType(exemption.type)
            setExemptedStreets(exemption.exemptedStreets || "")
        } else {
            setEditingExemption(null)
            setDni("")
            setName("")
            setPlate("")
            setType("disability")
            setExemptedStreets("")
        }
        setView("form")
    }

    const handleSave = async () => {
        if (!dni || !name || !plate) {
            toast({
                title: "Campos incompletos",
                description: "Por favor completa el DNI, Nombre y Patente.",
                variant: "destructive"
            })
            return
        }

        setSaving(true)
        try {
            const exemptionData: Omit<Exemption, "id"> = {
                dni,
                name,
                plate: plate.toUpperCase(),
                type,
                exemptedStreets: type === "resident" ? exemptedStreets : "",
                createdAt: editingExemption ? editingExemption.createdAt : Date.now()
            }

            if (editingExemption) {
                await updateDoc(doc(db, "exemptions", editingExemption.id), exemptionData)
                toast({ title: "Actualizado", description: "El registro se ha actualizado correctamente." })
            } else {
                await addDoc(collection(db, "exemptions"), exemptionData)
                toast({ title: "Creado", description: "El registro se ha creado correctamente." })
            }
            setView("list")
        } catch (error) {
            console.error("Error saving exemption:", error)
            toast({
                title: "Error",
                description: "No se pudo guardar el registro.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este registro de excepción?")) return

        try {
            await deleteDoc(doc(db, "exemptions", id))
            toast({ title: "Eliminado", description: "El registro ha sido eliminado." })
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
        }
    }

    // Filter based on search
    const filteredExemptions = exemptions.filter((e) =>
        e.dni.includes(searchTerm) ||
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.plate.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                                <ShieldBan className="size-5 text-slate-900" />
                                {editingExemption ? "Editar Beneficio" : "Registrar Nueva Exención"}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Gestión de frentistas residentes y personas con discapacidad.</p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white border border-slate-200 rounded-[1.25px] overflow-hidden shadow-none max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-200">
                        {/* Column 1: Core Data */}
                        <div className="p-8 space-y-8 h-full bg-slate-50/20">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Identidad y Vehículo</Label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">DNI TITULAR</span>
                                            <Input
                                                type="text"
                                                value={dni}
                                                onChange={(e) => setDni(e.target.value)}
                                                placeholder="Ej. 34123456"
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">NOMBRE COMPLETO</span>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Nombre del beneficiario"
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">DOMINIO (PATENTE)</span>
                                            <Input
                                                value={plate}
                                                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                                placeholder="Ej. AB123CD"
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Operation Config */}
                        <div className="p-8 space-y-8 h-full">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Tipo de Beneficio</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger className="h-11 rounded-[1.25px] border-slate-200 focus:ring-0 shadow-none font-bold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[1.25px] border-slate-200">
                                            <SelectItem value="disability" className="text-sm font-bold flex items-center gap-2">Persona con Discapacidad</SelectItem>
                                            <SelectItem value="resident" className="text-sm font-bold flex items-center gap-2">Frentista / Residente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {type === "resident" && (
                                    <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                            <Home className="size-3" /> Zonas o Calles Exentas
                                        </Label>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Detalle de cobertura</span>
                                            <Input
                                                value={exemptedStreets}
                                                onChange={(e) => setExemptedStreets(e.target.value)}
                                                placeholder="Ej. Av. San Martín 100-200, Belgrano..."
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm"
                                            />
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-[1.25px] p-3 flex items-start gap-3">
                                            <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-blue-700 leading-tight">
                                                Los frentistas mantendrán tarifa $0 únicamente en las calles especificadas en este campo.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {type === "disability" && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-[1.25px] p-4 flex items-start gap-3 animate-in fade-in">
                                        <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                        <div>
                                            <h4 className="text-[11px] font-black text-emerald-900 uppercase mb-1">Cobertura Total</h4>
                                            <p className="text-[10px] font-bold text-emerald-700 leading-tight">
                                                Este dominio {plate ? `(${plate})` : ''} estará exento del pago de estacionamiento en todas las zonas operativas.
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
                            {saving ? "PROCESANDO..." : editingExemption ? "ACTUALIZAR REGISTRO" : "CONFIRMAR EXENCIÓN"}
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
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Exenciones Tarifarias</h3>
                    <p className="text-sm font-medium text-slate-500 tracking-tight">Padrón de frentistas domiciliarios y personas con discapacidad</p>
                </div>
                <Button
                    onClick={() => handleShowForm()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-5 rounded-[1.25px] gap-2 shadow-none border border-slate-900"
                >
                    <Plus className="size-5" />
                    Nuevo Registro
                </Button>
            </div>

            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                    placeholder="Buscar por DNI, Dominio o Nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 rounded-[1.25px] bg-white border-slate-200 focus:ring-slate-900 text-sm font-bold shadow-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExemptions.map((exmp) => (
                    <div key={exmp.id} className="bg-white border border-slate-200 rounded-[1.25px] p-5 shadow-none hover:border-slate-400 transition-all duration-300 group flex justify-between flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`size-10 rounded-[1.25px] shrink-0 flex items-center justify-center border ${exmp.type === 'disability' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-blue-50 border-blue-100 text-blue-600"}`}>
                                {exmp.type === "disability" ? <UserCircle className="size-5" /> : <Home className="size-5" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleShowForm(exmp)}
                                    className="size-8 rounded-[1.25px] bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 flex items-center justify-center transition-colors"
                                >
                                    <Edit2 className="size-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(exmp.id)}
                                    className="size-8 rounded-[1.25px] bg-red-50/50 text-red-300 hover:text-red-600 border border-red-50 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 tracking-tight uppercase">{exmp.plate}</h4>
                                <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0 border-none rounded-[0.75px] ${exmp.type === 'disability' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {exmp.type === "disability" ? "Libre" : "Frentista"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{exmp.name}</p>
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">DNI: {exmp.dni}</p>
                            </div>
                        </div>

                        {exmp.type === "resident" && exmp.exemptedStreets && (
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">Calles Cubiertas</span>
                                <span className="text-xs font-bold text-blue-600">{exmp.exemptedStreets}</span>
                            </div>
                        )}
                        {exmp.type === "disability" && (
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Cobertura Global Total</span>
                            </div>
                        )}
                    </div>
                ))}

                {filteredExemptions.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[1.25px] border border-dashed border-slate-200">
                        <ShieldBan className="size-12 text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400 tracking-tight">No se encontraron excepciones registradas</p>
                    </div>
                )}
            </div>
        </div>
    )
}
