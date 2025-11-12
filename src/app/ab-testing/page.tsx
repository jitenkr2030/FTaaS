"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ABTestingManager } from "@/components/ab-testing/ab-testing-manager"
import { AuthGuard } from "@/components/auth/auth-button"
import { ModernLanding } from "@/components/landing/modern-landing"

export default function ABTestingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    // Check if user has visited before
    const visited = localStorage.getItem('ftaas-visited')
    setShowLanding(!visited)
  }, [])

  const handleGetStarted = () => {
    localStorage.setItem('ftaas-visited', 'true')
    setShowLanding(false)
  }

  const handleBackToLanding = () => {
    setShowLanding(true)
  }

  // Show loading state while checking auth and client-side
  if (!isClient || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showLanding) {
    return <ModernLanding onGetStarted={handleGetStarted} />
  }

  if (!session) {
    return <AuthGuard />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} onBackToLanding={handleBackToLanding} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <ABTestingManager />
          </div>
        </main>
      </div>
    </div>
  )
}