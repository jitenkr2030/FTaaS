import { cloudStorageService } from '@/lib/storage'
import { DatasetStatus } from '@prisma/client'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number // 0-100 quality score
  suggestions: string[]
}

export interface ValidationError {
  code: string
  message: string
  line?: number
  column?: number
  severity: 'error' | 'warning'
  context?: string
}

export interface ValidationWarning {
  code: string
  message: string
  line?: number
  column?: number
  context?: string
}

export interface DataQualityMetrics {
  totalRecords: number
  validRecords: number
  invalidRecords: number
  completeness: number // 0-1
  consistency: number // 0-1
  accuracy: number // 0-1
  uniqueness: number // 0-1
  timeliness?: number // 0-1
  validity: number // 0-1
}

export interface PreprocessingOptions {
  removeDuplicates: boolean
  handleMissingValues: 'remove' | 'fill' | 'keep'
  normalizeText: boolean
  standardizeFormat: boolean
  filterByQuality?: number // minimum quality score (0-100)
  maxRecords?: number
  sampleSize?: number
}

export interface PreprocessingResult {
  processedContent: string
  metrics: DataQualityMetrics
  transformations: Transformation[]
  originalSize: number
  processedSize: number
  compressionRatio: number
}

export interface Transformation {
  type: string
  description: string
  recordsAffected: number
  before: any
  after: any
}

export class DataValidationService {
  private validators: Map<string, (content: string) => ValidationResult> = new Map()

  constructor() {
    this.initializeValidators()
  }

  private initializeValidators() {
    this.validators.set('JSONL', this.validateJSONL.bind(this))
    this.validators.set('CSV', this.validateCSV.bind(this))
    this.validators.set('TXT', this.validateTXT.bind(this))
    this.validators.set('JSON', this.validateJSON.bind(this))
  }

  async validateDataset(datasetId: string, storageKey: string, format: string): Promise<ValidationResult> {
    try {
      // Download dataset from cloud storage
      const content = await cloudStorageService.getFileContent(storageKey)
      const contentString = content.toString('utf-8')

      // Get appropriate validator
      const validator = this.validators.get(format.toUpperCase())
      if (!validator) {
        throw new Error(`No validator available for format: ${format}`)
      }

      // Validate content
      const result = validator(contentString)

      // Calculate quality score
      result.score = this.calculateQualityScore(result)

      return result
    } catch (error) {
      console.error('Error validating dataset:', error)
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error.message}`,
          severity: 'error'
        }],
        warnings: [],
        score: 0,
        suggestions: ['Check file format and try again']
      }
    }
  }

  private validateJSONL(content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    let validRecords = 0
    let invalidRecords = 0
    const fieldSamples: Map<string, Set<any>> = new Map()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      try {
        const record = JSON.parse(line)
        validRecords++

        // Analyze field consistency
        this.analyzeRecordFields(record, fieldSamples)

        // Validate record structure
        this.validateRecordStructure(record, lineNumber, errors, warnings)

      } catch (error) {
        invalidRecords++
        errors.push({
          code: 'INVALID_JSON',
          message: `Invalid JSON: ${error.message}`,
          line: lineNumber,
          severity: 'error',
          context: line.substring(0, 100)
        })
      }
    }

    // Check for field consistency
    this.checkFieldConsistency(fieldSamples, lines.length, warnings)

    // Generate suggestions
    const suggestions = this.generateSuggestions(errors, warnings, validRecords, invalidRecords)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: 0, // Will be calculated by caller
      suggestions
    }
  }

  private validateCSV(content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'CSV file is empty',
        severity: 'error'
      })
      return {
        isValid: false,
        errors,
        warnings,
        score: 0,
        suggestions: ['Upload a non-empty CSV file']
      }
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataRows = lines.slice(1)
    
    let validRecords = 0
    let invalidRecords = 0
    const columnSamples: Map<number, Set<any>> = new Map()

    // Initialize column samples
    headers.forEach((_, index) => {
      columnSamples.set(index, new Set())
    })

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const lineNumber = i + 2 // +2 because of header row

      try {
        const values = this.parseCSVRow(row)
        
        if (values.length !== headers.length) {
          warnings.push({
            code: 'COLUMN_MISMATCH',
            message: `Row has ${values.length} columns but expected ${headers.length}`,
            line: lineNumber,
            context: row.substring(0, 100)
          })
        }

        // Analyze column values
        values.forEach((value, index) => {
          if (columnSamples.has(index)) {
            columnSamples.get(index)!.add(value)
          }
        })

        validRecords++

      } catch (error) {
        invalidRecords++
        errors.push({
          code: 'INVALID_CSV_ROW',
          message: `Invalid CSV row: ${error.message}`,
          line: lineNumber,
          severity: 'error',
          context: row.substring(0, 100)
        })
      }
    }

    // Check for data quality issues
    this.checkCSVQuality(headers, dataRows, columnSamples, warnings)

    // Generate suggestions
    const suggestions = this.generateSuggestions(errors, warnings, validRecords, invalidRecords)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: 0, // Will be calculated by caller
      suggestions
    }
  }

  private validateTXT(content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      errors.push({
        code: 'EMPTY_FILE',
        message: 'Text file is empty',
        severity: 'error'
      })
      return {
        isValid: false,
        errors,
        warnings,
        score: 0,
        suggestions: ['Upload a non-empty text file']
      }
    }

    let validLines = 0
    let invalidLines = 0
    let totalCharacters = 0
    let totalWords = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      totalCharacters += line.length
      totalWords += line.split(/\s+/).filter(word => word.length > 0).length

      // Basic validation for text content
      if (line.length > 10000) {
        warnings.push({
          code: 'LONG_LINE',
          message: 'Line is very long, consider splitting',
          line: lineNumber,
          context: line.substring(0, 100)
        })
      }

      if (line.match(/[\x00-\x1F\x7F]/)) {
        warnings.push({
          code: 'CONTROL_CHARACTERS',
          message: 'Line contains control characters',
          line: lineNumber,
          context: line.substring(0, 100)
        })
      }

      validLines++
    }

    // Check text quality metrics
    const averageLineLength = totalCharacters / lines.length
    const averageWordsPerLine = totalWords / lines.length

    if (averageLineLength < 10) {
      warnings.push({
        code: 'SHORT_LINES',
        message: 'Average line length is very short',
        severity: 'warning'
      })
    }

    if (averageWordsPerLine < 2) {
      warnings.push({
        code: 'LOW_WORD_COUNT',
        message: 'Average words per line is very low',
        severity: 'warning'
      })
    }

    const suggestions = this.generateSuggestions(errors, warnings, validLines, invalidLines)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: 0, // Will be calculated by caller
      suggestions
    }
  }

  private validateJSON(content: string): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      const data = JSON.parse(content)
      
      if (Array.isArray(data)) {
        // Validate JSON array
        this.validateJSONArray(data, errors, warnings)
      } else if (typeof data === 'object') {
        // Validate JSON object
        this.validateJSONObject(data, errors, warnings)
      } else {
        errors.push({
          code: 'INVALID_JSON_STRUCTURE',
          message: 'JSON must be an object or array',
          severity: 'error'
        })
      }
    } catch (error) {
      errors.push({
        code: 'INVALID_JSON',
        message: `Invalid JSON: ${error.message}`,
        severity: 'error'
      })
    }

    const suggestions = this.generateSuggestions(errors, warnings, 1, 0)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: 0, // Will be calculated by caller
      suggestions
    }
  }

  private validateJSONArray(data: any[], errors: ValidationError[], warnings: ValidationWarning[]) {
    if (data.length === 0) {
      warnings.push({
        code: 'EMPTY_ARRAY',
        message: 'JSON array is empty',
        severity: 'warning'
      })
      return
    }

    const fieldSamples: Map<string, Set<any>> = new Map()
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      
      if (typeof item !== 'object' || item === null) {
        errors.push({
          code: 'INVALID_ARRAY_ITEM',
          message: `Array item at index ${i} is not an object`,
          severity: 'error'
        })
        continue
      }

      this.analyzeRecordFields(item, fieldSamples)
      this.validateRecordStructure(item, i + 1, errors, warnings)
    }

    this.checkFieldConsistency(fieldSamples, data.length, warnings)
  }

  private validateJSONObject(data: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    const keys = Object.keys(data)
    
    if (keys.length === 0) {
      warnings.push({
        code: 'EMPTY_OBJECT',
        message: 'JSON object has no fields',
        severity: 'warning'
      })
    }

    this.validateRecordStructure(data, 1, errors, warnings)
  }

  private analyzeRecordFields(record: any, fieldSamples: Map<string, Set<any>>) {
    Object.keys(record).forEach(field => {
      if (!fieldSamples.has(field)) {
        fieldSamples.set(field, new Set())
      }
      fieldSamples.get(field)!.add(record[field])
    })
  }

  private validateRecordStructure(record: any, lineNumber: number, errors: ValidationError[], warnings: ValidationWarning[]) {
    Object.keys(record).forEach(field => {
      const value = record[field]

      // Check for null values
      if (value === null) {
        warnings.push({
          code: 'NULL_VALUE',
          message: `Field '${field}' has null value`,
          line: lineNumber,
          severity: 'warning'
        })
      }

      // Check for empty strings
      if (typeof value === 'string' && value.trim() === '') {
        warnings.push({
          code: 'EMPTY_STRING',
          message: `Field '${field}' has empty string`,
          line: lineNumber,
          severity: 'warning'
        })
      }

      // Check for very long strings
      if (typeof value === 'string' && value.length > 10000) {
        warnings.push({
          code: 'LONG_STRING',
          message: `Field '${field}' has very long string (${value.length} characters)`,
          line: lineNumber,
          severity: 'warning'
        })
      }
    })
  }

  private checkFieldConsistency(fieldSamples: Map<string, Set<any>>, totalRecords: number, warnings: ValidationWarning[]) {
    fieldSamples.forEach((values, field) => {
      const uniqueValues = values.size
      const consistency = uniqueValues / totalRecords

      // Check for fields with too many unique values (might be IDs)
      if (consistency > 0.9 && uniqueValues > 100) {
        warnings.push({
          code: 'HIGH_CARDINALITY',
          message: `Field '${field}' has high cardinality (${uniqueValues} unique values)`,
          severity: 'warning'
        })
      }

      // Check for fields with too few unique values (might be constant)
      if (consistency < 0.1 && uniqueValues === 1) {
        warnings.push({
          code: 'CONSTANT_FIELD',
          message: `Field '${field}' has constant value`,
          severity: 'warning'
        })
      }
    })
  }

  private checkCSVQuality(headers: string[], dataRows: string[], columnSamples: Map<number, Set<any>>, warnings: ValidationWarning[]) {
    // Check for missing headers
    if (headers.length === 0) {
      warnings.push({
        code: 'NO_HEADERS',
        message: 'CSV file has no headers',
        severity: 'warning'
      })
    }

    // Check for duplicate headers
    const headerCounts = new Map<string, number>()
    headers.forEach(header => {
      headerCounts.set(header, (headerCounts.get(header) || 0) + 1)
    })

    headerCounts.forEach((count, header) => {
      if (count > 1) {
        warnings.push({
          code: 'DUPLICATE_HEADERS',
          message: `Header '${header}' appears ${count} times`,
          severity: 'warning'
        })
      }
    })

    // Check column consistency
    columnSamples.forEach((values, columnIndex) => {
      const uniqueValues = values.size
      const consistency = uniqueValues / dataRows.length

      if (consistency > 0.9 && uniqueValues > 100) {
        warnings.push({
          code: 'HIGH_CARDINALITY',
          message: `Column '${headers[columnIndex] || columnIndex}' has high cardinality`,
          severity: 'warning'
        })
      }
    })
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < row.length) {
      const char = row[i]

      if (char === '"') {
        if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    // Add last field
    result.push(current.trim())

    return result
  }

  private calculateQualityScore(result: ValidationResult): number {
    let score = 100

    // Deduct for errors
    score -= result.errors.length * 20

    // Deduct for warnings
    score -= result.warnings.length * 5

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score))
  }

  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[], validRecords: number, invalidRecords: number): string[] {
    const suggestions: string[] = []

    if (errors.length > 0) {
      suggestions.push('Fix the validation errors before processing')
    }

    if (warnings.length > 0) {
      suggestions.push('Review and address the warnings for better data quality')
    }

    if (invalidRecords > 0) {
      const errorRate = (invalidRecords / (validRecords + invalidRecords)) * 100
      if (errorRate > 10) {
        suggestions.push('High error rate detected. Consider cleaning your data')
      }
    }

    if (validRecords < 100) {
      suggestions.push('Dataset is small. Consider adding more data for better model performance')
    }

    if (validRecords > 100000) {
      suggestions.push('Dataset is large. Consider using a sample for initial testing')
    }

    return suggestions
  }

  async preprocessDataset(
    datasetId: string,
    storageKey: string,
    format: string,
    options: PreprocessingOptions
  ): Promise<PreprocessingResult> {
    try {
      // Download original content
      const content = await cloudStorageService.getFileContent(storageKey)
      const contentString = content.toString('utf-8')
      const originalSize = content.length

      // Apply preprocessing
      const result = await this.applyPreprocessing(contentString, format, options)

      // Upload processed content
      const processedStorageKey = `processed_${datasetId}_${Date.now()}`
      const processedFile = await cloudStorageService.uploadDatasetFile(
        `processed_${datasetId}.jsonl`,
        Buffer.from(result.processedContent),
        'system',
        datasetId
      )

      return {
        ...result,
        originalSize,
        processedSize: result.processedContent.length,
        compressionRatio: result.processedContent.length / originalSize
      }
    } catch (error) {
      console.error('Error preprocessing dataset:', error)
      throw error
    }
  }

  private async applyPreprocessing(content: string, format: string, options: PreprocessingOptions): Promise<PreprocessingResult> {
    const transformations: Transformation[] = []
    let processedContent = content

    // Parse content based on format
    let records: any[] = []
    switch (format.toUpperCase()) {
      case 'JSONL':
        records = content.split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line))
        break
      case 'CSV':
        // Simple CSV parsing (in production, use a proper CSV library)
        const lines = content.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim())
        records = lines.slice(1).map(line => {
          const values = this.parseCSVRow(line)
          const record: any = {}
          headers.forEach((header, index) => {
            record[header] = values[index]
          })
          return record
        })
        break
      case 'JSON':
        const data = JSON.parse(content)
        records = Array.isArray(data) ? data : [data]
        break
      default:
        throw new Error(`Unsupported format for preprocessing: ${format}`)
    }

    // Apply preprocessing transformations
    let originalRecordCount = records.length

    // Remove duplicates
    if (options.removeDuplicates) {
      const uniqueRecords = this.removeDuplicateRecords(records)
      if (uniqueRecords.length !== records.length) {
        transformations.push({
          type: 'remove_duplicates',
          description: 'Removed duplicate records',
          recordsAffected: records.length - uniqueRecords.length,
          before: records.length,
          after: uniqueRecords.length
        })
        records = uniqueRecords
      }
    }

    // Handle missing values
    if (options.handleMissingValues !== 'keep') {
      const cleanedRecords = this.handleMissingValues(records, options.handleMissingValues)
      if (cleanedRecords.length !== records.length) {
        transformations.push({
          type: 'handle_missing_values',
          description: `Handled missing values (${options.handleMissingValues})`,
          recordsAffected: records.length - cleanedRecords.length,
          before: records.length,
          after: cleanedRecords.length
        })
        records = cleanedRecords
      }
    }

    // Normalize text
    if (options.normalizeText) {
      records = this.normalizeTextFields(records)
      transformations.push({
        type: 'normalize_text',
        description: 'Normalized text fields',
        recordsAffected: records.length,
        before: 'unnormalized',
        after: 'normalized'
      })
    }

    // Filter by quality
    if (options.filterByQuality !== undefined) {
      const filteredRecords = this.filterByQuality(records, options.filterByQuality)
      if (filteredRecords.length !== records.length) {
        transformations.push({
          type: 'filter_quality',
          description: `Filtered records by quality (min score: ${options.filterByQuality})`,
          recordsAffected: records.length - filteredRecords.length,
          before: records.length,
          after: filteredRecords.length
        })
        records = filteredRecords
      }
    }

    // Limit records
    if (options.maxRecords && records.length > options.maxRecords) {
      const limitedRecords = records.slice(0, options.maxRecords)
      transformations.push({
        type: 'limit_records',
        description: `Limited to ${options.maxRecords} records`,
        recordsAffected: records.length - limitedRecords.length,
        before: records.length,
        after: limitedRecords.length
      })
      records = limitedRecords
    }

    // Sample records
    if (options.sampleSize && records.length > options.sampleSize) {
      const sampledRecords = this.sampleRecords(records, options.sampleSize)
      transformations.push({
        type: 'sample_records',
        description: `Sampled to ${options.sampleSize} records`,
        recordsAffected: records.length - sampledRecords.length,
        before: records.length,
        after: sampledRecords.length
      })
      records = sampledRecords
    }

    // Convert back to JSONL format
    processedContent = records.map(record => JSON.stringify(record)).join('\n')

    // Calculate quality metrics
    const metrics = this.calculateDataQualityMetrics(records)

    return {
      processedContent,
      metrics,
      transformations,
      originalSize: 0, // Will be set by caller
      processedSize: 0, // Will be set by caller
      compressionRatio: 0 // Will be set by caller
    }
  }

  private removeDuplicateRecords(records: any[]): any[] {
    const seen = new Set()
    const uniqueRecords: any[] = []

    records.forEach(record => {
      const key = JSON.stringify(record)
      if (!seen.has(key)) {
        seen.add(key)
        uniqueRecords.push(record)
      }
    })

    return uniqueRecords
  }

  private handleMissingValues(records: any[], strategy: 'remove' | 'fill'): any[] {
    if (strategy === 'remove') {
      return records.filter(record => {
        return Object.values(record).every(value => 
          value !== null && value !== undefined && value !== ''
        )
      })
    } else {
      // Fill with default values
      return records.map(record => {
        const filledRecord = { ...record }
        Object.keys(filledRecord).forEach(key => {
          if (filledRecord[key] === null || filledRecord[key] === undefined || filledRecord[key] === '') {
            filledRecord[key] = 'N/A' // Default fill value
          }
        })
        return filledRecord
      })
    }
  }

  private normalizeTextFields(records: any[]): any[] {
    return records.map(record => {
      const normalizedRecord = { ...record }
      Object.keys(normalizedRecord).forEach(key => {
        if (typeof normalizedRecord[key] === 'string') {
          normalizedRecord[key] = normalizedRecord[key]
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
        }
      })
      return normalizedRecord
    })
  }

  private filterByQuality(records: any[], minScore: number): any[] {
    // Simple quality scoring based on field completeness
    return records.filter(record => {
      const fields = Object.keys(record)
      const nonNullFields = fields.filter(field => 
        record[field] !== null && record[field] !== undefined && record[field] !== ''
      )
      const completeness = nonNullFields.length / fields.length
      return completeness >= (minScore / 100)
    })
  }

  private sampleRecords(records: any[], sampleSize: number): any[] {
    if (records.length <= sampleSize) {
      return records
    }

    const shuffled = [...records].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, sampleSize)
  }

  private calculateDataQualityMetrics(records: any[]): DataQualityMetrics {
    const totalRecords = records.length
    let validRecords = 0
    let invalidRecords = 0
    let totalFields = 0
    let nonNullFields = 0

    const fieldValues: Map<string, Set<any>> = new Map()

    records.forEach(record => {
      const fields = Object.keys(record)
      let recordValid = true
      let recordNonNullFields = 0

      fields.forEach(field => {
        totalFields++
        
        if (!fieldValues.has(field)) {
          fieldValues.set(field, new Set())
        }
        fieldValues.get(field)!.add(record[field])

        if (record[field] !== null && record[field] !== undefined && record[field] !== '') {
          nonNullFields++
          recordNonNullFields++
        } else {
          recordValid = false
        }
      })

      if (recordValid) {
        validRecords++
      } else {
        invalidRecords++
      }
    })

    const completeness = totalFields > 0 ? nonNullFields / totalFields : 0
    const consistency = this.calculateConsistency(fieldValues, totalRecords)
    const accuracy = validRecords / totalRecords
    const uniqueness = this.calculateUniqueness(fieldValues, totalRecords)
    const validity = validRecords / totalRecords

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      completeness,
      consistency,
      accuracy,
      uniqueness,
      validity
    }
  }

  private calculateConsistency(fieldValues: Map<string, Set<any>>, totalRecords: number): number {
    let totalConsistency = 0
    let fieldCount = 0

    fieldValues.forEach((values, field) => {
      const uniqueRatio = values.size / totalRecords
      const consistency = uniqueRatio < 0.1 ? 0.1 : uniqueRatio > 0.9 ? 0.9 : uniqueRatio
      totalConsistency += consistency
      fieldCount++
    })

    return fieldCount > 0 ? totalConsistency / fieldCount : 0
  }

  private calculateUniqueness(fieldValues: Map<string, Set<any>>, totalRecords: number): number {
    let totalUniqueness = 0
    let fieldCount = 0

    fieldValues.forEach((values, field) => {
      const uniqueness = values.size / totalRecords
      totalUniqueness += uniqueness
      fieldCount++
    })

    return fieldCount > 0 ? totalUniqueness / fieldCount : 0
  }
}

// Export singleton instance
export const dataValidationService = new DataValidationService()