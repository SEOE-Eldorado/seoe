"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import { auth, db } from "@shared/api/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Car, Search, MapPin, Clock, Loader2, CheckCircle2, AlertCircle, DollarSign } from "lucide-react"

export function SellerStartParking() {
  const { user } = useAuth()
  const [plate, setPlate] = useState("")
  const [zones, setZones] = useState<{ id: string; name: string; basePrice?: number; pricePerHour?: number }[]>([])
  const [selectedZone, setSelectedZone] = useState("")
  const [address, setAddress] = useState("")
  const [hours, setHours] = useState(1)
  const [costPerHour, setCostPerHour] = useState(80)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState<{ plate: string; brand?: string; model?: string; owner: string; balance: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; session?: any } | null>(null)

  // Cargar zonas
  useEffect(() => {
    const loadZones = async () => {
      try {
        const snapshot = await getDocs(collection(db, "zones"))
        const zonesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          basePrice: doc.data().basePrice,
          pricePerHour: doc.data().pricePerHour,
        }))
        setZones(zonesData)
        if (zonesData.length > 0) {
          setSelectedZone(zonesData[0].name)
          if (zonesData[0].pricePerHour) setCostPerHour(zonesData[0].pricePerHour)
        }
      } catch (err) {
        // Zonas no disponibles aún
      }
    }
    loadZones()
  }, [])

  const handleZoneChange = (zoneName: string) => {
    setSelectedZone(zoneName)
    const zone = zones.find(z => z.name === zoneName)
    if (zone?.pricePerHour) setCostPerHour(zone.pricePerHour)
  }

  const handleSearch = async () => {
    if (!plate.trim()) return
    setSearching(true)
    setError(null)
    setVehicleInfo(null)

    try {
      const cleanPlate = plate.trim().toUpperCase()
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      // Buscar vehículo por patente (usamos el mismo endpoint de find-user)
      const res = await fetch(`/api/admin/sellers/find-user?plate=${encodeURIComponent(cleanPlate)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Vehículo no encontrado")

      setVehicleInfo({
        plate: cleanPlate,
        brand: data.vehicle?.brand,
        model: data.vehicle?.model,
        owner: data.user.name,
        balance: data.user.balance,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!vehicleInfo) {
      setError("Buscá una patente primero")
      return
    }
    if (!selectedZone) {
      setError("Seleccioná una zona")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      const res = await fetch("/api/seller/start-parking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plate: vehicleInfo.plate,
          zone: selectedZone,
          address,
          hours,
          costPerHour,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Error al iniciar estacionamiento")

      setResult({ success: true, message: data.message, session: data.session })
      setPlate("")
      setVehicleInfo(null)
      setAddress("")
      setHours(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalCost = hours * costPerHour

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search vehicle card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Buscar Vehículo</h3>
        <p className="text-sm text-slate-500 mb-6">Ingresá la patente para iniciar estacionamiento</p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Car className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              value={plate}
              onChange={e => setPlate(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="ej: ABC-123"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 text-lg font-bold text-slate-800 uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !plate.trim()}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            {searching ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in">
          <AlertCircle className="size-6 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Vehicle found - parking form */}
      {vehicleInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          {/* Vehicle info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="size-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Car className="size-7 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 tracking-wider">{vehicleInfo.plate}</h4>
              {vehicleInfo.brand && <p className="text-sm text-slate-500">{vehicleInfo.brand} {vehicleInfo.model}</p>}
              <p className="text-sm text-slate-500">Titular: <span className="font-bold text-slate-700">{vehicleInfo.owner}</span></p>
              <p className="text-sm font-bold text-emerald-600">Saldo: ${vehicleInfo.balance.toLocaleString("es-AR")}</p>
            </div>
          </div>

          {/* Parking form */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Zone */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Zona</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <select
                  value={selectedZone}
                  onChange={e => handleZoneChange(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.name}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Horas</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <select
                  value={hours}
                  onChange={e => setHours(parseInt(e.target.value))}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h} {h === 1 ? "hora" : "horas"}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address (optional) */}
            <div className="col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Dirección (opcional)</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="ej: San Martín 123"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-50 rounded-xl p-5 mb-6 flex items-center justify-between border border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total estimado</p>
              <p className="text-sm text-slate-500">{hours}h × ${costPerHour}/h</p>
            </div>
            <p className="text-3xl font-black text-slate-900">${totalCost.toLocaleString("es-AR")}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Car className="size-5" />
            )}
            {loading ? "Iniciando..." : `INICIAR ESTACIONAMIENTO — $${totalCost.toLocaleString("es-AR")}`}
          </button>
        </div>
      )}

      {/* Success */}
      {result?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 animate-in fade-in">
          <div className="flex items-start gap-4 mb-4">
            <CheckCircle2 className="size-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">¡Estacionamiento iniciado!</p>
              <p className="text-sm text-emerald-600 mt-1">{result.message}</p>
            </div>
          </div>
          {result.session && (
            <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-slate-500">Patente:</span> <span className="font-bold">{result.session.plate}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Zona:</span> <span className="font-bold">{result.session.zone}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Vence:</span> <span className="font-bold">{new Date(result.session.endTime).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Costo:</span> <span className="font-bold">${result.session.cost.toLocaleString("es-AR")}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
