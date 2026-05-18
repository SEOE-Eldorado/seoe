"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/atoms/card"
import { Button } from "@shared/ui/atoms/button"
import { CheckCircle2, XCircle } from "lucide-react"

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const status = searchParams.get("status")
    const [countdown, setCountdown] = useState(5)

    const isSuccess = status === "success"

    useEffect(() => {
        if (countdown === 0) {
            router.push("/")
        }
    }, [countdown, router])

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
                        {isSuccess ? "¡Pago Exitoso!" : "Pago Cancelado o Fallido"}
                    </CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? "Tu saldo ha sido acreditado correctamente."
                            : "La operación no pudo completarse."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Serás redirigido al inicio en {countdown} segundos...
                    </p>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Volver al Inicio
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
