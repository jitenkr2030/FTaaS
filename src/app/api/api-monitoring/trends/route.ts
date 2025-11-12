import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiMonitoringService } from '@/lib/api-monitoring'

// GET /api/api-monitoring/trends - Get API trend analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    // Calculate time range
    const now = new Date()
    let start: Date
    switch (timeRange) {
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const trends = await ApiMonitoringService.getApiTrendAnalysis({ start, end: now })

    return NextResponse.json({ trends })
  } catch (error) {
    console.error('Error fetching API trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API trends' },
      { status: 500 }
    )
  }
}