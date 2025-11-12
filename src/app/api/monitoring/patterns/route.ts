import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnomalyDetectionService } from '@/lib/anomaly-detection'

// GET /api/monitoring/patterns - Get detected patterns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fineTunedModelId = searchParams.get('fineTunedModelId')
    const timeRange = searchParams.get('timeRange') || '7d'

    if (!fineTunedModelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }

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

    const patterns = await AnomalyDetectionService.detectPatterns(
      fineTunedModelId,
      { start, end: now }
    )

    return NextResponse.json({ patterns })
  } catch (error) {
    console.error('Error fetching patterns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    )
  }
}