"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      // Set cookie for locale preference (next-intl middleware reads this)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleLanguageChange("es")}
        disabled={isPending}
        className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${
          locale === "es"
            ? "bg-primary-green text-white shadow-sm"
            : "bg-neutral-bg text-neutral-text/40 hover:text-neutral-text border border-border"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => handleLanguageChange("en")}
        disabled={isPending}
        className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${
          locale === "en"
            ? "bg-primary-green text-white shadow-sm"
            : "bg-neutral-bg text-neutral-text/40 hover:text-neutral-text border border-border"
        }`}
      >
        EN
      </button>
    </div>
  )
}
