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
    
    const variant = await ABTestingService.assignVariant(
      data.testId,
      session.user.id,
      data.sessionId
    )
    
    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error assigning A/B test variant:', error)
    return NextResponse.json(
      { error: 'Failed to assign A/B test variant' },
      { status: 500 }
    )
  }
}