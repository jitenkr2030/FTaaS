import { db } from '@/lib/db'
import { 
  ModelMetric, 
  SystemHealth, 
  Alert, 
  AlertHistory,
  ApiMetric,
  FineTunedModel,
  MetricType,
  HealthStatus,
  AlertType,
  AlertSeverity,
  AlertStatus
} from '@prisma/client'

export interface ExportFilters {
  startDate?: Date
  endDate?: Date
  metricTypes?: MetricType[]
  alertTypes?: AlertType[]
  alertSeverities?: AlertSeverity[]
  modelIds?: string[]
  components?: string[]
  format: 'csv' | 'json' | 'xlsx'
}

export interface ExportOptions {
  includeHeaders?: boolean
  dateFormat?: string
  timezone?: string
  compression?: boolean
  chunkSize?: number
}

export interface ExportResult {
  filename: string
  contentType: string
  data: string | Buffer
  size: number
  recordCount: number
  exportTime: Date
}

export class DataExportService {
  /**
   * Export model metrics data
   */
  static async exportModelMetrics(
    userId: string,
    filters: ExportFilters,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const whereClause: any = {
      fineTunedModel: {
        userId
      }
    }

    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {}
      if (filters.startDate) whereClause.timestamp.gte = filters.startDate
      if (filters.endDate) whereClause.timestamp.lte = filters.endDate
    }

    if (filters.metricTypes && filters.metricTypes.length > 0) {
      whereClause.metricType = {
        in: filters.metricTypes
      }
    }

    if (filters.modelIds && filters.modelIds.length > 0) {
      whereClause.fineTunedModelId = {
        in: filters.modelIds
      }
    }

    const metrics = await db.modelMetric.findMany({
      where: whereClause,
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true,
            modelId: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (filters.format === 'csv') {
      return this.exportToCSV(metrics, 'model_metrics', options)
    } else if (filters.format === 'xlsx') {
      return this.exportToExcel(metrics, 'model_metrics', options)
    } else {
      return this.exportToJSON(metrics, 'model_metrics', options)
    }
  }

  /**
   * Export system health data
   */
  static async exportSystemHealth(
    userId: string,
    filters: ExportFilters,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const whereClause: any = {}

    if (filters.startDate || filters.endDate) {
      whereClause.checkedAt = {}
      if (filters.startDate) whereClause.checkedAt.gte = filters.startDate
      if (filters.endDate) whereClause.checkedAt.lte = filters.endDate
    }

    if (filters.components && filters.components.length > 0) {
      whereClause.component = {
        in: filters.components
      }
    }

    const healthData = await db.systemHealth.findMany({
      where: whereClause,
      orderBy: {
        checkedAt: 'desc'
      }
    })

    if (filters.format === 'csv') {
      return this.exportToCSV(healthData, 'system_health', options)
    } else if (filters.format === 'xlsx') {
      return this.exportToExcel(healthData, 'system_health', options)
    } else {
      return this.exportToJSON(healthData, 'system_health', options)
    }
  }

  /**
   * Export alerts data
   */
  static async exportAlerts(
    userId: string,
    filters: ExportFilters,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const whereClause: any = {}

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {}
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate
    }

    if (filters.alertTypes && filters.alertTypes.length > 0) {
      whereClause.type = {
        in: filters.alertTypes
      }
    }

    if (filters.alertSeverities && filters.alertSeverities.length > 0) {
      whereClause.severity = {
        in: filters.alertSeverities
      }
    }

    const alerts = await db.alert.findMany({
      where: whereClause,
      include: {
        alertHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (filters.format === 'csv') {
      return this.exportToCSV(alerts, 'alerts', options)
    } else if (filters.format === 'xlsx') {
      return this.exportToExcel(alerts, 'alerts', options)
    } else {
      return this.exportToJSON(alerts, 'alerts', options)
    }
  }

  /**
   * Export API metrics data
   */
  static async exportApiMetrics(
    userId: string,
    filters: ExportFilters,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const whereClause: any = {}

    if (filters.startDate || filters.endDate) {
      whereClause.timestamp = {}
      if (filters.startDate) whereClause.timestamp.gte = filters.startDate
      if (filters.endDate) whereClause.timestamp.lte = filters.endDate
    }

    // For API metrics, we need to join with endpoints that belong to user's models
    const apiMetrics = await db.apiMetric.findMany({
      where: whereClause,
      include: {
        endpoint: {
          include: {
            // This would need to be adjusted based on your actual schema relationships
            // For now, we'll get all API metrics
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    if (filters.format === 'csv') {
      return this.exportToCSV(apiMetrics, 'api_metrics', options)
    } else if (filters.format === 'xlsx') {
      return this.exportToExcel(apiMetrics, 'api_metrics', options)
    } else {
      return this.exportToJSON(apiMetrics, 'api_metrics', options)
    }
  }

  /**
   * Export comprehensive report
   */
  static async exportComprehensiveReport(
    userId: string,
    filters: ExportFilters,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const [metrics, health, alerts] = await Promise.all([
      this.exportModelMetrics(userId, filters, { ...options, format: 'json' }),
      this.exportSystemHealth(userId, filters, { ...options, format: 'json' }),
      this.exportAlerts(userId, filters, { ...options, format: 'json' })
    ])

    const report = {
      exportDate: new Date().toISOString(),
      userId,
      filters,
      summary: {
        totalMetrics: metrics.recordCount,
        totalHealthChecks: health.recordCount,
        totalAlerts: alerts.recordCount
      },
      data: {
        metrics: JSON.parse(metrics.data as string),
        health: JSON.parse(health.data as string),
        alerts: JSON.parse(alerts.data as string)
      }
    }

    const reportData = JSON.stringify(report, null, 2)
    const filename = `comprehensive_report_${new Date().toISOString().split('T')[0]}.json`

    return {
      filename,
      contentType: 'application/json',
      data: reportData,
      size: Buffer.byteLength(reportData, 'utf8'),
      recordCount: metrics.recordCount + health.recordCount + alerts.recordCount,
      exportTime: new Date()
    }
  }

  /**
   * Export data to CSV format
   */
  private static async exportToCSV(
    data: any[],
    baseFilename: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (data.length === 0) {
      return {
        filename: `${baseFilename}_empty.csv`,
        contentType: 'text/csv',
        data: '',
        size: 0,
        recordCount: 0,
        exportTime: new Date()
      }
    }

    // Extract headers from first object
    const headers = Object.keys(data[0])
    const csvHeaders = options.includeHeaders !== false ? headers.join(',') : ''

    // Convert data to CSV rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Escape quotes and commas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    const filename = `${baseFilename}_${new Date().toISOString().split('T')[0]}.csv`

    return {
      filename,
      contentType: 'text/csv',
      data: csvContent,
      size: Buffer.byteLength(csvContent, 'utf8'),
      recordCount: data.length,
      exportTime: new Date()
    }
  }

  /**
   * Export data to JSON format
   */
  private static async exportToJSON(
    data: any[],
    baseFilename: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const jsonData = JSON.stringify(data, null, 2)
    const filename = `${baseFilename}_${new Date().toISOString().split('T')[0]}.json`

    return {
      filename,
      contentType: 'application/json',
      data: jsonData,
      size: Buffer.byteLength(jsonData, 'utf8'),
      recordCount: data.length,
      exportTime: new Date()
    }
  }

  /**
   * Export data to Excel format (simplified - returns CSV)
   */
  private static async exportToExcel(
    data: any[],
    baseFilename: string,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    // For now, return CSV format (in a real implementation, you'd use a library like xlsx)
    const csvResult = await this.exportToCSV(data, baseFilename, options)
    return {
      ...csvResult,
      filename: csvResult.filename.replace('.csv', '.xlsx'),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  /**
   * Get available export formats
   */
  static getAvailableFormats(): Array<{ value: string; label: string; extension: string }> {
    return [
      { value: 'csv', label: 'CSV (Comma Separated Values)', extension: '.csv' },
      { value: 'json', label: 'JSON (JavaScript Object Notation)', extension: '.json' },
      { value: 'xlsx', label: 'Excel (XLSX Spreadsheet)', extension: '.xlsx' }
    ]
  }

  /**
   * Get data retention info
   */
  static async getDataRetentionInfo(userId: string): Promise<{
    totalRecords: number
    oldestRecord: Date | null
    newestRecord: Date | null
    dataSize: number
    breakdown: {
      metrics: number
      health: number
      alerts: number
      apiMetrics: number
    }
  }> {
    const [metricsCount, healthCount, alertsCount, apiMetricsCount] = await Promise.all([
      db.modelMetric.count({
        where: {
          fineTunedModel: {
            userId
          }
        }
      }),
      db.systemHealth.count(),
      db.alert.count(),
      db.apiMetric.count()
    ])

    const [oldestMetric, newestMetric] = await Promise.all([
      db.modelMetric.findFirst({
        where: {
          fineTunedModel: {
            userId
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        select: {
          timestamp: true
        }
      }),
      db.modelMetric.findFirst({
        where: {
          fineTunedModel: {
            userId
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        select: {
          timestamp: true
        }
      })
    ])

    return {
      totalRecords: metricsCount + healthCount + alertsCount + apiMetricsCount,
      oldestRecord: oldestMetric?.timestamp || null,
      newestRecord: newestMetric?.timestamp || null,
      dataSize: (metricsCount + healthCount + alertsCount + apiMetricsCount) * 1024, // Estimate
      breakdown: {
        metrics: metricsCount,
        health: healthCount,
        alerts: alertsCount,
        apiMetrics: apiMetricsCount
      }
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  static async cleanupOldData(userId: string, retentionDays: number = 30): Promise<{
    deletedRecords: number
    breakdown: {
      metrics: number
      health: number
      alerts: number
      apiMetrics: number
    }
  }> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    const [deletedMetrics, deletedHealth, deletedAlerts, deletedApiMetrics] = await Promise.all([
      db.modelMetric.deleteMany({
        where: {
          fineTunedModel: {
            userId
          },
          timestamp: {
            lt: cutoffDate
          }
        }
      }),
      db.systemHealth.deleteMany({
        where: {
          checkedAt: {
            lt: cutoffDate
          }
        }
      }),
      db.alert.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: AlertStatus.RESOLVED
        }
      }),
      db.apiMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })
    ])

    return {
      deletedRecords: deletedMetrics.count + deletedHealth.count + deletedAlerts.count + deletedApiMetrics.count,
      breakdown: {
        metrics: deletedMetrics.count,
        health: deletedHealth.count,
        alerts: deletedAlerts.count,
        apiMetrics: deletedApiMetrics.count
      }
    }
  }
}