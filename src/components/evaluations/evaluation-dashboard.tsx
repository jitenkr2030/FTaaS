"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Download, 
  RefreshCw, 
  Play,
  Pause,
  Plus,
  Target,
  Zap,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"

const mockEvaluations = [
  {
    id: "1",
    name: "Customer Support Bot Evaluation",
    description: "Comparing fine-tuned GPT-4 vs base model for customer support",
    fineTunedModel: "GPT-4 Customer Support",
    baseModel: "GPT-4",
    status: "COMPLETED",
    progress: 100,
    testSamples: 1000,
    createdAt: "2024-01-21T15:30:00Z",
    completedAt: "2024-01-21T16:45:00Z",
    metrics: {
      bleu: 0.8234,
      rouge: 0.7891,
      perplexity: 12.45,
      accuracy: 0.912,
      responseTime: 1.23,
      humanPreference: 0.87
    },
    comparison: {
      fineTunedWins: 723,
      baseWins: 198,
      ties: 79
    },
    testResults: [
      {
        prompt: "How do I reset my password?",
        baseResponse: "To reset your password, go to the login page and click 'Forgot Password'.",
        fineTunedResponse: "To reset your password, please follow these steps: 1. Go to the login page, 2. Click on 'Forgot Password', 3. Enter your email address, 4. Check your email for reset instructions.",
        winner: "fine-tuned",
        reason: "More detailed and helpful"
      },
      {
        prompt: "What are your business hours?",
        baseResponse: "Our business hours are 9 AM to 6 PM.",
        fineTunedResponse: "Our business hours are Monday through Friday, 9 AM to 6 PM EST. We're closed on weekends and holidays.",
        winner: "fine-tuned",
        reason: "More comprehensive information"
      }
    ]
  },
  {
    id: "2",
    name: "Code Review Assistant Evaluation",
    description: "Evaluating LLaMA-3 fine-tuned for code review tasks",
    fineTunedModel: "LLaMA-3 Code Review",
    baseModel: "LLaMA-3",
    status: "RUNNING",
    progress: 65,
    testSamples: 500,
    createdAt: "2024-01-22T10:00:00Z",
    startedAt: "2024-01-22T10:05:00Z",
    metrics: {
      bleu: 0.7456,
      rouge: 0.7123,
      perplexity: 15.67,
      accuracy: 0.856,
      responseTime: 2.34,
      humanPreference: 0.72
    },
    comparison: {
      fineTunedWins: 289,
      baseWins: 156,
      ties: 55
    },
    testResults: []
  },
  {
    id: "3",
    name: "Medical Summarizer Evaluation",
    description: "Comparing Mistral fine-tuned model for medical text summarization",
    fineTunedModel: "Mistral Medical Summarizer",
    baseModel: "Mistral 7B",
    status: "PENDING",
    progress: 0,
    testSamples: 200,
    createdAt: "2024-01-23T09:00:00Z",
    metrics: {},
    comparison: {
      fineTunedWins: 0,
      baseWins: 0,
      ties: 0
    },
    testResults: []
  },
  {
    id: "4",
    name: "Product Description Generator",
    description: "Evaluating GPT-4 fine-tuned for e-commerce product descriptions",
    fineTunedModel: "GPT-4 Product Descriptions",
    baseModel: "GPT-4",
    status: "FAILED",
    progress: 30,
    testSamples: 300,
    createdAt: "2024-01-20T14:00:00Z",
    startedAt: "2024-01-20T14:05:00Z",
    errorMessage: "Evaluation timeout error",
    metrics: {},
    comparison: {
      fineTunedWins: 45,
      baseWins: 38,
      ties: 7
    },
    testResults: []
  }
]

export function EvaluationDashboard() {
  const [activeTab, setActiveTab] = useState("evaluations")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredEvaluations = mockEvaluations.filter(evaluation => {
    const matchesSearch = evaluation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || evaluation.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "RUNNING":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Running</Badge>
            <Progress value={progress} className="w-16" />
          </div>
        )
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>
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
      case "RUNNING":
        return <BarChart3 className="h-4 w-4 text-blue-500" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "FAILED":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = {
    total: mockEvaluations.length,
    completed: mockEvaluations.filter(e => e.status === "COMPLETED").length,
    running: mockEvaluations.filter(e => e.status === "RUNNING").length,
    pending: mockEvaluations.filter(e => e.status === "PENDING").length,
    failed: mockEvaluations.filter(e => e.status === "FAILED").length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Model Evaluations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Compare and evaluate your fine-tuned models against base models
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Evaluation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
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
              <BarChart3 className="h-8 w-8 text-yellow-500" />
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
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="compare">Compare Models</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search evaluations..."
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
                  <option value="RUNNING">Running</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation List */}
          <div className="space-y-4">
            {filteredEvaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(evaluation.status)}
                        <h3 className="text-lg font-semibold">{evaluation.name}</h3>
                        {getStatusBadge(evaluation.status, evaluation.progress)}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {evaluation.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          {evaluation.fineTunedModel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          vs {evaluation.baseModel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {evaluation.testSamples} test samples
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {evaluation.createdAt}
                        </span>
                      </div>
                      
                      {evaluation.errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                          <p className="text-sm text-red-600">
                            <AlertCircle className="inline h-4 w-4 mr-1" />
                            {evaluation.errorMessage}
                          </p>
                        </div>
                      )}
                      
                      {evaluation.status === "COMPLETED" && evaluation.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">BLEU</p>
                            <p className="font-semibold">{evaluation.metrics.bleu.toFixed(3)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">ROUGE</p>
                            <p className="font-semibold">{evaluation.metrics.rouge.toFixed(3)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Perplexity</p>
                            <p className="font-semibold">{evaluation.metrics.perplexity.toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Accuracy</p>
                            <p className="font-semibold">{(evaluation.metrics.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Response Time</p>
                            <p className="font-semibold">{evaluation.metrics.responseTime}s</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Human Pref.</p>
                            <p className="font-semibold">{(evaluation.metrics.humanPreference * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      )}
                      
                      {evaluation.status === "COMPLETED" && evaluation.comparison && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-3">
                          <h4 className="font-medium mb-2">Comparison Results</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-green-600">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="font-semibold">{evaluation.comparison.fineTunedWins}</span>
                              </div>
                              <p className="text-sm text-gray-500">Fine-tuned Wins</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-red-600">
                                <ThumbsDown className="h-4 w-4" />
                                <span className="font-semibold">{evaluation.comparison.baseWins}</span>
                              </div>
                              <p className="text-sm text-gray-500">Base Wins</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-gray-600">
                                <span className="font-semibold">{evaluation.comparison.ties}</span>
                              </div>
                              <p className="text-sm text-gray-500">Ties</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {evaluation.status === "RUNNING" && (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {evaluation.status === "PENDING" && (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {evaluation.status === "FAILED" && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      {evaluation.status === "COMPLETED" && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Tabs defaultValue="overview" className="mt-4">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="comparison">Comparison</TabsTrigger>
                      <TabsTrigger value="samples">Test Samples</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{evaluation.progress}%</p>
                          <p className="text-sm text-gray-500">Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{evaluation.testSamples}</p>
                          <p className="text-sm text-gray-500">Test Samples</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{evaluation.comparison.fineTunedWins}</p>
                          <p className="text-sm text-gray-500">Fine-tuned Wins</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{evaluation.comparison.baseWins}</p>
                          <p className="text-sm text-gray-500">Base Wins</p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="metrics" className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                        {evaluation.metrics && Object.keys(evaluation.metrics).length > 0 ? (
                          <pre className="text-sm">
                            {JSON.stringify(evaluation.metrics, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-gray-500">No metrics available yet</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="comparison" className="mt-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                        {evaluation.comparison && (
                          <pre className="text-sm">
                            {JSON.stringify(evaluation.comparison, null, 2)}
                          </pre>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="samples" className="mt-4">
                      <div className="space-y-4">
                        {evaluation.testResults.length > 0 ? (
                          evaluation.testResults.map((result, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                              <div className="mb-3">
                                <p className="font-medium mb-1">Prompt:</p>
                                <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded">{result.prompt}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium mb-1 flex items-center gap-1">
                                    <Target className="h-4 w-4" />
                                    Base Model:
                                  </p>
                                  <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded">{result.baseResponse}</p>
                                </div>
                                <div>
                                  <p className="font-medium mb-1 flex items-center gap-1">
                                    <Zap className="h-4 w-4" />
                                    Fine-tuned Model:
                                  </p>
                                  <p className="text-sm bg-white dark:bg-gray-700 p-2 rounded">{result.fineTunedResponse}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <Badge variant={result.winner === "fine-tuned" ? "default" : "secondary"}>
                                  Winner: {result.winner}
                                </Badge>
                                <span className="text-sm text-gray-500">{result.reason}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No test samples available yet</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvaluations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No evaluations found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Evaluation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Comparison</CardTitle>
              <CardDescription>
                Compare multiple fine-tuned models side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Model comparison interface will be implemented here. This will include:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Side-by-side model comparison</li>
                <li>Interactive testing interface</li>
                <li>Real-time performance metrics</li>
                <li>Human evaluation tools</li>
                <li>Export comparison results</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Leaderboard</CardTitle>
              <CardDescription>
                View top-performing models across different metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Leaderboard interface will be implemented here. This will show:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Ranked list of fine-tuned models</li>
                <li>Performance metrics and scores</li>
                <li>Filtering by category and use case</li>
                <li>Trending models</li>
                <li>Detailed model profiles</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}