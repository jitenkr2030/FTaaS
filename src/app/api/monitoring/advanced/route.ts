import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdvancedMetricsService } from '@/lib/advanced-metrics'

// GET /api/monitoring/advanced - Get advanced metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate time range
    const now = new Date()
    let start: Date
    switch (timeRange) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const advancedMetrics = await AdvancedMetricsService.calculateAdvancedMetrics(
      session.user.id,
      { start, end: now }
    )

    return NextResponse.json({ advancedMetrics })
  } catch (error) {
    console.error('Error fetching advanced metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advanced metrics' },
      { status: 500 }
    )
  }
}