import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MonitoringService } from '@/lib/monitoring'
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client'
import { z } from 'zod'

const createAlertSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(AlertType),
  severity: z.nativeEnum(AlertSeverity),
  condition: z.any(),
  metadata: z.any().optional(),
})

const triggerAlertSchema = z.object({
  alertId: z.string(),
  message: z.string(),
  metadata: z.any().optional(),
})

const resolveAlertSchema = z.object({
  alertId: z.string(),
  message: z.string().optional(),
})

// GET /api/monitoring/alerts - Get alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AlertStatus | undefined
    const type = searchParams.get('type') as AlertType | undefined
    const severity = searchParams.get('severity') as AlertSeverity | undefined

    let alerts
    if (status === 'active') {
      alerts = await MonitoringService.getActiveAlerts()
    } else {
      // For now, return active alerts by default
      alerts = await MonitoringService.getActiveAlerts()
    }

    // Filter by type and severity if specified
    let filteredAlerts = alerts
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type)
    }
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity)
    }

    return NextResponse.json({ alerts: filteredAlerts })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if it's a trigger or resolve action
    if (body.action === 'trigger') {
      const validatedData = triggerAlertSchema.parse(body)
      const alertHistory = await MonitoringService.triggerAlert(
        validatedData.alertId,
        validatedData.message,
        validatedData.metadata
      )
      return NextResponse.json({ alertHistory })
    }

    if (body.action === 'resolve') {
      const validatedData = resolveAlertSchema.parse(body)
      await MonitoringService.resolveAlert(validatedData.alertId, validatedData.message)
      return NextResponse.json({ success: true })
    }

    // Create new alert
    const validatedData = createAlertSchema.parse(body)
    const alert = await MonitoringService.createAlert(validatedData)

    return NextResponse.json({ alert })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error with alert operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform alert operation' },
      { status: 500 }
    )
  }
}