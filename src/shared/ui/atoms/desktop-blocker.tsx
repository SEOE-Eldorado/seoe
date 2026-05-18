"use client"

import { Smartphone } from "lucide-react"

interface DesktopBlockerProps {
    bypass?: boolean
}

export function DesktopBlocker({ bypass = false }: DesktopBlockerProps) {
    if (bypass) return null

    return (
        <div className="hidden md:flex fixed inset-0 z-9999 bg-neutral-bg flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700 font-display">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-green/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="w-32 h-32 bg-white rounded-[10px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center mb-10 border border-border relative">
                 <div className="absolute inset-2 bg-neutral-bg rounded-[8px]"></div>
                 <Smartphone className="size-14 text-primary-green relative z-10" />
            </div>

            <h1 className="text-5xl font-black text-neutral-text mb-4 tracking-tighter">
                Experiencia Móvil
            </h1>
            <p className="text-neutral-text/30 text-[10px] font-black uppercase tracking-[0.2em] max-w-sm mb-12 leading-relaxed">
                SEOE está diseñado exclusivamente para dispositivos móviles como una aplicación de billetera inteligente.
            </p>

            <div className="bg-white border border-border rounded-[10px] p-10 max-w-sm w-full shadow-2xl shadow-emerald-900/5 relative">
                <p className="text-[10px] font-black text-primary-green uppercase tracking-widest mb-6">Próximos Pasos</p>
                <ol className="text-xs text-neutral-text/50 text-left space-y-4 font-bold uppercase tracking-tight">
                    <li className="flex items-center gap-4">
                        <span className="size-6 rounded-full bg-neutral-bg flex items-center justify-center text-[10px] text-neutral-text">1</span>
                        Abre este sitio en tu celular
                    </li>
                    <li className="flex items-center gap-4">
                        <span className="size-6 rounded-full bg-neutral-bg flex items-center justify-center text-[10px] text-neutral-text">2</span>
                        Instala la app desde el navegador
                    </li>
                    <li className="flex items-center gap-4">
                        <span className="size-6 rounded-full bg-neutral-bg flex items-center justify-center text-[10px] text-neutral-text">3</span>
                        Disfruta la experiencia completa
                    </li>
                </ol>
            </div>

            <p className="fixed bottom-12 text-[9px] font-black text-neutral-text/20 uppercase tracking-[0.3em]">
                Exclusivo para Android & iOS PWA
            </p>
        </div>
    )
}
