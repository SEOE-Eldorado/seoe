"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@shared/api/firebase"
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    Timestamp, 
    where,
    doc,
    updateDoc
} from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Badge } from "@shared/ui/atoms/badge"
import { 
    Activity, 
    RefreshCcw, 
    AlertCircle, 
    CheckCircle2, 
    TrendingUp, 
    Search, 
    History,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    SearchCode,
    CreditCard,
    DollarSign,
    Percent,
    Banknote,
    Wallet
} from "lucide-react"
import { Switch } from "@shared/ui/atoms/switch"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { useToast } from "@shared/ui/atoms/use-toast"
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts"

interface Transaction {
    id: string
    userId: string
    userName: string
    amount: number
    status: "completed" | "pending" | "failed" | "refunded"
    method: string
    timestamp: Timestamp
    gatewayResponseCode?: string
    gatewayMessage?: string
    externalReference?: string
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

export function PaymentGatewayCenter() {
    const { toast } = useToast()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"monitor" | "reconciliation" | "logs" | "settings">("monitor")
    const [syncingId, setSyncingId] = useState<string | null>(null)
    const [settings, setSettings] = useState<PaymentSettings>({
        enableMacroClick: true,
        enableCash: true,
        promotions: { active: false, minAmount: 500, bonusPercentage: 10 }
    })

    // Load recent activity for the dashboard
    useEffect(() => {
        const q = query(
            collection(db, "transactions"), 
            orderBy("timestamp", "desc"), 
            limit(100)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Transaction[] = []
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as Transaction)
            })
            setTransactions(data)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Logic: Reconciliation (Filtered transactions stuck in pending > 10 mins)
    const pendingTransactions = useMemo(() => {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000
        return transactions.filter(tx => 
            tx.status === "pending" && 
            tx.timestamp.toMillis() < tenMinutesAgo
        )
    }, [transactions])

    // Mock Data: Conversion Rate Logic
    const stats = useMemo(() => {
        const completed = transactions.filter(t => t.status === "completed").length
        const total = transactions.length || 1
        const rate = (completed / total) * 100
        const totalVolume = transactions
            .filter(t => t.status === "completed")
            .reduce((acc, curr) => acc + curr.amount, 0)

        return { rate, totalVolume, completed, total }
    }, [transactions])

    // Mock Data: Chart Data (Last 7 days aggregated)
    const chartData = useMemo(() => {
        const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        return days.map(day => ({
            name: day,
            monto: Math.floor(Math.random() * 50000) + 10000,
            operaciones: Math.floor(Math.random() * 20) + 5
        }))
    }, [])

    const handleForceSync = async (txId: string) => {
        setSyncingId(txId)
        
        // Simulating Cloud Function Call to Bank API
        setTimeout(async () => {
            try {
                // In a real implementation:
                // const checkPayment = httpsCallable(functions, 'checkMacroClickPayment');
                // await checkPayment({ transactionId: txId });
                
                toast({
                    title: "Sincronización Exitosa",
                    description: `Estado verificado para la transacción ${txId}.`
                })
            } catch (error) {
                toast({
                    title: "Error de Sincronización",
                    description: "No se pudo conectar con la pasarela de pagos.",
                    variant: "destructive"
                })
            } finally {
                setSyncingId(null)
            }
        }, 1500)
    }

    const handleToggleSetting = async (key: keyof PaymentSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        toast({ title: "Configuración Actualizada", description: "Los cambios se han guardado." })
    }

    const handleUpdatePromotion = async () => {
        toast({ title: "Promoción Guardada", description: "La promoción de recarga ha sido actualizada." })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 animate-pulse">
                <div className="text-center space-y-4">
                    <RefreshCcw className="size-10 text-primary/20 animate-spin mx-auto" />
                    <p className="font-bold text-primary/40 uppercase tracking-widest text-xs">Cargando Centro de Pagos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Payment Gateway Center
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold tracking-widest uppercase text-[9px]">
                            Live Monitor
                        </Badge>
                    </h2>
                    <p className="text-sm font-medium text-slate-500">Conciliación avanzada, monitoreo de webhooks y analítica de pasarela</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={activeTab === 'monitor' ? 'default' : 'outline'} 
                        onClick={() => setActiveTab('monitor')}
                        className="rounded-xl font-bold h-10 px-5 transition-all shadow-sm"
                    >
                        Monitor
                    </Button>
                    <Button 
                        variant={activeTab === 'reconciliation' ? 'default' : 'outline'} 
                        onClick={() => setActiveTab('reconciliation')}
                        className="rounded-xl font-bold h-10 px-5 transition-all shadow-sm"
                    >
                        Conciliación {pendingTransactions.length > 0 && <Badge className="ml-2 bg-red-500 text-white border-0">{pendingTransactions.length}</Badge>}
                    </Button>
                    <Button 
                        variant={activeTab === 'settings' ? 'default' : 'outline'} 
                        onClick={() => setActiveTab('settings')}
                        className="rounded-xl font-bold h-10 px-5 transition-all shadow-sm"
                    >
                        Configuración
                    </Button>
                    <Button 
                        variant={activeTab === 'logs' ? 'default' : 'outline'} 
                        onClick={() => setActiveTab('logs')}
                        className="rounded-xl font-bold h-10 px-5 transition-all shadow-sm"
                    >
                        Logs Raw
                    </Button>
                </div>
            </header>

            {activeTab === "monitor" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Summary */}
                    <Card className="lg:col-span-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-black tracking-tight">Rendimiento Semanal</CardTitle>
                            <CardDescription>Volumen de recaudación procesado por Macro Click</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                        labelStyle={{fontWeight: 900, marginBottom: '5px'}}
                                    />
                                    <Area type="monotone" dataKey="monto" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorMonto)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stats Panel */}
                    <div className="space-y-4">
                        <Card className="border-emerald-100 bg-emerald-50/50 p-6 rounded-3xl group transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-emerald-100">
                                    <ShieldCheck className="text-emerald-600 size-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-600/70 tracking-widest">Tasa de Éxito</p>
                                    <h4 className="text-2xl font-black text-emerald-900 tracking-tighter">{stats.rate.toFixed(1)}%</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 bg-emerald-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{width: `${stats.rate}%`}} />
                                </div>
                                <ArrowUpRight className="size-4 text-emerald-600" />
                            </div>
                        </Card>

                        <Card className="border-blue-100 bg-blue-50/50 p-6 rounded-3xl group transition-all hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-blue-100">
                                    <TrendingUp className="text-blue-600 size-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-600/70 tracking-widest">Volumen Total</p>
                                    <h4 className="text-2xl font-black text-blue-900 tracking-tighter">${stats.totalVolume.toLocaleString("es-AR")}</h4>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-slate-100 p-6 rounded-3xl">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Estado Pasarela</h5>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Webhook Listener</span>
                                    <Badge className="bg-emerald-500 text-white border-0 font-bold">Activo</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">API Macro Click</span>
                                    <Badge className="bg-emerald-500 text-white border-0 font-bold">Online</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Certificados AES</span>
                                    <span className="text-[10px] font-black text-slate-400">Vence en 240 días</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Transactions List with specific Gateway Info */}
                    <Card className="lg:col-span-3 border-slate-100 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <CardTitle className="text-lg font-black tracking-tight">Actividad de Pasarela (Macro Click)</CardTitle>
                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por ID de pago o usuario..." 
                                    className="w-full bg-slate-50 border-0 rounded-xl pl-10 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Gateway</th>
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway Log</th>
                                        <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.slice(0, 10).map((tx) => (
                                        <tr key={tx.id} className="border-b border-slate-50/80 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-2">
                                                <p className="text-[11px] font-bold text-slate-900">{tx.timestamp.toDate().toLocaleTimeString()}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">{tx.timestamp.toDate().toLocaleDateString()}</p>
                                            </td>
                                            <td className="py-4 px-2">
                                                <p className="text-xs font-bold text-slate-800">{tx.userName || 'Usuario'}</p>
                                            </td>
                                            <td className="py-4 px-2">
                                                <Badge variant="outline" className="text-[10px] font-mono tracking-tight bg-slate-50">
                                                    {tx.externalReference || `MC_${tx.id.slice(0, 8)}`}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-2">
                                                <span className="text-sm font-black text-slate-900">${tx.amount.toLocaleString("es-AR")}</span>
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-[9px] font-black uppercase ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        CODE: {tx.gatewayResponseCode || (tx.status === 'completed' ? '00' : '99')}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-500 font-medium max-w-[120px] truncate">
                                                        {tx.gatewayMessage || (tx.status === 'completed' ? 'Aprobada' : 'No procesada')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2">
                                                <Badge className={`rounded-full font-bold px-3 py-1 ${
                                                    tx.status === 'completed' ? 'bg-emerald-500 text-white' :
                                                    tx.status === 'pending' ? 'bg-amber-500 text-white' :
                                                    tx.status === 'refunded' ? 'bg-slate-400 text-white' :
                                                    'bg-red-500 text-white'
                                                }`}>
                                                    {tx.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "reconciliation" && (
                <div className="space-y-6">
                    <Card className="border-red-100 bg-red-50/30 p-8 rounded-3xl border-dashed">
                        <div className="max-w-2xl">
                            <h3 className="text-xl font-black text-red-900 tracking-tight flex items-center gap-3">
                                <AlertCircle className="size-6 text-red-600" />
                                Conciliación de Transacciones Huérfanas
                            </h3>
                            <p className="text-sm font-medium text-red-700/70 mt-2">
                                Aquí se listan las transacciones que el usuario inició pero el Webhook del banco nunca reportó como finalizadas (Tiempo &gt; 10 min). Puedes forzar la verificación manual contra la API de Macro Click.
                            </p>
                        </div>
                    </Card>

                    {pendingTransactions.length === 0 ? (
                        <div className="py-20 text-center space-y-4 bg-white border border-slate-100 rounded-3xl">
                            <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500">
                                <CheckCircle2 className="size-10" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Todo Conciliado</h4>
                                <p className="text-sm font-medium text-slate-500">No hay transacciones pendientes de revisión en este momento.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingTransactions.map(tx => (
                                <Card key={tx.id} className="border-slate-100 p-6 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 text-xs font-black">
                                            PENDING
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-base font-black text-slate-800">${tx.amount.toLocaleString("es-AR")}</h4>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold">{tx.userName || 'Usuario'}</Badge>
                                            </div>
                                            <p className="text-xs font-medium text-slate-400">
                                                Iniciado: {tx.timestamp.toDate().toLocaleString()} • ID Int: {tx.id.slice(0, 10)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleForceSync(tx.id)}
                                        disabled={syncingId === tx.id}
                                        className="rounded-xl font-bold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 gap-2 h-11 px-6"
                                    >
                                        {syncingId === tx.id ? <RefreshCcw className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                                        Consultar Banco
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "settings" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-100 rounded-3xl p-6 bg-white shadow-sm">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                            <CreditCard className="size-4" /> Métodos Habilitados
                        </h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary">Macro Click</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Gateway Bancario</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enableMacroClick}
                                    onCheckedChange={(v: boolean) => handleToggleSetting("enableMacroClick", v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                                        <Banknote className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary">Puntos de Venta (Efectivo)</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Carga Presencial</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.enableCash}
                                    onCheckedChange={(v: boolean) => handleToggleSetting("enableCash", v)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-100 rounded-3xl p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Percent className="size-4" /> Promociones de Recarga
                            </h4>
                            <Switch
                                checked={settings.promotions.active}
                                onCheckedChange={(v: boolean) => {
                                    setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, active: v } }))
                                }}
                            />
                        </div>

                        <div className={`space-y-4 transition-all ${settings.promotions.active ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mínimo de Carga</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">$</span>
                                        <Input
                                            type="number"
                                            value={settings.promotions.minAmount}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, minAmount: parseFloat(e.target.value) } }))}
                                            className="pl-7 h-11 rounded-xl font-bold border-slate-100 bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">% Bonificación</Label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">%</span>
                                        <Input
                                            type="number"
                                            value={settings.promotions.bonusPercentage}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, promotions: { ...prev.promotions, bonusPercentage: parseFloat(e.target.value) } }))}
                                            className="pr-8 h-11 rounded-xl font-bold border-slate-100 bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handleUpdatePromotion}
                                className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 font-bold h-11 shadow-lg shadow-violet-200 transition-all active:scale-[0.98]"
                            >
                                Actualizar Promoción
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "logs" && (
                <div className="space-y-4">
                    <Card className="border-slate-100 rounded-3xl p-6 bg-slate-900">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                                    <SearchCode className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black tracking-tight">Raw Gateway Logs</h3>
                                    <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Nivel: Auditoría Técnica</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-white/10 text-white bg-transparent hover:bg-white/5 rounded-xl text-xs font-bold">Descargar Log JSON</Button>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 font-bold tracking-widest text-[9px] uppercase">Webhook_Success</Badge>
                                            <span className="text-[10px] text-white/30 font-mono">ID: 550e8400-e29b-41d4-a716-446655440000</span>
                                        </div>
                                        <span className="text-[10px] text-white/30 font-medium">hace {i * 12} min</span>
                                    </div>
                                    <pre className="text-[11px] font-mono text-white/70 bg-black/30 p-3 rounded-lg overflow-x-auto">
                                        {`{
  "event": "payment.success",
  "gateway": "macro_click",
  "amount": 1500.50,
  "currency": "ARS",
  "external_id": "TX_99228833",
  "customer": { "id": "USR_2233", "role": "user" }
}`}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
