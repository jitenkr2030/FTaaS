import { db } from '@/lib/db'
import { dataValidationService } from '@/lib/data-validation'

export interface QualityAssessment {
  id: string
  datasetId: string
  overallScore: number // 0-100
  dimensions: QualityDimension[]
  recommendations: QualityRecommendation[]
  issues: QualityIssue[]
  summary: QualitySummary
  assessedAt: Date
}

export interface QualityDimension {
  name: string
  score: number // 0-100
  weight: number // 0-1
  description: string
  metrics: QualityMetric[]
}

export interface QualityMetric {
  name: string
  value: number
  target: number
  status: 'good' | 'fair' | 'poor'
  description: string
}

export interface QualityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  affectedRecords: number
  suggestions: string[]
  location?: {
    field?: string
    recordRange?: [number, number]
  }
}

export interface QualityRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high'
  category: string
  title: string
  description: string
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  steps: string[]
}

export interface QualitySummary {
  totalRecords: number
  validRecords: number
  issuesFound: number
  criticalIssues: number
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  assessment: string
}

export interface QualityAssessmentOptions {
  includeDetailedAnalysis: boolean
  sampleSize?: number
  customRules?: QualityRule[]
  benchmarkComparison?: boolean
  industryStandards?: string[]
}

export interface QualityRule {
  id: string
  name: string
  type: 'validation' | 'consistency' | 'completeness' | 'accuracy'
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface QualityTrend {
  period: string
  assessments: QualityAssessment[]
  trends: {
    overall: TrendData
    dimensions: { [key: string]: TrendData }
  }
  insights: string[]
}

export interface TrendData {
  direction: 'improving' | 'declining' | 'stable'
  change: number
  confidence: number
}

export class DataQualityService {
  private dimensions: QualityDimensionConfig[] = [
    {
      name: 'Completeness',
      weight: 0.25,
      description: 'Measures the presence of required data',
      metrics: ['null_percentage', 'missing_fields', 'record_completeness']
    },
    {
      name: 'Accuracy',
      weight: 0.2,
      description: 'Measures correctness of data values',
      metrics: ['format_validation', 'range_validation', 'pattern_validation']
    },
    {
      name: 'Consistency',
      weight: 0.2,
      description: 'Measures uniformity of data across records',
      metrics: ['field_consistency', 'format_consistency', 'value_consistency']
    },
    {
      name: 'Timeliness',
      weight: 0.15,
      description: 'Measures currency and relevance of data',
      metrics: ['data_freshness', 'update_frequency', 'latency']
    },
    {
      name: 'Uniqueness',
      weight: 0.1,
      description: 'Measures absence of duplicate records',
      metrics: ['duplicate_records', 'primary_key_uniqueness', 'composite_uniqueness']
    },
    {
      name: 'Validity',
      weight: 0.1,
      description: 'Measures conformance to data standards',
      metrics: ['data_type_validation', 'domain_validation', 'constraint_validation']
    }
  ]

  async assessDatasetQuality(
    datasetId: string,
    options: QualityAssessmentOptions = {}
  ): Promise<QualityAssessment> {
    try {
      // Get dataset from database
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId }
      })

      if (!dataset) {
        throw new Error('Dataset not found')
      }

      // Get sample data for analysis
      const sampleData = await this.getDatasetSample(datasetId, options.sampleSize || 1000)

      // Assess each quality dimension
      const dimensions: QualityDimension[] = []
      let weightedScore = 0

      for (const dimensionConfig of this.dimensions) {
        const dimension = await this.assessDimension(
          datasetId,
          dimensionConfig,
          sampleData,
          options
        )
        dimensions.push(dimension)
        weightedScore += dimension.score * dimensionConfig.weight
      }

      // Identify quality issues
      const issues = await this.identifyQualityIssues(datasetId, sampleData, dimensions)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(issues, dimensions)

      // Create summary
      const summary = this.createQualitySummary(dimensions, issues)

      // Calculate overall score
      const overallScore = Math.round(weightedScore)

      const assessment: QualityAssessment = {
        id: `qa_${datasetId}_${Date.now()}`,
        datasetId,
        overallScore,
        dimensions,
        recommendations,
        issues,
        summary,
        assessedAt: new Date()
      }

      // Save assessment to database
      await this.saveAssessment(assessment)

      return assessment
    } catch (error) {
      console.error('Error assessing dataset quality:', error)
      throw error
    }
  }

  private async getDatasetSample(datasetId: string, sampleSize: number): Promise<any[]> {
    try {
      // Get dataset storage key
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId },
        select: { storageKey: true, format: true }
      })

      if (!dataset || !dataset.storageKey) {
        throw new Error('Dataset storage key not found')
      }

      // In a real implementation, this would sample from the actual dataset
      // For now, generate mock sample data based on dataset format
      const sampleData: any[] = []

      switch (dataset.format) {
        case 'JSONL':
          for (let i = 0; i < Math.min(sampleSize, 100); i++) {
            sampleData.push({
              id: i + 1,
              text: `Sample text ${i}`,
              category: `category_${i % 5}`,
              value: Math.random() * 100,
              timestamp: new Date().toISOString()
            })
          }
          break

        case 'CSV':
          for (let i = 0; i < Math.min(sampleSize, 100); i++) {
            sampleData.push({
              id: i + 1,
              name: `Record ${i}`,
              value: Math.random() * 100,
              status: ['active', 'inactive', 'pending'][i % 3]
            })
          }
          break

        case 'JSON':
          for (let i = 0; i < Math.min(sampleSize, 100); i++) {
            sampleData.push({
              id: i + 1,
              data: {
                text: `Sample data ${i}`,
                metadata: {
                  source: 'generated',
                  quality: 'high'
                }
              }
            })
          }
          break

        default:
          for (let i = 0; i < Math.min(sampleSize, 100); i++) {
            sampleData.push({
              id: i + 1,
              content: `Sample content ${i}`
            })
          }
      }

      return sampleData
    } catch (error) {
      console.error('Error getting dataset sample:', error)
      return []
    }
  }

  private async assessDimension(
    datasetId: string,
    config: QualityDimensionConfig,
    sampleData: any[],
    options: QualityAssessmentOptions
  ): Promise<QualityDimension> {
    const metrics: QualityMetric[] = []

    for (const metricName of config.metrics) {
      const metric = await this.calculateMetric(metricName, sampleData)
      metrics.push(metric)
    }

    // Calculate dimension score as weighted average of metrics
    const dimensionScore = metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length

    return {
      name: config.name,
      score: Math.round(dimensionScore),
      weight: config.weight,
      description: config.description,
      metrics
    }
  }

  private async calculateMetric(metricName: string, sampleData: any[]): Promise<QualityMetric> {
    let value: number
    let target: number
    let description: string

    switch (metricName) {
      case 'null_percentage':
        const nullCount = sampleData.filter(record => 
          Object.values(record).some(val => val === null || val === undefined)
        ).length
        value = Math.max(0, 100 - (nullCount / sampleData.length) * 100)
        target = 95
        description = `Percentage of non-null values: ${value.toFixed(1)}%`
        break

      case 'duplicate_records':
        const uniqueRecords = new Set(sampleData.map(r => JSON.stringify(r))).size
        value = (uniqueRecords / sampleData.length) * 100
        target = 98
        description = `Percentage of unique records: ${value.toFixed(1)}%`
        break

      case 'record_completeness':
        const totalFields = sampleData.reduce((sum, record) => sum + Object.keys(record).length, 0)
        const nonNullFields = sampleData.reduce((sum, record) => 
          sum + Object.values(record).filter(val => val !== null && val !== undefined).length, 0
        )
        value = (nonNullFields / totalFields) * 100
        target = 90
        description = `Record completeness: ${value.toFixed(1)}%`
        break

      case 'format_validation':
        // Simulate format validation
        value = 85 + Math.random() * 10
        target = 90
        description = `Format validation score: ${value.toFixed(1)}%`
        break

      case 'field_consistency':
        // Simulate field consistency check
        value = 90 + Math.random() * 8
        target = 95
        description = `Field consistency: ${value.toFixed(1)}%`
        break

      case 'data_freshness':
        // Simulate data freshness check
        value = 80 + Math.random() * 15
        target = 85
        description = `Data freshness score: ${value.toFixed(1)}%`
        break

      default:
        value = 75 + Math.random() * 20
        target = 80
        description = `${metricName} score: ${value.toFixed(1)}%`
    }

    const status = value >= target ? 'good' : value >= target * 0.8 ? 'fair' : 'poor'

    return {
      name: metricName,
      value: Math.round(value),
      target,
      status,
      description
    }
  }

  private async identifyQualityIssues(
    datasetId: string,
    sampleData: any[],
    dimensions: QualityDimension[]
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []

    // Analyze metrics to identify issues
    dimensions.forEach(dimension => {
      dimension.metrics.forEach(metric => {
        if (metric.status === 'poor') {
          issues.push({
            id: `issue_${datasetId}_${dimension.name}_${metric.name}`,
            type: 'error',
            severity: 'high',
            category: dimension.name,
            description: `${metric.name} is below target threshold`,
            affectedRecords: Math.floor(sampleData.length * (1 - metric.value / 100)),
            suggestions: [
              `Review and clean ${metric.name.toLowerCase()} issues`,
              `Consider data validation rules`,
              `Implement automated data quality checks`
            ]
          })
        } else if (metric.status === 'fair') {
          issues.push({
            id: `issue_${datasetId}_${dimension.name}_${metric.name}`,
            type: 'warning',
            severity: 'medium',
            category: dimension.name,
            description: `${metric.name} could be improved`,
            affectedRecords: Math.floor(sampleData.length * (1 - metric.value / 100)),
            suggestions: [
              `Monitor ${metric.name.toLowerCase()} metrics`,
              `Consider data enrichment strategies`
            ]
          })
        }
      })
    })

    // Add specific data quality issues based on sample analysis
    const missingDataIssues = this.identifyMissingDataIssues(sampleData)
    const consistencyIssues = this.identifyConsistencyIssues(sampleData)
    const formatIssues = this.identifyFormatIssues(sampleData)

    issues.push(...missingDataIssues, ...consistencyIssues, ...formatIssues)

    return issues
  }

  private identifyMissingDataIssues(sampleData: any[]): QualityIssue[] {
    const issues: QualityIssue[] = []
    const fieldCounts: Map<string, number> = new Map()
    const totalRecords = sampleData.length

    // Count field occurrences
    sampleData.forEach(record => {
      Object.keys(record).forEach(field => {
        fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1)
      })
    })

    // Identify fields with missing values
    fieldCounts.forEach((count, field) => {
      const missingCount = totalRecords - count
      const missingPercentage = (missingCount / totalRecords) * 100

      if (missingPercentage > 10) {
        issues.push({
          id: `missing_data_${field}`,
          type: 'warning',
          severity: missingPercentage > 50 ? 'high' : 'medium',
          category: 'Completeness',
          description: `Field '${field}' has ${missingPercentage.toFixed(1)}% missing values`,
          affectedRecords: missingCount,
          location: { field },
          suggestions: [
            `Implement data validation for ${field}`,
            `Consider default values or data imputation`,
            `Review data collection process`
          ]
        })
      }
    })

    return issues
  }

  private identifyConsistencyIssues(sampleData: any[]): QualityIssue[] {
    const issues: QualityIssue[] = []
    const fieldValues: Map<string, Set<any>> = new Map()

    // Collect field values
    sampleData.forEach(record => {
      Object.keys(record).forEach(field => {
        if (!fieldValues.has(field)) {
          fieldValues.set(field, new Set())
        }
        fieldValues.get(field)!.add(record[field])
      })
    })

    // Identify fields with too many unique values (potential inconsistency)
    fieldValues.forEach((values, field) => {
      const uniqueness = values.size / sampleData.length

      if (uniqueness > 0.9 && values.size > 100) {
        issues.push({
          id: `consistency_${field}`,
          type: 'info',
          severity: 'low',
          category: 'Consistency',
          description: `Field '${field}' has high cardinality (${values.size} unique values)`,
          affectedRecords: sampleData.length,
          location: { field },
          suggestions: [
            `Consider if this field should be normalized`,
            `Check for data entry errors`,
            `Review business requirements for this field`
          ]
        })
      }
    })

    return issues
  }

  private identifyFormatIssues(sampleData: any[]): QualityIssue[] {
    const issues: QualityIssue[] = []

    // Check for common format issues
    sampleData.forEach((record, index) => {
      Object.keys(record).forEach(field => {
        const value = record[field]

        if (typeof value === 'string') {
          // Check for unusually long strings
          if (value.length > 1000) {
            issues.push({
              id: `format_${field}_${index}`,
              type: 'warning',
              severity: 'low',
              category: 'Validity',
              description: `Unusually long string in field '${field}' at record ${index + 1}`,
              affectedRecords: 1,
              location: { field, recordRange: [index, index] },
              suggestions: [
                `Validate string length requirements`,
                `Consider truncation or normalization`
              ]
            })
          }

          // Check for potential encoding issues
          if (value.match(/[\x00-\x1F\x7F]/)) {
            issues.push({
              id: `encoding_${field}_${index}`,
              type: 'warning',
              severity: 'medium',
              category: 'Validity',
              description: `Potential encoding issues in field '${field}' at record ${index + 1}`,
              affectedRecords: 1,
              location: { field, recordRange: [index, index] },
              suggestions: [
                `Check character encoding`,
                `Clean special characters`,
                `Validate input encoding`
              ]
            })
          }
        }
      })
    })

    return issues
  }

  private async generateRecommendations(
    issues: QualityIssue[],
    dimensions: QualityDimension[]
  ): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = []

    // Generate recommendations based on issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical')
    const highIssues = issues.filter(issue => issue.severity === 'high')
    const mediumIssues = issues.filter(issue => issue.severity === 'medium')

    if (criticalIssues.length > 0) {
      recommendations.push({
        id: 'rec_critical_issues',
        priority: 'high',
        category: 'Issue Resolution',
        title: 'Address Critical Data Quality Issues',
        description: `Found ${criticalIssues.length} critical issues that require immediate attention`,
        effort: 'high',
        impact: 'high',
        steps: [
          'Prioritize critical issues by business impact',
          'Implement immediate fixes for data validation',
          'Set up monitoring to prevent recurrence',
          'Communicate with data stakeholders'
        ]
      })
    }

    if (highIssues.length > 0) {
      recommendations.push({
        id: 'rec_high_issues',
        priority: 'high',
        category: 'Issue Resolution',
        title: 'Resolve High Priority Issues',
        description: `Address ${highIssues.length} high-priority data quality issues`,
        effort: 'medium',
        impact: 'high',
        steps: [
          'Review and fix data validation rules',
          'Implement data cleansing workflows',
          'Add automated quality checks',
          'Document data quality standards'
        ]
      })
    }

    // Generate recommendations based on dimension scores
    const lowScoringDimensions = dimensions.filter(d => d.score < 70)
    if (lowScoringDimensions.length > 0) {
      recommendations.push({
        id: 'rec_dimension_improvement',
        priority: 'medium',
        category: 'Quality Improvement',
        title: 'Improve Data Quality Dimensions',
        description: `Focus on improving ${lowScoringDimensions.map(d => d.name).join(', ')}`,
        effort: 'medium',
        impact: 'medium',
        steps: [
          'Analyze root causes of low scores',
          'Implement targeted improvement initiatives',
          'Monitor progress regularly',
          'Adjust data collection processes'
        ]
      })
    }

    // Add proactive recommendations
    recommendations.push({
      id: 'rec_monitoring',
      priority: 'medium',
      category: 'Prevention',
      title: 'Implement Data Quality Monitoring',
      description: 'Set up ongoing data quality monitoring and alerts',
      effort: 'medium',
      impact: 'high',
      steps: [
        'Define data quality KPIs and thresholds',
        'Implement automated quality checks',
        'Set up alerting for quality issues',
        'Schedule regular quality assessments'
      ]
    })

    return recommendations
  }

  private createQualitySummary(dimensions: QualityDimension[], issues: QualityIssue[]): QualitySummary {
    const totalRecords = 1000 // Sample size
    const validRecords = totalRecords - issues.reduce((sum, issue) => sum + issue.affectedRecords, 0)
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length

    // Calculate quality grade
    const averageScore = dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length
    let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'

    if (averageScore >= 90) qualityGrade = 'A'
    else if (averageScore >= 80) qualityGrade = 'B'
    else if (averageScore >= 70) qualityGrade = 'C'
    else if (averageScore >= 60) qualityGrade = 'D'
    else qualityGrade = 'F'

    const assessment = this.generateAssessmentText(qualityGrade, averageScore, issues.length)

    return {
      totalRecords,
      validRecords,
      issuesFound: issues.length,
      criticalIssues,
      qualityGrade,
      assessment
    }
  }

  private generateAssessmentText(grade: 'A' | 'B' | 'C' | 'D' | 'F', score: number, issueCount: number): string {
    const gradeDescriptions = {
      A: 'Excellent data quality with minimal issues',
      B: 'Good data quality with some minor issues',
      C: 'Fair data quality requiring attention',
      D: 'Poor data quality needing significant improvement',
      F: 'Critical data quality issues requiring immediate action'
    }

    let assessment = `${gradeDescriptions[grade]} (Score: ${score}/100). `
    
    if (issueCount === 0) {
      assessment += 'No data quality issues detected.'
    } else if (issueCount <= 5) {
      assessment += 'Few issues found that can be easily addressed.'
    } else if (issueCount <= 15) {
      assessment += 'Multiple issues identified that should be prioritized.'
    } else {
      assessment += 'Significant number of issues requiring comprehensive data quality initiative.'
    }

    return assessment
  }

  private async saveAssessment(assessment: QualityAssessment): Promise<void> {
    try {
      await db.qualityAssessment.create({
        data: {
          id: assessment.id,
          datasetId: assessment.datasetId,
          overallScore: assessment.overallScore,
          dimensions: assessment.dimensions as any,
          recommendations: assessment.recommendations as any,
          issues: assessment.issues as any,
          summary: assessment.summary as any,
          assessedAt: assessment.assessedAt
        }
      })
    } catch (error) {
      console.error('Error saving quality assessment:', error)
    }
  }

  async getQualityHistory(datasetId: string, period: 'week' | 'month' | 'quarter' | 'year'): Promise<QualityTrend> {
    try {
      const endDate = new Date()
      let startDate: Date

      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      const assessments = await db.qualityAssessment.findMany({
        where: {
          datasetId,
          assessedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { assessedAt: 'asc' }
      })

      const trends = this.calculateTrends(assessments)
      const insights = this.generateTrendInsights(trends)

      return {
        period,
        assessments,
        trends,
        insights
      }
    } catch (error) {
      console.error('Error getting quality history:', error)
      throw error
    }
  }

  private calculateTrends(assessments: QualityAssessment[]): QualityTrends {
    if (assessments.length < 2) {
      return {
        overall: { direction: 'stable', change: 0, confidence: 0 },
        dimensions: {}
      }
    }

    const first = assessments[0]
    const last = assessments[assessments.length - 1]
    const change = last.overallScore - first.overallScore

    let direction: 'improving' | 'declining' | 'stable'
    if (Math.abs(change) < 5) direction = 'stable'
    else if (change > 0) direction = 'improving'
    else direction = 'declining'

    const confidence = Math.min(Math.abs(change) / 10, 1)

    const dimensionTrends: { [key: string]: TrendData } = {}
    first.dimensions.forEach(dimension => {
      const lastDimension = last.dimensions.find(d => d.name === dimension.name)
      if (lastDimension) {
        const dimensionChange = lastDimension.score - dimension.score
        let dimensionDirection: 'improving' | 'declining' | 'stable'
        
        if (Math.abs(dimensionChange) < 3) dimensionDirection = 'stable'
        else if (dimensionChange > 0) dimensionDirection = 'improving'
        else dimensionDirection = 'declining'

        dimensionTrends[dimension.name] = {
          direction: dimensionDirection,
          change: dimensionChange,
          confidence: Math.min(Math.abs(dimensionChange) / 10, 1)
        }
      }
    })

    return {
      overall: { direction, change, confidence },
      dimensions: dimensionTrends
    }
  }

  private generateTrendInsights(trends: any): string[] {
    const insights: string[] = []

    if (trends.overall.direction === 'improving') {
      insights.push('Data quality is improving over time')
      if (trends.overall.confidence > 0.7) {
        insights.push('Strong positive trend in data quality')
      }
    } else if (trends.overall.direction === 'declining') {
      insights.push('Data quality is declining and needs attention')
      if (trends.overall.confidence > 0.7) {
        insights.push('Significant negative trend requires immediate action')
      }
    } else {
      insights.push('Data quality remains stable over time')
    }

    // Add dimension-specific insights
    Object.entries(trends.dimensions).forEach(([dimension, trend]: [string, any]) => {
      if (trend.direction === 'improving' && trend.confidence > 0.6) {
        insights.push(`${dimension} shows consistent improvement`)
      } else if (trend.direction === 'declining' && trend.confidence > 0.6) {
        insights.push(`${dimension} requires focused improvement efforts`)
      }
    })

    return insights
  }

  async getQualityBenchmark(datasetId: string, industry: string = 'general'): Promise<any> {
    try {
      // Get current assessment
      const currentAssessment = await db.qualityAssessment.findFirst({
        where: { datasetId },
        orderBy: { assessedAt: 'desc' }
      })

      if (!currentAssessment) {
        throw new Error('No quality assessment found for dataset')
      }

      // Get industry benchmarks (mock data for now)
      const benchmarks = {
        general: {
          overall: 75,
          completeness: 80,
          accuracy: 72,
          consistency: 78,
          timeliness: 70,
          uniqueness: 82,
          validity: 76
        },
        healthcare: {
          overall: 85,
          completeness: 90,
          accuracy: 88,
          consistency: 86,
          timeliness: 82,
          uniqueness: 92,
          validity: 88
        },
        finance: {
          overall: 88,
          completeness: 92,
          accuracy: 90,
          consistency: 89,
          timeliness: 85,
          uniqueness: 94,
          validity: 91
        },
        retail: {
          overall: 72,
          completeness: 75,
          accuracy: 70,
          consistency: 73,
          timeliness: 68,
          uniqueness: 78,
          validity: 71
        }
      }

      const benchmark = benchmarks[industry as keyof typeof benchmarks] || benchmarks.general

      // Compare current assessment with benchmark
      const comparison = {
        overall: {
          current: currentAssessment.overallScore,
          benchmark: benchmark.overall,
          difference: currentAssessment.overallScore - benchmark.overall,
          status: currentAssessment.overallScore >= benchmark.overall ? 'above' : 'below'
        },
        dimensions: currentAssessment.dimensions.map(dimension => ({
          name: dimension.name,
          current: dimension.score,
          benchmark: benchmark[dimension.name.toLowerCase() as keyof typeof benchmark] || 75,
          difference: dimension.score - (benchmark[dimension.name.toLowerCase() as keyof typeof benchmark] || 75),
          status: dimension.score >= (benchmark[dimension.name.toLowerCase() as keyof typeof benchmark] || 75) ? 'above' : 'below'
        }))
      }

      return {
        industry,
        benchmark,
        comparison,
        insights: this.generateBenchmarkInsights(comparison)
      }
    } catch (error) {
      console.error('Error getting quality benchmark:', error)
      throw error
    }
  }

  private generateBenchmarkInsights(comparison: any): string[] {
    const insights: string[] = []

    if (comparison.overall.status === 'above') {
      insights.push('Dataset quality exceeds industry benchmark')
      if (comparison.overall.difference > 10) {
        insights.push('Significantly outperforms industry standards')
      }
    } else {
      insights.push('Dataset quality is below industry benchmark')
      if (comparison.overall.difference < -10) {
        insights.push('Significant improvement needed to meet industry standards')
      }
    }

    // Add dimension-specific insights
    comparison.dimensions.forEach((dimension: any) => {
      if (dimension.status === 'above' && dimension.difference > 15) {
        insights.push(`${dimension.name} is a key strength compared to industry`)
      } else if (dimension.status === 'below' && dimension.difference < -15) {
        insights.push(`${dimension.name} needs improvement to meet industry standards`)
      }
    })

    return insights
  }
}

interface QualityDimensionConfig {
  name: string
  weight: number
  description: string
  metrics: string[]
}

// Export singleton instance
export const dataQualityService = new DataQualityService()