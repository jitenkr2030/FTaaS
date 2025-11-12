import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId') || 'default-user-id' // In real app, get from auth

    let whereClause: any = { userId }
    
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const evaluations = await db.evaluation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        fineTunedModel: {
          select: { id: true, name, modelId, status }
        },
        baseModel: {
          select: { id: true, name, provider, modelId }
        },
        job: {
          select: { id: true, name, status }
        }
      }
    })

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      fineTunedModelId, 
      baseModelId, 
      testSamples,
      jobId 
    } = body
    const userId = 'default-user-id' // In real app, get from auth

    if (!name || !fineTunedModelId || !baseModelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify models exist and user has access
    const fineTunedModel = await db.fineTunedModel.findUnique({
      where: { id: fineTunedModelId }
    })

    const baseModel = await db.baseModel.findUnique({
      where: { id: baseModelId }
    })

    if (!fineTunedModel || !baseModel) {
      return NextResponse.json(
        { error: 'One or both models not found' },
        { status: 404 }
      )
    }

    if (fineTunedModel.userId !== userId) {
      return NextResponse.json(
        { error: 'Fine-tuned model not owned by user' },
        { status: 403 }
      )
    }

    const evaluation = await db.evaluation.create({
      data: {
        name,
        description,
        fineTunedModelId,
        baseModelId,
        userId,
        jobId,
        metrics: {},
        testResults: []
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        fineTunedModel: {
          select: { id: true, name, modelId, status }
        },
        baseModel: {
          select: { id: true, name, provider, modelId }
        }
      }
    })

    // Simulate evaluation process - in real app, this would be a background job
    setTimeout(async () => {
      // Simulate evaluation progress
      const evaluationInterval = setInterval(async () => {
        const currentEvaluation = await db.evaluation.findUnique({
          where: { id: evaluation.id }
        })

        if (!currentEvaluation) {
          clearInterval(evaluationInterval)
          return
        }

        const currentMetrics = currentEvaluation.metrics || {}
        const progress = Math.min((currentMetrics.progress || 0) + 20, 100)
        
        await db.evaluation.update({
          where: { id: evaluation.id },
          data: {
            metrics: {
              ...currentMetrics,
              progress,
              bleu: 0.7 + (Math.random() * 0.2),
              rouge: 0.6 + (Math.random() * 0.3),
              perplexity: 10 + (Math.random() * 10),
              accuracy: 0.8 + (Math.random() * 0.15),
              responseTime: 1 + (Math.random() * 2),
              humanPreference: 0.7 + (Math.random() * 0.25)
            }
          }
        })

        if (progress >= 100) {
          clearInterval(evaluationInterval)
          
          // Generate sample test results
          const sampleTestResults = [
            {
              prompt: "What is the capital of France?",
              baseResponse: "The capital of France is Paris.",
              fineTunedResponse: "Paris is the capital and most populous city of France.",
              winner: "fine-tuned",
              reason: "More detailed and informative"
            },
            {
              prompt: "How do I bake a cake?",
              baseResponse: "Mix ingredients and bake in oven.",
              fineTunedResponse: "To bake a cake, first preheat your oven to 350°F. Then mix flour, sugar, eggs, and butter in a bowl. Pour into a pan and bake for 30-35 minutes.",
              winner: "fine-tuned",
              reason: "More comprehensive instructions"
            }
          ]

          await db.evaluation.update({
            where: { id: evaluation.id },
            data: {
              metrics: {
                ...currentEvaluation.metrics,
                progress: 100,
                bleu: 0.8234,
                rouge: 0.7891,
                perplexity: 12.45,
                accuracy: 0.912,
                responseTime: 1.23,
                humanPreference: 0.87
              },
              testResults: sampleTestResults
            }
          })
        }
      }, 1000)
    }, 2000)

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    )
  }
}