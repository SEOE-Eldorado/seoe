"use client"
import { useRouter } from "next/navigation"
import { ActiveParkingPage } from "@views/active-parking-page"

export default function ActiveParkingRoute() {
  const router = useRouter()
  return <ActiveParkingPage onBack={() => router.push("/dashboard")} />
}
