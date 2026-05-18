"use client"
import { useRouter } from "next/navigation"
import { ProfilePage } from "@views/profile-page"
export default function ProfileRoute() {
  const router = useRouter()
  return <ProfilePage onBack={() => router.push("/dashboard")} />
}