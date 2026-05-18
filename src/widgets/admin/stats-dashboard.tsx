"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@shared/api/firebase"
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { useSettings } from "@entities/settings-context"
import {
    Car,
    DollarSign,
    Users,
    AlertTriangle,
    TrendingUp,
    Clock,
    MapPin,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Map as MapIcon,
    Wallet
} from "lucide-react"

interface Stats {
    activeSessions: number
    todayRevenue: number
    monthRevenue: number
    todayFines: number
    totalUsers: number
    sessionsToday: number
    topZone: { name: string; count: number } | null
}

export function StatsDashboard() {
    const { zones } = useSettings()
    const [stats, setStats] = useState<Stats>({
        activeSessions: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        todayFines: 0,
        totalUsers: 0,
        sessionsToday: 0,
        topZone: null
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Active Sessions listener
        const activeQuery = query(
            collection(db, "parking_sessions"),
            where("status", "==", "active")
        )

        const unsubActive = onSnapshot(activeQuery, (snapshot) => {
            setStats(prev => ({ ...prev, activeSessions: snapshot.size }))
        })

        // Today's sessions & revenue listener
        const todayQuery = query(
            collection(db, "parking_sessions"),
            where("startTime", ">=", Timestamp.fromDate(startOfDay))
        )

        const unsubToday = onSnapshot(todayQuery, (snapshot) => {
            let revenue = 0
            const zoneCounts: Record<string, number> = {}

            snapshot.forEach(doc => {
                const data = doc.data()
                revenue += data.cost || 0

                if (data.zone) {
                    zoneCounts[data.zone] = (zoneCounts[data.zone] || 0) + 1
                }
            })

            // Find top zone
            let topZone: { name: string; count: number } | null = null
            let maxCount = 0
            for (const [name, count] of Object.entries(zoneCounts)) {
                if (count > maxCount) {
                    maxCount = count
                    topZone = { name, count }
                }
            }

            setStats(prev => ({
                ...prev,
                todayRevenue: revenue,
                sessionsToday: snapshot.size,
                topZone
            }))
        })

        // Month revenue listener
        const monthQuery = query(
            collection(db, "parking_sessions"),
            where("startTime", ">=", Timestamp.fromDate(startOfMonth))
        )

        const unsubMonth = onSnapshot(monthQuery, (snapshot) => {
            let revenue = 0
            snapshot.forEach(doc => {
                revenue += doc.data().cost || 0
            })
            setStats(prev => ({ ...prev, monthRevenue: revenue }))
        })

        // Today's fines listener
        const finesQuery = query(
            collection(db, "fines"),
            where("issuedAt", ">=", Timestamp.fromDate(startOfDay))
        )

        const unsubFines = onSnapshot(finesQuery, (snapshot) => {
            setStats(prev => ({ ...prev, todayFines: snapshot.size }))
        })

        // Total users listener
        const usersRef = collection(db, "users")
        const unsubUsers = onSnapshot(usersRef, (snapshot) => {
            setStats(prev => ({ ...prev, totalUsers: snapshot.size }))
            setLoading(false)
        })

        return () => {
            unsubActive()
            unsubToday()
            unsubMonth()
            unsubFines()
            unsubUsers()
        }
    }, [])

    const statCards = [
        {
            label: "Sesiones Activas",
            value: stats.activeSessions,
            icon: Car,
            color: "text-emerald-600",
            borderColor: "border-emerald-100",
            iconBg: "bg-emerald-50",
            trend: "+2.5%",
            trendUp: true
        },
        {
            label: "Recaudación Hoy",
            value: stats.todayRevenue,
            icon: Wallet,
            color: "text-blue-600",
            borderColor: "border-blue-100",
            iconBg: "bg-blue-50",
            prefix: "$",
            trend: "+12%",
            trendUp: true
        },
        {
            label: "Monto Mes",
            value: stats.monthRevenue,
            icon: TrendingUp,
            color: "text-violet-600",
            borderColor: "border-violet-100",
            iconBg: "bg-violet-50",
            prefix: "$",
            trend: "+8.4%",
            trendUp: true
        },
        {
            label: "Multas Hoy",
            value: stats.todayFines,
            icon: AlertTriangle,
            color: "text-amber-600",
            borderColor: "border-amber-100",
            iconBg: "bg-amber-50",
            trend: "-4%",
            trendUp: false
        },
        {
            label: "Usuarios Totales",
            value: stats.totalUsers,
            icon: Users,
            color: "text-slate-900",
            borderColor: "border-slate-100",
            iconBg: "bg-slate-50",
            trend: "+5",
            trendUp: true
        },
        {
            label: "Sesiones Hoy",
            value: stats.sessionsToday,
            icon: Zap,
            color: "text-rose-600",
            borderColor: "border-rose-100",
            iconBg: "bg-rose-50",
            trend: "+18%",
            trendUp: true
        }
    ]

    const formatNumber = (num: number) => {
        return num.toLocaleString("es-AR")
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Panel de Estadísticas</h3>
                    <p className="text-sm font-medium text-slate-500 tracking-tight">Monitoreo de métricas clave en tiempo real</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Vivo</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={stat.label}
                        className={`bg-white border ${stat.borderColor} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`size-10 rounded-lg ${stat.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <stat.icon className={`size-5 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {stat.trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {stat.prefix || ""}{formatNumber(stat.value)}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2 flex items-center gap-2">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ranking Zona */}
                <div className="bg-slate-900 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                        <MapIcon className="size-32 text-white" />
                    </div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="size-16 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <MapPin className="size-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Zona más activa hoy</p>
                            <h4 className="text-2xl font-black text-white tracking-tight">
                                {stats.topZone ? stats.topZone.name : "Sin registros"}
                            </h4>
                            {stats.topZone && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-emerald-400">{stats.topZone.count}</span>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sesiones totales</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Zonas Estado */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                        <Activity className="size-32 text-slate-900" />
                    </div>
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="size-16 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Clock className="size-8 text-slate-900" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Configuración del Mapa</p>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                                {zones.filter(z => z.active).length} activas
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-slate-500">
                                <span className="text-[10px] font-bold uppercase tracking-widest">de {zones.length} zonas totales</span>
                                <div className="h-1 flex-1 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                                    <div
                                        className="h-full bg-slate-900 rounded-full"
                                        style={{ width: `${(zones.filter(z => z.active).length / (zones.length || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="pt-2 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">SISTEMA SEGURO • SEGUIMIENTO EN TIEMPO REAL</p>
            </div>
        </div>
    )
}
