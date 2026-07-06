"use client"
import { LoginForm } from "@widgets/forms/login-form"
import { useRouter } from "next/navigation"
export default function SellerLoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-background selection:bg-blue-600/20">
      <LoginForm variant="seller" onForgotPassword={() => router.push("/forgot-password")} />
    </div>
  )
}
