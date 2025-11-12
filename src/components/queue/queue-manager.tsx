"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Queue, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Zap
} from "lucide-react"

interface QueueStats {
  fineTuning: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  evaluation: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  processing: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
}

interface QueueJob {
  id: string
  type: string
  status: 'waiting' | 'active' | 'completed' | 'failed'
  data: any
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
  progress?: number
  errorMessage?: string
}

export function QueueManager() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQueue, setSelectedQueue] = useState<string>('all')

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/queue?type=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch queue stats:', error)
    }
  }

  const fetchJobs = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      const mockJobs: QueueJob[] = [
        {
          id: '1',
          type: 'fine-tuning',
          status: 'active',
          data: { jobId: 'job-1', datasetId: 'ds-1' },
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
          startedAt: new Date(Date.now() - 1000 * 60 * 2),
          progress: 65
        },
        {
          id: '2',
          type: 'evaluation',
          status: 'waiting',
          data: { evaluationId: 'eval-1', modelId: 'model-1' },
          createdAt: new Date(Date.now() - 1000 * 60 * 10)
        },
        {
          id: '3',
          type: 'processing',
          status: 'active',
          data: { datasetId: 'ds-2' },
          createdAt: new Date(Date.now() - 1000 * 60 * 1),
          startedAt: new Date(Date.now() - 1000 * 30),
          progress: 30
        },
        {
          id: '4',
          type: 'fine-tuning',
          status: 'completed',
          data: { jobId: 'job-2', datasetId: 'ds-3' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
          startedAt: new Date(Date.now() - 1000 * 60 * 45),
          completedAt: new Date(Date.now() - 1000 * 60 * 15)
        }
      ]
      setJobs(mockJobs)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueueStats()
    fetchJobs()
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchQueueStats()
      fetchJobs()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const getQueueIcon = (type: string) => {
    switch (type) {
      case 'fine-tuning':
        return <Zap className="h-4 w-4" />
      case 'evaluation':
        return <Activity className="h-4 w-4" />
      case 'processing':
        return <Users className="h-4 w-4" />
      default:
        return <Queue className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'active':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Queue className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline">Waiting</Badge>
      case 'active':
        return <Badge variant="secondary">Active</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredJobs = selectedQueue === 'all' 
    ? jobs 
    : jobs.filter(job => job.type === selectedQueue)

  const totalStats = stats ? {
    waiting: stats.fineTuning.waiting + stats.evaluation.waiting + stats.processing.waiting,
    active: stats.fineTuning.active + stats.evaluation.active + stats.processing.active,
    completed: stats.fineTuning.completed + stats.evaluation.completed + stats.processing.completed,
    failed: stats.fineTuning.failed + stats.evaluation.failed + stats.processing.failed,
  } : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Queue className="h-5 w-5" />
            Queue Management
          </CardTitle>
          <CardDescription>
            Monitor and manage background job queues for fine-tuning, evaluation, and data processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button 
                variant={selectedQueue === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedQueue('all')}
              >
                All Queues
              </Button>
              <Button 
                variant={selectedQueue === 'fine-tuning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedQueue('fine-tuning')}
              >
                Fine-tuning
              </Button>
              <Button 
                variant={selectedQueue === 'evaluation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedQueue('evaluation')}
              >
                Evaluation
              </Button>
              <Button 
                variant={selectedQueue === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedQueue('processing')}
              >
                Processing
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchQueueStats(); fetchJobs(); }}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Overall Stats */}
          {totalStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{totalStats.waiting}</p>
                      <p className="text-sm text-gray-500">Waiting</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{totalStats.active}</p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{totalStats.completed}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{totalStats.failed}</p>
                      <p className="text-sm text-gray-500">Failed</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Individual Queue Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Fine-tuning Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Waiting:</span>
                      <span className="ml-1 font-medium">{stats.fineTuning.waiting}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Active:</span>
                      <span className="ml-1 font-medium">{stats.fineTuning.active}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium">{stats.fineTuning.completed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Failed:</span>
                      <span className="ml-1 font-medium">{stats.fineTuning.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Evaluation Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Waiting:</span>
                      <span className="ml-1 font-medium">{stats.evaluation.waiting}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Active:</span>
                      <span className="ml-1 font-medium">{stats.evaluation.active}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium">{stats.evaluation.completed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Failed:</span>
                      <span className="ml-1 font-medium">{stats.evaluation.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Processing Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Waiting:</span>
                      <span className="ml-1 font-medium">{stats.processing.waiting}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Active:</span>
                      <span className="ml-1 font-medium">{stats.processing.active}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <span className="ml-1 font-medium">{stats.processing.completed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Failed:</span>
                      <span className="ml-1 font-medium">{stats.processing.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Jobs List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>
                Real-time status of background jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading jobs...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No jobs found in this queue
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getQueueIcon(job.type)}
                            <div>
                              <p className="font-medium">
                                {job.type === 'fine-tuning' && 'Fine-tuning Job'}
                                {job.type === 'evaluation' && 'Evaluation Job'}
                                {job.type === 'processing' && 'Data Processing'}
                              </p>
                              <p className="text-sm text-gray-500">
                                ID: {job.id} • Created: {job.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            {getStatusBadge(job.status)}
                          </div>
                        </div>

                        {job.status === 'active' && job.progress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="w-full" />
                          </div>
                        )}

                        {job.status === 'failed' && job.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                            <AlertCircle className="inline h-4 w-4 mr-1" />
                            {job.errorMessage}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}