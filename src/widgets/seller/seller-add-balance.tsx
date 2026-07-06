"use client"

import { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { auth, db } from "@shared/api/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Search, UserCheck, DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function SellerAddBalance() {
  const { user } = useAuth()
  const [searchType, setSearchType] = useState<"email" | "plate">("email")
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<{ uid: string; name: string; email: string; balance: number } | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"cash" | "transfer" | "card">("cash")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    setLoading(true)
    setError(null)
    setSearchResult(null)
    setResult(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      // Buscar usuario por email
      if (searchType === "email") {
        const res = await fetch(`/api/admin/sellers/find-user?email=${encodeURIComponent(searchValue.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Usuario no encontrado")
        setSearchResult(data.user)
      } else {
        // Buscar por patente
        const res = await fetch(`/api/admin/sellers/find-user?plate=${encodeURIComponent(searchValue.trim().toUpperCase())}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Vehículo no encontrado")
        setSearchResult(data.user)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    const numAmount = parseInt(amount)
    if (!numAmount || numAmount <= 0) {
      setError("Ingresá un monto válido")
      return
    }
    if (!searchResult) {
      setError("Buscá un usuario primero")
      return
    }

    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      const res = await fetch("/api/seller/add-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target: searchType === "email" ? searchValue.trim() : searchValue.trim().toUpperCase(),
          targetType: searchType,
          amount: numAmount,
          method,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Error al cargar saldo")

      setResult({ success: true, message: data.message })
      setAmount("")
      setSearchResult(null)
      setSearchValue("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Buscar Usuario</h3>
        <p className="text-sm text-slate-500 mb-6">Ingresá el email o la patente del usuario para cargarle saldo</p>

        {/* Toggle search type */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setSearchType("email"); setSearchValue(""); setSearchResult(null) }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              searchType === "email"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Por Email
          </button>
          <button
            onClick={() => { setSearchType("plate"); setSearchValue(""); setSearchResult(null) }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              searchType === "plate"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Por Patente
          </button>
        </div>

        {/* Search input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={searchType === "email" ? "ej: usuario@email.com" : "ej: ABC-123"}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchValue.trim()}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
            Buscar
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in">
          <AlertCircle className="size-6 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Result display */}
      {searchResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="size-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <UserCheck className="size-7 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{searchResult.name}</h4>
              <p className="text-sm text-slate-500">{searchResult.email}</p>
              <p className="text-sm font-bold text-emerald-600 mt-1">
                Saldo actual: ${searchResult.balance.toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Monto a cargar
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 text-2xl font-black text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Método de pago
              </label>
              <div className="flex gap-2">
                {(["cash", "transfer", "card"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all border ${
                      method === m
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {{ cash: "Efectivo", transfer: "Transferencia", card: "Tarjeta" }[m]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !amount || parseInt(amount) <= 0}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Wallet className="size-5" />
              )}
              {submitting ? "Cargando..." : `CARGAR $${parseInt(amount || "0").toLocaleString("es-AR")}`}
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {result?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in">
          <CheckCircle2 className="size-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">¡Carga exitosa!</p>
            <p className="text-sm text-emerald-600 mt-1">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
