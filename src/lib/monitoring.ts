import { db } from '@/lib/db'
import { 
  ModelMetric, 
  SystemHealth, 
  Alert, 
  AlertHistory, 
  MonitoringConfig,
  ApiEndpoint,
  ApiMetric,
  MetricType,
  HealthStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  EndpointStatus
} from '@prisma/client'

// Re-export the types for convenience
export type {
  ModelMetric,
  SystemHealth,
  Alert,
  AlertHistory,
  MonitoringConfig,
  ApiEndpoint,
  ApiMetric,
  MetricType,
  HealthStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  EndpointStatus
}

export interface CreateModelMetricInput {
  fineTunedModelId: string
  deploymentId?: string
  metricType: MetricType
  value: number
  unit?: string
  metadata?: any
}

export interface CreateSystemHealthInput {
  component: string
  status: HealthStatus
  message?: string
  metrics?: any
}

export interface CreateAlertInput {
  name: string
  description?: string
  type: AlertType
  severity: AlertSeverity
  condition: any
  metadata?: any
}

export interface CreateApiMetricInput {
  endpointId: string
  userId?: string
  requestTime: number
  statusCode: number
  error?: string
  userAgent?: string
  ipAddress?: string
  metadata?: any
}

export interface MonitoringThresholds {
  latency: { warning: number; critical: number }
  errorRate: { warning: number; critical: number }
  cost: { warning: number; critical: number }
  throughput: { min: number }
  availability: { min: number }
}

export class MonitoringService {
  /**
   * Create a new model metric
   */
  static async createModelMetric(data: CreateModelMetricInput): Promise<ModelMetric> {
    return await db.modelMetric.create({
      data: {
        fineTunedModelId: data.fineTunedModelId,
        deploymentId: data.deploymentId,
        metricType: data.metricType,
        value: data.value,
        unit: data.unit,
        metadata: data.metadata || {},
        timestamp: new Date(),
      }
    })
  }

  /**
   * Create multiple model metrics in batch
   */
  static async createModelMetrics(metrics: CreateModelMetricInput[]): Promise<ModelMetric[]> {
    return await db.modelMetric.createMany({
      data: metrics.map(m => ({
        fineTunedModelId: m.fineTunedModelId,
        deploymentId: m.deploymentId,
        metricType: m.metricType,
        value: m.value,
        unit: m.unit,
        metadata: m.metadata || {},
        timestamp: new Date(),
      }))
    }).then(() => {
      // Return the created metrics (simplified for batch operation)
      return metrics.map((m, i) => ({
        id: `metric-${i}`,
        ...m,
        timestamp: new Date(),
        createdAt: new Date(),
      })) as ModelMetric[]
    })
  }

  /**
   * Get model metrics for a specific model
   */
  static async getModelMetrics(
    fineTunedModelId: string,
    metricType?: MetricType,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date()
    }
  ): Promise<ModelMetric[]> {
    return await db.modelMetric.findMany({
      where: {
        fineTunedModelId,
        metricType,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000 // Limit to prevent excessive data
    })
  }

  /**
   * Get aggregated metrics for a model
   */
  static async getAggregatedMetrics(
    fineTunedModelId: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ) {
    const metrics = await db.modelMetric.findMany({
      where: {
        fineTunedModelId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const aggregated = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = {
          count: 0,
          sum: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        }
      }

      const agg = acc[metric.metricType]
      agg.count++
      agg.sum += metric.value
      agg.min = Math.min(agg.min, metric.value)
      agg.max = Math.max(agg.max, metric.value)
      agg.values.push(metric.value)

      return acc
    }, {} as Record<string, any>)

    // Calculate averages
    Object.keys(aggregated).forEach(type => {
      const agg = aggregated[type]
      agg.avg = agg.sum / agg.count
    })

    return aggregated
  }

  /**
   * Record system health status
   */
  static async recordSystemHealth(data: CreateSystemHealthInput): Promise<SystemHealth> {
    return await db.systemHealth.create({
      data: {
        component: data.component,
        status: data.status,
        message: data.message,
        metrics: data.metrics || {},
        checkedAt: new Date(),
      }
    })
  }

  /**
   * Get current system health status
   */
  static async getSystemHealth(): Promise<SystemHealth[]> {
    const components = ['api', 'database', 'models', 'queue', 'storage']
    
    const healthStatuses = await Promise.all(
      components.map(async (component) => {
        const latest = await db.systemHealth.findFirst({
          where: { component },
          orderBy: { checkedAt: 'desc' }
        })
        return latest
      })
    )

    return healthStatuses.filter(Boolean) as SystemHealth[]
  }

  /**
   * Create an alert
   */
  static async createAlert(data: CreateAlertInput): Promise<Alert> {
    return await db.alert.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        severity: data.severity,
        condition: data.condition,
        metadata: data.metadata || {},
      }
    })
  }

  /**
   * Trigger an alert
   */
  static async triggerAlert(alertId: string, message: string, metadata?: any): Promise<AlertHistory> {
    const alert = await db.alert.findUnique({
      where: { id: alertId }
    })

    if (!alert) {
      throw new Error('Alert not found')
    }

    // Update alert status
    await db.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.TRIGGERED,
        triggeredAt: new Date()
      }
    })

    // Create alert history
    return await db.alertHistory.create({
      data: {
        alertId,
        message,
        severity: alert.severity,
        metadata: metadata || {},
      }
    })
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(alertId: string, message?: string): Promise<void> {
    await db.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date()
      }
    })

    if (message) {
      const alert = await db.alert.findUnique({
        where: { id: alertId }
      })

      if (alert) {
        await db.alertHistory.create({
          data: {
            alertId,
            message: `Resolved: ${message}`,
            severity: alert.severity,
            resolvedAt: new Date(),
          }
        })
      }
    }
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(): Promise<Alert[]> {
    return await db.alert.findMany({
      where: {
        status: {
          in: [AlertStatus.ACTIVE, AlertStatus.TRIGGERED]
        }
      },
      orderBy: {
        severity: 'desc'
      }
    })
  }

  /**
   * Check thresholds and trigger alerts if needed
   */
  static async checkThresholds(
    fineTunedModelId: string,
    thresholds: MonitoringThresholds
  ): Promise<void> {
    const timeRange = {
      start: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      end: new Date()
    }

    const metrics = await this.getModelMetrics(fineTunedModelId, undefined, timeRange)
    
    // Group by metric type
    const metricsByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = []
      }
      acc[metric.metricType].push(metric.value)
      return acc
    }, {} as Record<MetricType, number[]>)

    // Check latency
    if (metricsByType[MetricType.LATENCY]) {
      const avgLatency = metricsByType[MetricType.LATENCY].reduce((a, b) => a + b, 0) / metricsByType[MetricType.LATENCY].length
      if (avgLatency > thresholds.latency.critical) {
        await this.triggerAlert(
          `latency-critical-${fineTunedModelId}`,
          `Critical latency detected: ${avgLatency.toFixed(2)}ms`,
          { fineTunedModelId, avgLatency, threshold: thresholds.latency.critical }
        )
      } else if (avgLatency > thresholds.latency.warning) {
        await this.triggerAlert(
          `latency-warning-${fineTunedModelId}`,
          `High latency detected: ${avgLatency.toFixed(2)}ms`,
          { fineTunedModelId, avgLatency, threshold: thresholds.latency.warning }
        )
      }
    }

    // Check error rate
    if (metricsByType[MetricType.ERROR_RATE]) {
      const avgErrorRate = metricsByType[MetricType.ERROR_RATE].reduce((a, b) => a + b, 0) / metricsByType[MetricType.ERROR_RATE].length
      if (avgErrorRate > thresholds.errorRate.critical) {
        await this.triggerAlert(
          `error-rate-critical-${fineTunedModelId}`,
          `Critical error rate detected: ${avgErrorRate.toFixed(2)}%`,
          { fineTunedModelId, avgErrorRate, threshold: thresholds.errorRate.critical }
        )
      } else if (avgErrorRate > thresholds.errorRate.warning) {
        await this.triggerAlert(
          `error-rate-warning-${fineTunedModelId}`,
          `High error rate detected: ${avgErrorRate.toFixed(2)}%`,
          { fineTunedModelId, avgErrorRate, threshold: thresholds.errorRate.warning }
        )
      }
    }

    // Check cost
    if (metricsByType[MetricType.COST]) {
      const totalCost = metricsByType[MetricType.COST].reduce((a, b) => a + b, 0)
      if (totalCost > thresholds.cost.critical) {
        await this.triggerAlert(
          `cost-critical-${fineTunedModelId}`,
          `Critical cost detected: $${totalCost.toFixed(2)}`,
          { fineTunedModelId, totalCost, threshold: thresholds.cost.critical }
        )
      } else if (totalCost > thresholds.cost.warning) {
        await this.triggerAlert(
          `cost-warning-${fineTunedModelId}`,
          `High cost detected: $${totalCost.toFixed(2)}`,
          { fineTunedModelId, totalCost, threshold: thresholds.cost.warning }
        )
      }
    }
  }

  /**
   * Record API endpoint metric
   */
  static async recordApiMetric(data: CreateApiMetricInput): Promise<ApiMetric> {
    // Update endpoint statistics
    await db.apiEndpoint.updateMany({
      where: { id: data.endpointId },
      data: {
        requestCount: {
          increment: 1
        },
        responseTime: data.requestTime,
        lastUsedAt: new Date(),
        errorRate: data.statusCode >= 400 ? 100 : 0 // Simplified error rate calculation
      }
    })

    return await db.apiMetric.create({
      data: {
        endpointId: data.endpointId,
        userId: data.userId,
        requestTime: data.requestTime,
        statusCode: data.statusCode,
        error: data.error,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        timestamp: new Date(),
        metadata: data.metadata || {},
      }
    })
  }

  /**
   * Get API endpoint metrics
   */
  static async getApiEndpointMetrics(
    endpointId?: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<ApiMetric[]> {
    return await db.apiMetric.findMany({
      where: {
        endpointId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000
    })
  }

  /**
   * Get monitoring configuration for a user
   */
  static async getMonitoringConfig(userId: string): Promise<MonitoringConfig | null> {
    return await db.monitoringConfig.findUnique({
      where: { userId }
    })
  }

  /**
   * Update monitoring configuration
   */
  static async updateMonitoringConfig(
    userId: string,
    config: Partial<MonitoringConfig>
  ): Promise<MonitoringConfig> {
    return await db.monitoringConfig.upsert({
      where: { userId },
      update: config,
      create: {
        userId,
        ...config,
        enabled: config.enabled ?? true,
        metrics: config.metrics ?? {},
        alerts: config.alerts ?? {},
        notifications: config.notifications ?? {},
        retentionDays: config.retentionDays ?? 30
      }
    })
  }

  /**
   * Clean up old monitoring data based on retention policy
   */
  static async cleanupOldData(): Promise<void> {
    const configs = await db.monitoringConfig.findMany({
      where: { enabled: true }
    })

    for (const config of configs) {
      const cutoffDate = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000)

      // Clean up old model metrics
      await db.modelMetric.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      // Clean up old API metrics
      await db.apiMetric.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      // Clean up old system health data
      await db.systemHealth.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      // Clean up old alert history (keep resolved alerts longer)
      const alertCutoffDate = new Date(Date.now() - (config.retentionDays * 2) * 24 * 60 * 60 * 1000)
      await db.alertHistory.deleteMany({
        where: {
          createdAt: {
            lt: alertCutoffDate
          },
          resolvedAt: {
            not: null
          }
        }
      })
    }
  }
}