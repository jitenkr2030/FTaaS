"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { useEffect } from "react"

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <AnalyticsDashboard />
    </div>
  )
}