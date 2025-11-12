import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/ab-testing'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 })
    }

    const stats = await ABTestingService.getTestStats(testId)
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching A/B test stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B test stats' },
      { status: 500 }
    )
  }
}