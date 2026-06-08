import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppProviders } from "@app/providers/app-providers"
import { AuthGuard } from "@shared/lib/auth-guard"
import { NextIntlClientProvider } from 'next-intl'
import "./globals.css"

import esMessages from "../src/shared/i18n/messages/es.json"

const inter = Inter({ subsets: ["latin"] })

export const dynamic = 'force-static'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={esMessages} locale="es">
          <AppProviders>
            <AuthGuard>{children}</AuthGuard>
          </AppProviders>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
