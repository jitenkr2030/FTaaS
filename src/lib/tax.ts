import { db } from '@/lib/db'
import { TaxType, ExemptionType, ExemptionStatus } from '@prisma/client'

export interface TaxRegionData {
  code: string
  name: string
  country: string
  type: TaxType
  rate: number
  enabled: boolean
  thresholds?: any
  exemptions?: any
  metadata?: any
}

export interface TaxCalculationRequest {
  userId: string
  amount: number
  regionCode?: string
  country?: string
  currency?: string
  items?: Array<{
    amount: number
    category?: string
    taxExempt?: boolean
  }>
}

export interface TaxCalculationResult {
  subtotal: number
  taxAmount: number
  total: number
  taxRate: number
  regionCode: string
  regionName: string
  breakdown: Array<{
    type: TaxType
    rate: number
    amount: number
    name: string
  }>
  exempt: boolean
  exemptionReason?: string
}

export interface TaxExemptionData {
  type: ExemptionType
  certificate?: string
  regions: string[]
  validFrom: Date
  validTo?: Date
  documents?: any
}

export class TaxService {
  static async getTaxRegions(country?: string): Promise<TaxRegionData[]> {
    const where: any = { enabled: true }
    if (country) {
      where.country = country
    }

    const regions = await db.taxRegion.findMany({
      where,
      orderBy: [
        { country: 'asc' },
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return regions.map(region => ({
      code: region.code,
      name: region.name,
      country: region.country,
      type: region.type,
      rate: region.rate,
      enabled: region.enabled,
      thresholds: region.thresholds,
      exemptions: region.exemptions,
      metadata: region.metadata
    }))
  }

  static async getTaxRegion(code: string): Promise<TaxRegionData | null> {
    const region = await db.taxRegion.findUnique({
      where: { code }
    })

    if (!region) return null

    return {
      code: region.code,
      name: region.name,
      country: region.country,
      type: region.type,
      rate: region.rate,
      enabled: region.enabled,
      thresholds: region.thresholds,
      exemptions: region.exemptions,
      metadata: region.metadata
    }
  }

  static async createTaxRegion(data: Omit<TaxRegionData, 'code'>): Promise<TaxRegionData> {
    const region = await db.taxRegion.create({
      data: {
        name: data.name,
        country: data.country,
        type: data.type,
        rate: data.rate,
        enabled: data.enabled,
        thresholds: data.thresholds,
        exemptions: data.exemptions,
        metadata: data.metadata
      }
    })

    return {
      code: region.code,
      name: region.name,
      country: region.country,
      type: region.type,
      rate: region.rate,
      enabled: region.enabled,
      thresholds: region.thresholds,
      exemptions: region.exemptions,
      metadata: region.metadata
    }
  }

  static async updateTaxRegion(code: string, data: Partial<TaxRegionData>): Promise<TaxRegionData> {
    const region = await db.taxRegion.update({
      where: { code },
      data: {
        name: data.name,
        country: data.country,
        type: data.type,
        rate: data.rate,
        enabled: data.enabled,
        thresholds: data.thresholds,
        exemptions: data.exemptions,
        metadata: data.metadata
      }
    })

    return {
      code: region.code,
      name: region.name,
      country: region.country,
      type: region.type,
      rate: region.rate,
      enabled: region.enabled,
      thresholds: region.thresholds,
      exemptions: region.exemptions,
      metadata: region.metadata
    }
  }

  static async deleteTaxRegion(code: string): Promise<void> {
    await db.taxRegion.delete({
      where: { code }
    })
  }

  static async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    const { userId, amount, regionCode, country, items = [] } = request

    // Determine the tax region
    let taxRegion = await this.determineTaxRegion(userId, regionCode, country)
    
    // Check for tax exemption
    const exemption = await this.getTaxExemption(userId)
    const isExempt = await this.isTaxExempt(exemption, taxRegion?.code)

    if (isExempt || !taxRegion) {
      return {
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        taxRate: 0,
        regionCode: taxRegion?.code || 'UNKNOWN',
        regionName: taxRegion?.name || 'Unknown',
        breakdown: [],
        exempt: true,
        exemptionReason: isExempt ? 'Tax exempt' : 'No tax region found'
      }
    }

    // Calculate tax for each item or total amount
    let taxableAmount = 0
    const breakdown: Array<{
      type: TaxType
      rate: number
      amount: number
      name: string
    }> = []

    if (items.length > 0) {
      // Calculate tax per item
      for (const item of items) {
        if (!item.taxExempt) {
          const itemTax = this.calculateItemTax(item.amount, taxRegion)
          taxableAmount += item.amount
          breakdown.push(...itemTax.breakdown)
        }
      }
    } else {
      // Calculate tax on total amount
      const taxBreakdown = this.calculateItemTax(amount, taxRegion)
      taxableAmount = amount
      breakdown.push(...taxBreakdown.breakdown)
    }

    // Aggregate breakdown by type
    const aggregatedBreakdown = this.aggregateBreakdown(breakdown)
    const totalTax = aggregatedBreakdown.reduce((sum, item) => sum + item.amount, 0)

    return {
      subtotal: taxableAmount,
      taxAmount: totalTax,
      total: taxableAmount + totalTax,
      taxRate: totalTax / taxableAmount,
      regionCode: taxRegion.code,
      regionName: taxRegion.name,
      breakdown: aggregatedBreakdown,
      exempt: false
    }
  }

  private static async determineTaxRegion(
    userId: string,
    regionCode?: string,
    country?: string
  ): Promise<any> {
    // If region code is provided, use it
    if (regionCode) {
      return await this.getTaxRegion(regionCode)
    }

    // Try to determine based on user's location or default country
    if (country) {
      // Find the most specific tax region for the country
      const regions = await db.taxRegion.findMany({
        where: {
          country,
          enabled: true
        },
        orderBy: [
          { type: 'desc' } // Prefer more specific types (CITY > COUNTY > STATE > COUNTRY)
        ]
      })

      return regions[0] || null
    }

    // Default to no tax region
    return null
  }

  private static async getTaxExemption(userId: string) {
    return await db.taxExemption.findUnique({
      where: { userId }
    })
  }

  private static async isTaxExempt(exemption: any, regionCode?: string): Promise<boolean> {
    if (!exemption || exemption.status !== ExemptionStatus.APPROVED) {
      return false
    }

    // Check if exemption is still valid
    const now = new Date()
    if (exemption.validFrom > now || (exemption.validTo && exemption.validTo < now)) {
      return false
    }

    // Check if region is covered by exemption
    if (regionCode && exemption.regions) {
      const exemptRegions = Array.isArray(exemption.regions) ? exemption.regions : JSON.parse(exemption.regions)
      return exemptRegions.includes(regionCode)
    }

    // If no specific regions, assume global exemption
    return true
  }

  private static calculateItemTax(amount: number, taxRegion: any) {
    const breakdown: Array<{
      type: TaxType
      rate: number
      amount: number
      name: string
    }> = []

    let taxAmount = 0

    // Apply thresholds if they exist
    let effectiveRate = taxRegion.rate
    if (taxRegion.thresholds) {
      const thresholds = typeof taxRegion.thresholds === 'string' 
        ? JSON.parse(taxRegion.thresholds) 
        : taxRegion.thresholds

      // Check for progressive tax rates
      if (thresholds.brackets) {
        for (const bracket of thresholds.brackets) {
          if (amount > bracket.threshold) {
            effectiveRate = bracket.rate
            break
          }
        }
      }
    }

    taxAmount = amount * effectiveRate

    breakdown.push({
      type: taxRegion.type,
      rate: effectiveRate,
      amount: taxAmount,
      name: taxRegion.name
    })

    return { breakdown }
  }

  private static aggregateBreakdown(breakdown: any[]) {
    const aggregated = new Map()

    for (const item of breakdown) {
      const key = `${item.type}-${item.name}`
      const existing = aggregated.get(key)

      if (existing) {
        existing.amount += item.amount
      } else {
        aggregated.set(key, { ...item })
      }
    }

    return Array.from(aggregated.values())
  }

  static async createTaxExemption(userId: string, data: TaxExemptionData): Promise<any> {
    return await db.taxExemption.create({
      data: {
        userId,
        type: data.type,
        certificate: data.certificate,
        regions: JSON.stringify(data.regions),
        validFrom: data.validFrom,
        validTo: data.validTo,
        documents: data.documents,
        status: ExemptionStatus.PENDING
      }
    })
  }

  static async updateTaxExemption(userId: string, data: Partial<TaxExemptionData>): Promise<any> {
    const existing = await db.taxExemption.findUnique({
      where: { userId }
    })

    if (!existing) {
      throw new Error('Tax exemption not found')
    }

    return await db.taxExemption.update({
      where: { userId },
      data: {
        type: data.type,
        certificate: data.certificate,
        regions: data.regions ? JSON.stringify(data.regions) : undefined,
        validFrom: data.validFrom,
        validTo: data.validTo,
        documents: data.documents
      }
    })
  }

  static async approveTaxExemption(userId: string): Promise<any> {
    return await db.taxExemption.update({
      where: { userId },
      data: { status: ExemptionStatus.APPROVED }
    })
  }

  static async rejectTaxExemption(userId: string): Promise<any> {
    return await db.taxExemption.update({
      where: { userId },
      data: { status: ExemptionStatus.REJECTED }
    })
  }

  static async getTaxCalculations(userId: string, limit = 50): Promise<any[]> {
    return await db.taxCalculation.findMany({
      where: { userId },
      include: {
        region: {
          select: {
            name: true,
            country: true,
            type: true
          }
        },
        invoice: {
          select: {
            invoiceNumber: true,
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  static async getTaxStats(userId: string): Promise<any> {
    const calculations = await db.taxCalculation.findMany({
      where: { userId }
    })

    const stats = {
      totalTaxPaid: calculations.reduce((sum, calc) => sum + calc.taxAmount, 0),
      totalTransactions: calculations.length,
      averageTaxRate: calculations.length > 0 
        ? calculations.reduce((sum, calc) => sum + calc.taxRate, 0) / calculations.length 
        : 0,
      uniqueRegions: new Set(calculations.map(calc => calc.regionCode)).size,
      taxByRegion: {} as Record<string, number>
    }

    // Calculate tax by region
    for (const calc of calculations) {
      if (!stats.taxByRegion[calc.regionCode]) {
        stats.taxByRegion[calc.regionCode] = 0
      }
      stats.taxByRegion[calc.regionCode] += calc.taxAmount
    }

    return stats
  }
}