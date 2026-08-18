"use client"

import { useState, useCallback } from "react"
import { useFines } from "@entities/fines-context"
import { useAuth } from "@entities/auth-context"
import { useSettings } from "@entities/settings-context"
import { Button } from "@shared/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/atoms/card"
import { Label } from "@shared/ui/atoms/label"
import { RadioGroup, RadioGroupItem } from "@shared/ui/atoms/radio-group"
import { AlertCircle, CheckCircle2, Loader2, Printer, ArrowRight } from "lucide-react"
import { printFineTicket } from "@shared/lib/sunmi-printer"

interface FineIssuerProps {
    plate: string
    onSuccess: () => void
    onCancel: () => void
}

// Montos por defecto — usados si el admin no configuró `settings.fineAmounts`
const DEFAULT_FINE_TYPES = [
    { id: "no_payment", label: "Sin Estacionamiento", description: "Vehículo estacionado sin sesión activa." },
    { id: "expired_meter", label: "Tiempo Expirado", description: "La sesión de estacionamiento ha caducado." },
    { id: "wrong_zone", label: "Zona Incorrecta", description: "Estacionado en una zona no habilitada o diferente." },
]

// Generate a short unique acta number
let lastActaNumber = Math.floor(Date.now() / 1000) % 100000
function generateActaNumber(inspectorId?: string): string {
  lastActaNumber++
  const prefix = inspectorId ? inspectorId.slice(-4).toUpperCase() : "SEOE"
  const suffix = String(lastActaNumber).padStart(5, "0")
  return `${prefix}-${suffix}`
}

export function FineIssuer({ plate, onSuccess, onCancel }: FineIssuerProps) {
    const { issueFine } = useFines()
    const { user } = useAuth()
    const { settings } = useSettings()

    // Montos configurables desde el admin (con fallback a defaults)
    const fineAmounts = {
        no_payment: settings?.fineAmounts?.no_payment ?? 12000,
        expired_meter: settings?.fineAmounts?.expired_meter ?? 8000,
        wrong_zone: settings?.fineAmounts?.wrong_zone ?? 10000,
    }
    const FINE_TYPES = [
        { id: "no_payment", label: "Sin Estacionamiento", amount: fineAmounts.no_payment, description: "Vehículo estacionado sin sesión activa." },
        { id: "expired_meter", label: "Tiempo Expirado", amount: fineAmounts.expired_meter, description: "La sesión de estacionamiento ha caducado." },
        { id: "wrong_zone", label: "Zona Incorrecta", amount: fineAmounts.wrong_zone, description: "Estacionado en una zona no habilitada o diferente." },
    ]

    const [selectedType, setSelectedType] = useState(FINE_TYPES[0].id)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"form" | "confirm" | "success">("form")
    const [lastActaNumber, setLastActaNumber] = useState("")
    const [lastFineAmount, setLastFineAmount] = useState(0)

    const isNativeApp = typeof window !== 'undefined' && typeof (window as any).Capacitor !== 'undefined'
    const isSunmi = isNativeApp

    const doPrint = useCallback((actaNumber: string, amount: number) => {
        const typeInfo = FINE_TYPES.find(t => t.id === selectedType)!
        const dateStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://inspectores.eldorado.gob.ar'
        const qrData = `${baseUrl}/payment?plate=${encodeURIComponent(plate)}&amount=${amount}`

        printFineTicket({
            plate,
            type: typeInfo.label,
            amount,
            location: "Ubicación detectada (GPS)",
            date: dateStr,
            inspectorName: user?.name || undefined,
            actaNumber,
            qrData,
        })
    }, [plate, selectedType, user?.name])

    const handleIssue = async () => {
        setLoading(true)
        const typeInfo = FINE_TYPES.find(t => t.id === selectedType)!

        try {
            let targetUserId = "unlinked"

            try {
                const { db } = await import("@shared/api/firebase")
                const { collection, query, where, getDocs } = await import("firebase/firestore")

                const cleanPlate = plate.toUpperCase().replace(/\s/g, "")
                const vehiclesQuery = query(
                    collection(db, "vehicles"),
                    where("licensePlate", "==", cleanPlate)
                )
                const snapshot = await getDocs(vehiclesQuery)

                if (!snapshot.empty) {
                    targetUserId = snapshot.docs[0].data().userId
                }
            } catch (e) {
                console.warn("Could not resolve userId for plate:", plate, e)
            }

            await issueFine({
                vehiclePlate: plate,
                type: selectedType as any,
                amount: typeInfo.amount,
                description: typeInfo.description,
                location: "Ubicación detectada (GPS)",
                zone: "Zona detectada",
                userId: targetUserId,
            })

            // Generate acta number
            const actaNumber = generateActaNumber(user?.id)
            setLastActaNumber(actaNumber)
            setLastFineAmount(typeInfo.amount)
            setStep("success")

            // Auto-print on Sunmi devices
            if (isSunmi) {
                setTimeout(() => doPrint(actaNumber, typeInfo.amount), 500)
            }
        } catch (error) {
            console.error("Fine issue error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrintReceipt = () => {
        doPrint(lastActaNumber || generateActaNumber(user?.id), lastFineAmount || FINE_TYPES.find(t => t.id === selectedType)!.amount)
    }

    if (step === "success") {
        return (
            <Card className="border-success bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-500 rounded-sm">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-6">
                    <div className="size-20 rounded-full border-4 border-success/20 bg-success/10 flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="size-10 text-success" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Acta Registrada</h3>
                        {lastActaNumber && (
                            <p className="text-sm font-mono font-bold text-slate-600 mt-1">Nro: {lastActaNumber}</p>
                        )}
                        <p className="text-sm font-medium text-slate-500 mt-2">La infracción para <span className="font-bold text-slate-800 uppercase px-1">{plate}</span> ha sido procesada correctamente en la nube.</p>
                    </div>
                    
                    <div className="w-full space-y-3 mt-4">
                        {!isSunmi && (
                            <Button 
                                onClick={handlePrintReceipt}
                                className="w-full h-14 rounded-sm bg-neutral-900 hover:bg-neutral-800 text-white font-bold tracking-widest text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <Printer className="size-5" />
                                IMPRIMIR ACTA
                            </Button>
                        )}
                        {isSunmi && (
                            <Button 
                                onClick={handlePrintReceipt}
                                variant="outline"
                                className="w-full h-12 rounded-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Printer className="size-4" />
                                REIMPRIMIR ACTA
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            onClick={onSuccess}
                            className="w-full h-12 rounded-sm font-bold opacity-60 flex items-center justify-center gap-2 hover:bg-slate-100 uppercase text-slate-500"
                        >
                            Cerrar y Continuar <ArrowRight className="size-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-destructive/20 shadow-xl animate-in slide-in-from-bottom-5 duration-500">
            <CardHeader>
                <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertCircle className="size-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Nueva Infracción</span>
                </div>
                <CardTitle className="text-2xl">Emitir Multa</CardTitle>
                <CardDescription>
                    Vehículo: <span className="font-bold text-foreground">{plate}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="text-sm font-bold opacity-70">Tipo de Infracción</Label>
                    <RadioGroup value={selectedType} onValueChange={setSelectedType} className="grid gap-3">
                        {FINE_TYPES.map((type) => (
                            <label
                                key={type.id}
                                className={`flex items-center justify-between p-4 rounded-sm border-2 transition-all cursor-pointer ${selectedType === type.id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{type.label}</span>
                                        <span className="text-[10px] opacity-60 line-clamp-1">{type.description}</span>
                                    </div>
                                </div>
                                <span className="font-black text-sm text-primary">${type.amount.toLocaleString("es-AR")}</span>
                            </label>
                        ))}
                    </RadioGroup>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={handleIssue}
                        disabled={loading}
                        className="h-14 rounded-sm bg-destructive hover:bg-destructive/90 text-white font-bold text-lg shadow-lg shadow-destructive/20"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "CONFIRMAR MULTA"}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-12 rounded-sm font-bold opacity-60"
                    >
                        CANCELAR
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
