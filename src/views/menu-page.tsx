"use client"

import { useAuth } from "@entities/auth-context"
import { useTranslations } from "next-intl"

type View = "home" | "vehicles" | "wallet" | "menu" | "fines" | "profile" | "history"

export function MenuPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (view: View) => void }) {
    const { user, logout } = useAuth()
    const t = useTranslations("menu")

    const menuItems = [
        { id: "profile", icon: "fi-sr-user", label: t("my_profile"), description: t("profile_desc") },
        { id: "vehicles", icon: "fi-sr-car-side", label: t("my_vehicles"), description: t("vehicles_desc") },
        { id: "wallet", icon: "fi-sr-wallet", label: t("wallet"), description: t("wallet_desc") },
        { id: "history", icon: "fi-sr-time-past", label: t("history"), description: t("history_desc") },
        { id: "fines", icon: "fi-sr-file-circle-exclamation", label: t("fines"), description: t("fines_desc") },
    ]

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text font-display overflow-hidden relative no-scrollbar">
            {/* Premium Header */}
            <header className="shrink-0 flex items-center bg-white px-6 py-5 z-20 border-b border-border/50">
                <button
                    onClick={onBack}
                    className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-2xl font-black">chevron_left</span>
                </button>
                <h1 className="text-xl font-black text-neutral-text flex-1 text-center pr-11 tracking-tighter">{t("title")}</h1>
            </header>

            <main className="flex-1 px-6 pb-24 space-y-10 overflow-y-auto no-scrollbar pt-8">
                {/* User Card - Premium Style */}
                <section>
                    <div className="flex items-center gap-5 p-6 rounded-[8px] bg-white shadow-sm border border-border">
                        <div
                            className="size-16 rounded-[6px] bg-neutral-bg bg-cover bg-center border border-border"
                            style={{
                                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC9dsmKv1OzepRPGsHR33Y9zEmTsVDTVAYPFEHnx9-_lAp4cu_o5XnsEcUa1_PcR6JuWP-I10-mnTOVI-_LUstFjQnjZx8vx_DImAPmO2M8UYSQahLMsK8a-bJnpqtwwSmTdsPpUli1zxrW0zQTKjhr0Nds_6skA6Ue6KASmZORmha5sTcvfsBTow8iyU5aNANKqx9EwmjQjRXPsuQaOI7GpTiq8bknrsIIawqWJqoksWrBBmOWL09WznZ4NxZft2XcqdD-ZEOvtHU")',
                            }}
                        />
                        <div className="flex-1">
                            <h2 className="text-lg font-black text-neutral-text tracking-tight uppercase leading-none mb-1">{t("user_display", { name: user?.name || t("user_name_placeholder") })}</h2>
                            <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest leading-none">{user?.email || t("user_email_placeholder")}</p>
                        </div>
                        <button
                            onClick={() => onNavigate("profile")}
                            className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text/40 hover:text-neutral-text transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">chevron_right</span>
                        </button>
                    </div>
                </section>

                {/* Main Navigation Items */}
                <section>
                    <h2 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-5 px-1">{t("management")}</h2>
                    <div className="space-y-3">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id as View)}
                                className="w-full flex items-center gap-5 p-6 rounded-[8px] bg-white shadow-sm border border-border hover:bg-neutral-bg/30 transition-all cursor-pointer group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-bg text-neutral-text/20 group-hover:text-primary-green group-hover:bg-primary-green/5 transition-all border border-border group-hover:border-primary-green/20">
                                    <span className="material-symbols-outlined text-2xl">
                                        {item.id === "profile" ? "person" : 
                                         item.id === "vehicles" ? "directions_car" :
                                         item.id === "wallet" ? "account_balance_wallet" :
                                         item.id === "history" ? "schedule" :
                                         item.id === "fines" ? "description" : "circle"}
                                    </span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-black text-neutral-text tracking-tight uppercase">{item.label}</p>
                                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{item.description}</p>
                                </div>
                                <span className="material-symbols-outlined text-neutral-text/10 group-hover:text-neutral-text transition-all">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Additional Settings */}
                <section>
                    <h2 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-5 px-1">{t("settings")}</h2>
                    <div className="space-y-3">
                        <button className="w-full flex items-center gap-5 p-6 rounded-[8px] bg-white shadow-sm border border-border hover:bg-neutral-bg/30 transition-all group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-bg text-neutral-text/20 group-hover:text-primary-green group-hover:bg-primary-green/5 transition-all border border-border group-hover:border-primary-green/20">
                                <span className="material-symbols-outlined text-2xl">settings</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("preferences")}</p>
                                <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{t("preferences_desc")}</p>
                            </div>
                            <span className="material-symbols-outlined text-neutral-text/10 group-hover:text-neutral-text transition-all">chevron_right</span>
                        </button>

                        <button className="w-full flex items-center gap-5 p-6 rounded-[8px] bg-white shadow-sm border border-border hover:bg-neutral-bg/30 transition-all group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-bg text-neutral-text/20 group-hover:text-primary-green group-hover:bg-primary-green/5 transition-all border border-border group-hover:border-primary-green/20">
                                <span className="material-symbols-outlined text-2xl">help_outline</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-neutral-text tracking-tight uppercase">{t("help_support")}</p>
                                <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-1">{t("help_support_desc")}</p>
                            </div>
                            <span className="material-symbols-outlined text-neutral-text/10 group-hover:text-neutral-text transition-all">chevron_right</span>
                        </button>
                    </div>
                </section>

                {/* Logout Button */}
                <section className="pt-4">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 p-6 rounded-[8px] bg-red-50 text-red-500 font-black uppercase text-[12px] tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        {t("logout", {}, { fallback: "Cerrar Sesión" })}
                    </button>
                </section>

                {/* App Version */}
                <footer className="text-center pt-8 pb-10">
                    <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] mb-2 leading-relaxed">{t("app_version")}</p>
                    <p className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest max-w-[200px] mx-auto opacity-50">{t("app_full_name")}</p>
                </footer>
            </main>
        </div>
    )
}
