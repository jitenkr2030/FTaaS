"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
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
  Download,
  Cpu,
  DollarSign,
  Timer,
  HardDrive
} from "lucide-react"
import { 
  felafaxService, 
  TrainingJob, 
  FineTuningRequest, 
  FelafaxModel, 
  CostEstimate, 
  HardwareMetrics 
} from "@/lib/felafax/service"
import { HardwareType, ModelPrecision } from "@/types/felafax"

interface FelafaxJob extends TrainingJob {
  name?: string
  description?: string
}

export function FelafaxFineTuningDashboard() {
  const [activeTab, setActiveTab] = useState("jobs")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [jobs, setJobs] = useState<FelafaxJob[]>([])
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<FelafaxModel[]>([])
  const [hardwareMetrics, setHardwareMetrics] = useState<HardwareMetrics | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    model: "",
    dataset: "",
    hardware: HardwareType.TPU,
    precision: ModelPrecision.BFLOAT16,
    learningRate: 0.0001,
    batchSize: 8,
    maxSeqLength: 2048,
    numSteps: "",
    evalInterval: 100,
    loraRank: 8,
    loraAlpha: 16,
    description: ""
  })

  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchModels()
    fetchHardwareMetrics()
    
    // Set up periodic hardware metrics updates
    const metricsInterval = setInterval(fetchHardwareMetrics, 30000) // Update every 30 seconds
    
    return () => clearInterval(metricsInterval)
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const jobsData = await felafaxService.listJobs()
      setJobs(jobsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Felafax jobs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const modelsData = await felafaxService.getAvailableModels()
      setModels(modelsData.models)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available models. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchHardwareMetrics = async () => {
    try {
      const metrics = await felafaxService.getHardwareMetrics()
      setHardwareMetrics(metrics)
    } catch (error) {
      console.error("Failed to fetch hardware metrics:", error)
    }
  }

  const estimateCost = async () => {
    if (!formData.model) return

    setIsEstimating(true)
    try {
      const request: FineTuningRequest = {
        model: formData.model,
        dataset: formData.dataset || "default",
        config: {
          learning_rate: formData.learningRate,
          batch_size: formData.batchSize,
          max_seq_length: formData.maxSeqLength,
          num_steps: formData.numSteps ? parseInt(formData.numSteps) : null,
          eval_interval: formData.evalInterval,
          lora_rank: formData.loraRank,
          lora_alpha: formData.loraAlpha
        },
        hardware: formData.hardware,
        precision: formData.precision
      }

      const estimate = await felafaxService.estimateCost(request)
      setCostEstimate(estimate)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to estimate cost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEstimating(false)
    }
  }

  const startFineTuning = async () => {
    if (!formData.model || !formData.dataset) {
      toast({
        title: "Error",
        description: "Please select a model and dataset.",
        variant: "destructive",
      })
      return
    }

    try {
      const request: FineTuningRequest = {
        model: formData.model,
        dataset: formData.dataset,
        config: {
          learning_rate: formData.learningRate,
          batch_size: formData.batchSize,
          max_seq_length: formData.maxSeqLength,
          num_steps: formData.numSteps ? parseInt(formData.numSteps) : null,
          eval_interval: formData.evalInterval,
          lora_rank: formData.loraRank,
          lora_alpha: formData.loraAlpha
        },
        hardware: formData.hardware,
        precision: formData.precision
      }

      const result = await felafaxService.startFineTuning(request)
      
      toast({
        title: "Success",
        description: `Fine-tuning job started with ID: ${result.job_id}`,
      })

      // Reset form and switch to jobs tab
      setFormData({
        ...formData,
        model: "",
        dataset: "",
        description: ""
      })
      setCostEstimate(null)
      setActiveTab("jobs")
      fetchJobs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start fine-tuning job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      await felafaxService.cancelJob(jobId)
      toast({
        title: "Success",
        description: "Job cancelled successfully.",
      })
      fetchJobs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.dataset.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || job.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "running":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Training</Badge>
            <Progress value={progress} className="w-16" />
          </div>
        )
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "running":
        return <Activity className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <StopCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status.toLowerCase() === "completed").length,
    running: jobs.filter(j => j.status.toLowerCase() === "running").length,
    pending: jobs.filter(j => j.status.toLowerCase() === "pending").length,
    failed: jobs.filter(j => j.status.toLowerCase() === "failed").length,
  }

  const getHardwareIcon = (hardware: HardwareType) => {
    switch (hardware) {
      case HardwareType.TPU:
        return <Cpu className="h-4 w-4 text-purple-500" />
      case HardwareType.TRAINIUM:
        return <Cpu className="h-4 w-4 text-blue-500" />
      case HardwareType.GPU:
        return <Cpu className="h-4 w-4 text-green-500" />
      case HardwareType.AMD:
        return <Cpu className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Felafax Fine-Tuning</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Advanced fine-tuning with Felafax framework - optimized for TPU, Trainium, and AMD GPUs
          </p>
        </div>
        <Button onClick={() => setActiveTab("create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Felafax Job
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
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold">{stats.running}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
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
        {hardwareMetrics && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                  <p className="text-2xl font-bold">{hardwareMetrics.cpu_usage.toFixed(1)}%</p>
                </div>
                <Cpu className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hardware Metrics */}
      {hardwareMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Hardware Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">CPU Usage</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={hardwareMetrics.cpu_usage} className="flex-1" />
                  <span className="text-sm font-medium">{hardwareMetrics.cpu_usage.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Memory Usage</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={hardwareMetrics.memory_usage} className="flex-1" />
                  <span className="text-sm font-medium">{hardwareMetrics.memory_usage.toFixed(1)}%</span>
                </div>
              </div>
              {hardwareMetrics.gpu_usage && (
                <div>
                  <Label className="text-sm text-gray-600">GPU Usage</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={hardwareMetrics.gpu_usage} className="flex-1" />
                    <span className="text-sm font-medium">{hardwareMetrics.gpu_usage.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm text-gray-600">Disk Usage</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={hardwareMetrics.disk_usage} className="flex-1" />
                  <span className="text-sm font-medium">{hardwareMetrics.disk_usage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="create">Create Job</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
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
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
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
                  <p className="text-gray-600">Loading Felafax jobs...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job.job_id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(job.status)}
                          <h3 className="font-semibold">{job.model}</h3>
                          {getStatusBadge(job.status, job.progress)}
                          <div className="flex items-center gap-1">
                            {getHardwareIcon(job.hardware)}
                            <span className="text-sm text-gray-500">{job.hardware}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Dataset:</span> {job.dataset}
                          </div>
                          <div>
                            <span className="font-medium">Progress:</span> {job.progress.toFixed(1)}%
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Precision:</span> {job.precision}
                          </div>
                        </div>

                        {job.progress > 0 && job.progress < 100 && (
                          <div className="mt-3">
                            <Progress value={job.progress} className="w-full" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {job.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelJob(job.job_id)}
                          >
                            <StopCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // View job details
                            toast({
                              title: "Job Details",
                              description: `Viewing details for job ${job.job_id}`,
                            })
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredJobs.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No Felafax jobs found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("create")}
                      >
                        Create your first job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Job Configuration</CardTitle>
                <CardDescription>
                  Configure your Felafax fine-tuning job parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData({...formData, model: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name} - {model.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dataset">Dataset</Label>
                  <Input
                    id="dataset"
                    placeholder="e.g., yahma/alpaca-cleaned"
                    value={formData.dataset}
                    onChange={(e) => setFormData({...formData, dataset: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hardware">Hardware</Label>
                    <Select value={formData.hardware} onValueChange={(value: HardwareType) => setFormData({...formData, hardware: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={HardwareType.TPU}>TPU (Recommended)</SelectItem>
                        <SelectItem value={HardwareType.TRAINIUM}>Trainium</SelectItem>
                        <SelectItem value={HardwareType.GPU}>GPU</SelectItem>
                        <SelectItem value={HardwareType.AMD}>AMD GPU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="precision">Precision</Label>
                    <Select value={formData.precision} onValueChange={(value: ModelPrecision) => setFormData({...formData, precision: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ModelPrecision.BFLOAT16}>bfloat16</SelectItem>
                        <SelectItem value={ModelPrecision.FLOAT32}>float32</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="learningRate">Learning Rate</Label>
                    <Input
                      id="learningRate"
                      type="number"
                      step="0.00001"
                      value={formData.learningRate}
                      onChange={(e) => setFormData({...formData, learningRate: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Input
                      id="batchSize"
                      type="number"
                      value={formData.batchSize}
                      onChange={(e) => setFormData({...formData, batchSize: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxSeqLength">Max Sequence Length</Label>
                    <Input
                      id="maxSeqLength"
                      type="number"
                      value={formData.maxSeqLength}
                      onChange={(e) => setFormData({...formData, maxSeqLength: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="numSteps">Number of Steps (optional)</Label>
                    <Input
                      id="numSteps"
                      type="number"
                      placeholder="Leave empty for full dataset"
                      value={formData.numSteps}
                      onChange={(e) => setFormData({...formData, numSteps: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loraRank">LoRA Rank</Label>
                    <Input
                      id="loraRank"
                      type="number"
                      value={formData.loraRank}
                      onChange={(e) => setFormData({...formData, loraRank: parseInt(e.target.value)})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="loraAlpha">LoRA Alpha</Label>
                    <Input
                      id="loraAlpha"
                      type="number"
                      value={formData.loraAlpha}
                      onChange={(e) => setFormData({...formData, loraAlpha: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional job description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={estimateCost}
                    disabled={isEstimating || !formData.model}
                  >
                    {isEstimating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4 mr-2" />
                    )}
                    Estimate Cost
                  </Button>
                  
                  <Button 
                    onClick={startFineTuning}
                    disabled={!formData.model || !formData.dataset}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Estimate
                </CardTitle>
                <CardDescription>
                  Estimated cost and duration for your training job
                </CardDescription>
              </CardHeader>
              <CardContent>
                {costEstimate ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Estimated Cost</Label>
                        <p className="text-2xl font-bold text-green-600">
                          ${costEstimate.estimated_cost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Duration</Label>
                        <p className="text-2xl font-bold text-blue-600">
                          {costEstimate.duration_hours.toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Hardware Type:</span>
                        <span className="font-medium">{costEstimate.hardware_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cost per Hour:</span>
                        <span className="font-medium">${costEstimate.cost_per_hour.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Training on TPUs can save up to 30% compared to GPUs 
                        while providing better performance for large models.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Configure your job and click "Estimate Cost"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <Card key={model.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <CardDescription>{model.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Supported Hardware</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.hardware.map((hw) => (
                          <Badge key={hw} variant="outline" className="text-xs">
                            {hw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Supported Precision</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.precision.map((prec) => (
                          <Badge key={prec} variant="outline" className="text-xs">
                            {prec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setFormData({...formData, model: model.name})
                        setActiveTab("create")
                      }}
                    >
                      Use This Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}