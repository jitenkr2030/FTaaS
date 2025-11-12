import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiMonitoringService } from '@/lib/api-monitoring'

// GET /api/api-monitoring - Get API monitoring dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboardData = await ApiMonitoringService.getDashboardData()

    return NextResponse.json({ dashboardData })
  } catch (error) {
    console.error('Error fetching API monitoring data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API monitoring data' },
      { status: 500 }
    )
  }
}

// POST /api/api-monitoring/health-check - Perform health checks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const healthChecks = await ApiMonitoringService.performHealthChecks()
    
    // Create alerts for any issues found
    await ApiMonitoringService.createApiAlerts()

    return NextResponse.json({ healthChecks })
  } catch (error) {
    console.error('Error performing health checks:', error)
    return NextResponse.json(
      { error: 'Failed to perform health checks' },
      { status: 500 }
    )
  }
}