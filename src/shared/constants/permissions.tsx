import React from "react"
import { 
    LayoutDashboard, 
    Car, 
    Users, 
    FileText, 
    Shield, 
    FileBarChart, 
    Bell, 
    ShieldAlert, 
    Wallet, 
    AlertTriangle, 
    CalendarDays, 
    MapPin, 
    Settings,
    History,
    Store 
} from "lucide-react"

export const ADMIN_PERMISSIONS = [
    { id: "dashboard", label: "Dashboard Analítico", icon: <LayoutDashboard className="size-4" /> },
    { id: "control", label: "Control de Patentes", icon: <Car className="size-4" /> },
    { id: "users", label: "Gestión de Usuarios", icon: <Users className="size-4" /> },
    { id: "exemptions", label: "Exenciones y Frentistas", icon: <FileText className="size-4" /> },
    { id: "inspectors", label: "Gestión de Inspectores", icon: <Shield className="size-4" /> },
    { id: "reports", label: "Reportes y Estadísticas", icon: <FileBarChart className="size-4" /> },
    { id: "notifications", label: "Sistema de Notificaciones", icon: <Bell className="size-4" /> },
    { id: "audit", label: "Logs de Auditoría", icon: <ShieldAlert className="size-4" /> },
    { id: "payments", label: "Gateway & Pasarela de Pagos", icon: <Wallet className="size-4" /> },
    { id: "fines", label: "Manejo de Multas", icon: <AlertTriangle className="size-4" /> },
    { id: "special-days", label: "Días Especiales", icon: <CalendarDays className="size-4" /> },
    { id: "zones", label: "Zonas de Estacionamiento", icon: <MapPin className="size-4" /> },
    { id: "config", label: "Tarifas y Precios", icon: <Settings className="size-4" /> },
    { id: "history", label: "Historial", icon: <History className="size-4" /> },
    { id: "sellers", label: "Gestión de Vendedores", icon: <Store className="size-4" /> },
] as const;

export const SYSTEM_PERMISSIONS = ADMIN_PERMISSIONS;

export type Permission = {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export type PermissionId = typeof ADMIN_PERMISSIONS[number]["id"];
