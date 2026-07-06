"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@shared/api/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { Store, Plus, Search, UserPlus, Loader2, Mail, Phone, DollarSign, CheckCircle2, XCircle, TrendingUp, Eye } from "lucide-react"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shared/ui/atoms/dialog"
import { Label } from "@shared/ui/atoms/label"
import { useToast } from "@shared/ui/atoms/use-toast"

interface Seller {
  id: string
  name: string
  email: string
  active: boolean
  balance: number
  createdAt?: string
  stats?: {
    todayAmount: number
    todayCount: number
  }
}

export function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [sellerDetail, setSellerDetail] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const { toast } = useToast()

  const [newSeller, setNewSeller] = useState({
    name: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "seller"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sellersData: Seller[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        sellersData.push({
          id: doc.id,
          name: data.name || "Sin nombre",
          email: data.email || "",
          active: data.active !== false,
          balance: data.balance || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        })
      })
      sellersData.sort((a, b) => a.name.localeCompare(b.name))
      setSellers(sellersData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newSeller.name || !newSeller.email || !newSeller.password) {
      toast({ title: "Campos requeridos", description: "Completá todos los campos", variant: "destructive" })
      return
    }

    setCreating(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/create-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSeller),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Error al crear vendedor")

      toast({ title: "Vendedor creado", description: data.message })
      setIsCreateOpen(false)
      setNewSeller({ name: "", email: "", password: "" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (seller: Seller) => {
    try {
      await updateDoc(doc(db, "users", seller.id), {
        active: !seller.active,
      })
      toast({
        title: seller.active ? "Vendedor desactivado" : "Vendedor activado",
        description: `${seller.name} ${seller.active ? "ya no puede operar" : "ahora puede operar"}`,
      })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const viewDetail = async (seller: Seller) => {
    setSelectedSeller(seller)
    setShowDetail(true)
    setSellerDetail(null)

    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/admin/sellers/stats?sellerId=${seller.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setSellerDetail(data)
    } catch {
      // Silently fail, show basic info
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando vendedores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="size-5 text-emerald-500" />
            Gestión de Vendedores
          </h3>
          <p className="text-sm text-slate-500 font-medium">Puntos de venta y cargas de saldo presenciales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Buscar vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-slate-200 rounded-lg bg-white shadow-sm"
            />
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm gap-2"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Nuevo Vendedor</span>
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Store className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-xl font-black text-slate-900">{sellers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activos</p>
              <p className="text-xl font-black text-slate-900">{sellers.filter(s => s.active).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
              <XCircle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inactivos</p>
              <p className="text-xl font-black text-slate-900">{sellers.filter(s => !s.active).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendedor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Store className="size-10" />
                      <p className="font-bold text-sm">No se encontraron vendedores</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center border ${seller.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          <Store className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{seller.name}</span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <Mail className="size-3 opacity-50" /> {seller.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={`border-none font-black text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                        seller.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {seller.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetail(seller)}
                          className="h-9 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold gap-2 rounded-lg"
                        >
                          <Eye className="size-4" />
                          Detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(seller)}
                          className={`h-9 px-3 font-bold gap-2 rounded-lg ${
                            seller.active
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {seller.active ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                          {seller.active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Seller Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <UserPlus className="size-5 text-emerald-600" />
                Nuevo Vendedor
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                Crear una cuenta de vendedor para carga de saldo y estacionamiento
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</Label>
              <Input
                value={newSeller.name}
                onChange={e => setNewSeller({...newSeller, name: e.target.value})}
                placeholder="Ej: Roberto Gomez"
                className="h-10 border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</Label>
              <Input
                type="email"
                value={newSeller.email}
                onChange={e => setNewSeller({...newSeller, email: e.target.value})}
                placeholder="vendedor@seoe.com"
                className="h-10 border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contraseña</Label>
              <Input
                type="password"
                value={newSeller.password}
                onChange={e => setNewSeller({...newSeller, password: e.target.value})}
                placeholder="Min. 6 caracteres"
                className="h-10 border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-lg h-10 font-bold"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 font-bold shadow-sm"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Crear Vendedor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
