import { db } from '@/lib/db'
import { MonitoringService } from './monitoring'
import { 
  ModelMetric, 
  SystemHealth, 
  Alert, 
  AlertHistory,
  MetricType,
  HealthStatus,
  AlertType,
  AlertSeverity,
  AlertStatus
} from '@prisma/client'

export interface AnomalyDetectionConfig {
  enabled: boolean
  sensitivity: 'low' | 'medium' | 'high'
  windowSize: number // in minutes
  thresholdMultiplier: number
  metrics: {
    [key in MetricType]?: {
      enabled: boolean
      thresholdMultiplier?: number
      minSamples?: number
    }
  }
}

export interface AnomalyResult {
  isAnomaly: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  message: string
  metrics: {
    expected: number
    actual: number
    deviation: number
    threshold: number
  }
  timestamp: Date
}

export interface Pattern {
  id: string
  type: 'seasonal' | 'trend' | 'cyclical' | 'anomaly'
  metricType: MetricType
  confidence: number
  description: string
  period?: number // for seasonal patterns
  trend?: 'increasing' | 'decreasing' | 'stable'
  detectedAt: Date
}

export class AnomalyDetectionService {
  private static readonly DEFAULT_CONFIG: AnomalyDetectionConfig = {
    enabled: true,
    sensitivity: 'medium',
    windowSize: 60, // 1 hour
    thresholdMultiplier: 2.5,
    metrics: {
      [MetricType.LATENCY]: { enabled: true, thresholdMultiplier: 2.0, minSamples: 10 },
      [MetricType.ERROR_RATE]: { enabled: true, thresholdMultiplier: 2.0, minSamples: 5 },
      [MetricType.COST]: { enabled: true, thresholdMultiplier: 3.0, minSamples: 10 },
      [MetricType.THROUGHPUT]: { enabled: true, thresholdMultiplier: 2.0, minSamples: 10 },
      [MetricType.MEMORY_USAGE]: { enabled: true, thresholdMultiplier: 2.0, minSamples: 5 },
      [MetricType.CPU_USAGE]: { enabled: true, thresholdMultiplier: 2.0, minSamples: 5 },
    }
  }

  /**
   * Detect anomalies in model metrics
   */
  static async detectAnomalies(
    fineTunedModelId: string,
    config: AnomalyDetectionConfig = this.DEFAULT_CONFIG
  ): Promise<AnomalyResult[]> {
    if (!config.enabled) {
      return []
    }

    const anomalies: AnomalyResult[] = []
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowSize * 60 * 1000)

    // Get recent metrics
    const recentMetrics = await db.modelMetric.findMany({
      where: {
        fineTunedModelId,
        timestamp: {
          gte: windowStart,
          lte: now
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Group by metric type
    const metricsByType = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = []
      }
      acc[metric.metricType].push(metric)
      return acc
    }, {} as Record<MetricType, ModelMetric[]>)

    // Check each metric type for anomalies
    for (const [metricType, metrics] of Object.entries(metricsByType)) {
      const metricConfig = config.metrics[metricType as MetricType]
      if (!metricConfig?.enabled || metrics.length < (metricConfig.minSamples || 5)) {
        continue
      }

      const anomaly = await this.detectMetricAnomaly(
        metrics,
        metricType as MetricType,
        config
      )

      if (anomaly.isAnomaly) {
        anomalies.push(anomaly)
      }
    }

    return anomalies
  }

  /**
   * Detect anomaly for a specific metric
   */
  private static async detectMetricAnomaly(
    metrics: ModelMetric[],
    metricType: MetricType,
    config: AnomalyDetectionConfig
  ): Promise<AnomalyResult> {
    const values = metrics.map(m => m.value)
    const latestValue = values[values.length - 1]
    
    // Calculate statistical measures
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)
    
    // Get metric-specific threshold multiplier
    const metricConfig = config.metrics[metricType]
    const thresholdMultiplier = metricConfig?.thresholdMultiplier || config.thresholdMultiplier
    
    // Calculate threshold based on sensitivity
    let sensitivityMultiplier = 1
    switch (config.sensitivity) {
      case 'low':
        sensitivityMultiplier = 1.5
        break
      case 'high':
        sensitivityMultiplier = 0.5
        break
      default:
        sensitivityMultiplier = 1
    }
    
    const threshold = mean + (standardDeviation * thresholdMultiplier * sensitivityMultiplier)
    const deviation = Math.abs(latestValue - mean)
    const isAnomaly = latestValue > threshold
    
    // Calculate confidence based on how far beyond threshold
    const confidence = Math.min(100, (deviation / threshold) * 100)
    
    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (confidence > 80) severity = 'critical'
    else if (confidence > 60) severity = 'high'
    else if (confidence > 40) severity = 'medium'
    
    // Generate message
    const message = this.generateAnomalyMessage(metricType, latestValue, mean, threshold)
    
    return {
      isAnomaly,
      severity,
      confidence,
      message,
      metrics: {
        expected: mean,
        actual: latestValue,
        deviation,
        threshold
      },
      timestamp: new Date()
    }
  }

  /**
   * Generate anomaly message
   */
  private static generateAnomalyMessage(
    metricType: MetricType,
    actual: number,
    expected: number,
    threshold: number
  ): string {
    const metricName = metricType.replace(/_/g, ' ').toLowerCase()
    const percentageChange = ((actual - expected) / expected) * 100
    
    switch (metricType) {
      case MetricType.LATENCY:
        return `High latency detected: ${actual.toFixed(2)}ms (${percentageChange.toFixed(1)}% above expected)`
      case MetricType.ERROR_RATE:
        return `Elevated error rate: ${actual.toFixed(2)}% (${percentageChange.toFixed(1)}% above expected)`
      case MetricType.COST:
        return `Unusual cost spike: $${actual.toFixed(4)} per prediction (${percentageChange.toFixed(1)}% above expected)`
      case MetricType.THROUGHPUT:
        return `Abnormal throughput: ${actual.toFixed(0)} requests/sec (${percentageChange.toFixed(1)}% deviation)`
      case MetricType.MEMORY_USAGE:
        return `High memory usage: ${actual.toFixed(1)}% (${percentageChange.toFixed(1)}% above expected)`
      case MetricType.CPU_USAGE:
        return `Elevated CPU usage: ${actual.toFixed(1)}% (${percentageChange.toFixed(1)}% above expected)`
      default:
        return `Anomaly detected in ${metricName}: ${actual.toFixed(2)} (${percentageChange.toFixed(1)}% deviation)`
    }
  }

  /**
   * Detect patterns in metrics
   */
  static async detectPatterns(
    fineTunedModelId: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
      end: new Date()
    }
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = []
    
    // Get metrics for the time range
    const metrics = await db.modelMetric.findMany({
      where: {
        fineTunedModelId,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Group by metric type
    const metricsByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = []
      }
      acc[metric.metricType].push(metric)
      return acc
    }, {} as Record<MetricType, ModelMetric[]>)

    // Detect patterns for each metric type
    for (const [metricType, metricData] of Object.entries(metricsByType)) {
      if (metricData.length < 10) continue // Need enough data points

      // Detect trend
      const trendPattern = this.detectTrend(metricData, metricType as MetricType)
      if (trendPattern) patterns.push(trendPattern)

      // Detect seasonal patterns (simplified)
      const seasonalPattern = this.detectSeasonalPattern(metricData, metricType as MetricType)
      if (seasonalPattern) patterns.push(seasonalPattern)
    }

    return patterns
  }

  /**
   * Detect trend in metric data
   */
  private static detectTrend(
    metrics: ModelMetric[],
    metricType: MetricType
  ): Pattern | null {
    const values = metrics.map(m => m.value)
    const n = values.length
    
    // Simple linear regression to detect trend
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // Determine trend direction and strength
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (Math.abs(slope) > 0.01) {
      trend = slope > 0 ? 'increasing' : 'decreasing'
    }
    
    const confidence = Math.min(100, Math.abs(slope) * 1000)
    
    if (confidence < 30) return null // Not a strong enough trend
    
    return {
      id: `trend-${metricType}-${Date.now()}`,
      type: 'trend',
      metricType,
      confidence,
      description: `${trend} trend detected in ${metricType.replace(/_/g, ' ').toLowerCase()}`,
      trend,
      detectedAt: new Date()
    }
  }

  /**
   * Detect seasonal pattern (simplified implementation)
   */
  private static detectSeasonalPattern(
    metrics: ModelMetric[],
    metricType: MetricType
  ): Pattern | null {
    // This is a simplified seasonal detection
    // In a real implementation, you'd use more sophisticated algorithms like FFT
    
    const values = metrics.map(m => m.value)
    const n = values.length
    
    if (n < 24) return null // Need at least a day of hourly data
    
    // Check for daily patterns by comparing similar times across days
    const hourlyPatterns = new Map<number, number[]>()
    
    metrics.forEach((metric, i) => {
      const hour = new Date(metric.timestamp).getHours()
      if (!hourlyPatterns.has(hour)) {
        hourlyPatterns.set(hour, [])
      }
      hourlyPatterns.get(hour)!.push(metric.value)
    })
    
    // Check if there's consistency in hourly patterns
    let consistentPatterns = 0
    for (const [hour, values] of hourlyPatterns) {
      if (values.length < 3) continue // Need at least 3 data points for the hour
      
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      const coefficientOfVariation = Math.sqrt(variance) / mean
      
      if (coefficientOfVariation < 0.2) { // Low variation indicates pattern
        consistentPatterns++
      }
    }
    
    const confidence = (consistentPatterns / hourlyPatterns.size) * 100
    
    if (confidence < 50) return null // Not a strong enough pattern
    
    return {
      id: `seasonal-${metricType}-${Date.now()}`,
      type: 'seasonal',
      metricType,
      confidence,
      description: `Daily seasonal pattern detected in ${metricType.replace(/_/g, ' ').toLowerCase()}`,
      period: 24, // 24-hour cycle
      detectedAt: new Date()
    }
  }

  /**
   * Run comprehensive anomaly detection and create alerts
   */
  static async runAnomalyDetection(
    fineTunedModelId: string,
    config: AnomalyDetectionConfig = this.DEFAULT_CONFIG
  ): Promise<void> {
    try {
      // Detect anomalies
      const anomalies = await this.detectAnomalies(fineTunedModelId, config)
      
      // Create alerts for detected anomalies
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
          await MonitoringService.triggerAlert(
            `anomaly-${fineTunedModelId}-${anomaly.metrics.actual}`,
            anomaly.message,
            {
              fineTunedModelId,
              anomaly: {
                severity: anomaly.severity,
                confidence: anomaly.confidence,
                metrics: anomaly.metrics
              }
            }
          )
        }
      }
      
      // Detect patterns
      const patterns = await this.detectPatterns(fineTunedModelId)
      
      // Create alerts for significant patterns
      for (const pattern of patterns) {
        if (pattern.confidence > 80 && pattern.type === 'trend') {
          await MonitoringService.triggerAlert(
            `pattern-${fineTunedModelId}-${pattern.type}`,
            pattern.description,
            {
              fineTunedModelId,
              pattern: {
                type: pattern.type,
                confidence: pattern.confidence,
                trend: pattern.trend
              }
            }
          )
        }
      }
      
    } catch (error) {
      console.error('Error in anomaly detection:', error)
    }
  }

  /**
   * Get anomaly detection configuration for a user
   */
  static async getAnomalyConfig(userId: string): Promise<AnomalyDetectionConfig> {
    // In a real implementation, this would be stored in the database
    // For now, return the default config
    return this.DEFAULT_CONFIG
  }

  /**
   * Update anomaly detection configuration
   */
  static async updateAnomalyConfig(
    userId: string,
    config: Partial<AnomalyDetectionConfig>
  ): Promise<AnomalyDetectionConfig> {
    // In a real implementation, this would be stored in the database
    // For now, just return the merged config
    return {
      ...this.DEFAULT_CONFIG,
      ...config,
      metrics: {
        ...this.DEFAULT_CONFIG.metrics,
        ...config.metrics
      }
    }
  }

  /**
   * Get recent anomalies for a model
   */
  static async getRecentAnomalies(
    fineTunedModelId: string,
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
      end: new Date()
    }
  ): Promise<AnomalyResult[]> {
    // Get recent alerts that are anomaly-related
    const alerts = await db.alert.findMany({
      where: {
        type: AlertType.MODEL,
        status: {
          in: [AlertStatus.TRIGGERED, AlertStatus.ACTIVE]
        },
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      include: {
        alertHistory: {
          where: {
            createdAt: {
              gte: timeRange.start,
              lte: timeRange.end
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Convert alerts to anomaly results
    const anomalies: AnomalyResult[] = []
    
    for (const alert of alerts) {
      for (const history of alert.alertHistory) {
        if (history.metadata?.anomaly) {
          const anomalyData = history.metadata.anomaly
          anomalies.push({
            isAnomaly: true,
            severity: anomalyData.severity,
            confidence: anomalyData.confidence,
            message: history.message,
            metrics: anomalyData.metrics,
            timestamp: new Date(history.triggeredAt)
          })
        }
      }
    }

    return anomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}