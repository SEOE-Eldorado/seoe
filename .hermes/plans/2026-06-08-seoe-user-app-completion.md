# SEOe User App — Plan de Implementación Completo

> **Objetivo:** Completar todas las funcionalidades pendientes de la app ciudadana (SEOE Wallet), consolidando la migración a App Router, separando la capa de datos, y eliminando deuda técnica.

**Arquitectura:** Next.js 15 App Router + Firebase (Auth, Firestore) + React Query + Tailwind v4 + shadcn/ui
**Stack técnico:** Next.js 15.1, React 19, TypeScript, Firebase 12, TanStack Query 5, Zustand 5, Zod
**Entorno:** Windows + Node 24, despliegue en Dokploy (standalone) y Capacitor Android (export)

**Estado actual:**
- ✅ App Router parcial: `/login`, `/register`, `/forgot-password`, `/dashboard/fines`, `/dashboard/history`, `/dashboard/menu`, `/dashboard/profile`, `/dashboard/vehicles`, `/dashboard/wallet`
- ❌ **Falta `/dashboard/page.tsx`** — el dashboard principal no existe como ruta App Router
- ❌ **Dos dashboards**: `dashboard-page.tsx` (viejo) y `new-dashboard.tsx` (nuevo) — ambos usan navegación state-based con `useState`
- ❌ **Views con `onBack` props** — en lugar de usar `router.push()` nativo
- ❌ **Contextos hinchados**: `parking-context.tsx` (342 líneas), `fines-context.tsx`, etc. aún mezclan lógica de datos con UI
- ❌ **Páginas faltantes**: `/dashboard/parking`, `/dashboard/reminders`, `/dashboard/active-parking`
- ❌ **Static export hack**: `page.tsx` redirige a `/login/index.html` con `window.location`
- ❌ **TypeScript errors ignorados**: `ignoreBuildErrors: true` en `next.config.mjs`
- ❌ **Lockfiles duplicados**: `package-lock.json` y `pnpm-lock.yaml`
- ❌ **Tests**: solo 2 archivos de test para contextos, sin cobertura de vistas

---

## Tarea 1: Crear `/dashboard/page.tsx` (Dashboard Principal)

**Objetivo:** Convertir `NewDashboard` en una página App Router real en `/dashboard/`

**Archivos:**
- Crear: `app/dashboard/page.tsx`
- Crear: `app/dashboard/layout.tsx` (layout compartido con header)
- Modificar: `src/views/new-dashboard.tsx` (eliminar `onBack`, usar `router`)

**Paso 1: Crear `app/dashboard/page.tsx`**

```tsx
"use client"
import { NewDashboard } from "@views/new-dashboard"

export default function DashboardPage() {
  return <NewDashboard />
}
```

**Paso 2: Crear `app/dashboard/layout.tsx`**

Layout compartido para todas las páginas del dashboard (header con logo + notificaciones + menú hamburguesa).

```tsx
"use client"
import { Bell, Menu, ParkingSquare } from "lucide-react"
import { Badge } from "@shared/ui/atoms/badge"
import { Button } from "@shared/ui/atoms/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/atoms/sheet"
import { useRouter } from "next/navigation"
import { useNotifications } from "@entities/notifications-context"
import { useAuth } from "@entities/auth-context"
import { LogOut, User, History, Car, Receipt } from "lucide-react"
import { useState } from "react"
import { NotificationsPanel } from "@widgets/notifications-panel"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { getUnreadCount } = useNotifications()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = getUnreadCount()

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground px-4 py-4 sticky top-0 z-50 shadow-md">
        <div className="container max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ParkingSquare className="h-6 w-6" />
            <h1 className="text-xl font-bold">SEOE</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20 relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Sheet open={showMenu} onOpenChange={setShowMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 bg-background/95 backdrop-blur-md">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    Menú Principal
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-2 mt-6">
                  <NavButton icon={<User className="h-5 w-5 text-primary" />} label="Mi Perfil" onClick={() => { setShowMenu(false); router.push("/dashboard/profile") }} />
                  <NavButton icon={<History className="h-5 w-5 text-primary" />} label="Historial Completo" onClick={() => { setShowMenu(false); router.push("/dashboard/history") }} />
                  <NavButton icon={<Car className="h-5 w-5 text-emerald-600" />} label="Mis Vehículos" onClick={() => { setShowMenu(false); router.push("/dashboard/vehicles") }} />
                  <NavButton icon={<Receipt className="h-5 w-5 text-amber-600" />} label="Multas" onClick={() => { setShowMenu(false); router.push("/dashboard/fines") }} />
                  <div className="pt-6 border-t mt-6">
                    <Button variant="destructive" className="w-full gap-3 h-12" onClick={() => { setShowMenu(false); logout() }}>
                      <LogOut className="h-5 w-5" /> Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />
      <main className="container max-w-md mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function NavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-base hover:bg-primary/10 hover:text-primary transition-all" onClick={onClick}>
      <div className="bg-primary/10 p-2 rounded-lg">{icon}</div>
      {label}
    </Button>
  )
}
```

**Paso 3: Refactorizar `new-dashboard.tsx`**

Eliminar el header duplicado, el manejo de `onBack` y la navegación state-based. El layout ahora provee header + menú. El dashboard solo renderiza el contenido (saldo, parking activo, acciones rápidas, actividad reciente).

**Verificación:**
1. `npm run dev` — navegar a `/dashboard` debe mostrar el dashboard con header
2. Clic en "Mis Vehículos" del menú → debe navegar a `/dashboard/vehicles`
3. Clic en botón "Volver" en vehicles → debe volver a `/dashboard`

---

## Tarea 2: Completar páginas faltantes del Dashboard

**Objetivo:** Crear páginas App Router para parking, reminders, y active-parking que hoy no existen como rutas

**Archivos:**
- Crear: `app/dashboard/parking/page.tsx`
- Crear: `app/dashboard/reminders/page.tsx`
- Crear: `app/dashboard/active-parking/page.tsx`

**Paso 1: Crear `app/dashboard/parking/page.tsx`**

```tsx
"use client"
import { useRouter } from "next/navigation"
import { StartParkingPage } from "@views/start-parking-page"

export default function ParkingRoute() {
  const router = useRouter()
  return <StartParkingPage onBack={() => router.push("/dashboard")} onSuccess={() => router.push("/dashboard")} />
}
```

**Paso 2: Crear `app/dashboard/reminders/page.tsx`**

```tsx
"use client"
import { useRouter } from "next/navigation"
import { RemindersPage } from "@views/reminders-page"

export default function RemindersRoute() {
  const router = useRouter()
  return <RemindersPage onBack={() => router.push("/dashboard")} />
}
```

**Paso 3: Crear `app/dashboard/active-parking/page.tsx`**

```tsx
"use client"
import { useRouter } from "next/navigation"
import { ActiveParkingPage } from "@views/active-parking-page"

export default function ActiveParkingRoute() {
  const router = useRouter()
  return <ActiveParkingPage onBack={() => router.push("/dashboard")} />
}
```

**Paso 4: Actualizar AuthGuard para incluir las nuevas rutas protegidas**

Revisar que `PUBLIC_ROUTES` en `auth-guard.tsx` no necesite cambios (las nuevas rutas son protegidas).

**Verificación:**
- Navegar a `/dashboard/parking` → debe mostrar StartParkingPage
- Navegar a `/dashboard/reminders` → debe mostrar RemindersPage
- Navegar a `/dashboard/active-parking` → debe mostrar ActiveParkingPage

---

## Tarea 3: Refactorizar vistas para usar App Router nativamente

**Objetivo:** Eliminar el patrón `onBack` en todas las vistas del usuario, reemplazando con `useRouter().push()` o `useRouter().back()` directo

**Archivos a modificar:**
- `src/views/wallet-page.tsx` — reemplazar `onBack` por `useRouter`
- `src/views/fines-page.tsx` — ídem
- `src/views/history-page.tsx` — ídem
- `src/views/vehicles-page.tsx` — ídem
- `src/views/profile-page.tsx` — ídem
- `src/views/menu-page.tsx` — ídem (ya no necesita `onNavigate` como prop)
- `src/views/active-parking-page.tsx` — ídem
- `src/views/start-parking-page.tsx` — ídem
- `src/views/reminders-page.tsx` — ídem

**Patrón para cada vista:**

```tsx
// ANTES
export function WalletPage({ onBack }: { onBack: () => void }) {
  // ...
  <button onClick={onBack}>Volver</button>
}

// DESPUÉS
"use client"
import { useRouter } from "next/navigation"

export function WalletPage() {
  const router = useRouter()
  // ...
  <button onClick={() => router.back()}>Volver</button>
}
```

**Verificación:**
- Cada ruta del dashboard debe cargar sin errores
- Botón "Volver" debe navegar correctamente usando `router.back()`
- Las rutas wrapper (`app/dashboard/*/page.tsx`) pueden simplificarse eliminando `onBack`

---

## Tarea 4: Separar capa de datos (Data Layer Migration)

**Objetivo:** Mover toda la lógica Firestore de los contextos a APIs dedicadas + hooks de React Query, dejando los contextos solo como estado de UI

**Archivos a modificar:**

### 4a: `fines-context.tsx` → API + Hook dedicado

Ya existe `src/shared/api/fines.ts` (de los admin APIs). Crear hooks específicos para usuario:

- Crear: `src/shared/api/user-fines.ts` — funciones Firestore para multas del ciudadano
- Crear: `src/shared/hooks/use-user-fines.ts` — hooks React Query

```tsx
// src/shared/api/user-fines.ts
import { db } from "./firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import type { Fine } from "@shared/types"

export async function fetchUserFines(userId: string): Promise<Fine[]> {
  const q = query(collection(db, "fines"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate?.() || doc.data().date }) as Fine)
}

export async function payFine(fineId: string): Promise<void> {
  await updateDoc(doc(db, "fines", fineId), { status: "paid", paidAt: new Date() })
}
```

```tsx
// src/shared/hooks/use-user-fines.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchUserFines, payFine } from "@shared/api/user-fines"

export function useUserFines(userId?: string) {
  return useQuery({
    queryKey: ["user_fines", userId],
    queryFn: () => fetchUserFines(userId!),
    enabled: !!userId,
  })
}

export function usePayFine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fineId: string) => payFine(fineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user_fines"] }),
  })
}
```

### 4b: Simplificar `fines-context.tsx`

El contexto solo debe mantener estado de UI (diálogos abiertos, selección) y delegar datos a los hooks.

### 4c: Simplificar `parking-context.tsx`

Ya tiene React Query, pero tiene lógica de negocio mezclada. Similar a 4a/4b.

**Verificación:**
- Las vistas siguen funcionando igual (mismos datos)
- `npm run build` — sin errores (después de Tarea 5)

---

## Tarea 5: Arreglar TypeScript y habilitar type checking

**Objetivo:** Eliminar `ignoreBuildErrors: true` y corregir todos los errores de tipo

**Archivos:**
- Modificar: `next.config.mjs` (quitar `ignoreBuildErrors`)
- Múltiples archivos `.tsx`/`.ts` con errores de tipo

**Paso 1: Encontrar errores actuales**

```bash
cd ~/Desktop/seoe-fundamental && npx tsc --noEmit 2>&1 | head -100
```

**Paso 2: Corregir errores comunes**
- Tipos faltantes en props (ej: `onNavigate: (view: string) => void`)
- Importaciones incorrectas
- Tipos `any` reemplazables
- Schemas de Zod con inferencia correcta

**Paso 3: Verificar**

```bash
cd ~/Desktop/seoe-fundamental && npx tsc --noEmit
```
Expected: 0 errors

---

## Tarea 6: Consolidar Dashboard (eliminar duplicación)

**Objetivo:** Eliminar `dashboard-page.tsx` (versión vieja) y usar solo `NewDashboard`

**Archivos:**
- Eliminar: `src/views/dashboard-page.tsx`
- Renombrar: `src/views/new-dashboard.tsx` → `src/views/dashboard.tsx` (o mantener NewDashboard como nombre)
- Verificar importaciones en todo el proyecto

**Paso 1: Buscar referencias a `dashboard-page.tsx`**

```bash
cd ~/Desktop/seoe-fundamental && grep -r "dashboard-page" src/ app/ --include="*.tsx" --include="*.ts"
```

**Paso 2: Actualizar importaciones**

Si `MenuPage` en `menu-page.tsx` usa `onNavigate` con vistas como `"home"`, actualizar para que apunte a las rutas App Router.

**Paso 3: Verificar que ningún componente importe el dashboard viejo**

---

## Tarea 7: Limpiar página principal y static export

**Objetivo:** Reemplazar el static export hack por una redirección App Router nativa

**Archivos:**
- Modificar: `app/page.tsx`

```tsx
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/login")
}
```

Esto funciona para modo `standalone` (Dokploy). Para static export (Capacitor), mantener el enfoque actual con "use client" + useEffect.

**Opción recomendada:** Usar redirect de next/navigation para modo server, y mantener `"use client"` + `useEffect` para static export. Detectar con `typeof window !== 'undefined' && process.env.NEXT_OUTPUT === 'export'`.

```tsx
"use client"
import { useEffect } from "react"
import { redirect } from "next/navigation"

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = "/login"
    }
  }, [])
  return null
}
```

---

## Tarea 8: Agregar tests para las vistas del usuario

**Objetivo:** Agregar tests de componente para las vistas principales del dashboard

**Archivos:**
- Crear: `src/views/__tests__/wallet-page.test.tsx`
- Crear: `src/views/__tests__/vehicles-page.test.tsx`
- Crear: `src/views/__tests__/fines-page.test.tsx`
- Crear: `src/shared/hooks/__tests__/use-parking.test.ts`

Los tests deben usar Vitest + Testing Library. Mockear Firebase y React Query.

**Ejemplo:**

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock necesario para next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

describe("WalletPage", () => {
  it("renders balance", () => {
    // usar mocks de auth context
    render(<WalletPage />)
    expect(screen.getByText(/saldo/i)).toBeDefined()
  })
})
```

**Verificación:**
```bash
cd ~/Desktop/seoe-fundamental && npm run test
```
Expected: all tests pass

---

## Tarea 9: Eliminar dependencias duplicadas y optimizar bundle

**Objetivo:** Limpiar lockfiles duplicados, remover fuentes externas innecesarias, optimizar bundle

**Archivos:**
- Eliminar: `pnpm-lock.yaml` (si existe)
- Eliminar: `tsconfig.tsbuildinfo` del repo (agregar a `.gitignore`)
- Modificar: `app/layout.tsx` — evaluar si Material Symbols es necesario (los iconos se usan en wallet, menu, profile)
- Modificar: `.gitignore` — agregar `tsconfig.tsbuildinfo`, `*.tsbuildinfo`

**Paso 1: Limpiar lockfiles**

```bash
cd ~/Desktop/seoe-fundamental
git rm --cached pnpm-lock.yaml 2>/dev/null || true
echo "*.tsbuildinfo" >> .gitignore
```

**Paso 2: Evaluar Material Symbols**

Si las vistas usan Material Symbols (wallet, menu, profile), mantener la fuente. Si ya migraron a lucide-react, eliminarla.

**Paso 3: Verificar tamaño de bundle**

```bash
cd ~/Desktop/seoe-fundamental && npm run build 2>&1 | tail -20
```
Buscar first load JS size compartido.

---

## Tarea 10: PWA y Notificaciones Push para user app

**Objetivo:** Asegurar que el service worker de PWA funciona correctamente para la app ciudadana

**Archivos:**
- Revisar: `next.config.mjs` (config PWA)
- Revisar: `app/manifest.ts`
- Revisar: `src/shared/lib/fcm.ts`

**Verificación:**
- Build produce `public/sw.js`
- Lighthouse PWA audit pasa en producción
- Notificaciones push funcionan con FCM

---

## Resumen de Archivos a Crear/Modificar

### Crear:
| Archivo | Propósito |
|---------|-----------|
| `app/dashboard/page.tsx` | Página principal del dashboard |
| `app/dashboard/layout.tsx` | Layout compartido con header + menú |
| `app/dashboard/parking/page.tsx` | Ruta para iniciar estacionamiento |
| `app/dashboard/reminders/page.tsx` | Ruta para recordatorios |
| `app/dashboard/active-parking/page.tsx` | Ruta para parking activo |
| `src/shared/api/user-fines.ts` | API de multas para ciudadano |
| `src/shared/hooks/use-user-fines.ts` | Hooks React Query para multas |
| `src/views/__tests__/wallet-page.test.tsx` | Tests de WalletPage |
| `src/views/__tests__/vehicles-page.test.tsx` | Tests de VehiclesPage |
| `src/views/__tests__/fines-page.test.tsx` | Tests de FinesPage |
| `src/shared/hooks/__tests__/use-parking.test.ts` | Tests de parking hooks |

### Modificar:
| Archivo | Cambio |
|---------|--------|
| `app/page.tsx` | Redirect nativo en vez de window.location |
| `src/views/new-dashboard.tsx` | Eliminar header, usar App Router layout |
| `src/views/wallet-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/fines-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/history-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/vehicles-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/profile-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/active-parking-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/start-parking-page.tsx` | `onBack` → `useRouter().back()` |
| `src/views/reminders-page.tsx` | `onBack` → `useRouter().back()` |
| `src/entities/fines-context.tsx` | Delegar datos a hooks React Query |
| `src/entities/parking-context.tsx` | Simplificar, delegar a APIs |
| `next.config.mjs` | Habilitar type checking |
| `.gitignore` | Agregar tsbuildinfo |

### Eliminar:
| Archivo | Razón |
|---------|-------|
| `src/views/dashboard-page.tsx` | Reemplazado por NewDashboard + App Router |
| `pnpm-lock.yaml` (si existe) | Lockfile duplicado |

---

## Orden de Ejecución Recomendado

1. **Tarea 1** → Dashboard layout + page (base para todo lo demás)
2. **Tarea 2** → Páginas faltantes (parking, reminders, active-parking)
3. **Tarea 6** → Consolidar dashboards (eliminar duplicado)
4. **Tarea 3** → Refactorizar vistas (eliminar `onBack`)
5. **Tarea 4** → Separar capa de datos
6. **Tarea 5** → Arreglar TypeScript
7. **Tarea 7** → Limpiar página principal
8. **Tarea 8** → Tests
9. **Tarea 9** → Limpiar dependencias
10. **Tarea 10** → PWA/Notificaciones

Cada tarea es independiente y puede ejecutarse en orden secuencial. Cada una termina con `git commit`.
