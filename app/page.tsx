"use client"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    window.location.href = "/login/index.html"
  }, [])
  return null
}
