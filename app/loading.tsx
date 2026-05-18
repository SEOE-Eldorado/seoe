export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg font-display">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-20 border-[6px] border-primary-green/10 border-t-primary-green rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black text-primary-green uppercase tracking-[0.3em] animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
