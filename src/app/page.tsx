"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardOverview } from "@/components/dashboard/overview"
import { AuthGuard } from "@/components/auth/auth-button"
import { ModernLanding } from "@/components/landing/modern-landing"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setIsClient(true)
    // Always show landing page first for all users
    // Clear any existing visit tracking to ensure landing page shows
    localStorage.removeItem('ftaas-visited')
    setShowLanding(true)
  }, [])

  const handleGetStarted = () => {
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} onBackToLanding={handleBackToLanding} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <DashboardOverview />
          </div>
        </main>
      </div>
    </div>
  )
}