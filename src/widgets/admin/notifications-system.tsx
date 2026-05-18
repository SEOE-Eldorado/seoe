"use client"

import { useState } from "react"
import { db } from "@shared/api/firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { useAuth } from "@entities/auth-context"
import { logAdminAction } from "@shared/lib/logging"
import { Card, CardContent } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { Textarea } from "@shared/ui/atoms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/atoms/select"
import { useToast } from "@shared/ui/atoms/use-toast"
import { Bell, Send, Users, Calendar, Megaphone, MapPin } from "lucide-react"
import { useSettings } from "@entities/settings-context"

export function NotificationsSystem() {
 const { user } = useAuth()
 const { zones } = useSettings()
 const { toast } = useToast()

 const [title, setTitle] = useState("")
 const [body, setBody] = useState("")
 const [targetType, setTargetType] = useState<"all" | "zone" | "debtors">("all")
 const [targetZone, setTargetZone] = useState("")
 const [sendAt, setSendAt] = useState("")
 const [priority, setPriority] = useState<"normal" | "high">("normal")
 const [sending, setSending] = useState(false)

 const handleSend = async () => {
 if (!title || !body) {
 toast({ title: "Error", description: "Completa el título y mensaje.", variant: "destructive" })
 return
 }

 if (targetType === "zone" && !targetZone) {
 toast({ title: "Error", description: "Selecciona una zona.", variant: "destructive" })
 return
 }

 setSending(true)
 try {
 const notificationData = {
 title,
 body,
 targetType,
 targetId: targetZone || null,
 priority,
 status: "pending",
 scheduledFor: sendAt ? Timestamp.fromDate(new Date(sendAt)) : Timestamp.now(),
 createdAt: Timestamp.now(),
 senderId: user?.id,
 senderName: user?.name
 }

 await addDoc(collection(db, "notifications_queue"), notificationData)

 // Log action
 if (user) {
 await logAdminAction(
 user.id,
 user.name || "Admin",
 "create_notification",
 `Creó notificación: ${title} (${targetType})`,
 undefined,
 { targetType, priority }
 )
 }

 toast({
 title: "Notificación Programada",
 description: sendAt ? `Se enviará el ${new Date(sendAt).toLocaleString()}` : "Se enviará en breve."
 })

 // Reset form
 setTitle("")
 setBody("")
 setSendAt("")
 setTargetType("all")
 setTargetZone("")
 } catch (error) {
 console.error("Error creating notification:", error)
 toast({ title: "Error", description: "No se pudo crear la notificación.", variant: "destructive" })
 } finally {
 setSending(false)
 }
 }

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-bold text-primary">Centro de Notificaciones</h3>
 <p className="text-xs font-medium text-accent">Envía alertas masivas o segmentadas a los usuarios</p>
 </div>
 <div className="size-12 rounded-sm bg-amber-500/10 flex items-center justify-center">
 <Megaphone className="size-6 text-amber-600" />
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Compose Card */}
 <Card className="lg:col-span-2 border border-slate-200 rounded-sm bg-white overflow-hidden">
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Título</Label>
 <Input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Ej: Mantenimiento Programado"
 className="h-12 rounded-sm text-lg font-bold"
 />
 </div>

 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Mensaje</Label>
 <Textarea
 value={body}
 onChange={(e) => setBody(e.target.value)}
 placeholder="Escribe el contenido de la notificación..."
 className="min-h-[150px] rounded-sm resize-none"
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Destinatarios</Label>
 <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
 <SelectTrigger className="h-12 rounded-sm">
 <div className="flex items-center gap-2">
 <Users className="size-4 text-slate-400" />
 <SelectValue />
 </div>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Todos los Usuarios</SelectItem>
 <SelectItem value="zone">Usuarios en Zona</SelectItem>
 <SelectItem value="debtors">Usuarios con Deuda</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {targetType === "zone" && (
 <div className="space-y-2 animate-in fade-in zoom-in-95">
 <Label className="text-[10px] font-black uppercase text-slate-400">Zona Objetivo</Label>
 <Select value={targetZone} onValueChange={setTargetZone}>
 <SelectTrigger className="h-12 rounded-sm">
 <div className="flex items-center gap-2">
 <MapPin className="size-4 text-slate-400" />
 <SelectValue placeholder="Seleccionar zona" />
 </div>
 </SelectTrigger>
 <SelectContent>
 {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 )}

 <div className="space-y-2">
 <Label className="text-[10px] font-black uppercase text-slate-400">Programar Envío (Opcional)</Label>
 <div className="relative">
 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
 <Input
 type="datetime-local"
 value={sendAt}
 onChange={(e) => setSendAt(e.target.value)}
 className="pl-11 h-12 rounded-sm"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
 <div className="flex-1">
 <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Prioridad</Label>
 <div className="flex gap-2">
 <button
 onClick={() => setPriority("normal")}
 className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all ${priority === "normal" ? "bg-slate-100 text-slate-700" : "bg-white border border-slate-100 text-slate-400"}`}
 >
 Normal
 </button>
 <button
 onClick={() => setPriority("high")}
 className={`flex-1 py-2 rounded-sm text-xs font-bold transition-all ${priority === "high" ? "bg-red-50 text-red-600 border border-red-100" : "bg-white border border-slate-100 text-slate-400"}`}
 >
 Alta
 </button>
 </div>
 </div>
 <Button
 onClick={handleSend}
 disabled={sending}
 className="h-14 px-8 rounded-sm font-black text-sm uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white"
 >
 {sending ? "Enviando..." : "Enviar Alerta"}
 {!sending && <Send className="size-4 ml-2" />}
 </Button>
 </div>
 </div>
 </Card>

 {/* Info / Preview */}
 <div className="space-y-4">
 <Card className="border border-slate-200 rounded-sm bg-white p-6">
 <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
 Vista Previa
 </h4>
 <div className="p-4 rounded-sm bg-slate-50 border border-slate-100 relative overflow-hidden">
 <div className="flex items-start gap-3 relative z-10">
 <div className="size-10 rounded-sm bg-white flex items-center justify-center shrink-0">
 <Bell className="size-5 text-primary" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-primary truncate leading-tight mb-1">{title || "Título de la notificación"}</p>
 <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{body || "Aquí se mostrará el cuerpo del mensaje que recibirán los usuarios en sus dispositivos."}</p>
 </div>
 <span className="text-[9px] text-slate-300 font-bold">Ahora</span>
 </div>
 </div>
 </Card>

 <Card className="border border-slate-200 rounded-sm bg-indigo-500 text-white p-6">
 <Megaphone className="size-8 mb-4 opacity-50" />
 <h4 className="text-xl font-black mb-1">Alcance Estimado</h4>
 <p className="text-xs text-white/70 font-medium mb-4">
 {targetType === "all" ? "Todos los usuarios registrados recibirán esta alerta." :
 targetType === "debtors" ? "Solo usuarios con saldo negativo recibirán esta alerta." :
 `Usuarios con vehículos estacionados en la zona seleccionada.`}
 </p>
 <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
 <div className="h-full bg-white w-3/4 rounded-full" />
 </div>
 </Card>
 </div>
 </div>
 </div>
 )
}
