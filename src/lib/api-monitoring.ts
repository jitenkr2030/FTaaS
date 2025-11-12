import { db } from '@/lib/db'
import { 
  ApiEndpoint,
  ApiMetric,
  Alert,
  AlertHistory,
  AlertType,
  AlertSeverity,
  AlertStatus,
  EndpointStatus
} from '@prisma/client'

export interface ApiEndpointSummary {
  id: string
  path: string
  method: string
  service: string
  status: EndpointStatus
  responseTime: number
  errorRate: number
  requestCount: number
  lastUsedAt: Date
  healthScore: number
}

export interface ApiHealthCheck {
  endpointId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  statusCode: number
  error: string | null
  checkedAt: Date
}

export interface ApiPerformanceMetrics {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  throughput: number
  p95ResponseTime: number
  p99ResponseTime: number
  availability: number
}

export interface ApiTrendAnalysis {
  period: string
  requests: number
  responseTime: number
  errorRate: number
  availability: number
}

export class ApiMonitoringService {
  /**
   * Get API endpoints summary
   */
  static async getApiEndpointsSummary(): Promise<ApiEndpointSummary[]> {
    const endpoints = await db.apiEndpoint.findMany({
      include: {
        apiMetrics: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1000
        }
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    })

    return endpoints.map(endpoint => {
      const metrics = endpoint.apiMetrics
      const totalRequests = metrics.length
      const averageResponseTime = totalRequests > 0 
        ? metrics.reduce((sum, m) => sum + m.requestTime, 0) / totalRequests 
        : 0
      const errorCount = metrics.filter(m => m.statusCode >= 400).length
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
      
      // Calculate health score (0-100)
      let healthScore = 100
      if (averageResponseTime > 1000) healthScore -= 20
      if (averageResponseTime > 5000) healthScore -= 30
      if (errorRate > 5) healthScore -= 25
      if (errorRate > 10) healthScore -= 25
      if (totalRequests === 0) healthScore = 50
      
      healthScore = Math.max(0, healthScore)

      return {
        id: endpoint.id,
        path: endpoint.path,
        method: endpoint.method,
        service: endpoint.service,
        status: endpoint.status,
        responseTime: averageResponseTime,
        errorRate,
        requestCount: totalRequests,
        lastUsedAt: endpoint.lastUsedAt || new Date(),
        healthScore
      }
    })
  }

  /**
   * Get API performance metrics
   */
  static async getApiPerformanceMetrics(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    }
  ): Promise<ApiPerformanceMetrics> {
    const metrics = await db.apiMetric.findMany({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        availability: 100
      }
    }

    const totalRequests = metrics.length
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.requestTime, 0) / totalRequests
    const errorCount = metrics.filter(m => m.statusCode >= 400).length
    const errorRate = (errorCount / totalRequests) * 100
    
    // Calculate throughput (requests per second)
    const timeSpan = (timeRange.end.getTime() - timeRange.start.getTime()) / 1000
    const throughput = totalRequests / timeSpan
    
    // Calculate percentiles
    const sortedResponseTimes = metrics.map(m => m.requestTime).sort((a, b) => a - b)
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95)
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99)
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0
    
    // Calculate availability (percentage of successful requests)
    const availability = ((totalRequests - errorCount) / totalRequests) * 100

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      throughput,
      p95ResponseTime,
      p99ResponseTime,
      availability
    }
  }

  /**
   * Get API trend analysis
   */
  static async getApiTrendAnalysis(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
      end: new Date()
    }
  ): Promise<ApiTrendAnalysis[]> {
    const trends: ApiTrendAnalysis[] = []
    const intervalMs = (timeRange.end.getTime() - timeRange.start.getTime()) / 7 // 7 intervals

    for (let i = 0; i < 7; i++) {
      const intervalStart = new Date(timeRange.start.getTime() + (i * intervalMs))
      const intervalEnd = new Date(timeRange.start.getTime() + ((i + 1) * intervalMs))

      const metrics = await db.apiMetric.findMany({
        where: {
          timestamp: {
            gte: intervalStart,
            lt: intervalEnd
          }
        }
      })

      const totalRequests = metrics.length
      const averageResponseTime = totalRequests > 0 
        ? metrics.reduce((sum, m) => sum + m.requestTime, 0) / totalRequests 
        : 0
      const errorCount = metrics.filter(m => m.statusCode >= 400).length
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
      const availability = totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 100

      trends.push({
        period: `Day ${i + 1}`,
        requests: totalRequests,
        responseTime: averageResponseTime,
        errorRate,
        availability
      })
    }

    return trends
  }

  /**
   * Perform health check on API endpoints
   */
  static async performHealthChecks(): Promise<ApiHealthCheck[]> {
    const endpoints = await db.apiEndpoint.findMany({
      where: {
        status: EndpointStatus.ACTIVE
      }
    })

    const healthChecks: ApiHealthCheck[] = []

    for (const endpoint of endpoints) {
      try {
        // In a real implementation, you would make actual HTTP requests to the endpoints
        // For now, we'll simulate health checks based on recent metrics
        const recentMetrics = await db.apiMetric.findMany({
          where: {
            endpointId: endpoint.id,
            timestamp: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10
        })

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
        let responseTime = 0
        let statusCode = 200
        let error: string | null = null

        if (recentMetrics.length > 0) {
          const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.requestTime, 0) / recentMetrics.length
          const errorRate = (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100

          responseTime = avgResponseTime
          statusCode = recentMetrics[0].statusCode

          if (errorRate > 10 || avgResponseTime > 5000) {
            status = 'unhealthy'
            error = `High error rate (${errorRate.toFixed(1)}%) or slow response (${avgResponseTime.toFixed(0)}ms)`
          } else if (errorRate > 5 || avgResponseTime > 2000) {
            status = 'degraded'
            error = `Elevated error rate (${errorRate.toFixed(1)}%) or slow response (${avgResponseTime.toFixed(0)}ms)`
          }
        } else {
          status = 'unhealthy'
          error = 'No recent metrics available'
          statusCode = 503
        }

        healthChecks.push({
          endpointId: endpoint.id,
          status,
          responseTime,
          statusCode,
          error,
          checkedAt: new Date()
        })

        // Update endpoint status based on health check
        await db.apiEndpoint.update({
          where: { id: endpoint.id },
          data: {
            status: status === 'healthy' ? EndpointStatus.ACTIVE : 
                   status === 'degraded' ? EndpointStatus.DEGRADED : EndpointStatus.DOWN,
            responseTime,
            errorRate: status === 'unhealthy' ? 100 : status === 'degraded' ? 50 : 0,
            lastUsedAt: new Date()
          }
        })

      } catch (error) {
        healthChecks.push({
          endpointId: endpoint.id,
          status: 'unhealthy',
          responseTime: 0,
          statusCode: 500,
          error: error instanceof Error ? error.message : 'Unknown error',
          checkedAt: new Date()
        })

        // Update endpoint status to down
        await db.apiEndpoint.update({
          where: { id: endpoint.id },
          data: {
            status: EndpointStatus.DOWN,
            responseTime: 0,
            errorRate: 100,
            lastUsedAt: new Date()
          }
        })
      }
    }

    return healthChecks
  }

  /**
   * Get endpoint details with recent metrics
   */
  static async getEndpointDetails(endpointId: string) {
    const endpoint = await db.apiEndpoint.findUnique({
      where: { id: endpointId },
      include: {
        apiMetrics: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 100
        }
      }
    })

    if (!endpoint) {
      throw new Error('Endpoint not found')
    }

    const metrics = endpoint.apiMetrics
    const totalRequests = metrics.length
    const averageResponseTime = totalRequests > 0 
      ? metrics.reduce((sum, m) => sum + m.requestTime, 0) / totalRequests 
      : 0
    const errorCount = metrics.filter(m => m.statusCode >= 400).length
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    // Group by status code
    const statusCounts = metrics.reduce((acc, metric) => {
      const statusRange = Math.floor(metric.statusCode / 100) * 100
      acc[statusRange] = (acc[statusRange] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      endpoint,
      metrics: {
        totalRequests,
        averageResponseTime,
        errorRate,
        statusCounts
      },
      recentMetrics: metrics.slice(0, 20) // Last 20 metrics
    }
  }

  /**
   * Create alerts for API issues
   */
  static async createApiAlerts(): Promise<void> {
    const endpoints = await db.apiEndpoint.findMany({
      where: {
        OR: [
          { status: EndpointStatus.DEGRADED },
          { status: EndpointStatus.DOWN }
        ]
      }
    })

    for (const endpoint of endpoints) {
      const alertName = `API ${endpoint.status}: ${endpoint.method} ${endpoint.path}`
      const existingAlert = await db.alert.findFirst({
        where: {
          name: alertName,
          status: {
            in: [AlertStatus.ACTIVE, AlertStatus.TRIGGERED]
          }
        }
      })

      if (!existingAlert) {
        await db.alert.create({
          data: {
            name: alertName,
            description: `API endpoint ${endpoint.method} ${endpoint.path} is ${endpoint.status.toLowerCase()}`,
            type: AlertType.PERFORMANCE,
            severity: endpoint.status === EndpointStatus.DOWN ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
            status: AlertStatus.TRIGGERED,
            condition: {
              endpointId: endpoint.id,
              status: endpoint.status,
              errorRate: endpoint.errorRate,
              responseTime: endpoint.responseTime
            },
            triggeredAt: new Date()
          }
        })
      }
    }
  }

  /**
   * Get API monitoring dashboard data
   */
  static async getDashboardData() {
    const [endpoints, performance, trends] = await Promise.all([
      this.getApiEndpointsSummary(),
      this.getApiPerformanceMetrics(),
      this.getApiTrendAnalysis()
    ])

    // Calculate overall health
    const healthyEndpoints = endpoints.filter(e => e.healthScore >= 80).length
    const totalEndpoints = endpoints.length
    const overallHealth = totalEndpoints > 0 ? (healthyEndpoints / totalEndpoints) * 100 : 100

    return {
      endpoints,
      performance,
      trends,
      summary: {
        totalEndpoints,
        healthyEndpoints,
        overallHealth,
        criticalIssues: endpoints.filter(e => e.status === EndpointStatus.DOWN).length,
        degradedEndpoints: endpoints.filter(e => e.status === EndpointStatus.DEGRADED).length
      }
    }
  }
}