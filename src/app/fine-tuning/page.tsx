"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { FineTuningDashboard } from "@/components/fine-tuning/fine-tuning-dashboard"
import { FelafaxFineTuningDashboard } from "@/components/fine-tuning/felafax-dashboard"
import { FelafaxMonitoringDashboard } from "@/components/fine-tuning/felafax-monitoring"
import { FelafaxCostTracking } from "@/components/fine-tuning/felafax-cost-tracking"
import { FelafaxIntegrationTest } from "@/components/fine-tuning/felafax-test"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FineTuningPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <Tabs defaultValue="traditional" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="traditional">Traditional</TabsTrigger>
                <TabsTrigger value="felafax">Felafax</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="costs">Cost Tracking</TabsTrigger>
                <TabsTrigger value="testing">Integration Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="traditional">
                <FineTuningDashboard />
              </TabsContent>
              
              <TabsContent value="felafax">
                <FelafaxFineTuningDashboard />
              </TabsContent>
              
              <TabsContent value="monitoring">
                <FelafaxMonitoringDashboard />
              </TabsContent>
              
              <TabsContent value="costs">
                <FelafaxCostTracking />
              </TabsContent>
              
              <TabsContent value="testing">
                <FelafaxIntegrationTest />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}