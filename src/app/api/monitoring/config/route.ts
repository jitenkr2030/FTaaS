import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MonitoringService } from '@/lib/monitoring'
import { z } from 'zod'

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  metrics: z.any().optional(),
  alerts: z.any().optional(),
  notifications: z.any().optional(),
  retentionDays: z.number().min(1).max(365).optional(),
})

// GET /api/monitoring/config - Get monitoring configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await MonitoringService.getMonitoringConfig(session.user.id)
    
    if (!config) {
      // Return default configuration
      return NextResponse.json({
        config: {
          enabled: true,
          metrics: {
            thresholds: {
              latency: { warning: 1000, critical: 5000 },
              errorRate: { warning: 5, critical: 10 },
              cost: { warning: 100, critical: 500 },
              throughput: { min: 10 },
              availability: { min: 99 }
            }
          },
          alerts: {
            enabled: true,
            channels: ['email', 'in_app']
          },
          notifications: {
            email: true,
            in_app: true,
            webhook: false
          },
          retentionDays: 30
        }
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching monitoring config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring config' },
      { status: 500 }
    )
  }
}

// PUT /api/monitoring/config - Update monitoring configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateConfigSchema.parse(body)

    const config = await MonitoringService.updateMonitoringConfig(
      session.user.id,
      validatedData
    )

    return NextResponse.json({ config })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating monitoring config:', error)
    return NextResponse.json(
      { error: 'Failed to update monitoring config' },
      { status: 500 }
    )
  }
}