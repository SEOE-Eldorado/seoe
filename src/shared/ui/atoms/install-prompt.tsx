"use client"

import { useEffect, useState } from "react"
import { Button } from "@shared/ui/atoms/button"
import { Download, X } from "lucide-react"
import { useAuth } from "@entities/auth-context"

export function InstallPrompt() {
    const { user } = useAuth()
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    const isAdminOrInspector = user?.role === "inspector" || user?.role === "admin"

    useEffect(() => {
        // Check if already standalone
        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(ios)

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === "accepted") {
            setDeferredPrompt(null)
            setIsVisible(false)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
    }

    if (isAdminOrInspector || isStandalone || !isVisible) return null

    if (deferredPrompt) {
        return (
            <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
                <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-2xl flex items-center gap-4 relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute -top-2 -right-2 bg-background text-foreground rounded-full p-1 shadow-md border border-border"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight">Instalar App</h3>
                        <p className="text-sm opacity-90 mt-1">
                            Agrega SEOE a tu inicio para una mejor experiencia.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleInstall}
                        className="shrink-0 font-bold"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Instalar
                    </Button>
                </div>
            </div>
        )
    }

    // Optional: iOS instructions could go here
    return null
}
