"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@shared/lib/hooks/use-toast"

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
    const { toast } = useToast()
    const [method, setMethod] = useState<"email" | "phone">("phone")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simular envío
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setSuccess(true)
        setLoading(false)

        toast({
            title: "Instrucciones enviadas",
            description: `Se han enviado las instrucciones a tu ${method === "email" ? "email" : "teléfono"}.`,
        })

        // Mostrar mensaje de éxito
        setTimeout(() => {
            onBack()
        }, 3000)
    }

    if (success) {
        return (
            <div className="bg-neutral-bg font-display min-h-screen flex flex-col items-center justify-center p-8 text-neutral-text antialiased pb-10 relative overflow-hidden">
                {/* Background Accents */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="w-full max-w-sm flex flex-col items-center text-center z-10">
                    <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-8 border border-border relative">
                        <div className="absolute inset-2 bg-neutral-bg rounded-[24px]"></div>
                        <span className="material-symbols-outlined text-primary-green text-[3.5rem] relative z-10">task_alt</span>
                    </div>
                    <h2 className="text-3xl font-black text-neutral-text mb-4 tracking-tighter">¡Enviado!</h2>
                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] leading-relaxed mb-10 max-w-[240px]">
                        Hemos enviado las instrucciones para restablecer tu contraseña a{" "}
                        <span className="text-primary-green font-black">{method === "email" ? email : `+54 ${phone}`}</span>.
                    </p>
                    <button
                        onClick={onBack}
                        className="w-full bg-neutral-text text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        VOLVER AL INICIO
                        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-neutral-bg font-display min-h-screen flex flex-col items-center justify-between p-8 text-neutral-text antialiased no-scrollbar pb-10 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="w-full max-w-sm flex flex-col items-center z-10 pt-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-[28px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-6 border border-border relative">
                        <div className="absolute inset-2 bg-neutral-bg rounded-[20px]"></div>
                        <span className="material-symbols-outlined text-primary-green text-[2.5rem] relative z-10">lock_reset</span>
                    </div>
                    <h1 className="text-3xl font-black text-neutral-text mb-2 tracking-tighter">Recuperar</h1>
                    <p className="text-[10px] font-black text-neutral-text/20 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                        Ingresa tus datos para restablecer tu acceso.
                    </p>
                </div>

                <div className="w-full mb-10 p-1.5 bg-white rounded-[28px] border border-border flex shadow-sm">
                    <button
                        type="button"
                        onClick={() => setMethod("phone")}
                        className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${method === "phone"
                            ? "bg-neutral-bg text-neutral-text shadow-inner"
                            : "text-neutral-text/20 hover:text-neutral-text/40"
                            }`}
                    >
                        TELÉFONO
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod("email")}
                        className={`flex-1 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all ${method === "email"
                            ? "bg-neutral-bg text-neutral-text shadow-inner"
                            : "text-neutral-text/20 hover:text-neutral-text/40"
                            }`}
                    >
                        EMAIL
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 w-full">
                    {method === "email" ? (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="email">Email de recuperación</label>
                            <div className="relative group">
                                <input
                                    className="block w-full rounded-[24px] border border-border bg-white py-4 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                                    id="email"
                                    placeholder="tu@email.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
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
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-green text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <>
                                    ENVIAR INSTRUCCIONES
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="w-full text-center pb-4 z-10">
                <button
                    onClick={onBack}
                    className="text-[10px] font-black text-neutral-text/20 hover:text-primary-green uppercase tracking-[0.2em] transition-colors"
                >
                    VOLVER AL INICIO
                </button>
            </div>
        </div>
    )
}
