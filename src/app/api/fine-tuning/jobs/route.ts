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

    // Create fine-tuning job
    const result = await fineTuningService.createFineTuningJob(
      user.id,
      datasetId,
      baseModelId,
      config || {}
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating fine-tuning job:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('limit exceeded')) {
        return NextResponse.json({ 
          error: error.message 
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // List fine-tuning jobs
    const jobs = await fineTuningService.listFineTuningJobs(user.id, limit, offset)

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error listing fine-tuning jobs:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}