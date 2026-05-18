"use client"

import type React from "react"
import { useState } from "react"
import { useVehicles } from "@entities/vehicles-context"

export function AddVehiclePage({ onBack }: { onBack: () => void }) {
    const { addVehicle } = useVehicles()
    const [formData, setFormData] = useState({
        licensePlate: "",
        brand: "",
        model: "",
        nickname: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.licensePlate || !formData.brand || !formData.model) {
            setError("Por favor completa los campos requeridos")
            return
        }

        setLoading(true)

        try {
            await addVehicle({
                brand: formData.brand,
                model: formData.model,
                licensePlate: formData.licensePlate.toUpperCase().replace(/\s/g, ""),
                year: "",
                color: "",
                isDefault: false,
            })
            onBack()
        } catch (err) {
            setError("Error al guardar el vehículo")
        } finally {
            setLoading(false)
        }
    }

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
                <h1 className="text-xl font-black text-neutral-text flex-1 text-center pr-11 tracking-tighter">Nuevo Vehículo</h1>
            </header>

            <main className="flex-1 px-6 pb-40 overflow-y-auto no-scrollbar pt-10">
                {/* Icon Header */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <div className="relative">
                        <div className="size-24 rounded-[8px] bg-white shadow-xl shadow-primary-green/5 border border-border flex items-center justify-center">
                            <span className="material-symbols-outlined text-neutral-text/10 text-5xl">directions_car</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-2xl bg-primary-green text-white shadow-lg border-4 border-neutral-bg transition-transform hover:scale-110">
                            <span className="material-symbols-outlined text-xl font-black">add</span>
                        </div>
                    </div>
                    <p className="mt-6 text-center text-[10px] font-black text-neutral-text/20 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                        Ingresa los datos para registrar tu unidad en el sistema
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Patente */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1">
                            Patente del Vehículo
                        </label>
                        <div className="relative group">
                            <input
                                className="w-full rounded-[6px] border border-border bg-white py-5 pl-6 pr-14 text-2xl font-black tracking-widest uppercase text-neutral-text placeholder:text-neutral-text/10 placeholder:font-black shadow-sm focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none"
                                id="plate"
                                placeholder="AA123BB"
                                type="text"
                                value={formData.licensePlate}
                                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                required
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-text/10 group-focus-within:text-primary-green transition-colors">
                                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-neutral-text/20 uppercase tracking-widest ml-4">Usa el formato oficial de tu país</p>
                    </div>

                    {/* Marca y Modelo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1">
                                Marca
                            </label>
                            <input
                                className="w-full rounded-[6px] border border-border bg-white py-4 px-6 text-sm font-black uppercase tracking-tight text-neutral-text placeholder:text-neutral-text/10 placeholder:font-black shadow-sm focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none"
                                id="make"
                                placeholder="Ej. Ford"
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1">
                                Modelo
                            </label>
                            <input
                                className="w-full rounded-[6px] border border-border bg-white py-4 px-6 text-sm font-black uppercase tracking-tight text-neutral-text placeholder:text-neutral-text/10 placeholder:font-black shadow-sm focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none"
                                id="model"
                                placeholder="Ej. Fiesta"
                                type="text"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Alias */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-text/20 ml-1">
                            Alias (Opcional)
                        </label>
                        <div className="relative group">
                            <input
                                className="w-full rounded-[6px] border border-border bg-white py-4 pl-6 pr-14 text-sm font-black uppercase tracking-tight text-neutral-text placeholder:text-neutral-text/10 placeholder:font-black shadow-sm focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all outline-none"
                                id="nickname"
                                placeholder="Pj. Auto de Juan"
                                type="text"
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-text/10 group-focus-within:text-primary-green transition-colors">
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}
                </form>
            </main>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-neutral-bg/80 backdrop-blur-xl z-40 border-t border-border/50">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary-green text-white font-black py-6 rounded-[6px] text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                        <span className="material-symbols-outlined">save</span>
                    )}
                    {loading ? "GUARDANDO..." : "REGISTRAR VEHÍCULO"}
                </button>
            </div>
        </div>
    )
}
