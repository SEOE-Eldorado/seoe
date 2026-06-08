"use client"

import { useEffect, useState } from "react"

export function useCapacitor() {
  const [isCapacitor, setIsCapacitor] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsCapacitor(
        (window as any).Capacitor?.isPluginAvailable?.("App") ?? false
      )
    }
  }, [])

  return { isCapacitor }
}

export function useSunmiPrinter() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [printerModel, setPrinterModel] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      if (typeof window === "undefined") return
      if (!(window as any).SunmiPrinter) return

      try {
        const { SunmiPrinter } = await import("@kduma-autoid/capacitor-sunmi-printer")
        const status: any = await SunmiPrinter.getServiceStatus()
        setIsAvailable(status === 1 || status === "connected")

        try {
          const model: any = await SunmiPrinter.getPrinterModel()
          setPrinterModel(model?.model ?? null)
        } catch { /* ignore */ }
      } catch {
        setIsAvailable(false)
      }
    }

    check()
  }, [])

  return { isAvailable, printerModel }
}
