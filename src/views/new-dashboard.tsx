"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@entities/auth-context"
import { useParking } from "@entities/parking-context"
import { useNotifications } from "@entities/notifications-context"
import { useFines } from "@entities/fines-context"
import { useVehicles } from "@entities/vehicles-context"
import { useHaptic } from "@shared/lib/hooks/use-haptic"
import { useToast } from "@shared/lib/hooks/use-toast"
import { BalanceRechargeDialog } from "@widgets/dialogs/balance-recharge-dialog"
import { WelcomeModal } from "@widgets/dialogs/welcome-modal"
import { NotificationsPanel } from "@widgets/notifications-panel"
import { ActiveParkingCard } from "@widgets/active-parking-card"
import { SimpleActiveParkingCard } from "@widgets/simple-active-parking-card"
import { DesktopBlocker } from "@shared/ui/atoms/desktop-blocker"
import { LocationMap } from "@widgets/location-map"
import { db } from "@shared/api/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"

export function NewDashboard() {
    const { user } = useAuth()
    const { activeSessions } = useParking()
    const { getUnreadCount } = useNotifications()
    const { getPendingFines } = useFines()

    const { vehicles, getDefaultVehicle } = useVehicles()
    const { trigger: haptic } = useHaptic()
    const { toast } = useToast()
    const router = useRouter()
    const pathname = usePathname()

    const [showRechargeDialog, setShowRechargeDialog] = useState(false)
    const [showBalance, setShowBalance] = useState(true)
    const [showNotifications, setShowNotifications] = useState(false)
    const [showWelcomeModal, setShowWelcomeModal] = useState(false)
    const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)
    const [mountTime] = useState(Date.now())
    const processedNotifs = useRef<Set<string>>(new Set())

    const { notifications } = useNotifications()

    useEffect(() => {
        notifications.forEach(n => {
            // Only notify for items created AFTER dashboard mounted (new arrivals)
            // or very recent items (last 10 seconds) if we want to catch instant loads, but mountTime is safer to avoid spam on refresh
            if (n.date.getTime() > mountTime && !n.read && !processedNotifs.current.has(n.id)) {
                if (n.type === 'fine' || n.priority === 'urgent' || n.priority === 'high') {
                    haptic("medium")
                    toast({
                        title: n.title,
                        description: n.message,
                        variant: n.type === 'fine' ? "destructive" : "default",
                        action: <div onClick={() => router.push("/dashboard/fines")} className="font-bold text-xs border border-white/20 px-2 py-1 rounded cursor-pointer hover:bg-white/10">VER</div>
                    })
                    processedNotifs.current.add(n.id)
                }
            }
        })
    }, [notifications, mountTime, toast, haptic])

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords

                    // Optional: Simple reverse geocoding mock or fetch if available
                    // For now we set coordinates, and maybe a "Zona Detected" logical mapper
                    let address = "Ubicación actual"
                    try {
                        // Free OpenStreetMap Nominatim API (Rate limited, be careful in prod)
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        const data = await response.json()
                        if (data.address) {
                            // Extract relevant address parts
                            const road = data.address.road || "";
                            // Prioritize city-like fields
                            const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || "";

                            // Construct a cleaner address string
                            if (road && city) {
                                address = `${road}, ${city}`;
                            } else if (road) {
                                address = road;
                            } else if (city) {
                                address = city;
                            }
                        }
                    } catch (e) {
                        console.error("Reverse geocoding failed", e)
                    }

                    setLocation({ latitude, longitude, address })
                },
                (error) => {
                    console.warn("Location access denied or unavailable:", error.message);
                    setLocation({
                        latitude: -34.6037, // Default fallback (e.g., Obelisco, BA)
                        longitude: -58.3816,
                        address: "Ubicación no disponible"
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 // Accept cached position up to 1 min old
                }
            )
        } else {
            setLocation({
                latitude: -34.6037,
                longitude: -58.3816,
                address: "Geolocalización no soportada"
            });
        }
    }, [])

    // Show welcome modal for new users without vehicles
    useEffect(() => {
        if (user && vehicles.length === 0) {
            // Check if we've already shown the modal in this session
            const hasSeenWelcome = sessionStorage.getItem(`seoe_welcome_shown_${user.id}`)
            if (!hasSeenWelcome) {
                // Small delay to let the UI settle
                const timer = setTimeout(() => {
                    setShowWelcomeModal(true)
                    sessionStorage.setItem(`seoe_welcome_shown_${user.id}`, "true")
                }, 500)
                return () => clearTimeout(timer)
            }
        }
    }, [user, vehicles])

    // Derived values
    const unreadCount = getUnreadCount()
    const pendingFines = getPendingFines()
    const defaultVehicle = getDefaultVehicle()

    // Real history data fetching
    const [historyItems, setHistoryItems] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            const fetchHistory = async () => {
                try {
                    // Fetch parking sessions
                    const qParking = query(
                        collection(db, "parking_sessions"),
                        where("userId", "==", user.id)
                    )
                    const snapshotParking = await getDocs(qParking)

                    // Fetch movements (manual recharges, adjustments)
                    const qMovements = query(
                        collection(db, "movements"),
                        where("userId", "==", user.id)
                    )
                    const snapshotMovements = await getDocs(qMovements)

                    const parkingItems = snapshotParking.docs.map(doc => {
                        const data = doc.data()
                        const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime)
                        const end = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime)

                        // Calculate duration
                        const diff = end.getTime() - start.getTime()
                        const hours = Math.floor(diff / (1000 * 60 * 60))
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

                        return {
                            id: doc.id,
                            type: 'parking',
                            location: data.zone || data.address || "Estacionamiento",
                            date: start.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
                            detail: `${hours}h ${minutes}m`,
                            amount: -Math.abs(data.cost),
                            timestamp: start.getTime()
                        }
                    })

                    const movementItems = snapshotMovements.docs.map(doc => {
                        const data = doc.data()
                        if (data.status !== 'completed' && data.status !== undefined) return null;

                        const date = data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())

                        return {
                            id: doc.id,
                            type: 'recharge',
                            location: data.description || "Recarga de Saldo",
                            date: date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
                            detail: data.type === 'recharge' ? 'Billetera' : 'Ajuste',
                            amount: Math.abs(data.amount),
                            timestamp: date.getTime()
                        }
                    }).filter(item => item !== null)

                    const allItems = [...parkingItems, ...movementItems]
                    // accurate sorting client-side
                    allItems.sort((a, b) => b.timestamp - a.timestamp)

                    setHistoryItems(allItems.slice(0, 3))
                } catch (error) {
                    console.error("Failed to fetch history widget", error)
                }
            }
            fetchHistory()
        }
    }, [user])
    const isHome = pathname === "/dashboard" || pathname === "/dashboard/"
    const isHistory = pathname.startsWith("/dashboard/history")
    const isWallet = pathname.startsWith("/dashboard/wallet")
    const isMenu = pathname.startsWith("/dashboard/menu")

    return (
        <>
            <div className="flex min-h-dvh w-full flex-col overflow-x-hidden relative bg-neutral-bg text-neutral-text pb-24 md:hidden font-display no-scrollbar">
                {/* Header Section - Modern Large Style */}
                <header className="px-6 pt-4 pb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push("/dashboard/profile")}
                            className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-primary-green font-bold text-xl overflow-hidden border border-emerald-100 shadow-sm"
                        >
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "GG"}
                        </button>
                        <div className="space-y-0.5">
                            <h1 className="text-2xl font-black text-neutral-text leading-tight">
                                ¡Hola<br />{user?.name?.split(' ')[0] || "Usuario"}! 👋
                            </h1>
                        </div>
                    </div>
                    <div className="flex space-x-3 items-center">
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="size-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-border relative active:scale-90 transition-all"
                        >
                            <span className="material-symbols-outlined text-neutral-text/70 text-2xl">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 size-5 bg-primary-green text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col no-scrollbar">
                    {/* Accounts Section */}
                    <section className="px-6 mb-8">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-[11px] font-black text-neutral-text/40 tracking-widest uppercase">MIS CUENTAS</h2>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowRechargeDialog(true)}
                                    className="size-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-border transition-all active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-neutral-text/60">payments</span>
                                </button>
                                <button
                                    onClick={() => {
                                        haptic("light")
                                        setShowBalance(!showBalance)
                                    }}
                                    className="size-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-border transition-all active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-neutral-text/60">
                                        {showBalance ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Balance Content Card - Horizontal Style Mockup */}
                        <div className="flex overflow-x-auto no-scrollbar gap-4 -mx-6 px-6 pb-2">
                            <div className="min-w-[85%] bg-white rounded-4xl p-7 border border-border shadow-sm relative overflow-hidden shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="size-8 bg-blue-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                                            <span className="material-symbols-outlined text-sm">account_balance</span>
                                        </div>
                                        <span className="font-bold text-neutral-text/80 text-sm">SEOE Wallet</span>
                                    </div>
                                    <span className="material-symbols-outlined text-primary-green fill-1 text-sm">star</span>
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-black text-neutral-text tracking-tighter tabular-nums">
                                        {showBalance
                                            ? `$ ${user?.balance?.toLocaleString("es-AR", { minimumFractionDigits: 2 }) || "0,00"}`
                                            : "$ ••••"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-dashed border-border">
                                    <div className="text-neutral-text/30 text-[10px] font-bold uppercase tracking-widest">
                                        CTA • {user?.id?.slice(-4) || "0609"}
                                    </div>
                                    <span className="text-[10px] font-bold text-primary-green uppercase tracking-wide flex items-center">
                                         Disponible <span className="material-symbols-outlined text-[12px] ml-1">check_circle</span>
                                    </span>
                                </div>
                            </div>
                            
                            {/* Secondary card mock */}
                            <div className="min-w-[85%] bg-accent-green rounded-4xl p-7 border border-emerald-100 shadow-sm relative overflow-hidden shrink-0 flex items-center justify-between">
                                 <div>
                                     <h3 className="text-primary-green font-bold text-sm">Vincular Banco</h3>
                                     <p className="text-[10px] text-primary-green/60 font-medium">¡Estás a un solo clic!</p>
                                 </div>
                                 <span className="material-symbols-outlined text-primary-green">add_card</span>
                            </div>
                        </div>
                    </section>

                    {/* Main Action Grid - Matching Image Distribution */}
                    <section className="px-6 mb-10">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowRechargeDialog(true)}
                                className="h-16 bg-primary-green text-white rounded-3xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">payments</span>
                                <span className="font-bold">Cargar</span>
                            </button>

                             <button
                                onClick={() => router.push("/dashboard/vehicles")}
                                className="h-16 bg-white border border-border text-neutral-text rounded-3xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-neutral-text/60">directions_car</span>
                                <span className="font-bold">Vehículos</span>
                            </button>
                            <button
                                onClick={() => router.push("/dashboard/fines")}
                                className="h-16 bg-white border border-border text-neutral-text rounded-3xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-neutral-text/60">receipt_long</span>
                                <span className="font-bold">Multas</span>
                            </button>

                            <button
                                onClick={() => router.push("/dashboard/history")}
                                className="h-16 bg-white border border-border text-neutral-text rounded-3xl flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-neutral-text/60">history</span>
                                <span className="font-bold">Historial</span>
                            </button>
                        </div>
                    </section>

                    {/* Contactless Promo Style Section */}
                    <section className="px-6 mb-10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-[11px] font-black text-neutral-text/40 tracking-widest uppercase">GESTIÓN RÁPIDA</h2>
                            <button className="text-[11px] font-black text-neutral-text/80 uppercase tracking-tighter">MOSTRAR MÁS</button>
                        </div>
                        <div className="bg-[#003B2A] rounded-4xl h-28 flex overflow-hidden shadow-xl shadow-emerald-900/5 relative group cursor-pointer" onClick={() => router.push("/dashboard/parking")}>
                             <div className="flex-1 p-6 flex flex-col justify-center">
                                 <div className="flex items-center space-x-3 mb-2">
                                     <div className="size-10 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-yellow-400/20">
                                         <span className="material-symbols-outlined text-[#003B2A] text-xl font-bold">local_parking</span>
                                     </div>
                                     <h3 className="text-white font-bold leading-tight">Activar Estacionamiento</h3>
                                 </div>
                                 <div className="bg-yellow-400/90 text-[#003B2A] px-3 py-1 rounded-full text-[9px] font-black w-fit uppercase tracking-tighter ml-12">
                                     100% de Gestión digital
                                 </div>
                             </div>
                             <div className="w-1/3 bg-emerald-600 flex items-center justify-center relative overflow-hidden active:bg-emerald-500 transition-colors">
                                 <p className="text-[10px] text-white font-bold text-center leading-tight">Gestión<br />Rápida</p>
                                 <span className="material-symbols-outlined text-white/50 text-sm ml-1">chevron_right</span>
                                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             </div>
                        </div>
                    </section>

                    {/* Activity Section */}
                    {historyItems.length > 0 && (
                        <section className="px-6 mb-8">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[11px] font-black text-neutral-text/40 tracking-widest uppercase">ACTIVIDAD RECIENTE</h2>
                                <button
                                    onClick={() => router.push("/dashboard/history")}
                                    className="text-[11px] font-black text-neutral-text/80 uppercase tracking-tighter"
                                >
                                    MOSTRAR MÁS
                                </button>
                            </div>

                            <div className="space-y-3">
                                {historyItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-3xl p-4 flex items-center space-x-4 border border-border shadow-sm active:scale-[0.98] transition-all">
                                        <div className="size-11 bg-neutral-bg rounded-full flex items-center justify-center text-neutral-text/70">
                                            <span className="material-symbols-outlined text-xl">
                                                {item.amount > 0 ? "add_card" : "local_parking"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="font-bold text-neutral-text text-sm truncate max-w-[150px]">{item.location}</h4>
                                                <span className={`font-black text-sm tabular-nums ${item.amount > 0 ? 'text-primary-green' : 'text-neutral-text'}`}>
                                                    {item.amount > 0 ? "+" : "-"}${Math.abs(item.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-neutral-text/40 uppercase tracking-widest leading-none mt-0.5">
                                                {item.date} • {item.type === 'recharge' ? 'CARGA' : 'ESTACIONAR'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Active Parking (If any) */}
                     {activeSessions.length > 0 && (
                        <section className="px-6 mb-10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-[11px] font-black text-neutral-text/40 tracking-widest uppercase">PARKING ACTIVO</h2>
                            </div>
                            {activeSessions.map((session) => (
                                <div key={session.id} className="bg-white rounded-4xl border border-primary-green/20 overflow-hidden shadow-lg shadow-emerald-900/5">
                                    <SimpleActiveParkingCard session={session} />
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Promotions Mockup Style 2025 */}
                    <section className="px-6 mb-8 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-[11px] font-black text-neutral-text/40 tracking-widest uppercase">TUS PROMOCIONES</h2>
                            <button className="text-[11px] font-black text-neutral-text/80 uppercase tracking-tighter">MOSTRAR MÁS</button>
                        </div>
                        <div className="w-full rounded-4xl overflow-hidden shadow-sm border border-border">
                             <img src="/moratoria-ipa-2025.jpg?v=2" alt="Moratoria" className="w-full object-cover" />
                        </div>
                    </section>
                </main>

                {/* Bottom Navigation - Refined Wallet Style */}
                <nav className="fixed bottom-0 left-0 right-0 py-5 bg-white border-t border-border/40 flex justify-between items-center px-8 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] pb-safe rounded-t-[32px]">
                    <button
                        onClick={() => {
                            haptic("light")
                            router.push("/dashboard")
                        }}
                        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${isHome ? 'text-primary-green' : 'text-neutral-text/20'}`}
                    >
                        <span className={`material-symbols-outlined text-[28px] ${isHome ? 'fill-1 opacity-100' : 'opacity-60'}`}>home</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Inicio</span>
                    </button>
                    <button
                        onClick={() => {
                            haptic("light")
                            router.push("/dashboard/history")
                        }}
                        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${isHistory ? 'text-primary-green' : 'text-neutral-text/20'}`}
                    >
                        <span className={`material-symbols-outlined text-[28px] ${isHistory ? 'fill-1 opacity-100' : 'opacity-60'}`}>history</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Actividad</span>
                    </button>

                    <div className="relative -mt-10">
                        <button
                            onClick={() => {
                                haptic("medium")
                                router.push("/dashboard/parking")
                            }}
                            className="bg-primary-green size-16 rounded-[24px] shadow-2xl shadow-emerald-900/30 flex items-center justify-center active:scale-95 transition-all text-white border-2 border-white ring-8 ring-neutral-bg"
                        >
                            <span className="material-symbols-outlined text-white text-3xl font-black">schedule</span>
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            haptic("light")
                            router.push("/dashboard/wallet")
                        }}
                        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${isWallet ? 'text-primary-green' : 'text-neutral-text/20'}`}
                    >
                        <span className={`material-symbols-outlined text-[28px] ${isWallet ? 'fill-1 opacity-100' : 'opacity-60'}`}>account_balance_wallet</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Billetera</span>
                    </button>
                    <button
                        onClick={() => {
                            haptic("light")
                            router.push("/dashboard/menu")
                        }}
                        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${isMenu ? 'text-primary-green' : 'text-neutral-text/20'}`}
                    >
                        <span className={`material-symbols-outlined text-[28px] ${isMenu ? 'fill-1 opacity-100' : 'opacity-60'}`}>widgets</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">Menú</span>
                    </button>
                </nav>

                {/* Dialogs */}
                <BalanceRechargeDialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog} />
                <NotificationsPanel
                    open={showNotifications}
                    onOpenChange={setShowNotifications}
                />
                <WelcomeModal
                    open={showWelcomeModal}
                    onOpenChange={setShowWelcomeModal}
                    onNavigateToVehicles={() => router.push("/dashboard/vehicles")}
                />
            </div>
            <DesktopBlocker />
        </>
    )
}
