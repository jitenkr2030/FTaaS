import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnomalyDetectionService } from '@/lib/anomaly-detection'

// GET /api/monitoring/anomalies - Get recent anomalies
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
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const anomalies = await AnomalyDetectionService.getRecentAnomalies(
      fineTunedModelId,
      { start, end: now }
    )

    return NextResponse.json({ anomalies })
  } catch (error) {
    console.error('Error fetching anomalies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch anomalies' },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/anomalies - Run anomaly detection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fineTunedModelId, config } = body

    if (!fineTunedModelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }

    await AnomalyDetectionService.runAnomalyDetection(fineTunedModelId, config)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error running anomaly detection:', error)
    return NextResponse.json(
      { error: 'Failed to run anomaly detection' },
      { status: 500 }
    )
  }
}