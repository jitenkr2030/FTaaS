"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Brain, 
  Zap, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle,
  Plus,
  ExternalLink,
  Loader2,
  DollarSign,
  BarChart3
} from "lucide-react"

interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  parameters: {
    contextLength: number
    maxTokens: number
    supportsStreaming: boolean
    supportsJson: boolean
    supportsVision: boolean
  }
  pricing: {
    input: number
    output: number
  }
  capabilities: string[]
}

export function EnhancedModelBrowser() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("all")
  const [selectedCapability, setSelectedCapability] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/models/inference')
      
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      } else {
        throw new Error('Failed to fetch models')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load AI models. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProvider = selectedProvider === "all" || model.provider.toLowerCase() === selectedProvider.toLowerCase()
    const matchesCapability = selectedCapability === "all" || model.capabilities.includes(selectedCapability)
    
    return matchesSearch && matchesProvider && matchesCapability
  })

  const providers = ["all", ...new Set(models.map(m => m.provider))]
  const capabilities = ["all", ...new Set(models.flatMap(m => m.capabilities))]

  const handleTestModel = async (modelId: string) => {
    try {
      const response = await fetch('/api/models/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          messages: [
            { role: 'user', content: 'Hello! Can you help me with a simple task?' }
          ],
          maxTokens: 100
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Test Successful",
          description: `Model responded with ${result.usage.totalTokens} tokens used.`,
        })
      } else {
        throw new Error('Test failed')
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test the model. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEstimateCost = async (modelId: string) => {
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'estimate_cost',
          estimatedTokens: 1000
        }),
      })

      if (response.ok) {
        const cost = await response.json()
        toast({
          title: "Cost Estimate",
          description: `Estimated cost for 1K tokens: $${cost.totalCost.toFixed(4)}`,
        })
      } else {
        throw new Error('Cost estimation failed')
      }
    } catch (error) {
      toast({
        title: "Estimation Failed",
        description: "Failed to estimate cost. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRequestCustomModel = () => {
    toast({
      title: "Custom Model Request",
      description: "Custom model request form will be implemented soon.",
    })
  }

  const formatPricing = (pricing: { input: number; output: number }) => {
    return `$${pricing.input.toFixed(3)}/$${pricing.output.toFixed(3)} per 1K tokens (input/output)`
  }

  const formatContextLength = (length: number) => {
    if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K`
    }
    return length.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Models</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose from a wide range of pre-trained models for fine-tuning and inference
          </p>
        </div>
        <Button onClick={handleRequestCustomModel} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Request Custom Model
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Capability" />
                </SelectTrigger>
                <SelectContent>
                  {capabilities.map(capability => (
                    <SelectItem key={capability} value={capability}>
                      {capability.charAt(0).toUpperCase() + capability.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <Card key={model.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    {model.name}
                  </CardTitle>
                  <CardDescription>{model.provider}</CardDescription>
                </div>
                <Badge variant="default">
                  {model.provider}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {model.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>{formatContextLength(model.parameters.contextLength)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>{model.parameters.maxTokens} max</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatPricing(model.pricing)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.slice(0, 3).map((capability, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                  {model.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{model.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-2">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Context Length:</strong> {formatContextLength(model.parameters.contextLength)} tokens</p>
                    <p className="text-sm"><strong>Max Tokens:</strong> {model.parameters.maxTokens}</p>
                    <p className="text-sm"><strong>Streaming:</strong> {model.parameters.supportsStreaming ? 'Yes' : 'No'}</p>
                    <p className="text-sm"><strong>JSON Mode:</strong> {model.parameters.supportsJson ? 'Yes' : 'No'}</p>
                    <p className="text-sm"><strong>Vision:</strong> {model.parameters.supportsVision ? 'Yes' : 'No'}</p>
                  </div>
                </TabsContent>
                <TabsContent value="capabilities" className="mt-2">
                  <div className="space-y-1">
                    {model.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{capability}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1"
                  onClick={() => handleTestModel(model.id)}
                >
                  Test Model
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEstimateCost(model.id)}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No models found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}