"use client"
import { useRouter } from "next/navigation"
import { HistoryPage } from "@views/history-page"
export default function HistoryRoute() {
  const router = useRouter()
  return <HistoryPage onBack={() => router.push("/dashboard")} />
}