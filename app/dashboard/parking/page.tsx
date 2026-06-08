"use client"
import { useRouter } from "next/navigation"
import { StartParkingPage } from "@views/start-parking-page"

export default function ParkingRoute() {
  const router = useRouter()
  return <StartParkingPage onSuccess={() => router.push("/dashboard")} />
}