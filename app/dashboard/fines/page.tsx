"use client"
import { useRouter } from "next/navigation"
import { FinesPage } from "@views/fines-page"
export default function FinesRoute() {
  const router = useRouter()
  return <FinesPage onBack={() => router.push("/dashboard")} />
}