"use client"

import type { ReactNode } from "react"

/**
 * Dashboard layout — minimal wrapper.
 * The actual header and bottom navigation live inside NewDashboard
 * to preserve its premium banking-style design.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
