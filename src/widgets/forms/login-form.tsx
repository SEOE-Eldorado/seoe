"use client"

import React, { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { useToast } from "@shared/lib/hooks/use-toast"
import { useTranslations } from "next-intl"

export function LoginForm({ onToggle, onForgotPassword }: { onToggle: () => void; onForgotPassword?: () => void }) {
    const { login } = useAuth()
    const { toast } = useToast()
    const t = useTranslations("auth")
    const tErr = useTranslations("errors")
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [isNotRegistered, setIsNotRegistered] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsNotRegistered(false)
        setLoading(true)

        try {
            await login(identifier, password)
            toast({
                title: t("login_success_title"),
                description: t("login_success_description"),
            })
        } catch (err: any) {
            console.error(err)
            const msg = err.message || tErr("generic")
            setError(msg)

            // Mostrar notificación de error
            toast({
                title: t("login_error_title"),
                description: msg,
                variant: "destructive",
            })

            if (msg.toLowerCase().includes("no está registrado") || msg.toLowerCase().includes("no tiene una cuenta")) {
                setIsNotRegistered(true)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-neutral-bg font-display min-h-screen flex flex-col items-center justify-between p-8 text-neutral-text antialiased no-scrollbar overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="w-full max-w-sm flex flex-col items-center flex-1 justify-center z-10">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-8 border border-border relative">
                         <div className="absolute inset-2 bg-neutral-bg rounded-[24px]"></div>
                        <span className="material-symbols-outlined text-primary-green text-5xl relative z-10">local_parking</span>
                    </div>
                    <h1 className="text-4xl font-black text-neutral-text mb-3 tracking-tighter">{t("welcome")}</h1>
                    <p className="text-[10px] font-black text-neutral-text/20 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                        {t("welcome_subtitle")}
                    </p>
                </div>

                <div className="w-full space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="identifier">{t("identifier")}</label>
                            <div className="relative group">
                                <input
                                    className="block w-full rounded-[24px] border border-border bg-white py-5 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                                    id="identifier"
                                    placeholder={t("identifier_placeholder")}
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-text/10 group-focus-within:text-primary-green transition-colors">
                                    <span className="material-symbols-outlined text-2xl font-black">person</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="password">{t("password")}</label>
                            <div className="relative group">
                                <input
                                    className="block w-full rounded-[24px] border border-border bg-white py-5 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                                    id="password"
                                    placeholder={t("password_placeholder")}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-text/10 group-focus-within:text-primary-green transition-colors">
                                    <span className="material-symbols-outlined text-2xl font-black">lock</span>
                                </div>
                            </div>
                            <div className="flex justify-end pr-2">
                                <button type="button" onClick={onForgotPassword} className="text-[10px] font-black text-neutral-text/30 hover:text-primary-green uppercase tracking-widest transition-colors">
                                    {t("forgot_password")}
                                </button>
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
                            {isNotRegistered ? (
                                <button
                                    type="button"
                                    onClick={onToggle}
                                    className="w-full bg-neutral-text text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                >
                                    {t("register_now")}
                                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">person_add</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-green text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                >
                                    {loading ? (
                                         <span className="material-symbols-outlined animate-spin">refresh</span>
                                    ) : (
                                        <>
                                            {t("login")}
                                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <div className="w-full text-center pb-8 z-10">
                <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">
                    {t("no_account")}
                    <button onClick={onToggle} className="text-primary-green ml-2 hover:underline underline-offset-4 decoration-2">
                        {t("sign_up")}
                    </button>
                </p>
            </div>
        </div>
    )
}
