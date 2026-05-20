"use client"

import { useState, useEffect, useMemo } from "react"
import { useAllUsers, useUpdateUser } from "@shared/api/admin-users"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Badge } from "@shared/ui/atoms/badge"
import { Label } from "@shared/ui/atoms/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shared/ui/atoms/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/ui/atoms/select"
import {
    Users,
    Search,
    Edit2,
    Shield,
    ShieldCheck,
    UserIcon,
    Wallet,
    AlertTriangle,
    Ban,
    CheckCircle,
    MoreHorizontal,
    Phone,
    Mail,
    Calendar,
    ArrowUpDown
} from "lucide-react"
import { useToast } from "@shared/ui/atoms/use-toast"
import type { User } from "@shared/types"

export function UsersManagement() {
    const { toast } = useToast()
    const { data: users = [], isLoading: loading } = useAllUsers()
    const updateUserMutation = useUpdateUser()
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")

    // Edit dialog
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editBalance, setEditBalance] = useState("")
    const [editRole, setEditRole] = useState<string>("")
    const [saving, setSaving] = useState(false)

    // Filter users when search or role changes
    useEffect(() => {
        let result = users

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(u =>
                u.name?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.phone?.includes(term)
            )
        }

        if (roleFilter !== "all") {
            result = result.filter(u => u.role === roleFilter)
        }

        setFilteredUsers(result)
    }, [users, searchTerm, roleFilter])

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setEditBalance((user.balance ?? 0).toString())
        setEditRole(user.role || "user")
        setIsEditOpen(true)
    }

    const handleSaveUser = async () => {
        if (!editingUser) return

        setSaving(true)
        try {
            await updateUserMutation.mutateAsync({
                userId: editingUser.id,
                data: {
                    balance: parseFloat(editBalance) || 0,
                    role: editRole as User["role"]
                }
            })

            toast({
                title: "Usuario Actualizado",
                description: `Los cambios para ${editingUser.name} se guardaron correctamente.`
            })
            setIsEditOpen(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el usuario.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleToggleBlock = async (user: User) => {
        try {
            await updateUserMutation.mutateAsync({
                userId: user.id,
                data: { blocked: !user.blocked }
            })
            toast({
                title: user.blocked ? "Usuario Desbloqueado" : "Usuario Bloqueado",
                description: `${user.name} ha sido ${user.blocked ? "desbloqueado" : "bloqueado"}.`
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo cambiar el estado del usuario.",
                variant: "destructive"
            })
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none text-[10px] font-bold px-2 py-0.5">Admin</Badge>
            case "inspector":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-bold px-2 py-0.5">Inspector</Badge>
            default:
                return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none text-[10px] font-bold px-2 py-0.5">Usuario</Badge>
        }
    }

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === "admin").length,
        inspectors: users.filter(u => u.role === "inspector").length,
        users: users.filter(u => u.role === "user").length,
        blocked: users.filter(u => u.blocked).length
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-sm w-1/4" />
                <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-slate-100 rounded-md" />)}
                </div>
                <div className="h-96 bg-slate-50 rounded-md" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h3>
                    <p className="text-sm text-slate-500 font-medium">Administra cuentas, roles y saldos de la plataforma</p>
                </div>
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold rounded-lg h-10 px-4 gap-2">
                    <UserIcon className="size-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Quick Stats Rows */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "TOTAL", value: stats.total, color: "text-slate-900" },
                    { label: "ADMINS", value: stats.admins, color: "text-violet-600" },
                    { label: "INSPECTORES", value: stats.inspectors, color: "text-blue-600" },
                    { label: "USUARIOS", value: stats.users, color: "text-slate-600" },
                    { label: "BLOQUEADOS", value: stats.blocked, color: "text-red-600" }
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                        <span className={`text-2xl font-black block tracking-tighter ${stat.color}`}>{stat.value}</span>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Table Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-slate-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 rounded-lg bg-white border-slate-200 text-sm focus:ring-1 focus:ring-slate-300"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full lg:w-48 h-10 rounded-lg bg-white border-slate-200 text-sm">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                            <SelectItem value="all">Todos los roles</SelectItem>
                            <SelectItem value="user">Usuarios</SelectItem>
                            <SelectItem value="inspector">Inspectores</SelectItem>
                            <SelectItem value="admin">Administradores</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        User <ArrowUpDown className="size-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Role
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Balance
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Status
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">
                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        Actions
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Users className="size-12" />
                                            <p className="font-bold text-sm">No users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`group hover:bg-slate-50/50 transition-colors ${user.blocked ? 'bg-red-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 ${user.role === 'admin' ? 'bg-violet-50 text-violet-500' : user.role === 'inspector' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'}`}>
                                                    {user.role === 'admin' ? <ShieldCheck className="size-5" /> : user.role === 'inspector' ? <Shield className="size-5" /> : <UserIcon className="size-5" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-900 truncate tracking-tight">{user.name || "Sin nombre"}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-2">
                                                        <Mail className="size-3 opacity-50" /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                                    ${user.balance?.toLocaleString("es-AR") || '0.00'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Credits</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.blocked ? (
                                                <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none text-[10px] font-bold px-2 py-0.5">Blocked</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[10px] font-bold px-2 py-0.5">Active</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditUser(user)}
                                                    className="size-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                >
                                                    <Edit2 className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleBlock(user)}
                                                    className={`size-8 rounded-lg ${user.blocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                                                >
                                                    {user.blocked ? <CheckCircle className="size-4" /> : <Ban className="size-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-slate-400">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-slate-200">Previous</Button>
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-[#f97316] text-white border-none hover:bg-orange-600 hover:text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-slate-200">Next</Button>
                    </div>
                </div>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
                    <div className="p-6 pb-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                Editar Usuario
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium text-slate-500">
                                {editingUser?.name} • {editingUser?.email}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Balance de Cuenta</Label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                                <Input
                                    type="number"
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    className="pl-8 h-12 rounded-lg text-xl font-black border-slate-200 focus:ring-1 focus:ring-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Rol asignado</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-12 rounded-lg border-slate-200 focus:ring-1 focus:ring-slate-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="user">
                                        <div className="flex items-center gap-2 font-medium">
                                            <div className="p-1 bg-slate-100 rounded">
                                                <UserIcon className="size-3 text-slate-500" />
                                            </div>
                                            <span>Usuario</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="inspector">
                                        <div className="flex items-center gap-2 font-medium">
                                            <div className="p-1 bg-blue-100 rounded">
                                                <Shield className="size-3 text-blue-500" />
                                            </div>
                                            <span>Inspector</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2 font-medium">
                                            <div className="p-1 bg-violet-100 rounded">
                                                <ShieldCheck className="size-3 text-violet-500" />
                                            </div>
                                            <span>Administrador</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
                            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-amber-800 leading-normal">
                                Los cambios de rol y saldo se aplican inmediatamente. Esta acción quedará registrada en los logs de auditoría.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            className="flex-1 h-11 rounded-lg font-bold text-slate-600 border-slate-200"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveUser}
                            disabled={saving}
                            className="flex-1 h-11 rounded-lg font-bold bg-[#f97316] hover:bg-orange-600 text-white border-none shadow-sm"
                        >
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
