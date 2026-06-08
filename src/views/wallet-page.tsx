"use client"

import { useAuth } from "@entities/auth-context"
import { BalanceRechargeDialog } from "@widgets/dialogs/balance-recharge-dialog"
import { TransactionHistory } from "@widgets/transaction-history"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function WalletPage() {
    const router = useRouter()
    const { user, toggleAutoPayFines } = useAuth()
    const [showRechargeDialog, setShowRechargeDialog] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text overflow-hidden relative font-display">
            {/* Premium Header */}
            <header className="shrink-0 flex items-center bg-white px-6 py-5 z-10 border-b border-border/50">
                <button
                    onClick={() => router.back()}
                    className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-black flex-1 text-center pr-11 tracking-tight">Mi Billetera</h1>
            </header>

            <main className="flex-1 px-6 pb-24 space-y-8 overflow-y-auto pt-6 no-scrollbar">
                {/* Balance Card - Matching Premium Banking Style */}
                <div className="bg-white rounded-[10px] p-8 flex flex-col items-center justify-center shadow-lg relative overflow-hidden border border-border">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <span className="material-symbols-outlined text-[140px] text-neutral-text">account_balance_wallet</span>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-1 mb-8">
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-neutral-text/30">SALDO DISPONIBLE</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-neutral-text/20">$</span>
                            <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                                {user?.balance.toLocaleString("es-AR") || "0"}
                                <span className="text-2xl font-bold opacity-30">,00</span>
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 w-full flex gap-3">
                        <button
                            onClick={() => setShowRechargeDialog(true)}
                            className="flex-1 bg-primary-green hover:brightness-110 text-white px-6 py-4.5 rounded-[6px] text-sm font-black transition-all active:scale-[0.98] shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-2 tracking-tight uppercase"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            CARGAR SALDO
                        </button>
                    </div>
                </div>

                {/* Grid Actions - Large 2x1 Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex flex-col items-start justify-between p-6 rounded-[8px] h-36 transition-all active:scale-[0.98] border border-border shell shadow-sm ${showHistory ? 'bg-primary-green text-white border-primary-green/20' : 'bg-white text-neutral-text'}`}
                    >
                        <div className={`size-12 rounded-full flex items-center justify-center ${showHistory ? 'bg-white/20' : 'bg-neutral-bg text-neutral-text/50'}`}>
                            <span className="material-symbols-outlined text-2xl">history</span>
                        </div>
                        <span className="text-sm font-black tracking-tight uppercase">Actividad</span>
                    </button>
                    <button className="bg-white flex flex-col items-start justify-between p-6 rounded-[8px] h-36 border border-border shadow-sm active:scale-[0.98] transition-all">
                        <div className="size-12 rounded-full bg-neutral-bg flex items-center justify-center text-neutral-text/50">
                            <span className="material-symbols-outlined text-2xl">credit_card</span>
                        </div>
                        <span className="text-sm font-black tracking-tight uppercase">Tarjetas</span>
                    </button>
                </div>

                {/* Auto-pay Card - Premium Settings Widget */}
                <div className="bg-white rounded-[8px] p-6 border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[5px] bg-yellow-400/10 text-yellow-600">
                                <span className="material-symbols-outlined text-3xl font-black">bolt</span>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[13px] font-black text-neutral-text uppercase tracking-tight">Pago automático</p>
                                <p className="text-[10px] text-neutral-text/40 font-bold uppercase tracking-widest mt-0.5">Multas e infracciones</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={user?.autoPayFines || false}
                                onChange={toggleAutoPayFines}
                                className="sr-only peer"
                            />
                            <div className="w-13 h-7.5 bg-neutral-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4.5px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-primary-green transition-all"></div>
                        </label>
                    </div>
                </div>

                {/* Transaction History Section if expanded */}
                {showHistory && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <TransactionHistory />
                    </div>
                )}

                {/* Help Section */}
                <div className="flex items-center justify-between p-2 pt-4">
                    <p className="text-[10px] text-neutral-text/20 font-black uppercase tracking-[0.2em]">¿Necesitás ayuda?</p>
                    <button className="text-[10px] text-primary-green font-black underline decoration-2 underline-offset-4 uppercase tracking-widest hover:text-emerald-700 transition-colors">SOPORTE 24/7</button>
                </div>
            </main>

            <BalanceRechargeDialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog} />
        </div>
    )
}
