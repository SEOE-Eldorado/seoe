"use client"
import { useRouter } from "next/navigation"
import { InspectorPage } from "@views/inspector-page"
export default function InspectorRoute() {
  const router = useRouter()
  return <InspectorPage onBack={() => router.push("/dashboard")} />
}