"use client"
import { ForgotPasswordForm } from "@widgets/forms/forgot-password-form"
import { useRouter } from "next/navigation"
export default function ForgotPasswordPage() {
  const router = useRouter()
  return <ForgotPasswordForm onBack={() => router.push("/login")} />
}