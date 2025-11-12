import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiMonitoringService } from '@/lib/api-monitoring'

// GET /api/api-monitoring/performance - Get API performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    // Calculate time range
    const now = new Date()
    let start: Date
    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const performance = await ApiMonitoringService.getApiPerformanceMetrics({ start, end: now })

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Error fetching API performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API performance' },
      { status: 500 }
    )
  }
}