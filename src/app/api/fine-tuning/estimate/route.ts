import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fineTuningService } from '@/lib/fine-tuning'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { datasetId, baseModelId, config } = await request.json()
    
    if (!datasetId || !baseModelId) {
      return NextResponse.json({ 
        error: 'Dataset ID and base model ID are required' 
      }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get cost estimate
    const estimate = await fineTuningService.getFineTuningCostEstimate(
      datasetId,
      baseModelId,
      config || {}
    )

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Error estimating fine-tuning cost:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}