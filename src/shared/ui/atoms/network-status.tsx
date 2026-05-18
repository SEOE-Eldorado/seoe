"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    if (isOnline) return null

    return (
        <div className="bg-destructive text-destructive-foreground p-1 text-center text-xs font-medium flex items-center justify-center gap-2 fixed top-0 w-full z-100 animate-in slide-in-from-top-2">
            <WifiOff className="h-3 w-3" />
            <span>Sin conexión - Modo Offline</span>
        </div>
    )
}
