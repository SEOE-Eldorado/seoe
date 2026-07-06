"use client"
import { LoginForm } from "@widgets/forms/login-form"
import { useRouter } from "next/navigation"
export default function AdminLoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background selection:bg-violet-700/20">
      <LoginForm variant="admin" onForgotPassword={() => router.push("/forgot-password")} />
    </div>
  )
}
