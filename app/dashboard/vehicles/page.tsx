"use client"

import dynamic from "next/dynamic"

const VehiclesPage = dynamic(() => import("@views/vehicles-page").then(m => ({ default: m.VehiclesPage })), {
  loading: () => <div className="flex h-48 items-center justify-center"><div className="size-8 border-2 border-primary-green border-t-transparent rounded-full animate-spin" /></div>
})

import { useRouter } from "next/navigation"

export default function VehiclesRoute() {
  const router = useRouter()
  return <VehiclesPage onBack={() => router.push("/dashboard")} />
}
