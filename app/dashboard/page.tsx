"use client"

import dynamic from "next/dynamic"

const NewDashboard = dynamic(() => import("@views/new-dashboard").then((m) => ({ default: m.NewDashboard })), {
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-[5px] border-primary-green/20 border-t-primary-green rounded-full animate-spin" />
        <p className="text-[10px] font-black text-neutral-text/30 uppercase tracking-[0.3em]">Cargando</p>
      </div>
    </div>
  ),
})

export default function DashboardPage() {
  return <NewDashboard />
}
