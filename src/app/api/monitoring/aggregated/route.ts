import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MonitoringService } from '@/lib/monitoring'

// GET /api/monitoring/aggregated - Get aggregated metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fineTunedModelId = searchParams.get('fineTunedModelId')
    const timeRange = searchParams.get('timeRange') || '24h'

    if (!fineTunedModelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }

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
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const aggregatedMetrics = await MonitoringService.getAggregatedMetrics(
      fineTunedModelId,
      { start, end: now }
    )

    return NextResponse.json({ aggregatedMetrics })
  } catch (error) {
    console.error('Error fetching aggregated metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch aggregated metrics' },
      { status: 500 }
    )
  }
}