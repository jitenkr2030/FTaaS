import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'

// Initialize AI provider clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Model providers and their configurations
export interface ModelProvider {
  name: string
  models: AIModel[]
  api: any
}

export interface AIModel {
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
    input: number // per 1K tokens
    output: number // per 1K tokens
  }
  capabilities: string[]
}

export interface ModelInferenceRequest {
  modelId: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: any[]
  toolChoice?: any
}

export interface ModelInferenceResponse {
  id: string
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  timestamp: Date
}

// Available AI models
export const aiModels: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable model, great for complex reasoning and creative tasks',
    parameters: {
      contextLength: 128000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: false
    },
    pricing: {
      input: 0.03,
      output: 0.06
    },
    capabilities: ['reasoning', 'creative', 'code', 'analysis']
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Latest GPT-4 model with improved capabilities and lower cost',
    parameters: {
      contextLength: 128000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: true
    },
    pricing: {
      input: 0.01,
      output: 0.03
    },
    capabilities: ['reasoning', 'creative', 'code', 'analysis', 'vision']
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and capable model for most tasks',
    parameters: {
      contextLength: 16385,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: false
    },
    pricing: {
      input: 0.0005,
      output: 0.0015
    },
    capabilities: ['chat', 'code', 'analysis']
  },
  // Anthropic Models
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable Claude model for complex tasks',
    parameters: {
      contextLength: 200000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: true
    },
    pricing: {
      input: 0.015,
      output: 0.075
    },
    capabilities: ['reasoning', 'creative', 'analysis', 'vision']
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed for most tasks',
    parameters: {
      contextLength: 200000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: true
    },
    pricing: {
      input: 0.003,
      output: 0.015
    },
    capabilities: ['chat', 'code', 'analysis', 'vision']
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model for quick responses',
    parameters: {
      contextLength: 200000,
      maxTokens: 4096,
      supportsStreaming: true,
      supportsJson: true,
      supportsVision: true
    },
    pricing: {
      input: 0.00025,
      output: 0.00125
    },
    capabilities: ['chat', 'quick-tasks']
  }
]

export class AIModelService {
  private providers: Map<string, ModelProvider> = new Map()

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize OpenAI provider
    this.providers.set('OpenAI', {
      name: 'OpenAI',
      models: aiModels.filter(model => model.provider === 'OpenAI'),
      api: openai
    })

    // Initialize Anthropic provider
    this.providers.set('Anthropic', {
      name: 'Anthropic',
      models: aiModels.filter(model => model.provider === 'Anthropic'),
      api: anthropic
    })
  }

  async getModelInference(
    request: ModelInferenceRequest,
    userId: string
  ): Promise<ModelInferenceResponse> {
    try {
      // Get model details
      const model = aiModels.find(m => m.id === request.modelId)
      if (!model) {
        throw new Error(`Model ${request.modelId} not found`)
      }

      // Check user's subscription and usage limits
      await this.checkUserLimits(userId, model)

      // Perform inference based on provider
      let response: ModelInferenceResponse

      switch (model.provider) {
        case 'OpenAI':
          response = await this.performOpenAIInference(request, model)
          break
        case 'Anthropic':
          response = await this.performAnthropicInference(request, model)
          break
        default:
          throw new Error(`Provider ${model.provider} not supported`)
      }

      // Log usage and update costs
      await this.logModelUsage(userId, request.modelId, response)

      return response
    } catch (error) {
      console.error('Error in model inference:', error)
      throw error
    }
  }

  private async performOpenAIInference(
    request: ModelInferenceRequest,
    model: AIModel
  ): Promise<ModelInferenceResponse> {
    const openai = this.providers.get('OpenAI')?.api

    if (!openai) {
      throw new Error('OpenAI provider not initialized')
    }

    const completion = await openai.chat.completions.create({
      model: request.modelId,
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || model.parameters.maxTokens,
      stream: request.stream || false,
      tools: request.tools,
      tool_choice: request.toolChoice
    })

    const message = completion.choices[0]?.message
    const usage = completion.usage

    if (!message || !usage) {
      throw new Error('Invalid response from OpenAI')
    }

    // Calculate cost
    const inputCost = (usage.prompt_tokens / 1000) * model.pricing.input
    const outputCost = (usage.completion_tokens / 1000) * model.pricing.output
    const totalCost = inputCost + outputCost

    return {
      id: completion.id,
      model: completion.model,
      content: message.content || '',
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: totalCost,
      timestamp: new Date()
    }
  }

  private async performAnthropicInference(
    request: ModelInferenceRequest,
    model: AIModel
  ): Promise<ModelInferenceResponse> {
    const anthropic = this.providers.get('Anthropic')?.api

    if (!anthropic) {
      throw new Error('Anthropic provider not initialized')
    }

    // Convert OpenAI format messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')

    const message = await anthropic.messages.create({
      model: request.modelId,
      max_tokens: request.maxTokens || model.parameters.maxTokens,
      temperature: request.temperature || 0.7,
      system: systemMessage?.content || undefined,
      messages: userMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      stream: request.stream || false
    })

    // Calculate cost (Anthropic uses different pricing structure)
    const inputTokens = message.usage?.input_tokens || 0
    const outputTokens = message.usage?.output_tokens || 0
    const inputCost = (inputTokens / 1000) * model.pricing.input
    const outputCost = (outputTokens / 1000) * model.pricing.output
    const totalCost = inputCost + outputCost

    return {
      id: message.id,
      model: message.model,
      content: message.content[0]?.text || '',
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      cost: totalCost,
      timestamp: new Date()
    }
  }

  private async checkUserLimits(userId: string, model: AIModel) {
    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      throw new Error('User subscription not found')
    }

    // Get current month's usage
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const usage = await db.apiUsage.aggregate({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        tokenCount: true
      }
    })

    const totalTokensUsed = usage._sum.tokenCount || 0

    // Check limits based on subscription plan
    let tokenLimit = 1000 // Free plan default

    switch (subscription.plan) {
      case 'PRO':
        tokenLimit = 100000
        break
      case 'ENTERPRISE':
        tokenLimit = 1000000 // 1M tokens for enterprise
        break
    }

    if (totalTokensUsed >= tokenLimit) {
      throw new Error('Token limit exceeded for this billing period')
    }
  }

  private async logModelUsage(
    userId: string,
    modelId: string,
    response: ModelInferenceResponse
  ) {
    // Log API usage
    await db.apiUsage.create({
      data: {
        userId,
        endpoint: 'model_inference',
        requestCount: 1,
        tokenCount: response.usage.totalTokens,
        cost: response.cost,
        date: new Date()
      }
    })

    // Update user's subscription usage if needed
    // This could trigger alerts or notifications
  }

  async getAvailableModels(userId?: string): Promise<AIModel[]> {
    if (!userId) {
      // Return all models for unauthenticated users (read-only)
      return aiModels
    }

    // Get user's subscription to filter available models
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      // Free users get limited models
      return aiModels.filter(model => model.id === 'gpt-3.5-turbo')
    }

    // All models available for paid subscribers
    return aiModels
  }

  async getModelDetails(modelId: string): Promise<AIModel | null> {
    return aiModels.find(model => model.id === modelId) || null
  }

  async estimateCost(
    modelId: string,
    estimatedTokens: number
  ): Promise<{ inputCost: number; outputCost: number; totalCost: number }> {
    const model = aiModels.find(m => m.id === modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    // Estimate 60% input tokens, 40% output tokens
    const inputTokens = Math.floor(estimatedTokens * 0.6)
    const outputTokens = Math.floor(estimatedTokens * 0.4)

    const inputCost = (inputTokens / 1000) * model.pricing.input
    const outputCost = (outputTokens / 1000) * model.pricing.output
    const totalCost = inputCost + outputCost

    return { inputCost, outputCost, totalCost }
  }

  async getUsageStats(userId: string, period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    const usage = await db.apiUsage.groupBy({
      by: ['date'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        tokenCount: true,
        cost: true
      },
      _count: {
        requestCount: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    return usage
  }
}

// Export singleton instance
export const aiModelService = new AIModelService()