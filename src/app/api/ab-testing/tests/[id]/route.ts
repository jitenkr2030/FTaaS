import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/ab-testing'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await ABTestingService.getTest(params.id)
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user owns the test
    if (test.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    return NextResponse.json({ test })
  } catch (error) {
    console.error('Error fetching A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B test' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    
    const test = await ABTestingService.getTest(params.id)
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if user owns the test
    if (test.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let updatedTest
    switch (action) {
      case 'start':
        updatedTest = await ABTestingService.startTest(params.id)
        break
      case 'pause':
        updatedTest = await ABTestingService.pauseTest(params.id)
        break
      case 'complete':
        updatedTest = await ABTestingService.completeTest(params.id)
        break
      case 'cancel':
        updatedTest = await ABTestingService.cancelTest(params.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json({ test: updatedTest })
  } catch (error) {
    console.error('Error updating A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to update A/B test' },
      { status: 500 }
    )
  }
}