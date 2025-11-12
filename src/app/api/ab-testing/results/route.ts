import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/ab-testing'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const result = await ABTestingService.recordResult({
      testId: data.testId,
      variantId: data.variantId,
      userId: session.user.id,
      sessionId: data.sessionId,
      metrics: data.metrics,
      conversion: data.conversion,
      revenue: data.revenue,
      metadata: data.metadata
    })
    
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error recording A/B test result:', error)
    return NextResponse.json(
      { error: 'Failed to record A/B test result' },
      { status: 500 }
    )
  }
}