"use client"
import { RegisterForm } from "@widgets/forms/register-form"
import { useRouter } from "next/navigation"
export default function RegisterPage() {
  const router = useRouter()
  return <RegisterForm onToggle={() => router.push("/login")} />
}