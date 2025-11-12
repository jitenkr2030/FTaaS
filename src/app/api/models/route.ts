import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { aiModelService } from '@/lib/ai-models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const provider = searchParams.get('provider')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')

    let whereClause: any = { isActive: true }
    
    if (category && category !== 'all') {
      whereClause.category = category
    }
    
    if (provider && provider !== 'all') {
      whereClause.provider = provider
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get available models from AI service
    const availableModels = await aiModelService.getAvailableModels(userId || undefined)
    
    // Filter based on search parameters
    let filteredModels = availableModels
    
    if (provider && provider !== 'all') {
      filteredModels = filteredModels.filter(model => model.provider === provider)
    }
    
    if (search) {
      filteredModels = filteredModels.filter(model => 
        model.name.toLowerCase().includes(search.toLowerCase()) ||
        model.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Also get models from database for any custom models
    const dbModels = await db.baseModel.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    // Combine both sources
    const allModels = [
      ...filteredModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        description: model.description,
        modelId: model.id,
        parameters: model.parameters,
        isActive: true,
        isCustom: false,
        category: model.capabilities.join(','),
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      ...dbModels.map(model => ({
        ...model,
        isCustom: true
      }))
    ]

    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, provider, modelId, parameters } = body

    if (!name || !provider || !modelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if model already exists in AI service
    const existingModel = await aiModelService.getModelDetails(modelId)
    if (existingModel) {
      return NextResponse.json(
        { error: 'Model already exists in AI service' },
        { status: 400 }
      )
    }

    const model = await db.baseModel.create({
      data: {
        name,
        description,
        provider,
        modelId,
        parameters: parameters || {},
        isActive: true
      }
    })

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
}