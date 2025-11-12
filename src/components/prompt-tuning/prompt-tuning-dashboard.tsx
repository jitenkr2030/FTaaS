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
import { useToast } from "@/hooks/use-toast"
import { 
  Wand2, 
  Play, 
  Pause, 
  Save, 
  Copy, 
  Download, 
  Upload, 
  Settings, 
  BarChart3, 
  Target,
  Zap,
  Brain,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Code,
  MessageSquare,
  Lightbulb,
  Search
} from "lucide-react"

interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  template: string
  variables: string[]
  createdAt: string
  updatedAt: string
  performance?: {
    accuracy: number
    responseTime: number
    userSatisfaction: number
  }
}

interface PromptTest {
  id: string
  promptId: string
  input: string
  expectedOutput?: string
  actualOutput?: string
  score?: number
  status: "pending" | "running" | "completed" | "failed"
  createdAt: string
  completedAt?: string
}

interface OptimizationResult {
  id: string
  promptId: string
  originalPrompt: string
  optimizedPrompt: string
  improvement: number
  metrics: {
    clarity: number
    specificity: number
    effectiveness: number
    conciseness: number
  }
  createdAt: string
}

const mockPromptTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "Customer Support Response",
    description: "Generate helpful customer support responses",
    category: "Customer Service",
    template: "You are a helpful customer support agent. Please respond to the following customer query: {query}. Be empathetic, professional, and provide a clear solution. Response should be under 200 words.",
    variables: ["query"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    performance: {
      accuracy: 0.92,
      responseTime: 1.2,
      userSatisfaction: 0.88
    }
  },
  {
    id: "2",
    name: "Code Review Assistant",
    description: "Provide constructive code review feedback",
    category: "Development",
    template: "Review the following {language} code and provide feedback on: 1. Code quality and best practices 2. Potential bugs or issues 3. Performance optimizations 4. Security considerations. Code: {code}",
    variables: ["language", "code"],
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-22T11:15:00Z",
    performance: {
      accuracy: 0.89,
      responseTime: 2.1,
      userSatisfaction: 0.91
    }
  },
  {
    id: "3",
    name: "Content Summarizer",
    description: "Summarize long-form content effectively",
    category: "Content",
    template: "Summarize the following text in {word_count} words or less. Focus on key points, main arguments, and conclusions. Maintain the original tone and style. Text: {content}",
    variables: ["word_count", "content"],
    createdAt: "2024-01-17T13:45:00Z",
    updatedAt: "2024-01-21T16:20:00Z",
    performance: {
      accuracy: 0.85,
      responseTime: 1.8,
      userSatisfaction: 0.86
    }
  }
]

const mockPromptTests: PromptTest[] = [
  {
    id: "1",
    promptId: "1",
    input: "How do I reset my password?",
    expectedOutput: "A helpful response explaining password reset steps",
    actualOutput: "To reset your password, go to the login page and click 'Forgot Password'. Follow the instructions sent to your email.",
    score: 0.95,
    status: "completed",
    createdAt: "2024-01-20T10:00:00Z",
    completedAt: "2024-01-20T10:01:00Z"
  },
  {
    id: "2",
    promptId: "2",
    input: "def calculate_sum(a, b):\n    return a + b",
    expectedOutput: "Code review feedback mentioning simplicity and potential edge cases",
    status: "running",
    createdAt: "2024-01-22T14:00:00Z"
  }
]

const mockOptimizationResults: OptimizationResult[] = [
  {
    id: "1",
    promptId: "1",
    originalPrompt: "You are a customer support agent. Respond to: {query}",
    optimizedPrompt: "You are a helpful and empathetic customer support agent with 5+ years of experience. Please respond to the following customer query: {query}. Be professional, clear, and solution-oriented. Keep your response under 200 words and include specific action steps.",
    improvement: 0.25,
    metrics: {
      clarity: 0.92,
      specificity: 0.88,
      effectiveness: 0.95,
      conciseness: 0.85
    },
    createdAt: "2024-01-21T15:30:00Z"
  }
]

export function PromptTuningDashboard() {
  const [activeTab, setActiveTab] = useState("templates")
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [templates, setTemplates] = useState<PromptTemplate[]>(mockPromptTemplates)
  const [tests, setTests] = useState<PromptTest[]>(mockPromptTests)
  const [optimizations, setOptimizations] = useState<OptimizationResult[]>(mockOptimizationResults)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { toast } = useToast()

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...new Set(templates.map(t => t.category))]

  const handleCreateTemplate = async () => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name: "New Prompt Template",
      description: "Describe your prompt template",
      category: "General",
      template: "Your prompt template here with {variables}",
      variables: ["variables"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setTemplates([newTemplate, ...templates])
    setSelectedTemplate(newTemplate)
    
    toast({
      title: "Template Created",
      description: "New prompt template has been created successfully.",
    })
  }

  const handleSaveTemplate = async (template: PromptTemplate) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedTemplates = templates.map(t => 
        t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t
      )
      setTemplates(updatedTemplates)
      
      toast({
        title: "Template Saved",
        description: "Prompt template has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestPrompt = async (templateId: string, testInput: string) => {
    setLoading(true)
    try {
      const newTest: PromptTest = {
        id: Date.now().toString(),
        promptId: templateId,
        input: testInput,
        status: "running",
        createdAt: new Date().toISOString()
      }
      
      setTests([newTest, ...tests])
      
      // Simulate test execution
      setTimeout(() => {
        const updatedTest: PromptTest = {
          ...newTest,
          actualOutput: "This is a simulated response for testing purposes.",
          score: 0.85,
          status: "completed",
          completedAt: new Date().toISOString()
        }
        
        setTests(prev => prev.map(t => t.id === newTest.id ? updatedTest : t))
        
        toast({
          title: "Test Completed",
          description: "Prompt test has been completed successfully.",
        })
      }, 2000)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizePrompt = async (templateId: string) => {
    setLoading(true)
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return
      
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newOptimization: OptimizationResult = {
        id: Date.now().toString(),
        promptId: templateId,
        originalPrompt: template.template,
        optimizedPrompt: template.template + " [Optimized version with better clarity and specificity]",
        improvement: 0.15 + Math.random() * 0.2,
        metrics: {
          clarity: 0.85 + Math.random() * 0.15,
          specificity: 0.8 + Math.random() * 0.2,
          effectiveness: 0.85 + Math.random() * 0.15,
          conciseness: 0.75 + Math.random() * 0.25
        },
        createdAt: new Date().toISOString()
      }
      
      setOptimizations([newOptimization, ...optimizations])
      
      toast({
        title: "Optimization Complete",
        description: "Prompt has been optimized with 15-35% improvement.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "running":
        return <Badge variant="secondary">Running</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600"
    if (score >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prompt Tuning Studio</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Design, test, and optimize prompts for maximum performance
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold">{tests.filter(t => t.status === "running").length}</p>
              </div>
              <Play className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {templates.length > 0 
                    ? ((templates.reduce((sum, t) => sum + (t.performance?.accuracy || 0), 0) / templates.length) * 100).toFixed(1) + "%"
                    : "0%"
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Optimizations</p>
                <p className="text-2xl font-bold">{optimizations.length}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(c => c !== "all").map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Template List */}
          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                      
                      {template.performance && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Accuracy</p>
                            <p className={`font-semibold ${getPerformanceColor(template.performance.accuracy)}`}>
                              {(template.performance.accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Response Time</p>
                            <p className="font-semibold">{template.performance.responseTime}s</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Satisfaction</p>
                            <p className={`font-semibold ${getPerformanceColor(template.performance.userSatisfaction)}`}>
                              {(template.performance.userSatisfaction * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{template.name}</DialogTitle>
                            <DialogDescription>{template.description}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Prompt Template</label>
                              <Textarea 
                                value={template.template}
                                className="min-h-[200px] font-mono text-sm"
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Variables</label>
                              <div className="flex flex-wrap gap-2">
                                {template.variables.map((variable, index) => (
                                  <Badge key={index} variant="secondary">
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleTestPrompt(template.id, "Test input")}>
                                <Play className="h-4 w-4 mr-2" />
                                Test
                              </Button>
                              <Button onClick={() => handleOptimizePrompt(template.id)}>
                                <Zap className="h-4 w-4 mr-2" />
                                Optimize
                              </Button>
                              <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestPrompt(template.id, "Test input")}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOptimizePrompt(template.id)}
                        disabled={loading}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Optimize
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>
                Monitor and manage your prompt testing results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(test.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(test.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">Test Input:</p>
                        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {test.input}
                        </p>
                      </div>
                      {test.score && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Score</p>
                          <p className={`text-lg font-bold ${getPerformanceColor(test.score)}`}>
                            {(test.score * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {test.actualOutput && (
                      <div>
                        <p className="text-sm font-medium mb-2">Actual Output:</p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          {test.actualOutput}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
              <CardDescription>
                View prompt optimization results and improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizations.map((optimization) => (
                  <div key={optimization.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="h-5 w-5 text-purple-500" />
                          <span className="text-lg font-semibold">
                            {(optimization.improvement * 100).toFixed(1)}% Improvement
                          </span>
                          <Badge variant="outline">
                            {new Date(optimization.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Original Prompt</p>
                            <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-600">
                              {optimization.originalPrompt}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Optimized Prompt</p>
                            <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-700">
                              {optimization.optimizedPrompt}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Clarity</p>
                            <p className="font-semibold">{(optimization.metrics.clarity * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Specificity</p>
                            <p className="font-semibold">{(optimization.metrics.specificity * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Effectiveness</p>
                            <p className="font-semibold">{(optimization.metrics.effectiveness * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Conciseness</p>
                            <p className="font-semibold">{(optimization.metrics.conciseness * 100).toFixed(1)}%</p>
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Track prompt performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mr-2" />
                  Performance chart would be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Distribution of prompts by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.filter(c => c !== "all").map((category) => {
                    const count = templates.filter(t => t.category === category).length
                    const percentage = templates.length > 0 ? (count / templates.length) * 100 : 0
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span>{count} templates ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}