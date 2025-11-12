import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiModelService, ModelInferenceRequest } from '@/lib/ai-models'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { modelId, messages, temperature, maxTokens, stream, tools, toolChoice } = body

    if (!modelId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        error: 'Model ID and messages are required' 
      }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare inference request
    const inferenceRequest: ModelInferenceRequest = {
      modelId,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature,
      maxTokens,
      stream: stream || false,
      tools,
      toolChoice
    }

    // Perform inference
    const response = await aiModelService.getModelInference(inferenceRequest, user.id)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in model inference:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Token limit exceeded')) {
        return NextResponse.json({ 
          error: 'Token limit exceeded for this billing period' 
        }, { status: 429 })
      }
      
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get available models
    const models = await aiModelService.getAvailableModels(user.id)

    return NextResponse.json(models)
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}