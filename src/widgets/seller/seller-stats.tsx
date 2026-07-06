"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import { auth } from "@shared/api/firebase"
import { Wallet, Car, TrendingUp, RefreshCw, Receipt, Clock, DollarSign } from "lucide-react"

interface Stats {
  today: { amount: number; count: number }
  week: { amount: number; count: number }
  total: { amount: number; count: number }
  rechargeCount: number
  parkingCount: number
}

interface Transaction {
  id: string
  type: "recharge" | "parking"
  amount: number
  targetName: string
  targetPlate: string
  createdAt: string
}

export function SellerStats({ showFullHistory }: { showFullHistory?: boolean }) {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error("No autenticado")

      const res = await fetch("/api/seller/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Error al cargar stats")

      setStats(data.stats)
      setTransactions(data.recentTransactions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="size-8 text-slate-300 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-yellow-800">{error}</p>
        <button onClick={fetchStats} className="mt-3 text-sm font-bold text-yellow-700 underline">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats cards */}
      {!showFullHistory && stats && (
        <>
          {/* Today's summary */}
          <div>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen del Día</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                  <DollarSign className="size-5 text-emerald-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ventas Hoy</p>
                <p className="text-3xl font-black text-slate-900">${stats.today.amount.toLocaleString("es-AR")}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.today.count} operaciones</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4">
                  <TrendingUp className="size-5 text-blue-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Esta Semana</p>
                <p className="text-3xl font-black text-slate-900">${stats.week.amount.toLocaleString("es-AR")}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.week.count} operaciones</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="size-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-4">
                  <Receipt className="size-5 text-purple-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Totales</p>
                <p className="text-3xl font-black text-slate-900">${stats.total.amount.toLocaleString("es-AR")}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.total.count} operaciones</p>
              </div>
            </div>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
              <Wallet className="size-8 text-white/80 mb-3" />
              <p className="text-2xl font-black">{stats.rechargeCount}</p>
              <p className="text-sm text-white/80 font-medium">Cargas de saldo</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <Car className="size-8 text-white/80 mb-3" />
              <p className="text-2xl font-black">{stats.parkingCount}</p>
              <p className="text-sm text-white/80 font-medium">Estacionamientos</p>
            </div>
          </div>
        </>
      )}

      {/* History */}
      <div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
          {showFullHistory ? "Historial Completo" : "Últimas Operaciones"}
        </h3>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Clock className="size-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-400">Todavía no hay operaciones registradas</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Usuario</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Patente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        tx.type === "recharge"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {tx.type === "recharge" ? <Wallet className="size-3" /> : <Car className="size-3" />}
                        {tx.type === "recharge" ? "Carga" : "Estacionamiento"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{tx.targetName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600 uppercase">{tx.targetPlate || "—"}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                      ${tx.amount.toLocaleString("es-AR")}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 text-right">
                      {new Date(tx.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={fetchStats}
          className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <RefreshCw className="size-4" />
          Actualizar
        </button>
      </div>
    </div>
  )
}
