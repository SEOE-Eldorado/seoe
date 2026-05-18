"use client"

import { useState } from "react"
import { useAuth } from "@entities/auth-context"
import { useVehicles } from "@entities/vehicles-context"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "@shared/i18n/language-switcher"

type View = "profile" | "vehicles"

interface ProfilePageProps {
  onBack: () => void
  onNavigate?: (view: string) => void
}

export function ProfilePage({ onBack, onNavigate }: ProfilePageProps) {
  const { user, logout, toggleAutoPayFines } = useAuth()
  const { vehicles } = useVehicles()
  const t = useTranslations("profile")
  const tMenu = useTranslations("menu")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text font-display overflow-hidden relative no-scrollbar">
            {/* Premium Header */}
            <div className="shrink-0 flex items-center bg-white px-6 py-5 border-b border-border/50 z-20">
                <button
                    onClick={onBack}
                    className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-2xl font-black">chevron_left</span>
                </button>
                <h2 className="text-xl font-black flex-1 text-center pr-11 tracking-tighter">{t("title")}</h2>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
                {/* Profile Hero Section */}
                <div className="flex flex-col items-center pt-10 pb-12 px-8 bg-white border-b border-border/30 shadow-sm relative overflow-hidden">
                     {/* Decorative Element */}
                    <div className="absolute -top-20 -right-20 size-64 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative group cursor-pointer z-10">
                        <div
                            className="aspect-square w-32 h-32 rounded-[10px] bg-cover bg-center border-4 border-white shadow-2xl transition-all transform group-hover:scale-105 group-active:scale-95 ring-1 ring-border"
                            style={{
                                backgroundImage:
                                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDi-WRApged--b90NYWCl6Ssd_ftzhhkkiJTz8uzc99wCTAiYgB5k2LHNPN3PU39HKzkzzIPk_PAlF63m_ZiEqq6IY2T7m5xuqNqR_PdrIoQbDB9UUeZVDp5PC2uq6DvDNB3KO-0-14x0PKpjz6zPJOJVvXnyHUPdh0Hv2hDjwEV4KhXfF-e9lcaYViMYBgUfKcYdvjNiUDmW9cD8t5xHk1ZkVkqHV_Xy3t_QgBJqXkQyfBd2-wsrlbxD4hH7ThffeIJ2GOAri5gww")',
                            }}
                        />
                        <div className="absolute -bottom-2 -right-2 bg-primary-green text-white rounded-2xl p-2.5 border-4 border-white flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-sm font-black">edit</span>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center z-10">
                        <h1 className="text-2xl font-black tracking-tight text-neutral-text">{user?.name || "Usuario"}</h1>
                        <div className="mt-4 inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-neutral-bg border border-border shadow-sm">
                            <span className="material-symbols-outlined text-primary-green text-lg font-black tracking-tight">account_balance_wallet</span>
                            <p className="text-neutral-text/60 font-black text-xs uppercase tracking-widest leading-none">
                                {t("balance_label", { balance: `$${user?.balance.toLocaleString("es-AR") || "0,00"}` })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="px-6 mt-10 space-y-10">
                    {/* Section: Datos Personales */}
                    <section>
                        <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-4 px-1">{t("personal_data")}</h3>
                        <div className="bg-white rounded-[8px] shadow-sm border border-border overflow-hidden">
                            {[
                                { icon: "person", label: t("full_name"), value: user?.name, id: "name" },
                                { icon: "mail", label: t("email"), value: user?.email, id: "email" },
                                { icon: "smartphone", label: t("phone"), value: user?.phone || "+54 9 11 1234 5678", id: "phone" }
                            ].map((item, idx, arr) => (
                                <div key={item.id} className={`flex items-center justify-between p-6 hover:bg-neutral-bg/30 transition-all cursor-pointer group ${idx !== arr.length - 1 ? 'border-b border-border/50' : ''}`}>
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border group-hover:border-primary-green/20 group-hover:bg-primary-green/5 transition-all">
                                            <span className="material-symbols-outlined text-neutral-text/20 group-hover:text-primary-green transition-all">{item.icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mb-1">{item.label}</span>
                                            <span className="text-sm font-black text-neutral-text tracking-tight ">{item.value || "No especificado"}</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-neutral-text/10 group-hover:text-neutral-text transition-all">chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Vehículos */}
                    <section>
                        <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-4 px-1">{tMenu("management")}</h3>
                        <div className="bg-white rounded-[8px] shadow-sm border border-border overflow-hidden">
                            <div
                                onClick={() => onNavigate && onNavigate("vehicles")}
                                className="flex items-center justify-between p-6 hover:bg-neutral-bg transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">directions_car</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("vehicles")}</span>
                                        <span className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">
                                            {t("vehicles_count", { count: vehicles.length })}
                                        </span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-neutral-text/10">chevron_right</span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Configuración */}
                    <section>
                        <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-4 px-1">{tMenu("settings")}</h3>
                        <div className="bg-white rounded-[8px] shadow-sm border border-border overflow-hidden">
                            {/* Language Selector */}
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">language</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("language")}</span>
                                        <span className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{t("language_desc")}</span>
                                    </div>
                                </div>
                                <LanguageSwitcher />
                            </div>

                            {/* Notificaciones */}
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">notifications_active</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("notifications")}</span>
                                        <span className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{t("notifications_desc")}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notificationsEnabled ? 'bg-primary-green' : 'bg-neutral-bg border-border/50'}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {/* Pago Automático */}
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">auto_awesome</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("auto_pay_fines")}</span>
                                        <span className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{t("auto_pay_desc")}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleAutoPayFines}
                                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user?.autoPayFines ? 'bg-primary-green' : 'bg-neutral-bg border-border/50'}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-200 ease-in-out ${user?.autoPayFines ? 'translate-x-6' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {/* Item: Seguridad */}
                            <div className="flex items-center justify-between p-6 hover:bg-neutral-bg transition-all cursor-pointer group">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">security</span>
                                    </div>
                                    <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("support")}</span>
                                </div>
                                <span className="material-symbols-outlined text-neutral-text/10">chevron_right</span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Soporte */}
                    <section>
                         <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-4 px-1">{t("support")}</h3>
                        <div className="bg-white rounded-[8px] shadow-sm border border-border overflow-hidden">
                             <div className="flex items-center justify-between p-6 border-b border-border/50 hover:bg-neutral-bg transition-all cursor-pointer">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center rounded-2xl bg-neutral-bg shrink-0 size-12 border border-border">
                                        <span className="material-symbols-outlined text-neutral-text/20">help</span>
                                    </div>
                                    <span className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("support_desc")}</span>
                                </div>
                                <span className="material-symbols-outlined text-neutral-text/10">chevron_right</span>
                            </div>
                        </div>
                    </section>

                    {/* Logout Button */}
                    <div className="pt-4 pb-12">
                        <button
                            onClick={() => {
                                if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
                                    logout()
                                }
                            }}
                            className="w-full bg-white border border-red-100 rounded-[7px] p-6 text-red-500 font-black text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <span className="material-symbols-outlined text-xl">power_settings_new</span>
                            {tMenu("logout")}
                        </button>
                        <p className="text-center text-[9px] font-black text-neutral-text/10 uppercase tracking-[0.4em] mt-8">SEO-E • Versión 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
