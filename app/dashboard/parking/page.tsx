"use client"
import { useRouter } from "next/navigation"
import { StartParkingPage } from "@views/start-parking-page"

export default function ParkingRoute() {
  const router = useRouter()
  return <StartParkingPage onBack={() => router.push("/dashboard")} onSuccess={() => router.push("/dashboard")} />
}
