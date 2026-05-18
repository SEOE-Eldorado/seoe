import React, { useState, useEffect } from "react"
import { 
    Users, 
    Search, 
    ShieldCheck, 
    Mail, 
    Shield, 
    Plus,
    UserPlus,
    Key,
    ShieldAlert,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { db } from "@shared/api/firebase"
import { 
    collection, 
    query, 
    where, 
    doc, 
    updateDoc, 
    onSnapshot 
} from "firebase/firestore"
import { httpsCallable, getFunctions } from "firebase/functions"
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@shared/ui/atoms/dialog"
import { Label } from "@shared/ui/atoms/label"
import { Switch } from "@shared/ui/atoms/switch"
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import { useToast } from "@shared/ui/atoms/use-toast"
import { SYSTEM_PERMISSIONS, Permission } from "@shared/constants/permissions"

interface AdminUser {
    id: string
    name: string
    email: string
    role: "admin" | "inspector"
    permissions?: string[]
    createdAt?: any
}

export const AdminRolesManager: React.FC = () => {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [updating, setUpdating] = useState(false)
    const { toast } = useToast()

    // New Admin Form State
    const [newAdmin, setNewAdmin] = useState({
        name: "",
        email: "",
        password: "",
        role: "admin" as "admin" | "inspector"
    })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        const usersRef = collection(db, "users")
        const q = query(
            usersRef, 
            where("role", "in", ["admin", "inspector"])
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const adminsData: AdminUser[] = []
            snapshot.forEach(doc => {
                adminsData.push({ id: doc.id, ...doc.data() } as AdminUser)
            })
            // Client-side sort
            adminsData.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            setAdmins(adminsData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const filteredAdmins = admins.filter(a => 
        (a.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleTogglePermission = async (permissionId: string) => {
        if (!selectedAdmin) return
        
        const currentPermissions = selectedAdmin.permissions || []
        const newPermissions = currentPermissions.includes(permissionId)
            ? currentPermissions.filter(id => id !== permissionId)
            : [...currentPermissions, permissionId]

        try {
            setUpdating(true)
            const userRef = doc(db, "users", selectedAdmin.id)
            await updateDoc(userRef, {
                permissions: newPermissions
            })
            
            // Local update for immediate UI feedback 
            setSelectedAdmin({
                ...selectedAdmin,
                permissions: newPermissions
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron actualizar los permisos.",
                variant: "destructive"
            })
        } finally {
            setUpdating(false)
        }
    }

    const handleCreateAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            toast({
                title: "Campos requeridos",
                description: "Por favor completa todos los campos.",
                variant: "destructive"
            })
            return
        }

        try {
            setCreating(true)
            // 1. Create User via Cloud Function
            const functions = getFunctions()
            const createAdminUserFn = httpsCallable(functions, 'createAdminUserV1');
            const result = await createAdminUserFn(newAdmin)

            toast({
                title: "Administrador Creado",
                description: `Se ha creado la cuenta para ${newAdmin.name}.`
            })
            setIsCreateOpen(false)
            setNewAdmin({ name: "", email: "", password: "", role: "admin" })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo crear el usuario.",
                variant: "destructive"
            })
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="size-8 text-[#f97316] animate-spin" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando personal administrativo...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldAlert className="size-5 text-violet-500" />
                        Roles y Permisos Dinámicos
                    </h3>
                    <p className="text-sm text-slate-500 font-medium italic">Controla exactamente qué puede ver cada administrador</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar administrador..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 border-slate-200 rounded-lg bg-white shadow-sm"
                        />
                    </div>
                    <Button 
                        onClick={() => setIsCreateOpen(true)}
                        className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-sm gap-2"
                    >
                        <UserPlus className="size-4" />
                        <span className="hidden sm:inline">Nuevo Administrador</span>
                    </Button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Colaborador</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Rol</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Accesos</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <ShieldAlert className="size-10" />
                                            <p className="font-bold text-sm">No se encontraron administradores</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-lg flex items-center justify-center border ${admin.role === 'admin' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {admin.role === 'admin' ? <ShieldCheck className="size-5" /> : <Shield className="size-5" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{admin.name || "Sin nombre"}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                                        <Mail className="size-3 opacity-50" /> {admin.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={`border-none font-black text-[10px] px-2 py-0.5 uppercase tracking-wider ${admin.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {admin.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                {!admin.permissions || admin.permissions.length === 0 ? (
                                                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50/50">
                                                        SUPER ADMIN (TOTAL)
                                                    </Badge>
                                                ) : (
                                                    admin.permissions.map(pId => (
                                                        <Badge key={pId} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none px-1.5 py-0">
                                                            {pId}
                                                        </Badge>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAdmin(admin)
                                                    setIsPermissionsOpen(true)
                                                }}
                                                className="h-9 px-3 text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-bold gap-2 rounded-lg"
                                            >
                                                <Key className="size-4" />
                                                Permisos
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <UserPlus className="size-5 text-violet-600" />
                                Nuevo Administrador
                            </DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Crea una nueva cuenta corporativa para el sistema
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</Label>
                            <Input 
                                value={newAdmin.name}
                                onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                                placeholder="Ej: Roberto Gomez"
                                className="h-10 border-slate-200 rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Corporativo</Label>
                            <Input 
                                type="email"
                                value={newAdmin.email}
                                onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                                placeholder="admin@seoe.com"
                                className="h-10 border-slate-200 rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contraseña Temporal</Label>
                            <Input 
                                type="password"
                                value={newAdmin.password}
                                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                                placeholder="Min. 6 caracteres"
                                className="h-10 border-slate-200 rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rol de Sistema</Label>
                            <Select value={newAdmin.role} onValueChange={(v: any) => setNewAdmin({...newAdmin, role: v})}>
                                <SelectTrigger className="h-10 border-slate-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="inspector">Inspector</SelectItem>
                                </SelectContent>
                            </Select>
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
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-10 font-bold shadow-sm"
                            onClick={handleCreateAdmin}
                            disabled={creating}
                        >
                            {creating ? <Loader2 className="size-4 animate-spin" /> : "Crear Cuenta"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Permissions Control Dialog */}
            <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <Key className="size-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-slate-900 leading-tight">Control de Accesos</p>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{selectedAdmin?.name}</p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                            {SYSTEM_PERMISSIONS.map((permission) => (
                                <div 
                                    key={permission.id}
                                    className={`p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                        selectedAdmin?.permissions?.includes(permission.id) 
                                        ? 'bg-violet-50 border-violet-200' 
                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                    }`}
                                    onClick={() => !updating && handleTogglePermission(permission.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            selectedAdmin?.permissions?.includes(permission.id) 
                                            ? 'bg-white text-violet-600 shadow-sm' 
                                            : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600'
                                        }`}>
                                            {permission.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{permission.label}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Módulo: {permission.id}</p>
                                        </div>
                                    </div>
                                    <Switch 
                                        checked={selectedAdmin?.permissions?.includes(permission.id)}
                                        onCheckedChange={() => handleTogglePermission(permission.id)}
                                        disabled={updating}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500">
                            {updating ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Sincronizando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Listo</span>
                                </>
                            )}
                        </div>
                        <Button 
                            className="bg-slate-900 text-white px-8 rounded-lg font-bold h-10"
                            onClick={() => setIsPermissionsOpen(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
