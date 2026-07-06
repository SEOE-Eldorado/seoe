"use client"
import { LoginForm } from "@widgets/forms/login-form"
import { useRouter } from "next/navigation"
export default function InspectorLoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background selection:bg-orange-600/20">
      <LoginForm variant="inspector" onForgotPassword={() => router.push("/forgot-password")} />
    </div>
  )
}
