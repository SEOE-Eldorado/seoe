"use client"

import { useCallback } from "react"

type HapticType = "light" | "medium" | "heavy" | "success" | "error"

export function useHaptic() {
    const trigger = useCallback((type: HapticType = "light") => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            switch (type) {
                case "light":
                    navigator.vibrate(10)
                    break
                case "medium":
                    navigator.vibrate(40)
                    break
                case "heavy":
                    navigator.vibrate(70)
                    break
                case "success":
                    navigator.vibrate([10, 30, 20])
                    break
                case "error":
                    navigator.vibrate([50, 30, 50, 30, 50])
                    break
            }
        }
    }, [])

    return { trigger }
}
