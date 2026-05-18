"use client"
import { LoginForm } from "@widgets/forms/login-form"
import { useRouter } from "next/navigation"
export default function LoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background selection:bg-primary-green/20">
      <LoginForm onToggle={() => router.push("/register")} onForgotPassword={() => router.push("/forgot-password")} />
    </div>
  )
}