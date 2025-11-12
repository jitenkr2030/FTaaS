import { db } from '@/lib/db'
import { TestStatus, TestType, TestGoal } from '@prisma/client'

export interface ABTestConfig {
  name: string
  description?: string
  type: TestType
  goal: TestGoal
  config: any
  metrics: any
  duration?: number
  trafficSplit?: number
  sampleSize?: number
  significanceLevel?: number
}

export interface ABTestVariantConfig {
  name: string
  description?: string
  modelId?: string
  config: any
  isControl?: boolean
  weight?: number
}

export interface ABTestResultData {
  variantId: string
  userId?: string
  sessionId?: string
  metrics: any
  conversion?: boolean
  revenue?: number
  metadata?: any
}

export interface ABTestStats {
  totalParticipants: number
  conversionRate: number
  averageRevenue: number
  statisticalSignificance: number
  confidence: number
  winner?: string
  variants: {
    id: string
    name: string
    participants: number
    conversions: number
    conversionRate: number
    averageRevenue: number
    isControl: boolean
  }[]
}

export class ABTestingService {
  static async createTest(userId: string, config: ABTestConfig): Promise<any> {
    const test = await db.aBTest.create({
      data: {
        userId,
        name: config.name,
        description: config.description,
        type: config.type,
        goal: config.goal,
        config: config.config,
        metrics: config.metrics,
        duration: config.duration,
        trafficSplit: config.trafficSplit || 0.5,
        sampleSize: config.sampleSize,
        significanceLevel: config.significanceLevel || 0.05
      }
    })

    return test
  }

  static async addVariant(testId: string, variantConfig: ABTestVariantConfig): Promise<any> {
    const variant = await db.aBTestVariant.create({
      data: {
        testId,
        name: variantConfig.name,
        description: variantConfig.description,
        modelId: variantConfig.modelId,
        config: variantConfig.config,
        isControl: variantConfig.isControl || false,
        weight: variantConfig.weight || 0.5
      }
    })

    return variant
  }

  static async startTest(testId: string): Promise<any> {
    const test = await db.aBTest.update({
      where: { id: testId },
      data: {
        status: TestStatus.RUNNING,
        startDate: new Date(),
        startedAt: new Date()
      }
    })

    return test
  }

  static async pauseTest(testId: string): Promise<any> {
    const test = await db.aBTest.update({
      where: { id: testId },
      data: {
        status: TestStatus.PAUSED
      }
    })

    return test
  }

  static async completeTest(testId: string): Promise<any> {
    const test = await db.aBTest.update({
      where: { id: testId },
      data: {
        status: TestStatus.COMPLETED,
        endDate: new Date(),
        completedAt: new Date()
      }
    })

    return test
  }

  static async cancelTest(testId: string): Promise<any> {
    const test = await db.aBTest.update({
      where: { id: testId },
      data: {
        status: TestStatus.CANCELLED,
        endDate: new Date()
      }
    })

    return test
  }

  static async getTests(userId: string, status?: TestStatus): Promise<any[]> {
    const where: any = { userId }
    if (status) {
      where.status = status
    }

    return await db.aBTest.findMany({
      where,
      include: {
        variants: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                modelId: true
              }
            }
          }
        },
        _count: {
          select: {
            results: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getTest(testId: string): Promise<any> {
    return await db.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                modelId: true
              }
            },
            _count: {
              select: {
                results: true
              }
            }
          }
        },
        results: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 100
        }
      }
    })
  }

  static async assignVariant(testId: string, userId?: string, sessionId?: string): Promise<any> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error('Test not found')
    }

    if (test.status !== TestStatus.RUNNING) {
      throw new Error('Test is not running')
    }

    // Check if user/session already has a variant assigned
    if (userId) {
      const existingResult = await db.aBTestResult.findFirst({
        where: {
          testId,
          userId
        }
      })

      if (existingResult) {
        return existingResult.variant
      }
    }

    if (sessionId) {
      const existingResult = await db.aBTestResult.findFirst({
        where: {
          testId,
          sessionId
        }
      })

      if (existingResult) {
        return existingResult.variant
      }
    }

    // Assign variant based on weights
    const totalWeight = test.variants.reduce((sum: number, variant: any) => sum + variant.weight, 0)
    const random = Math.random() * totalWeight
    let currentWeight = 0

    for (const variant of test.variants) {
      currentWeight += variant.weight
      if (random <= currentWeight) {
        return variant
      }
    }

    // Fallback to first variant
    return test.variants[0]
  }

  static async recordResult(resultData: ABTestResultData): Promise<any> {
    const result = await db.aBTestResult.create({
      data: {
        testId: resultData.testId,
        variantId: resultData.variantId,
        userId: resultData.userId,
        sessionId: resultData.sessionId,
        metrics: resultData.metrics,
        conversion: resultData.conversion || false,
        revenue: resultData.revenue || 0,
        metadata: resultData.metadata
      }
    })

    return result
  }

  static async getTestStats(testId: string): Promise<ABTestStats> {
    const test = await this.getTest(testId)
    if (!test) {
      throw new Error('Test not found')
    }

    const results = await db.aBTestResult.findMany({
      where: { testId },
      include: {
        variant: true
      }
    })

    const variantStats = new Map<string, any>()

    // Calculate stats for each variant
    for (const result of results) {
      const variantId = result.variantId
      if (!variantStats.has(variantId)) {
        variantStats.set(variantId, {
          id: variantId,
          name: result.variant.name,
          participants: 0,
          conversions: 0,
          totalRevenue: 0,
          isControl: result.variant.isControl
        })
      }

      const stats = variantStats.get(variantId)!
      stats.participants++
      stats.totalRevenue += result.revenue

      if (result.conversion) {
        stats.conversions++
      }
    }

    const variants = Array.from(variantStats.values()).map(stats => ({
      id: stats.id,
      name: stats.name,
      participants: stats.participants,
      conversions: stats.conversions,
      conversionRate: stats.participants > 0 ? stats.conversions / stats.participants : 0,
      averageRevenue: stats.participants > 0 ? stats.totalRevenue / stats.participants : 0,
      isControl: stats.isControl
    }))

    const totalParticipants = variants.reduce((sum, v) => sum + v.participants, 0)
    const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0)
    const totalRevenue = variants.reduce((sum, v) => sum + (v.averageRevenue * v.participants), 0)

    const conversionRate = totalParticipants > 0 ? totalConversions / totalParticipants : 0
    const averageRevenue = totalParticipants > 0 ? totalRevenue / totalParticipants : 0

    // Calculate statistical significance (simplified)
    const statisticalSignificance = this.calculateStatisticalSignificance(variants)
    const confidence = this.calculateConfidence(variants)

    // Determine winner
    let winner: string | undefined
    if (variants.length > 1) {
      const sortedByConversion = [...variants].sort((a, b) => b.conversionRate - a.conversionRate)
      if (sortedByConversion[0].conversionRate > sortedByConversion[1].conversionRate) {
        winner = sortedByConversion[0].id
      }
    }

    return {
      totalParticipants,
      conversionRate,
      averageRevenue,
      statisticalSignificance,
      confidence,
      winner,
      variants
    }
  }

  private static calculateStatisticalSignificance(variants: any[]): number {
    if (variants.length < 2) return 0

    // Simplified chi-square test for conversion rates
    const control = variants.find(v => v.isControl)
    const treatment = variants.find(v => !v.isControl)

    if (!control || !treatment) return 0

    const controlConversion = control.conversions
    const controlNonConversion = control.participants - control.conversions
    const treatmentConversion = treatment.conversions
    const treatmentNonConversion = treatment.participants - treatment.conversions

    const total = control.participants + treatment.participants
    const expectedControlConversion = (controlConversion + treatmentConversion) * control.participants / total
    const expectedControlNonConversion = (controlNonConversion + treatmentNonConversion) * control.participants / total
    const expectedTreatmentConversion = (controlConversion + treatmentConversion) * treatment.participants / total
    const expectedTreatmentNonConversion = (controlNonConversion + treatmentNonConversion) * treatment.participants / total

    const chiSquare = 
      Math.pow(controlConversion - expectedControlConversion, 2) / expectedControlConversion +
      Math.pow(controlNonConversion - expectedControlNonConversion, 2) / expectedControlNonConversion +
      Math.pow(treatmentConversion - expectedTreatmentConversion, 2) / expectedTreatmentConversion +
      Math.pow(treatmentNonConversion - expectedTreatmentNonConversion, 2) / expectedTreatmentNonConversion

    // Convert chi-square to p-value (simplified)
    return Math.min(chiSquare / 10, 1) // This is a simplification
  }

  private static calculateConfidence(variants: any[]): number {
    if (variants.length < 2) return 0

    const control = variants.find(v => v.isControl)
    const treatment = variants.find(v => !v.isControl)

    if (!control || !treatment) return 0

    const controlRate = control.conversionRate
    const treatmentRate = treatment.conversionRate
    const difference = Math.abs(treatmentRate - controlRate)

    // Simplified confidence calculation
    return Math.min(difference * 10, 1)
  }

  static async getRunningTests(): Promise<any[]> {
    return await db.aBTest.findMany({
      where: {
        status: TestStatus.RUNNING
      },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            weight: true
          }
        }
      }
    })
  }

  static async shouldAutoComplete(testId: string): Promise<boolean> {
    const test = await this.getTest(testId)
    if (!test || test.status !== TestStatus.RUNNING) {
      return false
    }

    const stats = await this.getTestStats(testId)

    // Check if sample size reached
    if (test.sampleSize && stats.totalParticipants >= test.sampleSize) {
      return true
    }

    // Check if duration reached
    if (test.duration && test.startDate) {
      const endDate = new Date(test.startDate)
      endDate.setDate(endDate.getDate() + test.duration)
      if (new Date() >= endDate) {
        return true
      }
    }

    // Check if statistical significance reached
    if (stats.statisticalSignificance >= (1 - test.significanceLevel)) {
      return true
    }

    return false
  }

  static async autoCompleteTests(): Promise<void> {
    const runningTests = await this.getRunningTests()

    for (const test of runningTests) {
      if (await this.shouldAutoComplete(test.id)) {
        await this.completeTest(test.id)
      }
    }
  }
}