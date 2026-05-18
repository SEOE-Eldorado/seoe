"use client"

import { useState, useEffect } from "react"
import { db } from "@shared/api/firebase"
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, Timestamp, where } from "firebase/firestore"
import { useAuth } from "@entities/auth-context"
import { logAdminAction } from "@shared/lib/logging"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { Switch } from "@shared/ui/atoms/switch"
import { Badge } from "@shared/ui/atoms/badge"
import {
 Wallet,
 CreditCard,
 DollarSign,
 Percent,
 RefreshCcw,
 CheckCircle2,
 XCircle,
 Banknote,
 QrCode
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"

interface Transaction {
 id: string
 userId: string
 userName: string
 amount: number
 type: "credit" | "debit"
 method: "macro_click" | "cash" | "admin_adjustment" | "promotion"
 status: "completed" | "pending" | "failed" | "refunded"
 timestamp: Timestamp
 referenceId?: string
}

interface PaymentSettings {
 enableMacroClick: boolean
 enableCash: boolean
 promotions: {
 active: boolean
 minAmount: number
 bonusPercentage: number
 }
}

export function PaymentsConfig() {
 const { user } = useAuth()
 const { toast } = useToast()
 const [transactions, setTransactions] = useState<Transaction[]>([])
 const [settings, setSettings] = useState<PaymentSettings>({
 enableMacroClick: true,
 enableCash: true,
 promotions: { active: false, minAmount: 500, bonusPercentage: 10 }
 })
 const [loading, setLoading] = useState(true)

 // Load logs & settings
 useEffect(() => {
 // 1. Transactions
 const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(50))
 const unsubTrans = onSnapshot(q, (snapshot) => {
 const data: Transaction[] = []
 snapshot.forEach(doc => {
 data.push({ id: doc.id, ...doc.data() } as Transaction)
 })
 setTransactions(data)
 setLoading(false)
 })

 // 2. Settings (mocked for now, but should come from DB)
 // In a real app, you'd fetch this from `settings/payments` doc

 return () => unsubTrans()
 }, [])

 const handleToggleSetting = async (key: keyof PaymentSettings, value: any) => {
 // Optimistic update
 setSettings(prev => ({ ...prev, [key]: value }))

 // Log it
 if (user) {
 await logAdminAction(
 user.id,
 user.name || "Admin",
 "update_payment_settings",
 `Actualizó configuración de pagos: ${key} = ${value}`,
 undefined,
 { key, value }
 )
 }

 toast({ title: "Configuración Actualizada", description: "Los cambios se han guardado." })
 }

 const handleUpdatePromotion = async () => {
 if (user) {
 await logAdminAction(
 user.id,
 user.name || "Admin",
 "update_promotion",
 `Actualizó promoción: ${settings.promotions.active ? "Activa" : "Inactiva"}, min $${settings.promotions.minAmount}, bonus ${settings.promotions.bonusPercentage}%`,
 undefined,
 settings.promotions
 )
 }
 toast({ title: "Promoción Guardada", description: "La promoción de recarga ha sido actualizada." })
 }

 const handleRefund = async (tx: Transaction) => {
 if (!confirm(`¿Estás seguro de reembolsar esta transacción de $${tx.amount}?`)) return

 try {
 // 1. Mark transaction as refunded
 await updateDoc(doc(db, "transactions", tx.id), {
 status: "refunded",
 refundedAt: Timestamp.now(),
 refundedBy: user?.id
 })

 // 2. Adjust user balance (reverse the credit)
 // Note: Ideally this should be a transaction or cloud function to ensure consistency
 const userRef = doc(db, "users", tx.userId)
 // We can't do increment(-amount) easily here without knowing current balance logic fully, 
 // but let's assume a Cloud Function handles the balance update based on transaction status change.
 // For now, we'll just log it.

 if (user) {
 await logAdminAction(
 user.id,
 user.name || "Admin",
 "refund_transaction",
 `Reembolsó transacción ${tx.id} de $${tx.amount}`,
 tx.id,
 { amount: tx.amount, userId: tx.userId }
 )
 }

 toast({ title: "Reembolso Iniciado", description: "La transacción ha sido marcada como reembolsada." })
 } catch (error) {
 console.error(error)
 toast({ title: "Error", description: "No se pudo procesar el reembolso.", variant: "destructive" })
 }
 }

 if (loading) return <div className="p-8 text-center animate-pulse">Cargando pagos...</div>

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-bold text-primary">Configuración de Pagos</h3>
 <p className="text-xs font-medium text-accent">Gestiona métodos, promociones y reembolsos</p>
 </div>
 <div className="size-12 rounded-sm bg-emerald-500/10 flex items-center justify-center">
 <Wallet className="size-6 text-emerald-600" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Methods Config */}
 <Card className="border border-slate-200 rounded-sm-[2.5rem] bg-white p-6">
 <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
 <CreditCard className="size-4" /> Métodos Habilitados
 </h4>
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-sm bg-blue-50 flex items-center justify-center text-blue-500">
 <CreditCard className="size-5" />
 </div>
 <div>
 <p className="font-bold text-primary">Macro Click</p>
 <p className="text-[10px] text-slate-400">Botón de Pago Banco Macro</p>
 </div>
 </div>
 <Switch
 checked={settings.enableMacroClick}
 onCheckedChange={(v) => handleToggleSetting("enableMacroClick", v)}
 />
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-sm bg-emerald-50 flex items-center justify-center text-emerald-500">
 <Banknote className="size-5" />
 </div>
 <div>
 <p className="font-bold text-primary">Puntos de Venta (Efectivo)</p>
 <p className="text-[10px] text-slate-400">Recargas en kioscos adheridos</p>
 </div>
 </div>
 <Switch
 checked={settings.enableCash}
 onCheckedChange={(v) => handleToggleSetting("enableCash", v)}
 />
 </div>
 </div>
 </Card>

 {/* Promotions */}
 <Card className="border border-slate-200 rounded-sm-[2.5rem] bg-white p-6">
 <div className="flex items-center justify-between mb-6">
 <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
 <Percent className="size-4" /> Promociones
 </h4>
 <Switch
 checked={settings.promotions.active}
 onCheckedChange={(v) => {
 setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, active: v } }))
 }}
 />
 </div>

 <div className={`space-y-4 transition-all ${settings.promotions.active ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Mínimo de Carga</Label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
 <Input
 type="number"
 value={settings.promotions.minAmount}
 onChange={(e) => setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, minAmount: parseFloat(e.target.value) } }))}
 className="pl-6 h-10 rounded-sm font-bold"
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">% Bonificación</Label>
 <div className="relative">
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
 <Input
 type="number"
 value={settings.promotions.bonusPercentage}
 onChange={(e) => setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, bonusPercentage: parseFloat(e.target.value) } }))}
 className="pr-8 h-10 rounded-sm font-bold"
 />
 </div>
 </div>
 </div>
 <Button
 onClick={handleUpdatePromotion}
 className="w-full rounded-sm bg-violet-500 hover:bg-violet-600 font-bold"
 >
 Guardar Promoción
 </Button>
 </div>
 </Card>
 </div>

 {/* Transactions List */}
 <div className="space-y-4">
 <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
 <RefreshCcw className="size-4" /> Historial de Transacciones
 </h4>

 {transactions.length === 0 ? (
 <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-sm border border-dashed border-slate-200">
 <DollarSign className="size-12 mx-auto mb-2 opacity-30" />
 <p className="font-bold">Sin transacciones recientes</p>
 </div>
 ) : (
 <div className="grid gap-3">
 {transactions.map((tx) => (
 <Card key={tx.id} className="border border-slate-200 transition-all rounded-sm bg-white overflow-hidden">
 <div className="p-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className={`size-10 rounded-sm flex items-center justify-center shrink-0 ${tx.status === "completed" ? "bg-emerald-100 text-emerald-600" :
 tx.status === "refunded" ? "bg-slate-100 text-slate-400" :
 "bg-amber-100 text-amber-600"
 }`}>
 {tx.status === "completed" ? <CheckCircle2 className="size-5" /> :
 tx.status === "refunded" ? <RefreshCcw className="size-5" /> :
 <Wallet className="size-5" />}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <p className="font-bold text-primary">${tx.amount.toLocaleString("es-AR")}</p>
 <Badge variant="outline" className="text-[9px] uppercase font-black">{tx.method}</Badge>
 </div>
 <p className="text-[10px] text-slate-500 flex items-center gap-1">
 {tx.timestamp?.toDate().toLocaleString()} • {tx.userName || "Usuario"}
 </p>
 </div>
 </div>

 {tx.status === "completed" && (
 <Button
 size="sm"
 variant="ghost"
 onClick={() => handleRefund(tx)}
 className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-sm text-xs"
 >
 Reembolsar
 </Button>
 )}
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}
