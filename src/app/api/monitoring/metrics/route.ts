import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MonitoringService } from '@/lib/monitoring'
import { MetricType } from '@prisma/client'
import { z } from 'zod'

const createMetricSchema = z.object({
  fineTunedModelId: z.string(),
  deploymentId: z.string().optional(),
  metricType: z.nativeEnum(MetricType),
  value: z.number(),
  unit: z.string().optional(),
  metadata: z.any().optional(),
})

const batchMetricsSchema = z.object({
  metrics: z.array(createMetricSchema),
})

// GET /api/monitoring/metrics - Get metrics for a model
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fineTunedModelId = searchParams.get('fineTunedModelId')
    const metricType = searchParams.get('metricType') as MetricType | undefined
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

    const metrics = await MonitoringService.getModelMetrics(
      fineTunedModelId,
      metricType,
      { start, end: now }
    )

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

// POST /api/monitoring/metrics - Create a new metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if it's a batch request
    if (body.metrics && Array.isArray(body.metrics)) {
      const validatedData = batchMetricsSchema.parse(body)
      const metrics = await MonitoringService.createModelMetrics(validatedData.metrics)
      return NextResponse.json({ metrics })
    }

    // Single metric request
    const validatedData = createMetricSchema.parse(body)
    const metric = await MonitoringService.createModelMetric(validatedData)

    // Check thresholds and trigger alerts if needed
    const config = await MonitoringService.getMonitoringConfig(session.user.id)
    if (config?.enabled && config.metrics?.thresholds) {
      await MonitoringService.checkThresholds(
        validatedData.fineTunedModelId,
        config.metrics.thresholds
      )
    }

    return NextResponse.json({ metric })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating metric:', error)
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    )
  }
}