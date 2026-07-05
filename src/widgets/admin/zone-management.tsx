"use client"

import { useState } from "react"
import { useSettings, type Zone } from "@entities/settings-context"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import { Switch } from "@shared/ui/atoms/switch"
import { LocationMap } from "@widgets/location-map"
import {
    MapPin,
    Plus,
    Trash2,
    Edit2,
    Search,
    Map as MapIcon,
    Layers,
    Navigation,
    Target,
    Compass,
    Settings2,
    Check,
    MapPinOff,
    Maximize2,
    ArrowLeft
} from "lucide-react"

export function ZoneManagement() {
    const { zones, addZone, updateZone, deleteZone } = useSettings()
    const [searchTerm, setSearchTerm] = useState("")

    // View State
    const [view, setView] = useState<"list" | "form">("list")
    const [editingZone, setEditingZone] = useState<Zone | null>(null)
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [active, setActive] = useState(true)
    const [lat, setLat] = useState("-34.6037")
    const [lng, setLng] = useState("-58.3816")
    const [radius, setRadius] = useState("500")

    const handleShowForm = (zone?: Zone) => {
        if (zone) {
            setEditingZone(zone)
            setName(zone.name)
            setDescription(zone.description)
            setActive(zone.active)
            setLat(zone.center.lat.toString())
            setLng(zone.center.lng.toString())
            setRadius(zone.radius.toString())
        } else {
            setEditingZone(null)
            setName("")
            setDescription("")
            setActive(true)
            setLat("-34.6037")
            setLng("-58.3816")
            setRadius("500")
        }
        setView("form")
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const zoneData = {
                name,
                description,
                active,
                center: { lat: parseFloat(lat), lng: parseFloat(lng) },
                radius: parseInt(radius)
            }

            if (editingZone) {
                await updateZone(editingZone.id, zoneData)
            } else {
                await addZone(zoneData)
            }
            setView("list")
        } catch (error) {
            console.error("Error saving zone:", error)
        } finally {
            setLoading(false)
        }
    }

    const captureLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLat(pos.coords.latitude.toFixed(6))
                setLng(pos.coords.longitude.toFixed(6))
            })
        }
    }

    // Filter zones based on search
    const filteredZones = zones.filter((z: Zone) =>
        z.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        z.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (view === "form") {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Form Header with Back Button */}
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
                                <Settings2 className="size-5 text-slate-900" />
                                {editingZone ? "Editar Parámetros de Zona" : "Configurar Nueva Zona de Control"}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Gestión técnica de geolocalización y área de cobertura tarifaria.</p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white border border-slate-200 rounded-[1.25px] overflow-hidden shadow-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-200">
                        {/* Column 1: Info & Config */}
                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Configuración Básica</Label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">NOMBRE DE LA ZONA</span>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ej. Microcentro, Area 1..."
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">DESCRIPCIÓN OPERATIVA</span>
                                            <Input
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Resumen del perímetro..."
                                                className="h-11 rounded-[1.25px] border-slate-200 focus:border-slate-900 focus:ring-0 shadow-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Radio de Acción</Label>
                                        <Badge className="bg-slate-900 text-white border-none text-[11px] font-black rounded-[0.75px] px-2 py-0.5">
                                            {radius}m
                                        </Badge>
                                    </div>
                                    <div className="space-y-4 px-1">
                                        <input
                                            type="range"
                                            min="100"
                                            max="3000"
                                            step="50"
                                            value={radius}
                                            onChange={(e) => setRadius(e.target.value)}
                                            className="w-full h-1 bg-slate-100 rounded-[1.25px] appearance-none cursor-pointer accent-slate-900"
                                        />
                                        <div className="flex justify-between text-[9px] font-black text-slate-300 tracking-tighter">
                                            <span>MÍN: 100m</span>
                                            <span>MÁX: 3km</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-[1.25px] bg-slate-50/50 border border-slate-200 flex items-center justify-between shadow-none">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-[0.75px] border flex items-center justify-center ${active ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                            <Check className="size-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">Estado de Servicio</span>
                                            <span className="text-[9px] font-bold text-slate-400 tracking-tight">Habilita el cobro automático</span>
                                        </div>
                                    </div>
                                    <Switch checked={active} onCheckedChange={setActive} />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Location & Map */}
                        <div className="p-8 space-y-8 bg-slate-50/20">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Punto GPS Central</Label>
                                        <Button
                                            onClick={captureLocation}
                                            variant="outline"
                                            className="h-8 text-[10px] font-black text-blue-600 border-blue-200 bg-white hover:bg-blue-50 px-3 rounded-[1.25px] shadow-none gap-1.5"
                                        >
                                            <Navigation className="size-3" /> MI POSICIÓN
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5 p-3 rounded-[1.25px] bg-white border border-slate-200">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latitud</span>
                                            <input
                                                type="number"
                                                value={lat}
                                                onChange={(e) => setLat(e.target.value)}
                                                className="w-full bg-transparent text-sm font-black outline-none text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-1.5 p-3 rounded-[1.25px] bg-white border border-slate-200">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Longitud</span>
                                            <input
                                                type="number"
                                                value={lng}
                                                onChange={(e) => setLng(e.target.value)}
                                                className="w-full bg-transparent text-sm font-black outline-none text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                        <Maximize2 className="size-3" /> Plano de Referencia
                                    </Label>
                                    <div className="h-[300px] rounded-[1.25px] overflow-hidden grayscale border border-slate-200 shadow-none relative">
                                        <LocationMap location={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }} className="h-full scale-110" />
                                        <div className="absolute inset-0 border-[1px] border-slate-200 pointer-events-none opacity-20" />
                                    </div>
                                </div>
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
                            disabled={loading || !name}
                            className="w-64 h-12 rounded-[1.25px] font-black bg-slate-900 hover:bg-slate-800 text-white uppercase tracking-widest text-[11px] shadow-none border border-slate-900"
                        >
                            {loading ? "PROCESANDO..." : editingZone ? "ACTUALIZAR PARÁMETROS" : "CREAR NUEVA ZONA"}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // List View
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header & Search */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Zonas de Control</h3>
                        <p className="text-sm font-medium text-slate-500 tracking-tight">Gestión de perímetros y tarifas inteligentes</p>
                    </div>
                    <Button
                        onClick={() => handleShowForm()}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-5 rounded-[1.25px] gap-2 shadow-none border border-slate-900"
                    >
                        <Plus className="size-5" />
                        Nueva Zona
                    </Button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <Input
                        placeholder="Buscar por nombre o descripción de la zona..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 rounded-[1.25px] bg-white border-slate-200 focus:ring-slate-900 text-sm shadow-none"
                    />
                </div>
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredZones.map((zone: Zone) => (
                    <div
                        key={zone.id}
                        className="bg-white border border-slate-200 rounded-[1.25px] p-5 shadow-none hover:border-slate-400 transition-all duration-300 group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`size-10 rounded-[1.25px] flex items-center justify-center border ${zone.active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                                    <MapPin className="size-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleShowForm(zone)}
                                        className="size-8 rounded-[1.25px] bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 border border-slate-100 flex items-center justify-center transition-colors shadow-none"
                                    >
                                        <Edit2 className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`¿Eliminar la zona "${zone.name}"? Esta acción no se puede deshacer.`)) {
                                                await deleteZone(zone.id)
                                            }
                                        }}
                                        className="size-8 rounded-[1.25px] bg-red-50/50 text-red-300 hover:text-red-600 hover:bg-red-50 border border-red-50 flex items-center justify-center transition-colors shadow-none"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 tracking-tight">{zone.name}</h4>
                                <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed">{zone.description || "Sin descripción adicional registrada."}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cobertura</span>
                                <span className="text-xs font-bold text-slate-700 mt-1">{zone.radius} metros</span>
                            </div>
                            <Badge className={`${zone.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"} border-none text-[9px] font-black uppercase px-2 py-0.5 tracking-wider rounded-[0.75px]`}>
                                {zone.active ? "Activa" : "Pausada"}
                            </Badge>
                        </div>
                    </div>
                ))}

                {filteredZones.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[1.25px]">
                        <Layers className="size-12 text-slate-200 mb-3" />
                        <p className="text-sm font-bold text-slate-400 tracking-tight">No se encontraron zonas de control</p>
                    </div>
                )}
            </div>

            {/* Hint Box */}
            <div className="bg-blue-600 rounded-[1.25px] p-5 text-white flex items-center justify-between relative overflow-hidden group border border-blue-700 shadow-none">
                <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                    <Target className="size-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="size-11 rounded-[1.25px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <Compass className="size-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-0.5">Política de Geocercado</p>
                        <p className="text-sm font-bold">Las áreas fuera de estas zonas mantienen un costo base de $0.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
