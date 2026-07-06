"use client"

import { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { SellerAddBalance } from "@widgets/seller/seller-add-balance"
import { SellerStartParking } from "@widgets/seller/seller-start-parking"
import { SellerStats } from "@widgets/seller/seller-stats"
import {
  LayoutDashboard,
  Wallet,
  Car,
  History,
  LogOut,
  Store,
} from "lucide-react"

type Tab = "dashboard" | "add-balance" | "start-parking" | "history"

const SIDEBAR_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Inicio", icon: <LayoutDashboard className="size-[18px]" /> },
  { id: "add-balance", label: "Cargar Saldo", icon: <Wallet className="size-[18px]" /> },
  { id: "start-parking", label: "Estacionar", icon: <Car className="size-[18px]" /> },
  { id: "history", label: "Historial", icon: <History className="size-[18px]" /> },
]

export function SellerDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")

  const titles: Record<Tab, string> = {
    "dashboard": "Panel Principal",
    "add-balance": "Cargar Saldo a Usuario",
    "start-parking": "Iniciar Estacionamiento",
    "history": "Historial de Operaciones",
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Store className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Punto de Venta</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SEOE Vendedor</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-sm font-bold text-slate-800">{user?.name || "Vendedor"}</p>
          <p className="text-[11px] text-slate-400 font-medium">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className={activeTab === item.id ? "text-emerald-600" : "text-slate-400"}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="size-[18px]" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{titles[activeTab]}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === "dashboard" && <SellerStats />}
            {activeTab === "add-balance" && <SellerAddBalance />}
            {activeTab === "start-parking" && <SellerStartParking />}
            {activeTab === "history" && <SellerStats showFullHistory />}
          </div>
        </main>
      </div>
    </div>
  )
}
