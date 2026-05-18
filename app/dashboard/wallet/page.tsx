"use client"
import { useRouter } from "next/navigation"
import { WalletPage } from "@views/wallet-page"
export default function WalletRoute() {
  const router = useRouter()
  return <WalletPage onBack={() => router.push("/dashboard")} />
}