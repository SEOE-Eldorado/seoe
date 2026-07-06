"use client"

import dynamic from "next/dynamic"

const SellerDashboard = dynamic(() => import("@views/seller-dashboard").then((m) => ({ default: m.SellerDashboard })), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-[5px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cargando Portal Vendedor</p>
      </div>
    </div>
  ),
})

export default function SellerPage() {
  return <SellerDashboard />
}
