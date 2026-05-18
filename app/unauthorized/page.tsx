"use client"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
export default function UnauthorizedPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-display">
      <div className="bg-slate-50 p-6 rounded-[24px] max-w-sm w-full text-center space-y-4 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="mx-auto size-16 bg-red-100 text-red-600 flex items-center justify-center rounded-3xl mb-4 rotate-3">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-800">Acceso Restringido</h2>
        <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">Esta aplicación es de uso exclusivo para el cuerpo de fiscalización y control.</p>
        <button onClick={() => router.push("/login")} className="w-full h-12 bg-white border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] mt-6">Volver Atrás</button>
      </div>
    </div>
  )
}