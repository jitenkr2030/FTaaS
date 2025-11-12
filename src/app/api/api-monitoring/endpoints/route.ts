import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiMonitoringService } from '@/lib/api-monitoring'

// GET /api/api-monitoring/endpoints - Get API endpoints summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const endpoints = await ApiMonitoringService.getApiEndpointsSummary()

    return NextResponse.json({ endpoints })
  } catch (error) {
    console.error('Error fetching API endpoints:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API endpoints' },
      { status: 500 }
    )
  }
}