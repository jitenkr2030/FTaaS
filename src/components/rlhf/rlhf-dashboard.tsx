"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Brain, 
  Users, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Target,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Database,
  MessageSquare,
  Award,
  Activity,
  Layers,
  GitBranch,
  Lightbulb,
  Zap as Bolt,
  Cpu,
  Network,
  Scale,
  Balance
} from "lucide-react"

interface HumanFeedback {
  id: string
  modelId: string
  prompt: string
  response: string
  rating: number // 1-5 scale
  feedback: string
  categories: {
    accuracy: number
    helpfulness: number
    clarity: number
    relevance: number
  }
  userId: string
  createdAt: string
  status: "pending" | "processed" | "used_in_training"
}

interface PreferenceLearningTask {
  id: string
  name: string
  description: string
  modelId: string
  status: "collecting" | "training" | "completed" | "failed"
  progress: number
  pairsCollected: number
  targetPairs: number
  improvement: number
  createdAt: string
  completedAt?: string
}

interface RLHFTrainingJob {
  id: string
  name: string
  baseModelId: string
  feedbackDatasetId: string
  status: "pending" | "training" | "evaluating" | "completed" | "failed"
  progress: number
  currentEpoch: number
  totalEpochs: number
  metrics: {
    loss: number
    reward: number
    accuracy: number
    kl_divergence: number
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
}

interface FeedbackSession {
  id: string
  name: string
  description: string
  modelId: string
  isActive: boolean
  promptCount: number
  feedbackCount: number
  createdAt: string
  lastActivity?: string
}

const mockHumanFeedback: HumanFeedback[] = [
  {
    id: "1",
    modelId: "model-1",
    prompt: "How do I reset my password?",
    response: "To reset your password, go to the login page and click 'Forgot Password'. Follow the instructions sent to your email.",
    rating: 4,
    feedback: "Good response, but could be more detailed about the email process.",
    categories: {
      accuracy: 0.9,
      helpfulness: 0.8,
      clarity: 0.9,
      relevance: 0.95
    },
    userId: "user-1",
    createdAt: "2024-01-22T10:00:00Z",
    status: "processed"
  },
  {
    id: "2",
    modelId: "model-1",
    prompt: "What are your business hours?",
    response: "Our business hours are Monday through Friday, 9 AM to 6 PM EST.",
    rating: 5,
    feedback: "Perfect! Clear and concise.",
    categories: {
      accuracy: 1.0,
      helpfulness: 1.0,
      clarity: 1.0,
      relevance: 1.0
    },
    userId: "user-2",
    createdAt: "2024-01-22T10:30:00Z",
    status: "used_in_training"
  },
  {
    id: "3",
    modelId: "model-2",
    prompt: "Explain quantum computing",
    response: "Quantum computing is a type of computation that harnesses quantum mechanical phenomena like superposition and entanglement to process information in fundamentally different ways than classical computers.",
    rating: 3,
    feedback: "Too technical for a general audience. Need simpler explanation.",
    categories: {
      accuracy: 0.8,
      helpfulness: 0.6,
      clarity: 0.5,
      relevance: 0.7
    },
    userId: "user-3",
    createdAt: "2024-01-22T11:00:00Z",
    status: "pending"
  }
]

const mockPreferenceTasks: PreferenceLearningTask[] = [
  {
    id: "1",
    name: "Customer Support Preference Learning",
    description: "Collect preferences for customer support responses",
    modelId: "model-1",
    status: "collecting",
    progress: 65,
    pairsCollected: 650,
    targetPairs: 1000,
    improvement: 0.12,
    createdAt: "2024-01-20T09:00:00Z"
  },
  {
    id: "2",
    name: "Code Review Preferences",
    description: "Learn preferences for code review feedback",
    modelId: "model-2",
    status: "training",
    progress: 30,
    pairsCollected: 500,
    targetPairs: 500,
    improvement: 0.08,
    createdAt: "2024-01-18T14:00:00Z"
  },
  {
    id: "3",
    name: "Content Summarization Preferences",
    description: "Preference learning for content summarization",
    modelId: "model-3",
    status: "completed",
    progress: 100,
    pairsCollected: 800,
    targetPairs: 800,
    improvement: 0.18,
    createdAt: "2024-01-15T10:00:00Z",
    completedAt: "2024-01-21T16:30:00Z"
  }
]

const mockRLHFJobs: RLHFTrainingJob[] = [
  {
    id: "1",
    name: "Customer Support RLHF Training",
    baseModelId: "model-1",
    feedbackDatasetId: "dataset-1",
    status: "training",
    progress: 45,
    currentEpoch: 3,
    totalEpochs: 5,
    metrics: {
      loss: 0.234,
      reward: 0.876,
      accuracy: 0.892,
      kl_divergence: 0.045
    },
    createdAt: "2024-01-20T10:00:00Z",
    startedAt: "2024-01-20T10:05:00Z"
  },
  {
    id: "2",
    name: "Code Review RLHF Training",
    baseModelId: "model-2",
    feedbackDatasetId: "dataset-2",
    status: "completed",
    progress: 100,
    currentEpoch: 5,
    totalEpochs: 5,
    metrics: {
      loss: 0.156,
      reward: 0.923,
      accuracy: 0.934,
      kl_divergence: 0.032
    },
    createdAt: "2024-01-18T09:00:00Z",
    startedAt: "2024-01-18T09:05:00Z",
    completedAt: "2024-01-21T14:30:00Z"
  }
]

const mockFeedbackSessions: FeedbackSession[] = [
  {
    id: "1",
    name: "Customer Support Feedback",
    description: "Collect feedback on customer support responses",
    modelId: "model-1",
    isActive: true,
    promptCount: 150,
    feedbackCount: 89,
    createdAt: "2024-01-20T09:00:00Z",
    lastActivity: "2024-01-22T10:30:00Z"
  },
  {
    id: "2",
    name: "Technical Documentation Feedback",
    description: "Feedback on technical documentation generation",
    modelId: "model-3",
    isActive: false,
    promptCount: 75,
    feedbackCount: 45,
    createdAt: "2024-01-18T14:00:00Z",
    lastActivity: "2024-01-21T16:20:00Z"
  }
]

export function RLHFDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [feedback, setFeedback] = useState<HumanFeedback[]>(mockHumanFeedback)
  const [preferenceTasks, setPreferenceTasks] = useState<PreferenceLearningTask[]>(mockPreferenceTasks)
  const [rlhfJobs, setRlhfJobs] = useState<RLHFTrainingJob[]>(mockRLHFJobs)
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>(mockFeedbackSessions)
  const [loading, setLoading] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState("")
  const { toast } = useToast()

  const stats = {
    totalFeedback: feedback.length,
    avgRating: feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length || 0,
    activeTasks: preferenceTasks.filter(t => t.status === "collecting" || t.status === "training").length,
    completedJobs: rlhfJobs.filter(j => j.status === "completed").length,
    activeSessions: feedbackSessions.filter(s => s.isActive).length
  }

  const handleSubmitFeedback = async (feedbackData: Partial<HumanFeedback>) => {
    setLoading(true)
    try {
      const newFeedback: HumanFeedback = {
        id: Date.now().toString(),
        modelId: "model-1",
        prompt: feedbackData.prompt || "",
        response: feedbackData.response || "",
        rating: selectedRating,
        feedback: feedbackText,
        categories: {
          accuracy: Math.random(),
          helpfulness: Math.random(),
          clarity: Math.random(),
          relevance: Math.random()
        },
        userId: "current-user",
        createdAt: new Date().toISOString(),
        status: "pending"
      }

      setFeedback([newFeedback, ...feedback])
      
      // Update session feedback count
      setFeedbackSessions(prev => prev.map(session => 
        session.isActive 
          ? { ...session, feedbackCount: session.feedbackCount + 1, lastActivity: new Date().toISOString() }
          : session
      ))

      setSelectedRating(0)
      setFeedbackText("")

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It will be used to improve the model.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartPreferenceTask = async (taskName: string) => {
    setLoading(true)
    try {
      const newTask: PreferenceLearningTask = {
        id: Date.now().toString(),
        name: taskName,
        description: "New preference learning task",
        modelId: "model-1",
        status: "collecting",
        progress: 0,
        pairsCollected: 0,
        targetPairs: 1000,
        improvement: 0,
        createdAt: new Date().toISOString()
      }

      setPreferenceTasks([newTask, ...preferenceTasks])
      
      toast({
        title: "Task Started",
        description: "Preference learning task has been started successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start preference task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartRLHFTraining = async (jobName: string) => {
    setLoading(true)
    try {
      const newJob: RLHFTrainingJob = {
        id: Date.now().toString(),
        name: jobName,
        baseModelId: "model-1",
        feedbackDatasetId: "dataset-1",
        status: "pending",
        progress: 0,
        currentEpoch: 0,
        totalEpochs: 5,
        metrics: {
          loss: 0,
          reward: 0,
          accuracy: 0,
          kl_divergence: 0
        },
        createdAt: new Date().toISOString()
      }

      setRlhfJobs([newJob, ...rlhfJobs])
      
      // Simulate training start
      setTimeout(() => {
        setRlhfJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: "training" as const, progress: 10, startedAt: new Date().toISOString() }
            : job
        ))
      }, 1000)

      toast({
        title: "Training Started",
        description: "RLHF training job has been started successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start RLHF training. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "processed":
      case "used_in_training":
      case "active":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "training":
      case "collecting":
        return <Badge variant="secondary">In Progress</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RLHF Studio</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Reinforcement Learning from Human Feedback - Train models with human preferences
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Training Job
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.totalFeedback}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-2xl font-bold">{stats.completedJobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Human Feedback</TabsTrigger>
          <TabsTrigger value="preferences">Preference Learning</TabsTrigger>
          <TabsTrigger value="training">RLHF Training</TabsTrigger>
          <TabsTrigger value="sessions">Feedback Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Training Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Active RLHF Training</CardTitle>
              <CardDescription>
                Currently running reinforcement learning training jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rlhfJobs.filter(job => job.status === "training").map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold">{job.name}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">{job.progress}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Epoch</p>
                            <p className="font-medium">{job.currentEpoch}/{job.totalEpochs}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Loss</p>
                            <p className="font-medium">{job.metrics.loss.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Reward</p>
                            <p className="font-medium">{job.metrics.reward.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Human Feedback</CardTitle>
              <CardDescription>
                Latest feedback collected from human evaluators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.slice(0, 3).map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">{getRatingStars(item.rating)}</div>
                          {getStatusBadge(item.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">Prompt:</p>
                        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2">
                          {item.prompt}
                        </p>
                        <p className="text-sm font-medium mb-1">Response:</p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2">
                          {item.response}
                        </p>
                        {item.feedback && (
                          <p className="text-sm text-gray-600 italic">
                            "{item.feedback}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Feedback Collection Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                Provide feedback on model responses to improve training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Model Response</label>
                  <Textarea 
                    placeholder="Paste the model response here..."
                    className="min-h-[100px]"
                    value="To reset your password, go to the login page and click 'Forgot Password'. Follow the instructions sent to your email."
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-6 w-6 cursor-pointer ${
                          rating <= selectedRating 
                            ? "text-yellow-500 fill-current" 
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                        onClick={() => setSelectedRating(rating)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Detailed Feedback</label>
                  <Textarea 
                    placeholder="Provide specific feedback about the response..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Accuracy</label>
                    <Select defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Helpfulness</label>
                    <Select defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Clarity</label>
                    <Select defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Relevance</label>
                    <Select defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSubmitFeedback({})}
                  disabled={selectedRating === 0 || loading}
                >
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedback History */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback History</CardTitle>
              <CardDescription>
                View all collected human feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">{getRatingStars(item.rating)}</div>
                          {getStatusBadge(item.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">Prompt:</p>
                        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2">
                          {item.prompt}
                        </p>
                        <p className="text-sm font-medium mb-1">Response:</p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2">
                          {item.response}
                        </p>
                        {item.feedback && (
                          <>
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm text-gray-600 italic mb-2">
                              "{item.feedback}"
                            </p>
                          </>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Accuracy</p>
                            <p className="font-medium">{(item.categories.accuracy * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Helpfulness</p>
                            <p className="font-medium">{(item.categories.helpfulness * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Clarity</p>
                            <p className="font-medium">{(item.categories.clarity * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Relevance</p>
                            <p className="font-medium">{(item.categories.relevance * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preference Learning Tasks</CardTitle>
                  <CardDescription>
                    Train models to learn human preferences through comparative feedback
                  </CardDescription>
                </div>
                <Button onClick={() => handleStartPreferenceTask("New Preference Task")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferenceTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="h-5 w-5 text-purple-500" />
                          <h3 className="text-lg font-semibold">{task.name}</h3>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {task.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">{task.progress}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pairs Collected</p>
                            <p className="font-medium">{task.pairsCollected}/{task.targetPairs}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Improvement</p>
                            <p className="font-medium text-green-600">+{(task.improvement * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created</p>
                            <p className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {task.status === "collecting" && (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Start Training
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>RLHF Training Jobs</CardTitle>
                  <CardDescription>
                    Train models using reinforcement learning from human feedback
                  </CardDescription>
                </div>
                <Button onClick={() => handleStartRLHFTraining("New RLHF Job")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rlhfJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold">{job.name}</h3>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">{job.progress}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Epoch</p>
                            <p className="font-medium">{job.currentEpoch}/{job.totalEpochs}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Loss</p>
                            <p className="font-medium">{job.metrics.loss.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Reward</p>
                            <p className="font-medium">{job.metrics.reward.toFixed(3)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Accuracy</p>
                            <p className="font-medium">{(job.metrics.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">KL Divergence</p>
                            <p className="font-medium">{job.metrics.kl_divergence.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Started</p>
                            <p className="font-medium">
                              {job.startedAt ? new Date(job.startedAt).toLocaleString() : "Not started"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created</p>
                            <p className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {job.status === "pending" && (
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {job.status === "training" && (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feedback Sessions</CardTitle>
                  <CardDescription>
                    Manage feedback collection sessions and campaigns
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-orange-500" />
                          <h3 className="text-lg font-semibold">{session.name}</h3>
                          <Badge variant={session.isActive ? "default" : "outline"}>
                            {session.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {session.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Prompts</p>
                            <p className="font-medium">{session.promptCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Feedback</p>
                            <p className="font-medium">{session.feedbackCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Response Rate</p>
                            <p className="font-medium">
                              {session.promptCount > 0 
                                ? ((session.feedbackCount / session.promptCount) * 100).toFixed(1) + "%"
                                : "0%"
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Last Activity</p>
                            <p className="font-medium">
                              {session.lastActivity 
                                ? new Date(session.lastActivity).toLocaleDateString()
                                : "Never"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Switch 
                          checked={session.isActive}
                          onCheckedChange={(checked) => {
                            setFeedbackSessions(prev => prev.map(s => 
                              s.id === session.id 
                                ? { ...s, isActive: checked }
                                : s
                            ))
                          }}
                        />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}