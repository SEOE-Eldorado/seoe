"use client"

import { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { useParking, type ParkingSession } from "@entities/parking-context"
import { PlateChecker } from "@widgets/plate-checker"
import { FineIssuer } from "@widgets/fine-issuer"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Badge } from "@shared/ui/atoms/badge"
import { Button } from "@shared/ui/atoms/button"
import {
    ShieldCheck,
    ArrowLeft,
    LogOut,
    Car,
    Clock,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    DollarSign,
    History as HistoryIcon,
    LayoutDashboard,
    Users,
    FileText,
    CalendarDays,
    Shield,
    FileBarChart,
    Bell,
    ShieldAlert,
    Wallet,
    Search,
    Settings,
    MoreHorizontal,
    WifiOff,
    Activity,
    RefreshCw,
    Key
} from "lucide-react"
import { useEffect } from "react"

import dynamic from "next/dynamic"

const PriceConfig = dynamic(() => import("@widgets/admin/price-config").then(m => ({ default: m.PriceConfig })), { ssr: false })
const ZoneManagement = dynamic(() => import("@widgets/admin/zone-management").then(m => ({ default: m.ZoneManagement })), { ssr: false })
const StatsDashboard = dynamic(() => import("@widgets/admin/stats-dashboard").then(m => ({ default: m.StatsDashboard })), { ssr: false })
const UsersManagement = dynamic(() => import("@widgets/admin/users-management").then(m => ({ default: m.UsersManagement })), { ssr: false })
const FinesManagement = dynamic(() => import("@widgets/admin/fines-management").then(m => ({ default: m.FinesManagement })), { ssr: false })
const SpecialDaysManagement = dynamic(() => import("@widgets/admin/special-days-management").then(m => ({ default: m.SpecialDaysManagement })), { ssr: false })
const InspectorManagement = dynamic(() => import("@widgets/admin/inspector-management").then(m => ({ default: m.InspectorManagement })), { ssr: false })
const ReportsPanel = dynamic(() => import("@widgets/admin/reports-panel").then(m => ({ default: m.ReportsPanel })), { ssr: false })
const NotificationsSystem = dynamic(() => import("@widgets/admin/notifications-system").then(m => ({ default: m.NotificationsSystem })), { ssr: false })
const AuditLogsPanel = dynamic(() => import("@widgets/admin/audit-logs-panel").then(m => ({ default: m.AuditLogsPanel })), { ssr: false })
const PaymentGatewayCenter = dynamic(() => import("@widgets/admin/payment-gateway-center").then(m => ({ default: m.PaymentGatewayCenter })), { ssr: false })
const ExemptionsManagement = dynamic(() => import("@widgets/admin/exemptions-management").then(m => ({ default: m.ExemptionsManagement })), { ssr: false })
const AdminRolesManager = dynamic(() => import("@widgets/admin/admin-roles-manager").then(m => ({ default: m.AdminRolesManager })), { ssr: false })
const InspectorHeatmap = dynamic(() => import("@widgets/inspector-heatmap").then(m => ({ default: m.InspectorHeatmap })), { ssr: false })

const SidebarItem = ({ active, icon, label, onClick, badge, collapsed }: any) => {
    return (
        <div className="relative group">
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-green rounded-full transition-all" />}
            <button
                onClick={onClick}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${active ? 'text-neutral-text bg-neutral-bg/50 shadow-sm' : 'text-neutral-text/40 hover:bg-neutral-bg/30'} ${collapsed ? 'justify-center' : 'justify-between'}`}
                title={collapsed ? label : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className={`[&>svg]:size-[18px] transition-colors ${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {icon}
                    </div>
                    {!collapsed && <span className={`text-[13px] tracking-tight ${active ? 'font-bold' : 'font-medium'} whitespace-nowrap overflow-hidden`}>{label}</span>}
                </div>
                {badge && !collapsed && (
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${active ? 'bg-slate-100 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>
                        {badge}
                    </div>
                )}
            </button>
        </div>
    )
}

export function InspectorPage({ onBack }: { onBack: () => void }) {
    const { logout, user } = useAuth()
    const isAdmin = user?.role === "admin"
    const [searchResult, setSearchResult] = useState<{ plate: string, session: ParkingSession | null } | null>(null)
    const [showFineForm, setShowFineForm] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isOffline, setIsOffline] = useState(false)
    const [pendingSync, setPendingSync] = useState(0)
    const [activeTab, setActiveTab] = useState<"control" | "heatmap" | "history" | "config" | "zones" | "dashboard" | "users" | "fines" | "special-days" | "inspectors" | "reports" | "notifications" | "audit" | "payments" | "exemptions" | "roles">(isAdmin ? "dashboard" : "control")

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false)
            if (pendingSync > 0) {
                // Simulate syncing after coming back online
                setTimeout(() => setPendingSync(0), 2000)
            }
        }
        const handleOffline = () => setIsOffline(true)

        // Setup listeners
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Check initial state
        if (typeof navigator !== 'undefined') {
            setIsOffline(!navigator.onLine)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [pendingSync])

    const handleResult = (plate: string, session: ParkingSession | null) => {
        setSearchResult({ plate, session })
        setShowFineForm(false)
        setActiveTab("control")
    }

    const resetSearch = () => {
        setSearchResult(null)
        setShowFineForm(false)
        setActiveTab("control")
    }


    const titles: Record<string, string> = {
        "dashboard": "Dashboard",
        "control": "Control de Patentes",
        "heatmap": "Mapa de Calor",
        "users": "Gestión de Usuarios",
        "exemptions": "Exenciones y Frentistas",
        "inspectors": "Gestión de Inspectores",
        "reports": "Reportes y Estadísticas",
        "notifications": "Sistema de Notificaciones",
        "audit": "Logs de Auditoría",
        "payments": "Gateway & Pasarela de Pagos",
        "fines": "Manejo de Multas",
        "special-days": "Días Especiales",
        "zones": "Zonas de Estacionamiento",
        "config": "Tarifas y Precios",
        "history": "Historial de Operaciones",
        "roles": "Roles y Accesos Dinámicos",
    }

    const hasPermission = (tabId: string) => {
        if (tabId === 'control' || tabId === 'heatmap' || tabId === 'history') return true; // Common for both
        if (!isAdmin) return false;
        // Super Admin check: If no permissions array exists, allow everything for admin role
        if (!user?.permissions) return true;
        // If it's empty, user technically has no sub-access
        return user.permissions.includes(tabId);
    }

    return (
        <div className="flex h-dvh w-full flex-col lg:flex-row bg-white overflow-hidden relative">
            {/* Desktop Shell Box */}
            <div className="flex-1 flex overflow-hidden bg-white border-l border-slate-200/60">
                {/* Sidebar for Desktop */}
                <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-100 shrink-0 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
                    <div className={`p-5 flex flex-col ${isCollapsed ? 'items-center gap-8' : 'gap-5'}`}>
                        {/* Logo */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="size-10 rounded-2xl bg-neutral-text flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 border border-white/10 shadow-lg">
                                    <span className="text-white font-black text-xl tracking-tighter">s.</span>
                                </div>
                                {!isCollapsed && (
                                    <div className="leading-tight overflow-hidden">
                                        <h2 className="text-base font-black text-neutral-text tracking-tighter whitespace-nowrap">SEOE Panel</h2>
                                        <p className="text-[10px] text-neutral-text/30 font-black uppercase tracking-widest whitespace-nowrap">{isAdmin ? "Administrador" : "Inspector"}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className={`text-slate-400 hover:bg-slate-50 p-1 rounded-sm transition-all ${isCollapsed ? 'hidden' : 'block'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">keyboard_double_arrow_left</span>
                            </button>
                            {isCollapsed && (
                                <button
                                    onClick={() => setIsCollapsed(false)}
                                    className="text-slate-400 hover:bg-slate-50 p-1 rounded-sm transition-all absolute left-[60px] top-6 bg-white border border-slate-200 shadow-sm z-50 rounded-full size-6 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[14px]">keyboard_double_arrow_right</span>
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        {!isCollapsed ? (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-[0.625px] px-3 py-2.5 text-slate-400 transition-colors focus-within:border-slate-300 focus-within:bg-white">
                                <Search className="size-[14px]" />
                                <input type="text" placeholder="Buscar..." className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400" />
                                <div className="bg-white border border-slate-200 rounded-[0.25px] px-1.5 py-0.5 text-[9px] font-bold text-slate-400">⌘K</div>
                            </div>
                        ) : (
                            <button className="flex items-center justify-center size-9 bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                                <Search className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-7 flex flex-col no-scrollbar">
                        {/* Section 1 */}
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] px-4 mb-3 opacity-80 whitespace-nowrap overflow-hidden">Menú Principal</p>}
                            {isAdmin && <SidebarItem collapsed={isCollapsed} active={activeTab === 'dashboard'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />}
                            <SidebarItem collapsed={isCollapsed} active={activeTab === 'control'} icon={<ShieldCheck />} label="Control Fiscal" onClick={() => { setActiveTab('control'); resetSearch(); }} />
                            <SidebarItem collapsed={isCollapsed} active={activeTab === 'heatmap'} icon={<Activity />} label="Mapa de Calor" onClick={() => setActiveTab('heatmap')} />
                            <SidebarItem collapsed={isCollapsed} active={activeTab === 'history'} icon={<HistoryIcon />} label="Historial" onClick={() => setActiveTab('history')} />
                        </div>

                        {isAdmin && (
                            <>
                                <div className="space-y-1.5">
                                    {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5 opacity-80 whitespace-nowrap overflow-hidden">HERRAMIENTAS</p>}
                                    {hasPermission('users') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'users'} icon={<Users />} label="Gestión Usuarios" onClick={() => setActiveTab('users')} />}
                                    {hasPermission('exemptions') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'exemptions'} icon={<Shield />} label="Beneficios/Exenciones" onClick={() => setActiveTab('exemptions')} />}
                                    {hasPermission('inspectors') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'inspectors'} icon={<ShieldCheck />} label="Inspectores" onClick={() => setActiveTab('inspectors')} />}
                                    {hasPermission('fines') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'fines'} icon={<FileText />} label="Sistema Multas" onClick={() => setActiveTab('fines')} />}
                                    {hasPermission('zones') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'zones'} icon={<MapPin />} label="Zonas y Mapas" onClick={() => setActiveTab('zones')} />}
                                    {hasPermission('payments') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'payments'} icon={<Wallet />} label="Pagos y Créditos" onClick={() => setActiveTab('payments')} />}
                                </div>

                                <div className="space-y-1.5">
                                    {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5 opacity-80 whitespace-nowrap overflow-hidden">ESPACIO DE TRABAJO</p>}
                                    {hasPermission('reports') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'reports'} icon={<FileBarChart />} label="Analítica Reportes" badge={5} onClick={() => setActiveTab('reports')} />}
                                    {hasPermission('config') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'config'} icon={<DollarSign />} label="Tarifas y Precios" badge={4} onClick={() => setActiveTab('config')} />}
                                    {hasPermission('special-days') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'special-days'} icon={<CalendarDays />} label="Días Especiales" onClick={() => setActiveTab('special-days')} />}
                                    {hasPermission('audit') && <SidebarItem collapsed={isCollapsed} active={activeTab === 'audit'} icon={<ShieldAlert />} label="Log Actividades" onClick={() => setActiveTab('audit')} />}
                                    {/* Only Super Admins (no permissions restricted) can manage roles */}
                                    {(!user?.permissions || user.permissions.length === 0) && (
                                        <SidebarItem collapsed={isCollapsed} active={activeTab === 'roles'} icon={<Key className="size-4" />} label="Roles y Permisos" onClick={() => setActiveTab('roles')} />
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 mt-auto border-t border-slate-100 flex flex-col gap-1.5 bg-white">
                        <SidebarItem collapsed={isCollapsed} active={false} icon={<Settings />} label="Ajustes" onClick={() => { }} />
                        <SidebarItem collapsed={isCollapsed} active={false} icon={<Bell />} label="Soporte" onClick={() => { }} />
                        <SidebarItem
                            collapsed={isCollapsed}
                            active={false}
                            icon={<LogOut className="text-red-500" />}
                            label={<span className="text-red-500 font-bold">Cerrar Sesión</span>}
                            onClick={() => logout()}
                        />
                    </div>
                </aside>

                {/* Main View Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white border-l border-slate-100">
                    {/* Header Inspector - Mobile Only */}
                    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary-green p-4 pb-6 rounded-b-[10px] shadow-2xl shadow-emerald-900/10">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-white flex items-center justify-center border border-white/30 shadow-sm">
                                <ShieldCheck className="text-primary-green size-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">
                                    {isAdmin ? "Administrador" : "Inspector Oficial"}
                                </p>
                                <h2 className="text-lg font-black text-white leading-none tracking-tighter">{user?.name?.split(' ')[0] || "Oficial"}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isOffline && (
                                <div className="animate-bounce flex items-center justify-center size-9 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40">
                                    <WifiOff className="size-4" />
                                </div>
                            )}
                            <button onClick={() => logout()} className="size-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-all active:scale-95">
                                <LogOut className="size-5" />
                            </button>
                        </div>
                    </header>

                    {/* Desktop Clean Header */}
                    <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 relative">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                {titles[activeTab]}
                                {isOffline && (
                                    <Badge variant="destructive" className="animate-pulse bg-red-500 font-bold tracking-widest text-[10px] uppercase ml-2 flex items-center gap-1.5 rounded-sm">
                                        <WifiOff className="size-3" /> Modo Offline
                                    </Badge>
                                )}
                                {!isOffline && pendingSync > 0 && (
                                    <Badge className="bg-orange-500 font-bold tracking-widest text-[10px] uppercase ml-2 flex items-center gap-1.5 rounded-sm">
                                        <RefreshCw className="size-3 animate-spin" /> Sincronizando...
                                    </Badge>
                                )}
                            </h1>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto px-4 lg:px-8 lg:py-8 -mt-2 lg:mt-0 pb-32 lg:pb-8 no-scrollbar bg-white">
                        <div className="max-w-[1400px] mx-auto w-full">
                            {isOffline && (
                                <div className="lg:hidden mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="size-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <WifiOff className="size-4 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-red-900 leading-none mb-1">Modo Offline Activo</p>
                                        <p className="text-[10px] text-red-600 font-medium">Puedes seguir fiscalizando. Se sincronizará al volver.</p>
                                    </div>
                                </div>
                            )}
                            {activeTab === "dashboard" && hasPermission('dashboard') && <StatsDashboard />}

                            {activeTab === "users" && hasPermission('users') && <UsersManagement />}

                            {activeTab === "exemptions" && hasPermission('exemptions') && <ExemptionsManagement />}

                            {activeTab === "inspectors" && hasPermission('inspectors') && <InspectorManagement />}

                            {activeTab === "reports" && hasPermission('reports') && <ReportsPanel />}

                            {activeTab === "notifications" && hasPermission('notifications') && <NotificationsSystem />}

                            {activeTab === "audit" && hasPermission('audit') && <AuditLogsPanel />}

                            {activeTab === "payments" && hasPermission('payments') && <PaymentGatewayCenter />}

                            {activeTab === "roles" && (!user?.permissions || user.permissions.length === 0) && <AdminRolesManager />}

                            {activeTab === "fines" && hasPermission('fines') && <FinesManagement />}

                            {activeTab === "special-days" && hasPermission('special-days') && <SpecialDaysManagement />}

                            {activeTab === "heatmap" && <InspectorHeatmap />}

                            {activeTab === "control" && (
                                <>
                                    {/* Search Section */}
                                    {!searchResult && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto lg:mt-10">
                                            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 lg:p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <Search className="size-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-none">Fiscalización</h3>
                                                        <p className="text-xs text-slate-500 mt-1">Verifica dominios en tiempo real</p>
                                                    </div>
                                                </div>
                                                <PlateChecker onResult={handleResult} />
                                            </div>

                                            {/* Quick Stats or History Placeholder */}
                                            <div className="mt-8 space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 opacity-60">Resumen de Turno</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="size-2 rounded-full bg-blue-500" />
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Escaneos</span>
                                                        </div>
                                                        <span className="text-2xl font-black block text-slate-800 tracking-tighter">24</span>
                                                    </div>
                                                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Actas</span>
                                                        </div>
                                                        <span className="text-2xl font-black block text-red-600 tracking-tighter">04</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Result Section */}
                                    {searchResult && !showFineForm && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 max-w-2xl mx-auto">
                                            <Button
                                                variant="ghost"
                                                onClick={resetSearch}
                                                className="text-slate-500 hover:text-slate-900 font-bold -ml-2"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Nueva Búsqueda
                                            </Button>

                                            <Card className="border border-slate-100 (0,0,0,0.04)] rounded-[1.5px] overflow-hidden bg-white">
                                                <div className={`h-32 flex flex-col items-center justify-center gap-2 relative overflow-hidden ${searchResult.session ? "bg-emerald-50" : "bg-red-50"}`}>
                                                    <div className={`absolute inset-0 opacity-10 ${searchResult.session ? "bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] bg-emerald-500" : "bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] bg-red-500"}`} />
                                                    <div className="relative z-10 bg-white px-6 py-2 rounded-sm border border-slate-100/50">
                                                        <span className="text-3xl font-black tracking-widest text-slate-900 uppercase">{searchResult.plate}</span>
                                                    </div>
                                                    <Badge variant="outline" className={`relative z-10 border border-slate-200 font-black text-[10px] uppercase tracking-widest ${searchResult.session ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                        {searchResult.session ? "Estacionamiento Activo" : "Sin Estacionamiento"}
                                                    </Badge>
                                                </div>

                                                <CardContent className="pt-8 pb-8 space-y-6">
                                                    {searchResult.session ? (
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="flex flex-col gap-1 p-4 rounded-sm border border-slate-100 bg-slate-50/50">
                                                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Zona</span>
                                                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                                                        <MapPin className="size-4 text-slate-400" />
                                                                        {searchResult.session.zone}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1 p-4 rounded-sm border border-slate-100 bg-slate-50/50">
                                                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Vence en</span>
                                                                    <div className="flex items-center gap-2 font-bold text-emerald-600 text-sm">
                                                                        <Clock className="size-4" />
                                                                        {searchResult.session
                                                                          ? (() => {
                                                                              const now = new Date()
                                                                              const end = searchResult.session.endTime
                                                                              const diff = end.getTime() - now.getTime()
                                                                              if (diff <= 0) return "Vencido"
                                                                              const mins = Math.floor(diff / 60000)
                                                                              if (mins < 60) return `${mins} min`
                                                                              const hrs = Math.floor(mins / 60)
                                                                              const rem = mins % 60
                                                                              return `${hrs}h ${rem}m`
                                                                            })()
                                                                          : "N/A"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 rounded-sm bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                                                <div className="p-2 bg-emerald-100 rounded-sm">
                                                                    <CheckCircle2 className="text-emerald-600 size-5" />
                                                                </div>
                                                                <p className="text-sm font-medium text-emerald-800">
                                                                    Vehículo habilitado. No se requiere acción.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <div className="p-4 rounded-sm bg-red-50 border border-red-100 flex items-center gap-3">
                                                                <div className="p-2 bg-red-100 rounded-sm">
                                                                    <AlertTriangle className="text-red-600 size-5" />
                                                                </div>
                                                                <p className="text-sm font-medium text-red-800">
                                                                    No se encontró una sesión para esta patente en ninguna zona.
                                                                </p>
                                                            </div>
                                                            <Button
                                                                className="w-full h-14 rounded-sm bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm "
                                                                onClick={() => setShowFineForm(true)}
                                                            >
                                                                INICIAR MULTA
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Fine Form Section */}
                                    {searchResult && showFineForm && (
                                        <div className="space-y-4 max-w-2xl mx-auto">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowFineForm(false)}
                                                className="text-slate-500 hover:text-slate-900 font-bold -ml-2"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Estado
                                            </Button>
                                            <div className="bg-white rounded-[1.5px] (0,0,0,0.04)] border border-slate-100 overflow-hidden">
                                                <FineIssuer
                                                    plate={searchResult.plate}
                                                    onSuccess={() => {
                                                        if (isOffline) {
                                                            setPendingSync(prev => prev + 1)
                                                        }
                                                        resetSearch()
                                                    }}
                                                    onCancel={() => setShowFineForm(false)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === "config" && hasPermission('config') && <PriceConfig />}
                            {activeTab === "zones" && hasPermission('zones') && <ZoneManagement />}
                            {activeTab === "history" && (
                                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                    <HistoryIcon className="size-16 mb-4" />
                                    <p className="font-bold">Historial no disponible</p>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Bottom Nav Inspector/Admin - Mobile Only */}
                    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
                        <div className="mx-3 mb-4 bg-white/80 backdrop-blur-2xl border border-slate-200/60 rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
                            <div className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-3"} relative`}>
                                {isAdmin && (
                                    <button
                                        onClick={() => setActiveTab("dashboard")}
                                        className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "dashboard" ? "text-slate-900" : "text-slate-400"}`}
                                    >
                                        <div className={`relative transition-transform duration-300 ${activeTab === "dashboard" ? "scale-110" : ""}`}>
                                            <LayoutDashboard className="size-[22px]" />
                                        </div>
                                        <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "dashboard" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Stats</span>
                                        {activeTab === "dashboard" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                    </button>
                                )}

                                <button
                                    onClick={() => setActiveTab("control")}
                                    className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "control" ? "text-slate-900" : "text-slate-400"}`}
                                >
                                    <div className={`relative transition-transform duration-300 ${activeTab === "control" ? "scale-110" : ""}`}>
                                        <ShieldCheck className="size-[22px]" />
                                    </div>
                                    <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "control" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Fiscal</span>
                                    {activeTab === "control" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                </button>

                                <button
                                    onClick={() => setActiveTab("heatmap")}
                                    className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "heatmap" ? "text-slate-900" : "text-slate-400"}`}
                                >
                                    <div className={`relative transition-transform duration-300 ${activeTab === "heatmap" ? "scale-110" : ""}`}>
                                        <Activity className="size-[22px]" />
                                    </div>
                                    <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "heatmap" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Mapa</span>
                                    {activeTab === "heatmap" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                </button>

                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => setActiveTab("users")}
                                            className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "users" ? "text-slate-900" : "text-slate-400"}`}
                                        >
                                            <div className={`relative transition-transform duration-300 ${activeTab === "users" ? "scale-110" : ""}`}>
                                                <Users className="size-[22px]" />
                                            </div>
                                            <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "users" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Usuarios</span>
                                            {activeTab === "users" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("fines")}
                                            className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "fines" ? "text-slate-900" : "text-slate-400"}`}
                                        >
                                            <div className={`relative transition-transform duration-300 ${activeTab === "fines" ? "scale-110" : ""}`}>
                                                <FileText className="size-[22px]" />
                                            </div>
                                            <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "fines" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Actas</span>
                                            {activeTab === "fines" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                        </button>
                                    </>
                                )}

                                {!isAdmin && (
                                    <button
                                        onClick={() => setActiveTab("history")}
                                        className={`flex flex-col items-center gap-1.5 py-3.5 transition-all duration-300 relative ${activeTab === "history" ? "text-slate-900" : "text-slate-400"}`}
                                    >
                                        <div className={`relative transition-transform duration-300 ${activeTab === "history" ? "scale-110" : ""}`}>
                                            <HistoryIcon className="size-[22px]" />
                                        </div>
                                        <span className={`text-[9px] tracking-wide transition-all duration-300 ${activeTab === "history" ? "font-extrabold text-slate-900" : "font-semibold"}`}>Historial</span>
                                        {activeTab === "history" && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
