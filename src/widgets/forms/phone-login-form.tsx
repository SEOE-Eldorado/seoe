"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@entities/auth-context"
import { Button } from "@shared/ui/atoms/button"
import { Input } from "@shared/ui/atoms/input"
import { Label } from "@shared/ui/atoms/label"
import { Loader2 } from "lucide-react"
import { getDoc, doc, setDoc } from "firebase/firestore"
import { db } from "@shared/api/firebase"
import { useRouter } from "next/navigation"

interface PhoneLoginFormProps {
    onCancel: () => void
}

export function PhoneLoginForm({ onCancel }: PhoneLoginFormProps) {
    const { setupRecaptcha, startPhoneVerification, confirmPhoneVerification } = useAuth()
    const [phoneNumber, setPhoneNumber] = useState("")
    const [verificationCode, setVerificationCode] = useState("")
    const [step, setStep] = useState<"phone" | "code">("phone")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [codeSentAt, setCodeSentAt] = useState<Date | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Initialize reCAPTCHA on mount
        setupRecaptcha("recaptcha-container")
    }, [setupRecaptcha])

    // Countdown for resend cooldown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Format phone number - remove spaces and ensure E.164 format
        let formattedPhone = phoneNumber.trim().replace(/\s/g, "")
        if (!formattedPhone.startsWith("+")) {
            // Default to Argentina for this project if no code
            formattedPhone = "+54" + formattedPhone
        }

        try {
            await startPhoneVerification(formattedPhone)
            setStep("code")
            setCodeSentAt(new Date())
            setResendCooldown(60) // 60 second cooldown before resend
            setVerificationCode("") // Clear any previous code
        } catch (err: any) {
            console.error("Phone verification error:", err)
            if (err.code === "auth/too-many-requests") {
                setError("Demasiados intentos. Espera unos minutos antes de intentar de nuevo.")
            } else if (err.code === "auth/invalid-phone-number") {
                setError("Número de teléfono inválido. Usa el formato +54 9 11 1234 5678")
            } else {
                setError(err.message || "Error al enviar código")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResendCode = async () => {
        if (resendCooldown > 0) return

        // Re-initialize recaptcha before resending
        setupRecaptcha("recaptcha-container")

        setLoading(true)
        setError(null)

        let formattedPhone = phoneNumber.trim().replace(/\s/g, "")
        if (!formattedPhone.startsWith("+")) {
            formattedPhone = "+54" + formattedPhone
        }

        try {
            await startPhoneVerification(formattedPhone)
            setCodeSentAt(new Date())
            setResendCooldown(60)
            setVerificationCode("")
            setError(null)
        } catch (err: any) {
            setError(err.message || "Error al reenviar código")
        } finally {
            setLoading(false)
        }
    }

    const handleChangeNumber = () => {
        setStep("phone")
        setVerificationCode("")
        setError(null)
        setCodeSentAt(null)
        // Re-initialize recaptcha
        setupRecaptcha("recaptcha-container")
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Check if code might be expired (5 min limit)
        if (codeSentAt) {
            const elapsed = (new Date().getTime() - codeSentAt.getTime()) / 1000 / 60
            if (elapsed > 5) {
                setError("El código ha expirado. Por favor solicita uno nuevo.")
                setLoading(false)
                return
            }
        }

        try {
            const user = await confirmPhoneVerification(verificationCode.trim())
            // Check if user has profile
            const userRef = doc(db, "users", user.uid)
            const docSnap = await getDoc(userRef)

            if (!docSnap.exists()) {
                // New user or missing profile -> Create default
                await setDoc(userRef, {
                    name: "Usuario Nuevo",
                    email: "",
                    phone: user.phoneNumber,
                    balance: 0,
                    autoPayFines: false,
                    role: "user",
                    createdAt: new Date()
                })
            }

            router.push("/dashboard")

        } catch (err: any) {
            console.error("Code verification error:", err)
            if (err.code === "auth/invalid-verification-code") {
                setError("Código incorrecto. Verifica que hayas ingresado los 6 dígitos correctamente.")
            } else if (err.code === "auth/code-expired") {
                setError("El código ha expirado. Solicita uno nuevo.")
            } else {
                setError(err.message || "Error al verificar código")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-neutral-bg font-display min-h-screen flex flex-col items-center justify-between p-8 text-neutral-text antialiased no-scrollbar pb-10 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div id="recaptcha-container"></div>

            <div className="w-full max-w-sm flex flex-col items-center z-10 pt-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-[28px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-6 border border-border relative">
                        <div className="absolute inset-2 bg-neutral-bg rounded-[20px]"></div>
                        <span className="material-symbols-outlined text-primary-green text-[2.5rem] relative z-10">
                            {step === "phone" ? "phone_iphone" : "vibration"}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-neutral-text mb-2 tracking-tighter">
                        {step === "phone" ? "Ingreso Rápido" : "Confirmación"}
                    </h1>
                    <p className="text-[10px] font-black text-neutral-text/20 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                        {step === "phone" 
                            ? "Usa tu número de celular para acceder sin contraseña" 
                            : `Ingresa el código enviado a +54 ${phoneNumber}`}
                    </p>
                </div>

                {step === "phone" ? (
                    <form onSubmit={handleSendCode} className="space-y-6 w-full">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="phone">Número de Celular</label>
                            <div className="relative group flex items-center">
                                <div className="absolute left-6 text-neutral-text/30 font-black text-lg tracking-tight z-10">
                                    +54
                                </div>
                                <input
                                    className="block w-full rounded-[24px] border border-border bg-white py-4 pl-16 pr-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                                    id="phone"
                                    placeholder="11 1234 5678"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-[20px] bg-red-50 border border-red-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || !phoneNumber}
                                className="w-full bg-primary-green text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                ) : (
                                    <>
                                        ENVIAR CÓDIGO
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-6 w-full">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="code">Código de Verificación</label>
                            <div className="relative group">
                                <input
                                    className="block w-full rounded-[24px] border border-border bg-white py-5 px-6 text-neutral-text font-black text-3xl text-center tracking-[0.5em] placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                                    id="code"
                                    placeholder="000000"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-[20px] bg-red-50 border border-red-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || verificationCode.length < 6}
                                className="w-full bg-primary-green text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                ) : (
                                    <>
                                        CONFIRMAR INGRESO
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">verified_user</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 text-center">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendCooldown > 0 || loading}
                                className="text-[10px] font-black text-neutral-text/40 hover:text-primary-green uppercase tracking-widest transition-colors disabled:opacity-30"
                            >
                                {resendCooldown > 0
                                    ? `Reenviar en ${resendCooldown}s`
                                    : "Reenviar código"}
                            </button>
                            <button
                                type="button"
                                onClick={handleChangeNumber}
                                className="text-[10px] font-black text-neutral-text/20 hover:text-neutral-text/40 uppercase tracking-widest transition-colors"
                            >
                                ¿Número equivocado? Cambiar
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="w-full text-center pb-4 z-10">
                <button
                    onClick={onCancel}
                    className="text-[10px] font-black text-neutral-text/20 hover:text-primary-green uppercase tracking-[0.2em] transition-colors"
                >
                    VOLVER ATRÁS
                </button>
            </div>
        </div>
    )
}

