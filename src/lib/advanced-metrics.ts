import { db } from '@/lib/db'
import { MonitoringService } from './monitoring'
import { MetricType } from '@prisma/client'

export interface AdvancedMetrics {
  roi: {
    total: number
    monthly: number
    trend: 'up' | 'down' | 'stable'
  }
  costPerPrediction: {
    current: number
    average: number
    trend: 'up' | 'down' | 'stable'
    breakdown: {
      modelId: string
      modelName: string
      cost: number
      predictions: number
      costPerPrediction: number
    }[]
  }
  efficiency: {
    tokenEfficiency: number
    latencyEfficiency: number
    accuracyEfficiency: number
    overall: number
  }
  businessImpact: {
    costSavings: number
    revenueGenerated: number
    productivityGain: number
    customerSatisfaction: number
  }
}

export interface CostAnalysis {
  totalCost: number
  modelCosts: {
    modelId: string
    modelName: string
    cost: number
    percentage: number
  }[]
  costTrends: {
    period: string
    cost: number
    predictions: number
    costPerPrediction: number
  }[]
  budgetUtilization: {
    budget: number
    used: number
    remaining: number
    percentage: number
  }
}

export interface ROICalculation {
  investment: number
  returns: number
  roi: number
  paybackPeriod: number
  breakdown: {
    costSavings: number
    revenueIncrease: number
    efficiencyGains: number
  }
}

export class AdvancedMetricsService {
  /**
   * Calculate comprehensive advanced metrics for a user
   */
  static async calculateAdvancedMetrics(userId: string, timeRange: { start: Date; end: Date } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
    end: new Date()
  }): Promise<AdvancedMetrics> {
    const [roi, costPerPrediction, efficiency, businessImpact] = await Promise.all([
      this.calculateROI(userId, timeRange),
      this.calculateCostPerPrediction(userId, timeRange),
      this.calculateEfficiencyMetrics(userId, timeRange),
      this.calculateBusinessImpact(userId, timeRange)
    ])

    return {
      roi,
      costPerPrediction,
      efficiency,
      businessImpact
    }
  }

  /**
   * Calculate ROI (Return on Investment)
   */
  static async calculateROI(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    total: number
    monthly: number
    trend: 'up' | 'down' | 'stable'
  }> {
    // Get total costs from API usage
    const apiUsage = await db.apiUsage.findMany({
      where: {
        userId,
        date: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const totalCost = apiUsage.reduce((sum, usage) => sum + usage.cost, 0)

    // Calculate returns based on business impact factors
    const businessMetrics = await this.calculateBusinessImpact(userId, timeRange)
    const totalReturns = businessMetrics.costSavings + businessMetrics.revenueGenerated

    // Calculate ROI
    const roi = totalCost > 0 ? ((totalReturns - totalCost) / totalCost) * 100 : 0

    // Calculate monthly ROI
    const monthlyCost = totalCost / 30
    const monthlyReturns = totalReturns / 30
    const monthlyRoi = monthlyCost > 0 ? ((monthlyReturns - monthlyCost) / monthlyCost) * 100 : 0

    // Determine trend (simplified - would need historical data for accurate trend)
    const trend = roi > 50 ? 'up' : roi < 0 ? 'down' : 'stable'

    return {
      total: roi,
      monthly: monthlyRoi,
      trend
    }
  }

  /**
   * Calculate cost per prediction
   */
  static async calculateCostPerPrediction(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    current: number
    average: number
    trend: 'up' | 'down' | 'stable'
    breakdown: {
      modelId: string
      modelName: string
      cost: number
      predictions: number
      costPerPrediction: number
    }[]
  }> {
    // Get model metrics and costs
    const modelMetrics = await db.modelMetric.findMany({
      where: {
        metricType: MetricType.COST,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      include: {
        fineTunedModel: true
      }
    })

    const requestMetrics = await db.modelMetric.findMany({
      where: {
        metricType: MetricType.REQUEST_COUNT,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      include: {
        fineTunedModel: true
      }
    })

    // Group by model
    const modelData = new Map<string, {
      cost: number
      predictions: number
      modelName: string
    }>()

    modelMetrics.forEach(metric => {
      const modelId = metric.fineTunedModelId
      if (!modelData.has(modelId)) {
        modelData.set(modelId, {
          cost: 0,
          predictions: 0,
          modelName: metric.fineTunedModel.name
        })
      }
      modelData.get(modelId)!.cost += metric.value
    })

    requestMetrics.forEach(metric => {
      const modelId = metric.fineTunedModelId
      if (modelData.has(modelId)) {
        modelData.get(modelId)!.predictions += metric.value
      }
    })

    // Calculate cost per prediction for each model
    const breakdown = Array.from(modelData.entries()).map(([modelId, data]) => ({
      modelId,
      modelName: data.modelName,
      cost: data.cost,
      predictions: data.predictions,
      costPerPrediction: data.predictions > 0 ? data.cost / data.predictions : 0
    }))

    // Calculate overall averages
    const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0)
    const totalPredictions = breakdown.reduce((sum, item) => sum + item.predictions, 0)
    const current = totalPredictions > 0 ? totalCost / totalPredictions : 0
    const average = current // Simplified - would use historical data

    // Determine trend
    const trend = current < average * 0.9 ? 'down' : current > average * 1.1 ? 'up' : 'stable'

    return {
      current,
      average,
      trend,
      breakdown
    }
  }

  /**
   * Calculate efficiency metrics
   */
  static async calculateEfficiencyMetrics(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    tokenEfficiency: number
    latencyEfficiency: number
    accuracyEfficiency: number
    overall: number
  }> {
    // Get relevant metrics
    const metrics = await db.modelMetric.findMany({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    // Calculate token efficiency (tokens per dollar)
    const tokenMetrics = metrics.filter(m => m.metricType === MetricType.TOKEN_COUNT)
    const costMetrics = metrics.filter(m => m.metricType === MetricType.COST)
    
    const totalTokens = tokenMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalCost = costMetrics.reduce((sum, m) => sum + m.value, 0)
    const tokenEfficiency = totalCost > 0 ? totalTokens / totalCost : 0

    // Calculate latency efficiency (inverse of latency)
    const latencyMetrics = metrics.filter(m => m.metricType === MetricType.LATENCY)
    const avgLatency = latencyMetrics.length > 0 
      ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length 
      : 0
    const latencyEfficiency = avgLatency > 0 ? Math.max(0, 1000 - avgLatency) / 1000 : 0

    // Calculate accuracy efficiency (success rate)
    const successMetrics = metrics.filter(m => m.metricType === MetricType.SUCCESS_RATE)
    const avgSuccessRate = successMetrics.length > 0 
      ? successMetrics.reduce((sum, m) => sum + m.value, 0) / successMetrics.length 
      : 0
    const accuracyEfficiency = avgSuccessRate / 100

    // Calculate overall efficiency
    const overall = (tokenEfficiency + latencyEfficiency + accuracyEfficiency) / 3

    return {
      tokenEfficiency: Math.min(100, tokenEfficiency / 1000), // Normalize to 0-100
      latencyEfficiency: latencyEfficiency * 100,
      accuracyEfficiency: accuracyEfficiency * 100,
      overall: overall * 100
    }
  }

  /**
   * Calculate business impact metrics
   */
  static async calculateBusinessImpact(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    costSavings: number
    revenueGenerated: number
    productivityGain: number
    customerSatisfaction: number
  }> {
    // These would typically be calculated based on business-specific logic
    // For now, we'll use estimations based on usage patterns

    const apiUsage = await db.apiUsage.findMany({
      where: {
        userId,
        date: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const totalRequests = apiUsage.reduce((sum, usage) => sum + usage.requestCount, 0)
    const totalCost = apiUsage.reduce((sum, usage) => sum + usage.cost, 0)

    // Estimate cost savings (automation efficiency)
    const costSavings = totalRequests * 0.10 // $0.10 per request saved

    // Estimate revenue generation
    const revenueGenerated = totalRequests * 0.05 // $0.05 per request revenue

    // Estimate productivity gain (hours saved)
    const productivityGain = totalRequests * 0.001 // Hours saved

    // Customer satisfaction (based on success rate)
    const successMetrics = await db.modelMetric.findMany({
      where: {
        metricType: MetricType.SUCCESS_RATE,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const avgSuccessRate = successMetrics.length > 0 
      ? successMetrics.reduce((sum, m) => sum + m.value, 0) / successMetrics.length 
      : 95
    const customerSatisfaction = avgSuccessRate

    return {
      costSavings,
      revenueGenerated,
      productivityGain,
      customerSatisfaction
    }
  }

  /**
   * Get detailed cost analysis
   */
  static async getCostAnalysis(userId: string, timeRange: { start: Date; end: Date }): Promise<CostAnalysis> {
    const apiUsage = await db.apiUsage.findMany({
      where: {
        userId,
        date: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      include: {
        fineTunedModel: true
      }
    })

    const totalCost = apiUsage.reduce((sum, usage) => sum + usage.cost, 0)

    // Group costs by model
    const modelCosts = new Map<string, { cost: number; modelName: string }>()
    apiUsage.forEach(usage => {
      const modelId = usage.fineTunedModelId || 'unknown'
      if (!modelCosts.has(modelId)) {
        modelCosts.set(modelId, {
          cost: 0,
          modelName: usage.fineTunedModel?.name || 'Unknown Model'
        })
      }
      modelCosts.get(modelId)!.cost += usage.cost
    })

    const modelCostsArray = Array.from(modelCosts.entries()).map(([modelId, data]) => ({
      modelId,
      modelName: data.modelName,
      cost: data.cost,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
    }))

    // Generate cost trends (simplified - would need more sophisticated time series analysis)
    const costTrends = []
    for (let i = 0; i < 7; i++) {
      const periodStart = new Date(timeRange.start.getTime() + (i * (timeRange.end.getTime() - timeRange.start.getTime()) / 7))
      const periodEnd = new Date(timeRange.start.getTime() + ((i + 1) * (timeRange.end.getTime() - timeRange.start.getTime()) / 7))
      
      const periodUsage = apiUsage.filter(usage => 
        usage.date >= periodStart && usage.date < periodEnd
      )
      
      const periodCost = periodUsage.reduce((sum, usage) => sum + usage.cost, 0)
      const periodRequests = periodUsage.reduce((sum, usage) => sum + usage.requestCount, 0)
      
      costTrends.push({
        period: `Day ${i + 1}`,
        cost: periodCost,
        predictions: periodRequests,
        costPerPrediction: periodRequests > 0 ? periodCost / periodRequests : 0
      })
    }

    // Budget utilization (simplified - would need actual budget data)
    const monthlyBudget = 10000 // $10,000 monthly budget
    const budgetUtilization = {
      budget: monthlyBudget,
      used: totalCost,
      remaining: Math.max(0, monthlyBudget - totalCost),
      percentage: (totalCost / monthlyBudget) * 100
    }

    return {
      totalCost,
      modelCosts: modelCostsArray,
      costTrends,
      budgetUtilization
    }
  }

  /**
   * Calculate ROI with detailed breakdown
   */
  static async calculateDetailedROI(userId: string, timeRange: { start: Date; end: Date }): Promise<ROICalculation> {
    const businessImpact = await this.calculateBusinessImpact(userId, timeRange)
    const apiUsage = await db.apiUsage.findMany({
      where: {
        userId,
        date: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const investment = apiUsage.reduce((sum, usage) => sum + usage.cost, 0)
    const returns = businessImpact.costSavings + businessImpact.revenueGenerated
    const roi = investment > 0 ? ((returns - investment) / investment) * 100 : 0
    const paybackPeriod = roi > 0 ? investment / (returns / 30) : 0 // in days

    return {
      investment,
      returns,
      roi,
      paybackPeriod,
      breakdown: {
        costSavings: businessImpact.costSavings,
        revenueIncrease: businessImpact.revenueGenerated,
        efficiencyGains: businessImpact.productivityGain * 50 // $50 per hour saved
      }
    }
  }

  /**
   * Get performance benchmarks
   */
  static async getPerformanceBenchmarks(userId: string, timeRange: { start: Date; end: Date }) {
    const metrics = await db.modelMetric.findMany({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    })

    const benchmarks = {
      latency: {
        current: 0,
        benchmark: 100, // 100ms target
        status: 'good'
      },
      throughput: {
        current: 0,
        benchmark: 1000, // 1000 requests/sec target
        status: 'good'
      },
      errorRate: {
        current: 0,
        benchmark: 1, // 1% error rate target
        status: 'good'
      },
      cost: {
        current: 0,
        benchmark: 0.01, // $0.01 per prediction target
        status: 'good'
      }
    }

    // Calculate current values
    const latencyMetrics = metrics.filter(m => m.metricType === MetricType.LATENCY)
    if (latencyMetrics.length > 0) {
      benchmarks.latency.current = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
      benchmarks.latency.status = benchmarks.latency.current <= benchmarks.latency.benchmark ? 'good' : 'poor'
    }

    const throughputMetrics = metrics.filter(m => m.metricType === MetricType.THROUGHPUT)
    if (throughputMetrics.length > 0) {
      benchmarks.throughput.current = throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length
      benchmarks.throughput.status = benchmarks.throughput.current >= benchmarks.throughput.benchmark ? 'good' : 'poor'
    }

    const errorMetrics = metrics.filter(m => m.metricType === MetricType.ERROR_RATE)
    if (errorMetrics.length > 0) {
      benchmarks.errorRate.current = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length
      benchmarks.errorRate.status = benchmarks.errorRate.current <= benchmarks.errorRate.benchmark ? 'good' : 'poor'
    }

    const costMetrics = metrics.filter(m => m.metricType === MetricType.COST)
    const requestMetrics = metrics.filter(m => m.metricType === MetricType.REQUEST_COUNT)
    
    if (costMetrics.length > 0 && requestMetrics.length > 0) {
      const totalCost = costMetrics.reduce((sum, m) => sum + m.value, 0)
      const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0)
      benchmarks.cost.current = totalRequests > 0 ? totalCost / totalRequests : 0
      benchmarks.cost.status = benchmarks.cost.current <= benchmarks.cost.benchmark ? 'good' : 'poor'
    }

    return benchmarks
  }
}