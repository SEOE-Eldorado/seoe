"use client"

import { useState } from "react"
import { useFines } from "@entities/fines-context"
import { useAuth } from "@entities/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/atoms/alert-dialog"
import { useHaptic } from "@shared/lib/hooks/use-haptic"

interface FinesPageProps {
  onBack: () => void
}

export function FinesPage({ onBack }: FinesPageProps) {
  const { fines, payFine, getPendingFines, getTotalPendingAmount } = useFines()
  const { user } = useAuth()
  const { trigger: haptic } = useHaptic()
  const [fineToPayId, setFineToPayId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const pendingFines = getPendingFines()
  const paidFines = fines.filter((f) => f.status === "paid")
  const totalPending = getTotalPendingAmount()
  const fineToPay = fines.find((f) => f.id === fineToPayId)

  const handlePay = () => {
    if (!fineToPay) return

    haptic("medium")
    setError("")

    try {
      payFine(fineToPay.id)
      haptic("success")
      setFineToPayId(null)
    } catch (err) {
      haptic("error")
      setError(err instanceof Error ? err.message : "Error al pagar la multa")
    }
  }

  const getFineTypeLabel = (type?: string) => {
    if (!type) return "Infracción"
    const labels = {
      overtime: "Exceso de tiempo",
      no_payment: "Sin pago",
      wrong_zone: "Zona incorrecta",
      expired_meter: "Parquímetro vencido",
    }
    return labels[type as keyof typeof labels] || type
  }

    return (
        <div className="flex h-dvh w-full flex-col bg-neutral-bg text-neutral-text font-display overflow-hidden relative no-scrollbar">
            {/* Premium Header */}
            <header className="shrink-0 flex items-center bg-white px-6 py-5 z-10 border-b border-border/50">
                <button
                    onClick={() => {
                        haptic("light")
                        onBack()
                    }}
                    className="flex size-11 items-center justify-center rounded-full bg-neutral-bg text-neutral-text hover:bg-neutral-bg/80 active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-black flex-1 text-center pr-11 tracking-tight">Infracciones</h1>
            </header>

            <main className="flex-1 px-6 pt-6 pb-24 space-y-8 overflow-y-auto no-scrollbar">
                {/* Summary Card - Urgent Message */}
                {pendingFines.length > 0 ? (
                    <div className="bg-white rounded-[10px] p-8 border border-red-100 shadow-xl shadow-red-900/5 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 pointer-events-none">
                            <span className="material-symbols-outlined text-[160px] text-red-600">report_problem</span>
                        </div>

                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-red-600/50 uppercase tracking-[0.2em] mb-2">Multas Pendientes</p>
                                <h2 className="text-4xl font-black text-neutral-text tracking-tighter">
                                    {pendingFines.length} <span className="text-base font-bold text-neutral-text/20 uppercase tracking-widest ml-1">Total</span>
                                </h2>
                            </div>
                            <div className="size-14 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
                                <span className="material-symbols-outlined text-2xl font-black">gavel</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-red-50/50 space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-neutral-text/20">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                    <span className="text-xs font-black uppercase tracking-tight">Total a regularizar:</span>
                                </div>
                                <span className="text-2xl font-black text-red-600 tracking-tighter tabular-nums">
                                    ${totalPending.toLocaleString("es-AR")}
                                </span>
                            </div>

                            {user?.autoPayFines && (
                                <div className="flex items-center gap-3 text-[10px] font-black text-primary-green uppercase bg-primary-green/5 p-4 rounded-[5px] tracking-tight">
                                    <span className="material-symbols-outlined text-lg">bolt</span>
                                    <span>
                                        {(user?.balance || 0) >= totalPending
                                            ? "Se pagarán automáticamente"
                                            : "Saldo insuficiente para pago auto"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[10px] p-8 border border-border shadow-sm flex items-center gap-6">
                        <div className="size-16 rounded-3xl bg-primary-green/5 text-primary-green flex items-center justify-center shrink-0 border border-primary-green/10">
                            <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-neutral-text tracking-tight">¡Todo al día!</h2>
                            <p className="text-[10px] text-neutral-text/30 font-black uppercase tracking-widest mt-0.5">Sin infracciones pendientes.</p>
                        </div>
                    </div>
                )}

                {/* Fines List */}
                <div className="space-y-10 pt-2">
                    {pendingFines.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">Infracciones Pendientes</h3>
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-400 text-[10px] font-black border border-red-100 uppercase tracking-widest">Crucial</span>
                            </div>
                            <div className="space-y-4">
                                {pendingFines.map((fine) => (
                                    <div
                                        key={fine.id}
                                        className="group relative overflow-hidden rounded-[8px] bg-white border border-border shadow-sm transition-all active:scale-[0.98]"
                                        onClick={() => haptic("light")}
                                    >
                                        <div className="p-7">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-red-600/50 uppercase tracking-widest bg-red-50/50 px-2.5 py-1 rounded-full border border-red-100/30 w-fit">
                                                        Vence {fine.dueDate?.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' }) ?? "—"}
                                                    </span>
                                                    <h4 className="text-xl font-black text-neutral-text tracking-tight mt-1">{getFineTypeLabel(fine.type)}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-neutral-text tracking-tighter tabular-nums">
                                                        ${fine.amount.toLocaleString("es-AR")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-8 grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-8 rounded-xl bg-neutral-bg flex items-center justify-center text-neutral-text/20 border border-border/50">
                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-neutral-text/40 tracking-tight truncate">{fine.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                   <div className="size-8 rounded-xl bg-neutral-bg flex items-center justify-center text-neutral-text/20 border border-border/50">
                                                        <span className="material-symbols-outlined text-sm">directions_car</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-neutral-text/40 tracking-tight uppercase">{fine.vehiclePlate}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setFineToPayId(fine.id)
                                                }}
                                                className="w-full bg-neutral-text text-white font-black py-4.5 rounded-[6px] text-[11px] hover:brightness-110 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 tracking-widest uppercase"
                                            >
                                                <span className="material-symbols-outlined text-lg">payments</span>
                                                Pagar Infracción
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {paidFines.length > 0 && (
                        <section>
                             <div className="flex items-center justify-between mb-6 px-1">
                                <h3 className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">Historial de Pagos</h3>
                                <span className="material-symbols-outlined text-primary-green opacity-20">verified</span>
                            </div>
                            <div className="space-y-3">
                                {paidFines.map((fine) => (
                                    <div
                                        key={fine.id}
                                        onClick={() => haptic("light")}
                                        className="flex justify-between items-center p-5 rounded-[7px] bg-white border border-border shadow-sm active:scale-[0.99] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-neutral-bg flex items-center justify-center text-primary-green/40 shrink-0 border border-border/50">
                                                <span className="material-symbols-outlined">description</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-black text-neutral-text uppercase tracking-tight truncate">{getFineTypeLabel(fine.type)}</p>
                                                <p className="text-[10px] font-black text-neutral-text/20 uppercase tracking-widest mt-0.5">{fine.date.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                                            <p className="text-sm font-black text-neutral-text/20 line-through tabular-nums">
                                                ${fine.amount.toLocaleString("es-AR")}
                                            </p>
                                            <span className="text-[9px] font-black text-primary-green uppercase tracking-widest bg-primary-green/5 px-3 py-1 rounded-full border border-primary-green/10 mt-1">
                                                Saldado
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Pay Fine Dialog - Redesigned Modal */}
            <AlertDialog
                open={!!fineToPayId}
                onOpenChange={() => {
                    setFineToPayId(null)
                    setError("")
                }}
            >
                <AlertDialogContent className="w-[92%] rounded-[10px] border-none bg-white p-8 font-display shadow-2xl">
                    <AlertDialogHeader className="mb-6">
                        <div className="size-16 rounded-[6px] bg-primary-green/5 text-primary-green flex items-center justify-center border border-primary-green/10 mb-6 mx-auto">
                            <span className="material-symbols-outlined text-4xl font-black">payments</span>
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-neutral-text text-center tracking-tight mb-2">Total a Pagar</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-[11px] font-black text-neutral-text/30 uppercase tracking-widest leading-relaxed">
                            {fineToPay && (
                                <>
                                    Confirmá el pago de la infracción por <span className="text-red-500">{getFineTypeLabel(fineToPay.type)}</span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {fineToPay && (
                        <div className="bg-neutral-bg rounded-[8px] p-6 space-y-4 mb-8 border border-border/50">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                <span className="text-neutral-text/30">Importe</span>
                                <span className="text-neutral-text">${fineToPay.amount.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                <span className="text-neutral-text/30">Saldo Actual</span>
                                <span className="text-neutral-text">${user?.balance.toLocaleString("es-AR")}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                <span className="text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em]">Restante</span>
                                <span className="text-2xl font-black text-primary-green tracking-tighter tabular-nums">
                                    ${((user?.balance || 0) - fineToPay.amount).toLocaleString("es-AR")}
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-black uppercase tracking-tight flex items-center gap-3 mb-6 border border-red-100">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <AlertDialogFooter className="flex flex-col gap-3">
                        <AlertDialogAction
                            onClick={handlePay}
                            className="w-full bg-primary-green text-white font-black h-16 rounded-[6px] text-[13px] uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all"
                        >
                            Confirmar Pago
                        </AlertDialogAction>
                        <AlertDialogCancel className="w-full bg-neutral-bg text-neutral-text/40 font-black h-14 rounded-[5px] text-[11px] uppercase tracking-widest border-none hover:bg-neutral-bg/80 active:scale-[0.98]">
                            Cancelar
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
