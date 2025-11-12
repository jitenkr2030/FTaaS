"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Download,
  RefreshCw,
  Settings,
  Zap,
  Brain,
  MessageSquare,
  Code,
  FileText
} from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatProps {
  onModelResponse?: (response: string) => void
}

export function AIChat({ onModelResponse }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with fine-tuning models, analyzing datasets, or answering questions about AI. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)

  const models = [
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and capable for most tasks" },
    { id: "gpt-4", name: "GPT-4", description: "Most capable model for complex reasoning" },
    { id: "claude-3", name: "Claude 3", description: "Balanced performance with helpfulness" },
    { id: "llama-3", name: "LLaMA 3", description: "Open-source model with strong performance" }
  ]

  const prompts = [
    {
      category: "Fine-tuning",
      items: [
        "How do I prepare my dataset for fine-tuning?",
        "What hyperparameters should I use for my model?",
        "How can I evaluate my fine-tuned model?",
        "What's the best way to prevent overfitting?"
      ]
    },
    {
      category: "Dataset Analysis",
      items: [
        "Analyze my dataset quality",
        "Suggest data preprocessing steps",
        "Help me format my training data",
        "Check for data bias in my dataset"
      ]
    },
    {
      category: "Model Selection",
      items: [
        "Which model is best for my use case?",
        "Compare GPT-4 vs LLaMA-3 for my task",
        "What are the costs of different models?",
        "How do I choose the right model size?"
      ]
    }
  ]

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an AI assistant specializing in fine-tuning language models. Provide helpful, accurate, and concise responses about AI model training, dataset preparation, and model evaluation.' },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: input }
          ],
          model: selectedModel,
          temperature,
          maxTokens: maxTokens
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      if (onModelResponse) {
        onModelResponse(data.choices[0].message.content)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. I can help you with fine-tuning models, analyzing datasets, or answering questions about AI. How can I assist you today?',
        timestamp: new Date()
      }
    ])
  }

  const exportChat = () => {
    const chatData = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }))
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Get help with fine-tuning, dataset analysis, and AI model questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4">
              {/* Quick Prompts */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Quick Prompts</h4>
                <div className="space-y-2">
                  {prompts.map((category) => (
                    <div key={category.category}>
                      <p className="text-xs font-medium text-gray-600 mb-1">{category.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {category.items.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(prompt)}
                            className="text-xs"
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <span className="text-xs text-gray-500">
                          {message.role === 'user' ? 'You' : selectedModel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                          className="h-4 w-4 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs text-gray-500">AI Assistant</span>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-100">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about fine-tuning AI models..."
                  className="resize-none"
                  rows={3}
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  className="self-end"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearChat}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportChat}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  Model: {models.find(m => m.id === selectedModel)?.name}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-gray-500">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls randomness: Lower values are more focused, higher values more creative
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                  <Input
                    type="number"
                    min="1"
                    max="4000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum length of the generated response
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Tips for Better Results</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Be specific about your fine-tuning goals</li>
                    <li>• Provide context about your dataset</li>
                    <li>• Ask for code examples when helpful</li>
                    <li>• Follow up with clarification questions</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}