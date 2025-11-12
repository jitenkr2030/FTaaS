import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnomalyDetectionService } from '@/lib/anomaly-detection'

// GET /api/monitoring/anomaly-config - Get anomaly detection configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await AnomalyDetectionService.getAnomalyConfig(session.user.id)
    
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching anomaly config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch anomaly config' },
      { status: 500 }
    )
  }
}

// PUT /api/monitoring/anomaly-config - Update anomaly detection configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const config = await AnomalyDetectionService.updateAnomalyConfig(
      session.user.id,
      body
    )

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating anomaly config:', error)
    return NextResponse.json(
      { error: 'Failed to update anomaly config' },
      { status: 500 }
    )
  }
}