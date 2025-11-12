import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataExportService } from '@/lib/data-export'
import { z } from 'zod'

const exportSchema = z.object({
  dataType: z.enum(['metrics', 'health', 'alerts', 'api-metrics', 'comprehensive']),
  format: z.enum(['csv', 'json', 'xlsx']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metricTypes: z.array(z.string()).optional(),
  alertTypes: z.array(z.string()).optional(),
  alertSeverities: z.array(z.string()).optional(),
  modelIds: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
  includeHeaders: z.boolean().optional(),
  dateFormat: z.string().optional(),
  timezone: z.string().optional(),
  compression: z.boolean().optional(),
  chunkSize: z.number().optional(),
})

// POST /api/export - Export data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = exportSchema.parse(body)

    // Convert string dates to Date objects
    const filters: any = {
      format: validatedData.format,
      metricTypes: validatedData.metricTypes,
      alertTypes: validatedData.alertTypes,
      alertSeverities: validatedData.alertSeverities,
      modelIds: validatedData.modelIds,
      components: validatedData.components,
    }

    if (validatedData.startDate) {
      filters.startDate = new Date(validatedData.startDate)
    }

    if (validatedData.endDate) {
      filters.endDate = new Date(validatedData.endDate)
    }

    const options: any = {
      includeHeaders: validatedData.includeHeaders,
      dateFormat: validatedData.dateFormat,
      timezone: validatedData.timezone,
      compression: validatedData.compression,
      chunkSize: validatedData.chunkSize,
    }

    let result
    switch (validatedData.dataType) {
      case 'metrics':
        result = await DataExportService.exportModelMetrics(session.user.id, filters, options)
        break
      case 'health':
        result = await DataExportService.exportSystemHealth(session.user.id, filters, options)
        break
      case 'alerts':
        result = await DataExportService.exportAlerts(session.user.id, filters, options)
        break
      case 'api-metrics':
        result = await DataExportService.exportApiMetrics(session.user.id, filters, options)
        break
      case 'comprehensive':
        result = await DataExportService.exportComprehensiveReport(session.user.id, filters, options)
        break
      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }

    // Return the export result
    return NextResponse.json({
      success: true,
      export: {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size,
        recordCount: result.recordCount,
        exportTime: result.exportTime.toISOString(),
        downloadUrl: `/api/export/download/${result.filename}`
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}