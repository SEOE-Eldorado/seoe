"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@entities/auth-context"
import { useTranslations } from "next-intl"

// Rutas públicas (no requieren login)
const PUBLIC_ROUTES = [
  "/login", "/login/",
  "/register", "/register/",
  "/forgot-password", "/forgot-password/",
  "/iniciar", "/iniciar/",
  "/payment/callback", "/payment/callback/",
  // Logins específicos por rol
  "/seller/login", "/seller/login/",
  "/inspector/login", "/inspector/login/",
  "/admin/login", "/admin/login/",
]

// Mapeo: ruta de login → ruta destino según rol
const LOGIN_REDIRECTS: Record<string, Record<string, string>> = {
  "/login": {
    admin: "/dashboard/admin",
    inspector: "/inspector",
    seller: "/seller",
    user: "/dashboard",
  },
  "/seller/login": {
    seller: "/seller",
    admin: "/seller",
  },
  "/inspector/login": {
    inspector: "/inspector",
    admin: "/inspector",
  },
  "/admin/login": {
    admin: "/dashboard/admin",
  },
}

// Rutas protegidas por rol
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  "/seller": ["seller", "admin"],
  "/inspector": ["inspector", "admin"],
  "/dashboard/admin": ["admin"],
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const t = useTranslations("loading")

  useEffect(() => {
    if (loading) return

    // Usuario no logueado en ruta protegida → login
    if (!user && !isPublic) {
      // Detectar a qué login ir según la ruta actual
      if (pathname.startsWith("/seller")) {
        router.replace("/seller/login")
      } else if (pathname.startsWith("/inspector")) {
        router.replace("/inspector/login")
      } else if (pathname.startsWith("/dashboard/admin")) {
        router.replace("/admin/login")
      } else {
        router.replace("/login")
      }
      return
    }

    // Usuario logueado en ruta pública (login) → redirigir según rol y ruta
    if (user && isPublic) {
      const redirectMap = LOGIN_REDIRECTS[pathname]
      if (redirectMap) {
        const role = user.role || "user"
        const target = redirectMap[role]
        if (target) {
          router.replace(target)
        } else {
          // Rol no permitido para este login → unauthorized
          router.replace("/unauthorized")
        }
        return
      }
      // Si es una ruta pública pero no de login (register, forgot-password, etc)
      // y el usuario ya está logueado, mandar al dashboard según rol
      const role = user.role || "user"
      if (role === "admin") {
        router.replace("/dashboard/admin")
      } else if (role === "inspector") {
        router.replace("/inspector")
      } else if (role === "seller") {
        router.replace("/seller")
      } else {
        router.replace("/dashboard")
      }
      return
    }

    // Usuario logueado en ruta protegida → validar rol
    if (user && !isPublic) {
      const role = user.role || "user"
      for (const [route, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
        if (pathname.startsWith(route)) {
          if (!allowedRoles.includes(role)) {
            router.replace("/unauthorized")
            return
          }
          break
        }
      }
    }
  }, [user, loading, pathname, isPublic, router])

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
