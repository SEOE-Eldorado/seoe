"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@entities/auth-context"
import { useRouter } from "next/navigation"
import { useAllUsers, useUpdateUserRole } from "@shared/api/admin-users"
import { useAllFines, useCancelFine, useMarkFinePaid } from "@shared/api/admin-fines"
import { useAllTransactions, usePaymentSettings, useUpdatePaymentSettings, useRefundTransaction } from "@shared/api/admin-transactions"
import { useToast } from "@shared/lib/hooks/use-toast"

type Tab = "overview" | "users" | "fines" | "transactions" | "settings"

export function AdminDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [searchTerm, setSearchTerm] = useState("")

    // Queries
    const { data: allUsers, isLoading: usersLoading } = useAllUsers()
    const { data: allFines, isLoading: finesLoading } = useAllFines()
    const { data: allTransactions, isLoading: txLoading } = useAllTransactions()
    const { data: paymentSettings } = usePaymentSettings()

    // Mutations
    const updateRole = useUpdateUserRole()
    const cancelFine = useCancelFine()
    const markPaid = useMarkFinePaid()
    const updateSettings = useUpdatePaymentSettings()
    const refundTx = useRefundTransaction()

    // Guard: only admin
    if (user?.role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-bg font-display">
                <div className="text-center space-y-4">
                    <span className="material-symbols-outlined text-6xl text-red-400">block</span>
                    <p className="text-sm font-black text-neutral-text/40 uppercase tracking-widest">Acceso no autorizado</p>
                    <button onClick={() => router.push("/dashboard")} className="text-primary-green font-bold text-sm">Volver al dashboard</button>
                </div>
            </div>
        )
    }

    // Stats
    const totalUsers = allUsers?.length || 0
    const totalFines = allFines?.length || 0
    const pendingFines = allFines?.filter(f => f.status === "pending").length || 0
    const totalTransactions = allTransactions?.length || 0
    const totalRevenue = allTransactions?.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalBalance = allUsers?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "overview", label: "Resumen", icon: "dashboard" },
        { id: "users", label: "Usuarios", icon: "group" },
        { id: "fines", label: "Multas", icon: "receipt_long" },
        { id: "transactions", label: "Transacciones", icon: "payments" },
        { id: "settings", label: "Configuración", icon: "settings" },
    ]

    const filteredUsers = useMemo(() => {
        if (!allUsers) return []
        return allUsers.filter(u =>
            (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [allUsers, searchTerm])

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            await updateRole.mutateAsync({ userId, role })
            toast({ title: "Rol actualizado", description: `El usuario ahora es ${role}` })
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const handleCancelFine = async (fineId: string) => {
        const reason = prompt("Motivo de cancelación:")
        if (!reason) return
        try {
            await cancelFine.mutateAsync({ fineId, reason })
            toast({ title: "Multa cancelada", description: "La multa fue cancelada correctamente" })
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const handleMarkPaid = async (fineId: string) => {
        try {
            await markPaid.mutateAsync(fineId)
            toast({ title: "Multa pagada", description: "La multa fue marcada como pagada" })
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const handleRefund = async (txId: string, userId: string) => {
        if (!confirm("¿Confirmar reembolso de esta transacción?")) return
        try {
            await refundTx.mutateAsync({ txId, userId })
            toast({ title: "Reembolso procesado", description: "La transacción fue reembolsada" })
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const formatDate = (date: any) => {
        if (!date) return "—"
        const d = date?.toDate ? date.toDate() : new Date(date)
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    }

    const formatMoney = (amount: number) => `$${(amount || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

    const roleColors: Record<string, string> = {
        admin: "bg-violet-100 text-violet-700",
        inspector: "bg-blue-100 text-blue-700",
        seller: "bg-amber-100 text-amber-700",
        user: "bg-slate-100 text-slate-600",
    }

    return (
        <div className="min-h-screen bg-neutral-bg font-display flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-border sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <span className="material-symbols-outlined text-xl">shield_person</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-neutral-text tracking-tight">Panel Admin</h1>
                            <p className="text-[10px] font-bold text-neutral-text/30 uppercase tracking-widest">SEOE · Estacionamiento Medido</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="size-10 bg-neutral-bg rounded-full flex items-center justify-center text-neutral-text/60 hover:text-neutral-text transition-all active:scale-90"
                            title="Vista de usuario"
                        >
                            <span className="material-symbols-outlined text-xl">person</span>
                        </button>
                        <button
                            onClick={logout}
                            className="size-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-90"
                            title="Cerrar sesión"
                        >
                            <span className="material-symbols-outlined text-xl">logout</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar">
                    <div className="flex gap-1 pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchTerm("") }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-primary-green text-white shadow-sm"
                                        : "text-neutral-text/40 hover:bg-white hover:text-neutral-text/60"
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon="group" label="Total Usuarios" value={totalUsers.toString()} color="bg-blue-500" />
                            <StatCard icon="receipt_long" label="Multas Pendientes" value={pendingFines.toString()} sub={`de ${totalFines} total`} color="bg-amber-500" />
                            <StatCard icon="payments" label="Transacciones" value={totalTransactions.toString()} color="bg-emerald-500" />
                            <StatCard icon="account_balance" label="Saldo Total Sistema" value={formatMoney(totalBalance)} color="bg-violet-500" />
                        </div>

                        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                            <h2 className="text-sm font-black text-neutral-text/40 uppercase tracking-widest mb-4">Ingresos por Transacciones</h2>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-primary-green tracking-tighter">{formatMoney(totalRevenue)}</span>
                                <span className="text-xs font-bold text-neutral-text/30 uppercase tracking-widest mb-2">completadas</span>
                            </div>
                        </div>

                        {/* Recent transactions */}
                        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border/50">
                                <h2 className="text-sm font-black text-neutral-text/40 uppercase tracking-widest">Transacciones Recientes</h2>
                            </div>
                            <div className="divide-y divide-border/30">
                                {allTransactions?.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-neutral-text">{tx.userName || "Usuario"}</p>
                                            <p className="text-[10px] font-bold text-neutral-text/30 uppercase tracking-widest">{tx.method} · {formatDate(tx.timestamp)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-primary-green">{formatMoney(tx.amount)}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                                tx.status === "completed" ? "text-emerald-500" :
                                                tx.status === "pending" ? "text-amber-500" :
                                                tx.status === "refunded" ? "text-blue-500" : "text-red-500"
                                            }`}>{tx.status}</p>
                                        </div>
                                    </div>
                                )) || (
                                    <div className="px-6 py-8 text-center text-neutral-text/30 text-sm font-bold">No hay transacciones</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS */}
                {activeTab === "users" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-text/30 text-xl">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-neutral-text placeholder:text-neutral-text/20 focus:border-primary-green focus:ring-2 focus:ring-primary-green/10 outline-none transition-all"
                            />
                        </div>

                        {usersLoading ? (
                            <LoadingSpinner text="Cargando usuarios..." />
                        ) : (
                            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-neutral-bg/50 border-b border-border/50">
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Usuario</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Rol</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Saldo</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Cambiar Rol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-neutral-bg/20 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-sm font-bold text-neutral-text">{u.name || "Sin nombre"}</p>
                                                            <p className="text-[10px] text-neutral-text/40 font-medium">{u.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${roleColors[u.role] || roleColors.user}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-sm font-black text-neutral-text tabular-nums">{formatMoney(u.balance)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <select
                                                            value={u.role}
                                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                                            className="bg-neutral-bg border border-border rounded-lg px-2 py-1 text-[11px] font-bold text-neutral-text/60 outline-none focus:border-primary-green cursor-pointer"
                                                        >
                                                            <option value="user">Usuario</option>
                                                            <option value="seller">Vendedor</option>
                                                            <option value="inspector">Inspector</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-neutral-text/30 text-sm font-bold">No se encontraron usuarios</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FINES */}
                {activeTab === "fines" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {finesLoading ? (
                            <LoadingSpinner text="Cargando multas..." />
                        ) : (
                            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-neutral-bg/50 border-b border-border/50">
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Patente</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Motivo</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Monto</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Estado</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Fecha</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {allFines?.map(fine => (
                                                <tr key={fine.id} className="hover:bg-neutral-bg/20 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-black text-neutral-text uppercase">{fine.vehiclePlate}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-neutral-text/70">{fine.reason || fine.description || "N/A"}</span>
                                                        {fine.location && <p className="text-[10px] text-neutral-text/30">{fine.location}</p>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-sm font-black text-red-500">{formatMoney(fine.amount)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            fine.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                            fine.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                                                            fine.status === "cancelled" ? "bg-slate-100 text-slate-500" :
                                                            "bg-blue-100 text-blue-700"
                                                        }`}>
                                                            {fine.status === "pending" ? "Pendiente" :
                                                             fine.status === "paid" ? "Pagada" :
                                                             fine.status === "cancelled" ? "Cancelada" : "Impugnada"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[11px] font-medium text-neutral-text/50">{formatDate(fine.date)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            {fine.status === "pending" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleMarkPaid(fine.id)}
                                                                        className="size-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all active:scale-90"
                                                                        title="Marcar pagada"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base">check</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleCancelFine(fine.id)}
                                                                        className="size-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-90"
                                                                        title="Cancelar"
                                                                    >
                                                                        <span className="material-symbols-outlined text-base">close</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!allFines || allFines.length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-neutral-text/30 text-sm font-bold">No hay multas registradas</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TRANSACTIONS */}
                {activeTab === "transactions" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {txLoading ? (
                            <LoadingSpinner text="Cargando transacciones..." />
                        ) : (
                            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-neutral-bg/50 border-b border-border/50">
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Usuario</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Método</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Monto</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Estado</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">Fecha</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-neutral-text/30 uppercase tracking-widest text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {allTransactions?.map(tx => (
                                                <tr key={tx.id} className="hover:bg-neutral-bg/20 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-bold text-neutral-text">{tx.userName || "—"}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-neutral-text/60 capitalize">{tx.method}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-sm font-black text-primary-green">{formatMoney(tx.amount)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            tx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                                            tx.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                            tx.status === "refunded" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                                                        }`}>{tx.status}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[11px] font-medium text-neutral-text/50">{formatDate(tx.timestamp)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {tx.status === "completed" && (
                                                            <button
                                                                onClick={() => handleRefund(tx.id, tx.userId)}
                                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-95"
                                                            >
                                                                Reembolsar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!allTransactions || allTransactions.length === 0) && (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-neutral-text/30 text-sm font-bold">No hay transacciones</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SETTINGS */}
                {activeTab === "settings" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                            <h2 className="text-sm font-black text-neutral-text/40 uppercase tracking-widest mb-6">Métodos de Pago</h2>
                            <div className="space-y-4">
                                <SettingToggle
                                    label="Macro Click (Pago con Click)"
                                    description="Permite a los usuarios pagar mediante Macro Click"
                                    enabled={paymentSettings?.enableMacroClick ?? true}
                                    onToggle={() => updateSettings.mutate({ enableMacroClick: !paymentSettings?.enableMacroClick })}
                                />
                                <SettingToggle
                                    label="Efectivo"
                                    description="Permite recargas en efectivo"
                                    enabled={paymentSettings?.enableCash ?? true}
                                    onToggle={() => updateSettings.mutate({ enableCash: !paymentSettings?.enableCash })}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                            <h2 className="text-sm font-black text-neutral-text/40 uppercase tracking-widest mb-6">Promociones</h2>
                            <div className="space-y-4">
                                <SettingToggle
                                    label="Promoción Activa"
                                    description="Activa promociones de recarga para usuarios"
                                    enabled={paymentSettings?.promotions?.active ?? false}
                                    onToggle={() => updateSettings.mutate({
                                        promotions: {
                                            active: !paymentSettings?.promotions?.active,
                                            minAmount: paymentSettings?.promotions?.minAmount ?? 100,
                                            bonusPercentage: paymentSettings?.promotions?.bonusPercentage ?? 10,
                                        }
                                    })}
                                />
                                {paymentSettings?.promotions?.active && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest block mb-2">Monto Mínimo</label>
                                            <input
                                                type="number"
                                                value={paymentSettings?.promotions?.minAmount ?? 100}
                                                onChange={e => updateSettings.mutate({
                                                    promotions: {
                                                        active: paymentSettings?.promotions?.active ?? false,
                                                        minAmount: Number(e.target.value),
                                                        bonusPercentage: paymentSettings?.promotions?.bonusPercentage ?? 10,
                                                    }
                                                })}
                                                className="w-full bg-neutral-bg border border-border rounded-xl px-4 py-3 text-sm font-bold text-neutral-text outline-none focus:border-primary-green"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest block mb-2">Bonificación %</label>
                                            <input
                                                type="number"
                                                value={paymentSettings?.promotions?.bonusPercentage ?? 10}
                                                onChange={e => updateSettings.mutate({
                                                    promotions: {
                                                        active: paymentSettings?.promotions?.active ?? false,
                                                        minAmount: paymentSettings?.promotions?.minAmount ?? 100,
                                                        bonusPercentage: Number(e.target.value),
                                                    }
                                                })}
                                                className="w-full bg-neutral-bg border border-border rounded-xl px-4 py-3 text-sm font-bold text-neutral-text outline-none focus:border-primary-green"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
                            <h2 className="text-sm font-black text-neutral-text/40 uppercase tracking-widest mb-4">Información del Sistema</h2>
                            <div className="space-y-3">
                                <InfoRow label="Admin actual" value={user?.name || user?.email || "—"} />
                                <InfoRow label="Proyecto Firebase" value="seoe-67101" />
                                <InfoRow label="Total usuarios" value={totalUsers.toString()} />
                                <InfoRow label="Total multas" value={totalFines.toString()} />
                                <InfoRow label="Total transacciones" value={totalTransactions.toString()} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

// ── Sub-components ──
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
    return (
        <div className="bg-white rounded-3xl border border-border p-5 shadow-sm">
            <div className={`size-10 ${color} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <p className="text-2xl font-black text-neutral-text tracking-tighter tabular-nums">{value}</p>
            <p className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest mt-1">{label}</p>
            {sub && <p className="text-[10px] font-medium text-neutral-text/20 mt-0.5">{sub}</p>}
        </div>
    )
}

function LoadingSpinner({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-12 border-[5px] border-primary-green/20 border-t-primary-green rounded-full animate-spin" />
            <p className="text-[10px] font-black text-neutral-text/30 uppercase tracking-widest">{text}</p>
        </div>
    )
}

function SettingToggle({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-neutral-bg rounded-2xl">
            <div>
                <p className="text-sm font-bold text-neutral-text">{label}</p>
                <p className="text-[11px] text-neutral-text/40 font-medium">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={`relative w-12 h-7 rounded-full transition-all ${enabled ? "bg-primary-green" : "bg-neutral-text/15"}`}
            >
                <span className={`absolute top-1 size-5 bg-white rounded-full shadow-sm transition-all ${enabled ? "left-6" : "left-1"}`} />
            </button>
        </div>
    )
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
            <span className="text-[11px] font-bold text-neutral-text/40 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-neutral-text">{value}</span>
        </div>
    )
}
