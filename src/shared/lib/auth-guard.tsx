"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@entities/auth-context"
import { useTranslations } from "next-intl"

const PUBLIC_ROUTES = ["/login", "/login/", "/register", "/register/", "/forgot-password", "/forgot-password/"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const isInspectorApp = process.env.NEXT_PUBLIC_APP_ENV === "inspector"
  const t = useTranslations("loading")
  console.log("[AuthGuard] loading:", loading, "user:", !!user, "pathname:", pathname, "isPublic:", isPublic)

  useEffect(() => {
    if (loading) return

    if (!user && !isPublic) {
      router.replace("/login")
      return
    }

    if (user && isPublic) {
      router.replace(isInspectorApp ? "/inspector" : "/dashboard")
      return
    }

    if (user && isInspectorApp && user.role !== "admin" && user.role !== "inspector" && pathname !== "/unauthorized") {
      router.replace("/unauthorized")
      return
    }
  }, [user, loading, pathname, isPublic, isInspectorApp, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg font-display">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="size-20 border-[6px] border-primary-green/10 border-t-primary-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-2 rounded-full bg-primary-green animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-primary-green uppercase tracking-[0.3em] animate-pulse">{t("initiating")}</p>
            <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest">{t("seoe_wallet")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user && !isPublic) return null
  if (user && isPublic) return null

  return <>{children}</>
}
