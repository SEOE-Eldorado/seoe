"use client"
import { useRouter } from "next/navigation"
import { MenuPage } from "@views/menu-page"
export default function MenuRoute() {
  const router = useRouter()
  const navigate = (view) => {
    const routes = { home: '/dashboard', vehicles: '/dashboard/vehicles', fines: '/dashboard/fines', history: '/dashboard/history', profile: '/dashboard/profile', wallet: '/dashboard/wallet' }
    router.push(routes[view] || '/dashboard')
  }
  return <MenuPage onBack={() => router.push('/dashboard')} onNavigate={navigate} />
}