"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import type { ParkingSession } from "@entities/parking-context"
import { db } from "@shared/api/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

interface HistoryPageProps {
  onBack: () => void
}

/* Combined Type for History */
type HistoryItem = {
  id: string
  type: 'parking' | 'recharge' | 'fine'
  title: string
  subtitle: string
  date: Date
  amount: number
  status: string
  // Extra fields for parking details
  vehiclePlate?: string
  duration?: string
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const { user } = useAuth()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "month">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      if (user) {
        try {
          // Fetch Parking
          const qParking = query(
            collection(db, "parking_sessions"),
            where("userId", "==", user.id)
          )
          const snapParking = await getDocs(qParking)

          // Fetch Movements
          const qMovements = query(
            collection(db, "movements"),
            where("userId", "==", user.id)
          )
          const snapMovements = await getDocs(qMovements)


          const items: HistoryItem[] = []

          snapParking.forEach((doc) => {
            const data = doc.data()
            const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime)
            const end = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime)
            const diff = end.getTime() - start.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            items.push({
              id: doc.id,
              type: 'parking',
              title: data.zone || "Estacionamiento",
              subtitle: data.address || "",
              date: start,
              amount: -Math.abs(data.cost), // Cost is negative balance
              status: data.status,
              vehiclePlate: data.vehiclePlate,
              duration: `${hours}h ${minutes}min`
            })
          })

          snapMovements.forEach((doc) => {
            const data = doc.data()
            const date = data.date ? new Date(data.date) : new Date() // Handle ISO string or Timestamp if needed
            items.push({
              id: doc.id,
              type: data.type || 'recharge', // data.type should be 'recharge'
              title: "Recarga de Saldo",
              subtitle: "Billetera",
              date: date,
              amount: Math.abs(data.amount), // Recharge is positive
              status: data.status || "completed"
            })
          })

          // Sort descending
          items.sort((a, b) => b.date.getTime() - a.date.getTime())

          setHistoryItems(items)
        } catch (error) {
          console.error("Error fetching history:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchHistory()
  }, [user])

  const thisMonthItems = historyItems.filter((item) => {
    const now = new Date()
    return item.date.getMonth() === now.getMonth() && item.date.getFullYear() === now.getFullYear()
  })

  // Calculate generic totals for summary based on current filter
  const summarySource = activeTab === "month" ? thisMonthItems : historyItems
  const parkingStats = summarySource.filter(i => i.type === 'parking')
  const totalSpent = parkingStats.reduce((sum, item) => sum + Math.abs(item.amount), 0)

  const displayedItems = activeTab === "month" ? thisMonthItems : historyItems

  return (
    <div className="flex h-dvh w-full flex-col bg-neutral-bg overflow-hidden relative font-display">
      {/* Premium Header */}
      <header className="shrink-0 flex items-center bg-white px-6 py-5 z-10 border-b border-border/50">
        <button 
          onClick={onBack} 
          className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>
        <h1 className="text-xl font-black text-neutral-text flex-1 text-center pr-11 tracking-tight">Actividad</h1>
      </header>

      <main className="flex-1 px-6 pb-24 space-y-6 overflow-y-auto pt-6 no-scrollbar">
        {/* Summary Card - High Contrast Wallet Style */}
        <div className="rounded-[8px] bg-white border border-border shadow-sm p-6">
          <div className="grid grid-cols-2 gap-4 divide-x divide-border">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest mb-1">Sesiones</span>
              <p className="text-3xl font-black text-neutral-text leading-none">{parkingStats.length}</p>
              <p className="text-[10px] font-bold text-neutral-text/20 uppercase mt-1">
                {activeTab === "month" ? "este mes" : "en total"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center pl-4">
              <span className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest mb-1">Inversión</span>
              <p className="text-3xl font-black text-primary-green leading-none">
                ${Math.floor(totalSpent)}
                <span className="text-lg font-bold">,{(totalSpent % 1).toFixed(2).split('.')[1]}</span>
              </p>
              <p className="text-[10px] font-bold text-neutral-text/20 uppercase mt-1">
                {activeTab === "month" ? "este mes" : "en total"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Modern Clean Pill */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-white border border-border shadow-sm">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "all" ? "bg-primary-green text-white shadow-lg shadow-emerald-900/10" : "text-neutral-text/40"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("month")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "month" ? "bg-primary-green text-white shadow-lg shadow-emerald-900/10" : "text-neutral-text/40"}`}
          >
            Este mes
          </button>
        </div>

        {/* History List */}
        {loading ? (
             <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-3xl bg-white/50 animate-pulse border border-border/50"></div>
                ))}
             </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="size-24 rounded-full bg-white border border-border shadow-sm flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-neutral-text/10 text-5xl">history</span>
            </div>
            <h3 className="text-xl font-black text-neutral-text mb-2 tracking-tight">Sin actividad</h3>
            <p className="text-xs font-bold text-neutral-text/30 uppercase tracking-tight">
              Aún no registras movimientos en tu cuenta.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedItems.map((item) => (
              <div key={item.id} className="rounded-[8px] bg-white border border-border shadow-sm p-6 hover:border-primary-green/20 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === 'parking' ? 'bg-neutral-bg text-neutral-text/50' : 'bg-emerald-50 text-primary-green'
                    }`}>
                        <span className="material-symbols-outlined text-2xl font-bold">
                            {item.type === 'parking' ? 'directions_car' : 'account_balance_wallet'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-neutral-text text-[15px] tracking-tight">{item.title}</h3>
                        </div>
                        <p className="text-[11px] font-bold text-neutral-text/40 uppercase tracking-tight truncate max-w-[140px]">
                            {item.subtitle}
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black tracking-tighter ${item.amount > 0 ? 'text-primary-green' : 'text-neutral-text'}`}>
                      {item.amount > 0 ? "+" : "-"}${Math.abs(item.amount).toLocaleString("es-AR")}
                    </p>
                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-tighter mt-1">
                        {item.status === 'completed' ? 'EXITOSO' : item.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-neutral-text/30">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span className="text-[10px] font-black uppercase tracking-tight">
                                {item.date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                            </span>
                        </div>
                        {item.type === 'parking' && (
                             <div className="flex items-center gap-1.5 text-neutral-text/30">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                <span className="text-[10px] font-black uppercase tracking-tight">{item.duration}</span>
                            </div>
                        )}
                    </div>
                    
                    {item.vehiclePlate && (
                        <div className="bg-neutral-bg px-2 py-0.5 rounded-md">
                            <span className="text-[10px] font-black text-neutral-text/40 tracking-tight">{item.vehiclePlate}</span>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
