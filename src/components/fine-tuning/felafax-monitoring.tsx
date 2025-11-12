"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Activity, 
  Pause, 
  StopCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  TrendingUp,
  Timer,
  BarChart3,
  FileText
} from "lucide-react"
import { felafaxService, TrainingJob, HardwareMetrics } from "@/lib/felafax/service"

interface MonitoringData {
  job: TrainingJob
  hardwareMetrics: HardwareMetrics
  logs: string[]
  costPerHour: number
  estimatedTimeRemaining: number
}

export function FelafaxMonitoringDashboard() {
  const [jobs, setJobs] = useState<TrainingJob[]>([])
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchJobs()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchJobs()
        if (selectedJob) {
          fetchJobDetails(selectedJob)
        }
      }, 5000) // Refresh every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedJob])

  const fetchJobs = async () => {
    try {
      const jobsData = await felafaxService.listJobs()
      setJobs(jobsData)
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobDetails = async (jobId: string) => {
    try {
      const [job, hardwareMetrics] = await Promise.all([
        felafaxService.getJobStatus(jobId),
        felafaxService.getHardwareMetrics()
      ])

      // Calculate cost per hour based on hardware type
      const hardwareCosts = {
        'tpu': 3.22,
        'trainium': 4.03,
        'gpu': 1.00,
        'amd': 0.80
      }

      const costPerHour = hardwareCosts[job.hardware as keyof typeof hardwareCosts] || 1.00
      
      // Estimate time remaining based on progress
      const timeElapsed = (new Date().getTime() - new Date(job.created_at).getTime()) / 1000 / 3600 // hours
      const estimatedTimeRemaining = job.progress > 0 ? (timeElapsed / job.progress) * (100 - job.progress) : 0

      setMonitoringData({
        job,
        hardwareMetrics,
        logs: job.logs || [],
        costPerHour,
        estimatedTimeRemaining
      })
    } catch (error) {
      console.error("Failed to fetch job details:", error)
    }
  }

  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId)
    fetchJobDetails(jobId)
  }

  const cancelJob = async (jobId: string) => {
    try {
      await felafaxService.cancelJob(jobId)
      toast({
        title: "Success",
        description: "Job cancelled successfully.",
      })
      fetchJobs()
      if (selectedJob === jobId) {
        setSelectedJob(null)
        setMonitoringData(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const downloadLogs = (jobId: string) => {
    if (!monitoringData) return
    
    const logContent = monitoringData.logs.join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `felafax-job-${jobId}-logs.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    toast({
      title: "Success",
      description: "Logs downloaded successfully.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const runningJobs = jobs.filter(job => job.status.toLowerCase() === 'running')
  const completedJobs = jobs.filter(job => job.status.toLowerCase() === 'completed')
  const failedJobs = jobs.filter(job => job.status.toLowerCase() === 'failed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Felafax Monitoring</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time monitoring of Felafax training jobs and hardware metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold">{runningJobs.length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{failedJobs.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Training Jobs</CardTitle>
            <CardDescription>Select a job to view detailed monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading jobs...</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedJob === job.job_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleJobSelect(job.job_id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                        <span className="font-medium text-sm">{job.model}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.hardware}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Dataset: {job.dataset}</div>
                      <div>Progress: {job.progress.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              {monitoringData ? `Monitoring job: ${monitoringData.job.job_id}` : 'Select a job to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monitoringData ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="hardware">Hardware</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(monitoringData.job.status)}`} />
                        <span className="font-medium">{monitoringData.job.status}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Progress</Label>
                      <div className="mt-1">
                        <Progress value={monitoringData.job.progress} className="w-full" />
                        <span className="text-sm text-gray-600">{monitoringData.job.progress.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Model</Label>
                      <p className="font-medium">{monitoringData.job.model}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Dataset</Label>
                      <p className="font-medium">{monitoringData.job.dataset}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Hardware</Label>
                      <p className="font-medium">{monitoringData.job.hardware}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Precision</Label>
                      <p className="font-medium">{monitoringData.job.precision}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Created</Label>
                      <p className="font-medium">{new Date(monitoringData.job.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Cost/Hour</Label>
                      <p className="font-medium">${monitoringData.costPerHour.toFixed(2)}</p>
                    </div>
                  </div>

                  {monitoringData.job.status.toLowerCase() === 'running' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Estimated Time Remaining</span>
                      </div>
                      <p className="text-blue-700">
                        {monitoringData.estimatedTimeRemaining > 0 
                          ? `${monitoringData.estimatedTimeRemaining.toFixed(1)} hours remaining`
                          : 'Calculating...'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {monitoringData.job.status.toLowerCase() === 'running' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelJob(monitoringData.job.job_id)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Cancel Job
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadLogs(monitoringData.job.job_id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Logs
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="hardware" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">CPU Usage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={monitoringData.hardwareMetrics.cpu_usage} className="flex-1" />
                        <span className="text-sm font-medium">{monitoringData.hardwareMetrics.cpu_usage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Memory Usage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={monitoringData.hardwareMetrics.memory_usage} className="flex-1" />
                        <span className="text-sm font-medium">{monitoringData.hardwareMetrics.memory_usage.toFixed(1)}%</span>
                      </div>
                    </div>
                    {monitoringData.hardwareMetrics.gpu_usage && (
                      <div>
                        <Label className="text-sm text-gray-600">GPU Usage</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={monitoringData.hardwareMetrics.gpu_usage} className="flex-1" />
                          <span className="text-sm font-medium">{monitoringData.hardwareMetrics.gpu_usage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    {monitoringData.hardwareMetrics.gpu_memory && (
                      <div>
                        <Label className="text-sm text-gray-600">GPU Memory</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={monitoringData.hardwareMetrics.gpu_memory} className="flex-1" />
                          <span className="text-sm font-medium">{monitoringData.hardwareMetrics.gpu_memory.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-600">Disk Usage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={monitoringData.hardwareMetrics.disk_usage} className="flex-1" />
                        <span className="text-sm font-medium">{monitoringData.hardwareMetrics.disk_usage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">CPU</p>
                            <p className="text-lg font-bold">{monitoringData.hardwareMetrics.cpu_usage.toFixed(1)}%</p>
                          </div>
                          <Cpu className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Memory</p>
                            <p className="text-lg font-bold">{monitoringData.hardwareMetrics.memory_usage.toFixed(1)}%</p>
                          </div>
                          <MemoryStick className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Disk</p>
                            <p className="text-lg font-bold">{monitoringData.hardwareMetrics.disk_usage.toFixed(1)}%</p>
                          </div>
                          <HardDrive className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Training Logs</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadLogs(monitoringData.job.job_id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                  
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {monitoringData.logs.length > 0 ? (
                      monitoringData.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No logs available</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Training Progress</p>
                            <p className="text-2xl font-bold">{monitoringData.job.progress.toFixed(1)}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Cost Rate</p>
                            <p className="text-2xl font-bold">${monitoringData.costPerHour.toFixed(2)}/h</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Job Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{monitoringData.job.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dataset:</span>
                          <span className="font-medium">{monitoringData.job.dataset}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hardware:</span>
                          <span className="font-medium">{monitoringData.job.hardware}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precision:</span>
                          <span className="font-medium">{monitoringData.job.precision}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">{new Date(monitoringData.job.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {Object.keys(monitoringData.job.metrics).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Training Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {Object.entries(monitoringData.job.metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a job to view monitoring details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}