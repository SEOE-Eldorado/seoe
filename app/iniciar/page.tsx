"use client"
import dynamic from "next/dynamic"

const GuestParkingView = dynamic(
    () => import("@views/guest-parking-page").then(mod => ({ default: mod.GuestParkingPage })),
    { ssr: false }
)

export default function IniciarPage() {
    return <GuestParkingView />
}
