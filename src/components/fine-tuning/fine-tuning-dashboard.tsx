"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/use-websocket"
import { 
  Activity, 
  Play, 
  Pause, 
  StopCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  Zap,
  Database,
  TrendingUp,
  Eye,
  Download
} from "lucide-react"

interface FineTuningJob {
  id: string
  name: string
  description: string
  model: string
  dataset: string
  status: "PENDING" | "TRAINING" | "COMPLETED" | "FAILED" | "QUEUED"
  progress: number
  epochs: number
  currentEpoch: number
  estimatedTime: number
  elapsedTime: number
  cost: number
  metrics?: {
    loss: number
    accuracy: number
    learningRate: number
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  hyperparameters?: any
}

export function FineTuningDashboard() {
  const [activeTab, setActiveTab] = useState("jobs")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [jobs, setJobs] = useState<FineTuningJob[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { 
    isConnected, 
    trainingUpdates, 
    joinJob, 
    leaveJob, 
    getTrainingUpdate,
    notifications,
    clearNotifications 
  } = useWebSocket({ enableNotifications: true })

  useEffect(() => {
    fetchJobs()
  }, [selectedStatus, searchTerm])

  useEffect(() => {
    // Join job rooms for all active jobs
    jobs.forEach(job => {
      if (job.status === 'TRAINING' || job.status === 'QUEUED') {
        joinJob(job.id)
      }
    })

    // Clean up: leave job rooms when component unmounts
    return () => {
      jobs.forEach(job => {
        leaveJob(job.id)
      })
    }
  }, [jobs, joinJob, leaveJob])

  useEffect(() => {
    // Update jobs with real-time training updates
    const updatedJobs = jobs.map(job => {
      const update = getTrainingUpdate(job.id)
      if (update) {
        return {
          ...job,
          status: update.status,
          progress: update.progress,
          currentEpoch: update.currentEpoch,
          elapsedTime: update.elapsedTime,
          metrics: update.loss || update.accuracy ? {
            loss: update.loss,
            accuracy: update.accuracy,
            learningRate: job.metrics?.learningRate || 0.0001
          } : job.metrics
        }
      }
      return job
    })
    
    // Check if any jobs were updated
    const hasUpdates = updatedJobs.some((updatedJob, index) => 
      JSON.stringify(updatedJob) !== JSON.stringify(jobs[index])
    )
    
    if (hasUpdates) {
      setJobs(updatedJobs)
    }
  }, [trainingUpdates, jobs, getTrainingUpdate])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append('status', selectedStatus)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/fine-tuning?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      } else {
        throw new Error('Failed to fetch jobs')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load fine-tuning jobs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || job.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "TRAINING":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Training</Badge>
            <Progress value={progress} className="w-16" />
          </div>
        )
      case "QUEUED":
        return <Badge variant="outline">Queued</Badge>
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "TRAINING":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "QUEUED":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "FAILED":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === "COMPLETED").length,
    training: jobs.filter(j => j.status === "TRAINING").length,
    queued: jobs.filter(j => j.status === "QUEUED").length,
    failed: jobs.filter(j => j.status === "FAILED").length,
    totalCost: jobs.reduce((sum, j) => sum + j.cost, 0)
  }

  const handleViewJob = (jobId: string) => {
    // Navigate to job details page or show modal
    toast({
      title: "Job Details",
      description: `Viewing details for job ${jobId}`,
    })
  }

  const handlePauseJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tuning/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'pause' }),
      })

      if (response.ok) {
        toast({
          title: "Job Paused",
          description: "Training job has been paused successfully.",
        })
        fetchJobs() // Refresh the list
      } else {
        throw new Error('Failed to pause job')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStopJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tuning/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      })

      if (response.ok) {
        toast({
          title: "Job Stopped",
          description: "Training job has been stopped successfully.",
        })
        fetchJobs() // Refresh the list
      } else {
        throw new Error('Failed to stop job')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tuning/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })

      if (response.ok) {
        toast({
          title: "Job Started",
          description: "Training job has been started successfully.",
        })
        fetchJobs() // Refresh the list
      } else {
        throw new Error('Failed to start job')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRetryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tuning/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'retry' }),
      })

      if (response.ok) {
        toast({
          title: "Job Retried",
          description: "Training job has been retried successfully.",
        })
        fetchJobs() // Refresh the list
      } else {
        throw new Error('Failed to retry job')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadModel = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tuning/jobs/${jobId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `model-${jobId}.bin`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Download Started",
          description: "Model download has been initiated.",
        })
      } else {
        throw new Error('Failed to download model')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download model. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fine-tuning Jobs</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create and monitor your model fine-tuning jobs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Real-time updates active' : 'Disconnected'}
            </span>
          </div>
        </div>
        <Button onClick={() => setActiveTab("create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Fine-tuning Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Training</p>
                <p className="text-2xl font-bold">{stats.training}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-bold">{stats.queued}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="create">Create Job</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TRAINING">Training</option>
                  <option value="QUEUED">Queued</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Job List */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading fine-tuning jobs...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(job.status)}
                        <h3 className="text-lg font-semibold">{job.name}</h3>
                        {getStatusBadge(job.status, job.progress)}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          {job.model}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          {job.dataset}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          ${job.cost.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.elapsedTime}/{job.estimatedTime} min
                        </span>
                        <span>📊 {job.currentEpoch}/{job.epochs} epochs</span>
                      </div>
                      
                      {job.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-red-600">
                            <AlertCircle className="inline h-4 w-4 mr-1" />
                            {job.errorMessage}
                          </p>
                        </div>
                      )}
                      
                      {job.status === "TRAINING" && job.metrics && (
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Loss</p>
                            <p className="font-semibold">{job.metrics.loss.toFixed(3)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Accuracy</p>
                            <p className="font-semibold">{(job.metrics.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Learning Rate</p>
                            <p className="font-semibold">{job.metrics.learningRate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button onClick={() => handleViewJob(job.id)} variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {job.status === "TRAINING" && (
                        <>
                          <Button onClick={() => handlePauseJob(job.id)} variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button onClick={() => handleStopJob(job.id)} variant="outline" size="sm">
                            <StopCircle className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                      {job.status === "QUEUED" && (
                        <Button onClick={() => handleStartJob(job.id)} variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {job.status === "FAILED" && (
                        <Button onClick={() => handleRetryJob(job.id)} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      {job.status === "COMPLETED" && (
                        <Button onClick={() => handleDownloadModel(job.id)} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Tabs defaultValue="overview" className="mt-4">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="hyperparameters">Hyperparameters</TabsTrigger>
                      <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{job.progress}%</p>
                          <p className="text-sm text-gray-500">Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">${job.cost.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Cost</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{job.elapsedTime}m</p>
                          <p className="text-sm text-gray-500">Elapsed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{job.estimatedTime - job.elapsedTime}m</p>
                          <p className="text-sm text-gray-500">Remaining</p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="metrics" className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                        {job.metrics && Object.keys(job.metrics).length > 0 ? (
                          <pre className="text-sm">
                            {JSON.stringify(job.metrics, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-gray-500">No metrics available yet</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="hyperparameters" className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                        <pre className="text-sm">
                          {JSON.stringify(job.hyperparameters, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="logs" className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                        <p className="text-sm text-gray-500">Training logs will be displayed here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
          
          {filteredJobs.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No fine-tuning jobs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first fine-tuning job to get started.
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fine-tuning Job
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Fine-tuning Job</CardTitle>
              <CardDescription>
                Configure your fine-tuning job with model, dataset, and hyperparameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Job creation interface will be implemented here. This will include:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Model selection</li>
                <li>Dataset selection</li>
                <li>Hyperparameter configuration</li>
                <li>Cost estimation</li>
                <li>Job scheduling</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Queue</CardTitle>
              <CardDescription>
                View and manage the fine-tuning job queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Queue management interface will be implemented here. This will show:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Current queue status</li>
                <li>Job prioritization</li>
                <li>Resource allocation</li>
                <li>Estimated wait times</li>
                <li>Queue management controls</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}