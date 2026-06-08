"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Home page — redirects to /login.
 * Uses router.push in standalone mode (Dokploy) and
 * falls back to window.location for static export (Capacitor).
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const isExport = process.env.NEXT_OUTPUT === "export"
    if (isExport && typeof window !== "undefined") {
      window.location.href = "/login/"
    } else {
      router.replace("/login")
    }
  }, [router])

  return null
}
