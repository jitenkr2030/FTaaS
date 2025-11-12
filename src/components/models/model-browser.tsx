"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Zap, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle,
  Plus,
  ExternalLink
} from "lucide-react"

const mockModels = [
  {
    id: "1",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most capable model, great for complex reasoning and creative tasks",
    category: "General Purpose",
    parameters: "1.5T",
    contextLength: "128K",
    pricing: "$0.03/1K tokens",
    rating: 4.9,
    popularity: "High",
    features: ["Code generation", "Reasoning", "Creative writing", "Multi-language"],
    useCases: ["Customer support", "Content creation", "Code assistance", "Research"]
  },
  {
    id: "2",
    name: "Claude 3",
    provider: "Anthropic",
    description: "Balanced performance with strong reasoning and helpfulness",
    category: "General Purpose",
    parameters: "Unknown",
    contextLength: "200K",
    pricing: "$0.015/1K tokens",
    rating: 4.8,
    popularity: "High",
    features: ["Long context", "Reasoning", "Helpful", "Safe"],
    useCases: ["Document analysis", "Research", "Writing assistance", "Customer support"]
  },
  {
    id: "3",
    name: "LLaMA 3",
    provider: "Meta",
    description: "Open-source model with strong performance across many tasks",
    category: "Open Source",
    parameters: "70B",
    contextLength: "8K",
    pricing: "$0.001/1K tokens",
    rating: 4.6,
    popularity: "Medium",
    features: ["Open source", "Efficient", "Multi-task", "Customizable"],
    useCases: ["Custom applications", "Research", "Education", "Prototyping"]
  },
  {
    id: "4",
    name: "Mistral 7B",
    provider: "Mistral AI",
    description: "Lightweight and efficient model for fast inference",
    category: "Efficiency",
    parameters: "7B",
    contextLength: "32K",
    pricing: "$0.0002/1K tokens",
    rating: 4.4,
    popularity: "Medium",
    features: ["Fast", "Efficient", "Lightweight", "Cost-effective"],
    useCases: ["Real-time applications", "Mobile apps", "Edge computing", "Prototyping"]
  },
  {
    id: "5",
    name: "Falcon 40B",
    provider: "TII",
    description: "High-performance open-source model optimized for inference",
    category: "Open Source",
    parameters: "40B",
    contextLength: "2K",
    pricing: "$0.0008/1K tokens",
    rating: 4.5,
    popularity: "Low",
    features: ["Open source", "High performance", "Optimized", "Scalable"],
    useCases: ["Enterprise applications", "Research", "Custom deployments", "Large-scale projects"]
  },
  {
    id: "6",
    name: "Code Llama",
    provider: "Meta",
    description: "Specialized model for code generation and understanding",
    category: "Code",
    parameters: "34B",
    contextLength: "100K",
    pricing: "$0.002/1K tokens",
    rating: 4.7,
    popularity: "High",
    features: ["Code generation", "Code completion", "Documentation", "Debugging"],
    useCases: ["Software development", "Code review", "Documentation", "Learning"]
  }
]

export function ModelBrowser() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState("all")

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || model.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesProvider = selectedProvider === "all" || model.provider.toLowerCase() === selectedProvider.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesProvider
  })

  const categories = ["all", ...new Set(mockModels.map(m => m.category))]
  const providers = ["all", ...new Set(mockModels.map(m => m.provider))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Models</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose from a wide range of pre-trained models for fine-tuning
          </p>
        </div>
        <Button className="flex items-center gap-2">
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Badge variant={model.popularity === "High" ? "default" : "secondary"}>
                  {model.popularity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {model.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{model.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>{model.parameters}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>{model.contextLength}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Pricing: {model.pricing}</p>
                <div className="flex flex-wrap gap-1">
                  {model.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {model.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{model.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-2">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Category:</strong> {model.category}</p>
                    <p className="text-sm"><strong>Context Length:</strong> {model.contextLength}</p>
                    <p className="text-sm"><strong>Parameters:</strong> {model.parameters}</p>
                  </div>
                </TabsContent>
                <TabsContent value="use-cases" className="mt-2">
                  <div className="space-y-1">
                    {model.useCases.map((useCase, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1">
                  Fine-tune Model
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