"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { 
  Brain, 
  Database, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Plus,
  Loader2
} from "lucide-react"

interface DashboardStats {
  activeModels: number
  datasets: number
  apiCalls: number
  successRate: number
  trainingJobs: number
  queuedJobs: number
}

export function DashboardOverview() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Failed to load dashboard statistics')
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again.",
        variant: "destructive",
      })
      
      // Set fallback data
      setStats({
        activeModels: 0,
        datasets: 0,
        apiCalls: 0,
        successRate: 0,
        trainingJobs: 0,
        queuedJobs: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewFineTuningJob = () => {
    router.push('/fine-tuning')
  }

  const handleUploadDataset = () => {
    router.push('/datasets')
  }

  const handleBrowseModels = () => {
    router.push('/models')
  }

  const handleViewAnalytics = () => {
    router.push('/analytics')
  }

  const handleManageDatasets = () => {
    router.push('/datasets')
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome to your Fine-Tuning as a Service platform
          </p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        <Button onClick={handleNewFineTuningJob} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Fine-tuning Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeModels || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeModels > 0 ? '+2 from last month' : 'No models yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.datasets || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.datasets > 0 ? '+4 from last month' : 'No datasets yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.apiCalls > 1000000 ? `${(stats?.apiCalls / 1000000).toFixed(1)}M` : stats?.apiCalls.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.apiCalls > 0 ? '+180.1% from last month' : 'No API calls yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.successRate > 0 ? '+1.2% from last month' : 'No data yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Fine-tuning Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Fine-tuning Jobs</CardTitle>
            <CardDescription>
              Track the progress of your model training jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Job 1 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Customer Support Bot</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      GPT-4 • 2.5k samples
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Training</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">75%</p>
                    <Progress value={75} className="w-20" />
                  </div>
                </div>
              </div>

              {/* Job 2 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Code Review Assistant</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      LLaMA-3 • 5k samples
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Completed</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">100%</p>
                    <Progress value={100} className="w-20" />
                  </div>
                </div>
              </div>

              {/* Job 3 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Medical Summarizer</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mistral • 1.2k samples
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Queued</Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">0%</p>
                    <Progress value={0} className="w-20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleUploadDataset} variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Upload Dataset
            </Button>
            <Button onClick={handleBrowseModels} variant="outline" className="w-full justify-start">
              <Brain className="mr-2 h-4 w-4" />
              Browse Models
            </Button>
            <Button onClick={handleViewAnalytics} variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button onClick={handleManageDatasets} variant="outline" className="w-full justify-start">
              <Database className="mr-2 h-4 w-4" />
              Manage Datasets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Training Queue</p>
                <p className="text-sm text-gray-500">3 jobs in queue</p>
              </div>
              <Badge variant="secondary">Normal</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">GPU Availability</p>
                <p className="text-sm text-gray-500">8/10 available</p>
              </div>
              <Badge variant="default">Available</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">API Response Time</p>
                <p className="text-sm text-gray-500">avg. 45ms</p>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}