import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MonitoringService } from '@/lib/monitoring'
import { HealthStatus } from '@prisma/client'
import { z } from 'zod'

const createHealthSchema = z.object({
  component: z.string(),
  status: z.nativeEnum(HealthStatus),
  message: z.string().optional(),
  metrics: z.any().optional(),
})

// GET /api/monitoring/health - Get system health status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const health = await MonitoringService.getSystemHealth()
    return NextResponse.json({ health })
  } catch (error) {
    console.error('Error fetching health status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health status' },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/health - Record system health status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createHealthSchema.parse(body)
    
    const health = await MonitoringService.recordSystemHealth(validatedData)

    // Check for critical health issues and create alerts
    if (validatedData.status === HealthStatus.CRITICAL) {
      await MonitoringService.triggerAlert(
        `health-critical-${validatedData.component}`,
        `Critical health issue detected: ${validatedData.message || 'Unknown issue'}`,
        { component: validatedData.component, status: validatedData.status }
      )
    }

    return NextResponse.json({ health })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error recording health status:', error)
    return NextResponse.json(
      { error: 'Failed to record health status' },
      { status: 500 }
    )
  }
}