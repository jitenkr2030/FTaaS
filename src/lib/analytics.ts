import { db } from "@/lib/db"

export interface AnalyticsMetrics {
  totalModels: number
  deployedModels: number
  totalRequests: number
  totalCost: number
  averageLatency: number
  uptime: number
  errorRate: number
  throughput: number
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}

export interface AnalyticsFilters {
  startDate?: Date
  endDate?: Date
  modelId?: string
  deploymentId?: string
  userId?: string
}

export class AnalyticsService {
  async getDashboardMetrics(userId: string, filters?: AnalyticsFilters): Promise<AnalyticsMetrics> {
    const where: any = {
      userId,
      ...(filters?.modelId && { fineTunedModelId: filters.modelId }),
      ...(filters?.deploymentId && { deploymentId: filters.deploymentId }),
      ...(filters?.startDate && {
        createdAt: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        createdAt: {
          lte: filters.endDate
        }
      })
    }

    // Get model counts
    const [totalModels, deployedModels] = await Promise.all([
      db.fineTunedModel.count({
        where: { userId }
      }),
      db.fineTunedModel.count({
        where: { 
          userId,
          status: "DEPLOYED"
        }
      })
    ])

    // Get usage statistics
    const usageStats = await db.apiUsage.aggregate({
      where,
      _sum: {
        requestCount: true,
        tokenCount: true,
        cost: true
      },
      _avg: {
        cost: true
      }
    })

    // Get deployment metrics
    const deployments = await db.modelDeployment.findMany({
      where: {
        fineTunedModel: {
          userId
        },
        ...(filters?.startDate && {
          createdAt: {
            gte: filters.startDate
          }
        }),
        ...(filters?.endDate && {
          createdAt: {
            lte: filters.endDate
          }
        })
      },
      select: {
        metrics: true,
        createdAt: true,
        deployedAt: true,
        terminatedAt: true
      }
    })

    // Calculate aggregated metrics
    const totalRequests = usageStats._sum.requestCount || 0
    const totalCost = usageStats._sum.cost || 0
    const averageLatency = this.calculateAverageLatency(deployments)
    const uptime = this.calculateUptime(deployments)
    const errorRate = this.calculateErrorRate(deployments)
    const throughput = this.calculateThroughput(deployments, filters)

    return {
      totalModels,
      deployedModels,
      totalRequests,
      totalCost,
      averageLatency,
      uptime,
      errorRate,
      throughput
    }
  }

  async getRequestTimeSeries(userId: string, filters?: AnalyticsFilters): Promise<TimeSeriesData[]> {
    const where: any = {
      userId,
      ...(filters?.modelId && { fineTunedModelId: filters.modelId }),
      ...(filters?.deploymentId && { deploymentId: filters.deploymentId }),
      ...(filters?.startDate && {
        date: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        date: {
          lte: filters.endDate
        }
      })
    }

    const usageData = await db.apiUsage.findMany({
      where,
      orderBy: {
        date: "asc"
      },
      select: {
        date: true,
        requestCount: true
      }
    })

    return usageData.map(item => ({
      timestamp: item.date.toISOString(),
      value: item.requestCount,
      label: new Date(item.date).toLocaleDateString()
    }))
  }

  async getCostTimeSeries(userId: string, filters?: AnalyticsFilters): Promise<TimeSeriesData[]> {
    const where: any = {
      userId,
      ...(filters?.modelId && { fineTunedModelId: filters.modelId }),
      ...(filters?.deploymentId && { deploymentId: filters.deploymentId }),
      ...(filters?.startDate && {
        date: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        date: {
          lte: filters.endDate
        }
      })
    }

    const usageData = await db.apiUsage.findMany({
      where,
      orderBy: {
        date: "asc"
      },
      select: {
        date: true,
        cost: true
      }
    })

    return usageData.map(item => ({
      timestamp: item.date.toISOString(),
      value: item.cost,
      label: new Date(item.date).toLocaleDateString()
    }))
  }

  async getLatencyTimeSeries(userId: string, filters?: AnalyticsFilters): Promise<TimeSeriesData[]> {
    const where: any = {
      fineTunedModel: {
        userId
      },
      ...(filters?.modelId && { fineTunedModelId: filters.modelId }),
      ...(filters?.deploymentId && { id: filters.deploymentId }),
      ...(filters?.startDate && {
        createdAt: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        createdAt: {
          lte: filters.endDate
        }
      })
    }

    const deployments = await db.modelDeployment.findMany({
      where,
      orderBy: {
        createdAt: "asc"
      },
      select: {
        createdAt: true,
        metrics: true
      }
    })

    return deployments.map(deployment => ({
      timestamp: deployment.createdAt.toISOString(),
      value: deployment.metrics?.latency || 0,
      label: new Date(deployment.createdAt).toLocaleDateString()
    }))
  }

  async getModelPerformance(userId: string, filters?: AnalyticsFilters) {
    const where: any = {
      userId,
      ...(filters?.startDate && {
        createdAt: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        createdAt: {
          lte: filters.endDate
        }
      })
    }

    const models = await db.fineTunedModel.findMany({
      where,
      include: {
        deployments: {
          select: {
            id: true,
            status: true,
            metrics: true,
            cost: true,
            createdAt: true,
            deployedAt: true
          }
        },
        apiUsage: {
          select: {
            requestCount: true,
            cost: true,
            date: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return models.map(model => {
      const totalRequests = model.apiUsage.reduce((sum, usage) => sum + usage.requestCount, 0)
      const totalCost = model.apiUsage.reduce((sum, usage) => sum + usage.cost, 0)
      const activeDeployment = model.deployments.find(d => d.status === "DEPLOYED")
      
      return {
        id: model.id,
        name: model.name,
        status: model.status,
        totalRequests,
        totalCost,
        averageLatency: activeDeployment?.metrics?.latency || 0,
        uptime: activeDeployment ? this.calculateDeploymentUptime(activeDeployment) : 0,
        lastDeployed: activeDeployment?.deployedAt || null
      }
    })
  }

  async getTopPerformingModels(userId: string, limit: number = 5, filters?: AnalyticsFilters) {
    const models = await this.getModelPerformance(userId, filters)
    
    return models
      .sort((a, b) => {
        // Sort by a combination of uptime and request count
        const scoreA = (a.uptime * 0.6) + (Math.min(a.totalRequests / 1000, 1) * 0.4)
        const scoreB = (b.uptime * 0.6) + (Math.min(b.totalRequests / 1000, 1) * 0.4)
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  async getCostBreakdown(userId: string, filters?: AnalyticsFilters) {
    const where: any = {
      userId,
      ...(filters?.startDate && {
        date: {
          gte: filters.startDate
        }
      }),
      ...(filters?.endDate && {
        date: {
          lte: filters.endDate
        }
      })
    }

    const usageData = await db.apiUsage.findMany({
      where,
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const breakdown = usageData.reduce((acc, usage) => {
      const modelName = usage.fineTunedModel?.name || "Unknown"
      if (!acc[modelName]) {
        acc[modelName] = 0
      }
      acc[modelName] += usage.cost
      return acc
    }, {} as Record<string, number>)

    return Object.entries(breakdown).map(([name, cost]) => ({
      name,
      cost,
      percentage: (cost / Object.values(breakdown).reduce((sum, c) => sum + c, 0)) * 100
    }))
  }

  private calculateAverageLatency(deployments: any[]): number {
    const latencies = deployments
      .map(d => d.metrics?.latency)
      .filter(latency => latency !== undefined && latency !== null)
    
    if (latencies.length === 0) return 0
    
    return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
  }

  private calculateUptime(deployments: any[]): number {
    const deployedDeployments = deployments.filter(d => d.status === "DEPLOYED")
    
    if (deployedDeployments.length === 0) return 0
    
    // Simple uptime calculation based on deployment status
    return (deployedDeployments.length / deployments.length) * 100
  }

  private calculateErrorRate(deployments: any[]): number {
    // In a real implementation, this would use actual error metrics
    // For now, we'll simulate based on deployment status
    const failedDeployments = deployments.filter(d => d.status === "FAILED")
    
    if (deployments.length === 0) return 0
    
    return (failedDeployments.length / deployments.length) * 100
  }

  private calculateThroughput(deployments: any[], filters?: AnalyticsFilters): number {
    // Calculate requests per minute
    const now = new Date()
    const startTime = filters?.startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
    const endTime = filters?.endDate || now
    
    const timeDiffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    
    if (timeDiffMinutes === 0) return 0
    
    // Simulate throughput based on deployment metrics
    const avgThroughput = deployments
      .map(d => d.metrics?.throughput || 0)
      .reduce((sum, throughput) => sum + throughput, 0)
    
    return deployments.length > 0 ? avgThroughput / deployments.length : 0
  }

  private calculateDeploymentUptime(deployment: any): number {
    if (!deployment.deployedAt) return 0
    
    const now = new Date()
    const deployedTime = new Date(deployment.deployedAt)
    const uptimeMs = now.getTime() - deployedTime.getTime()
    
    // Convert to percentage (assuming 100% uptime while deployed)
    return Math.min(100, (uptimeMs / (1000 * 60 * 60 * 24)) * 100) // Cap at 100%
  }
}