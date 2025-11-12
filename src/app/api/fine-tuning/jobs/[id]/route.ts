import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fineTuningService } from '@/lib/fine-tuning'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get fine-tuning job
    const job = await fineTuningService.getFineTuningJob(params.id, user.id)

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error getting fine-tuning job:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Cancel fine-tuning job
    await fineTuningService.cancelFineTuningJob(params.id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling fine-tuning job:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let result
    switch (action) {
      case 'pause':
        result = await fineTuningService.pauseFineTuningJob(params.id, user.id)
        break
      case 'start':
        result = await fineTuningService.resumeFineTuningJob(params.id, user.id)
        break
      case 'stop':
        result = await fineTuningService.cancelFineTuningJob(params.id, user.id)
        break
      case 'retry':
        result = await fineTuningService.retryFineTuningJob(params.id, user.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating fine-tuning job:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'get_events') {
      // Get user from database
      const user = await db.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Get fine-tuning job events
      const events = await fineTuningService.getFineTuningJobEvents(params.id, user.id)
      return NextResponse.json(events)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing fine-tuning job request:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}