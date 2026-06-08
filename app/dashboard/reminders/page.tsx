"use client"
import { useRouter } from "next/navigation"
import { RemindersPage } from "@views/reminders-page"

export default function RemindersRoute() {
  const router = useRouter()
  return <RemindersPage onBack={() => router.push("/dashboard")} />
}
