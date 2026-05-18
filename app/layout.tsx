import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppProviders } from "@app/providers/app-providers"
import { AuthGuard } from "@shared/lib/auth-guard"
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'
import "./globals.css"

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] })

export function generateMetadata(): Metadata {
  const isInspector = process.env.NEXT_PUBLIC_APP_ENV === 'inspector'

  return {
    title: isInspector ? "SEOE Inspector" : "SEOE Wallet",
    description: isInspector ? "Plataforma de control y fiscalización" : "Sistema inteligente de gestión de estacionamiento",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: isInspector ? "SEOE Inspector" : "SEOE Wallet",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/logo-seoe.png",
      apple: "/logo-seoe.png",
    },
  }
}

export function generateViewport(): Viewport {
  const isInspector = process.env.NEXT_PUBLIC_APP_ENV === 'inspector'
  
  return {
    themeColor: isInspector ? "#ffffff" : "#0D2742",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read locale from the NEXT_LOCALE cookie (set by LanguageSwitcher)
  // Default to 'es' (Spanish) for Argentina
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es'
  
  // Load messages for the current locale
  let messages: Record<string, any> = {}
  try {
    messages = (await import(`../src/shared/i18n/messages/${locale}.json`)).default
  } catch {
    messages = (await import(`../src/shared/i18n/messages/es.json`)).default
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppProviders>
            <AuthGuard>{children}</AuthGuard>
          </AppProviders>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
