"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { CheckCircle2, XCircle, Car } from "lucide-react"

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const status = searchParams.get("status")
    const paymentId = searchParams.get("payment_id")
    const type = searchParams.get("type")
    const [countdown, setCountdown] = useState(5)

    const isSuccess = status === "success"
    const isGuestParking = type === "guest_parking"

    // Fetch parking details from payment if guest
    const [parkingInfo, setParkingInfo] = useState<{
        plate?: string
        zone?: string
        hours?: number
        cost?: number
    } | null>(null)

    useEffect(() => {
        if (!isGuestParking || !isSuccess || !paymentId) return

        const fetchPayment = async () => {
            try {
                const { doc, getDoc } = await import("firebase/firestore")
                const { db } = await import("@shared/api/firebase")
                const paymentSnap = await getDoc(doc(db, "payments", paymentId))
                if (paymentSnap.exists()) {
                    const data = paymentSnap.data()
                    if (data.guestParkingData) {
                        setParkingInfo({
                            plate: data.guestParkingData.plate,
                            zone: data.guestParkingData.zone,
                            hours: data.guestParkingData.hours,
                            cost: data.amount,
                        })
                    }
                }
            } catch (e) {
                console.error("Error fetching payment details:", e)
            }
        }

        fetchPayment()
    }, [isGuestParking, isSuccess, paymentId])

    useEffect(() => {
        if (countdown === 0) {
            const destination = isGuestParking ? (isSuccess ? "/iniciar" : "/iniciar?canceled=true") : "/"
            router.push(destination)
        }
    }, [countdown, router, isGuestParking, isSuccess])

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        {isSuccess ? (
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        ) : (
                            <XCircle className="h-16 w-16 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {isSuccess
                            ? isGuestParking
                                ? "¡Estacionamiento Iniciado!"
                                : "¡Pago Exitoso!"
                            : "Pago Cancelado o Fallido"}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? isGuestParking
                                ? "Tu estacionamiento ya está activo."
                                : "Tu saldo ha sido acreditado correctamente."
                            : "La operación no pudo completarse."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isSuccess && isGuestParking && parkingInfo && (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-200 space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <Car className="size-5 text-green-600" />
                                <span className="font-black text-lg text-green-800 tracking-wider">
                                    {parkingInfo.plate}
                                </span>
                            </div>
                            <div className="text-sm text-green-700 space-y-1">
                                <p><span className="font-medium">Zona:</span> {parkingInfo.zone}</p>
                                <p><span className="font-medium">Duración:</span> {parkingInfo.hours}h</p>
                                <p><span className="font-medium">Abonado:</span> ${parkingInfo.cost?.toLocaleString("es-AR")}</p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Serás redirigido{isGuestParking ? " al inicio" : " al inicio"} en {countdown} segundos...
                    </p>
                    <Button
                        onClick={() => router.push(isGuestParking ? (isSuccess ? "/iniciar" : "/iniciar?canceled=true") : "/")}
                        className="w-full"
                    >
                        {isGuestParking ? "Volver a Inicio" : "Volver al Inicio"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
