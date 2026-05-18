"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { useToast } from "@shared/lib/hooks/use-toast"
import { PrimaryButton } from "@shared/ui/atoms/primary-button"
import { Input } from "@shared/ui/atoms/input"
import { Checkbox } from "@shared/ui/atoms/checkbox"
import { useTranslations } from "next-intl"

export function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const { register } = useAuth()
  const { toast } = useToast()
  const t = useTranslations("auth")
  const tErr = useTranslations("errors")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!acceptTerms) {
      setError(t("must_accept_terms"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("password_mismatch"))
      return
    }

    if (password.length < 8) {
      setError(t("password_too_short"))
      return
    }

    setLoading(true)

    try {
      await register(name, email, phone, password)
      toast({
        title: t("register_success_title"),
        description: t("register_success_description"),
      })
    } catch (err: any) {
      const msg = err.message || tErr("generic_register")
      setError(msg)
      toast({
        title: t("register_error_title"),
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="bg-neutral-bg font-display min-h-screen flex flex-col items-center justify-between p-8 text-neutral-text antialiased no-scrollbar pb-10 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <div className="w-full max-w-sm flex flex-col items-center z-10 pt-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white rounded-[28px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-6 border border-border relative">
             <div className="absolute inset-2 bg-neutral-bg rounded-[20px]"></div>
            <span className="material-symbols-outlined text-primary-green text-[2.5rem] relative z-10">person_add</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-text mb-2 tracking-tighter">{t("register_title")}</h1>
          <p className="text-[10px] font-black text-neutral-text/20 text-center uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
            {t("register_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {/* Name */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="name">{t("full_name")}</label>
            <div className="relative group">
              <input
                className="block w-full rounded-[24px] border border-border bg-white py-4 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                id="name"
                placeholder={t("full_name_placeholder")}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="email">{t("email")}</label>
            <div className="relative group">
              <input
                className="block w-full rounded-[24px] border border-border bg-white py-4 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                id="email"
                placeholder={t("email_placeholder")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="phone">{t("phone")}</label>
            <div className="relative group flex items-center">
              <div className="absolute left-6 text-neutral-text/30 font-black text-lg tracking-tight z-10">
                {t("phone_prefix")}
              </div>
              <input
                className="block w-full rounded-[24px] border border-border bg-white py-4 pl-16 pr-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                id="phone"
                placeholder={t("phone_placeholder")}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Grid */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="password">{t("password")}</label>
                <div className="relative group">
                <input
                    className="block w-full rounded-[24px] border border-border bg-white py-4 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                    id="password"
                    placeholder={t("password_placeholder")}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-text/20 hover:text-primary-green transition-colors"
                >
                    <span className="material-symbols-outlined text-[1.25rem]">
                    {showPassword ? "visibility_off" : "visibility"}
                    </span>
                </button>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1" htmlFor="confirm">{t("repeat_password")}</label>
                <div className="relative group">
                <input
                    className="block w-full rounded-[24px] border border-border bg-white py-4 px-6 text-neutral-text font-black text-lg placeholder:text-neutral-text/10 focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none shadow-sm"
                    id="confirm"
                    placeholder={t("password_placeholder")}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-4 px-2 py-2">
            <div className="relative flex items-center">
                <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="peer size-6 opacity-0 absolute cursor-pointer"
                />
                <div className="size-6 rounded-lg border-2 border-border bg-white peer-checked:bg-primary-green peer-checked:border-primary-green transition-all flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-white text-sm font-black scale-0 peer-checked:scale-100 transition-transform">check</span>
                </div>
            </div>
            <label htmlFor="terms" className="text-[10px] font-bold text-neutral-text/40 uppercase tracking-widest leading-relaxed cursor-pointer select-none">
              {t("accept_terms")}
            </label>
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
                disabled={loading}
                className="w-full bg-primary-green text-white py-6 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
            >
                {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                ) : (
                    <>
                        {t("register_button")}
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">person_add</span>
                    </>
                )}
            </button>
          </div>
        </form>
      </div>

      <div className="w-full text-center mt-12 pb-4 z-10">
          <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">
            {t("already_have_account")}
            <button onClick={onToggle} className="text-primary-green font-black ml-2 hover:underline underline-offset-4 decoration-2">
                {t("login_link")}
            </button>
          </p>
      </div>
    </div>
  )
}
