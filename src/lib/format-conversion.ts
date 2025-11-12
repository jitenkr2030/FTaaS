import { cloudStorageService } from '@/lib/storage'

export interface ConversionOptions {
  targetFormat: 'JSONL' | 'CSV' | 'JSON' | 'TXT' | 'PARQUET' | 'AVRO'
  encoding?: 'utf-8' | 'ascii' | 'utf-16'
  compression?: 'none' | 'gzip' | 'zip'
  delimiter?: string // For CSV
  includeHeaders?: boolean // For CSV
  prettyPrint?: boolean // For JSON
  maxRecords?: number
  sampleSize?: number
  schemaInference?: boolean
}

export interface ConversionResult {
  convertedContent: string | Buffer
  targetFormat: string
  originalSize: number
  convertedSize: number
  compressionRatio: number
  recordsConverted: number
  conversionTime: number
  warnings: ConversionWarning[]
  schema?: any
}

export interface ConversionWarning {
  code: string
  message: string
  record?: number
  field?: string
  severity: 'warning' | 'error'
}

export interface Schema {
  fields: SchemaField[]
  format: string
  encoding: string
  recordCount: number
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  nullable: boolean
  description?: string
  constraints?: FieldConstraint[]
}

export interface FieldConstraint {
  type: 'min' | 'max' | 'pattern' | 'enum'
  value: any
}

export class FormatConversionService {
  private converters: Map<string, (content: string, options: ConversionOptions) => Promise<ConversionResult>> = new Map()

  constructor() {
    this.initializeConverters()
  }

  private initializeConverters() {
    this.converters.set('JSONL_TO_CSV', this.convertJSONLToCSV.bind(this))
    this.converters.set('JSONL_TO_JSON', this.convertJSONLToJSON.bind(this))
    this.converters.set('JSONL_TO_TXT', this.convertJSONLToTXT.bind(this))
    this.converters.set('CSV_TO_JSONL', this.convertCSVToJSONL.bind(this))
    this.converters.set('CSV_TO_JSON', this.convertCSVToJSON.bind(this))
    this.converters.set('CSV_TO_TXT', this.convertCSVToTXT.bind(this))
    this.converters.set('JSON_TO_JSONL', this.convertJSONToJSONL.bind(this))
    this.converters.set('JSON_TO_CSV', this.convertJSONToCSV.bind(this))
    this.converters.set('JSON_TO_TXT', this.convertJSONToTXT.bind(this))
    this.converters.set('TXT_TO_JSONL', this.convertTXTToJSONL.bind(this))
    this.converters.set('TXT_TO_CSV', this.convertTXTToCSV.bind(this))
    this.converters.set('TXT_TO_JSON', this.convertTXTToJSON.bind(this))
  }

  async convertDataset(
    datasetId: string,
    storageKey: string,
    sourceFormat: string,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    try {
      const startTime = Date.now()

      // Download original content
      const content = await cloudStorageService.getFileContent(storageKey)
      const contentString = content.toString('utf-8')
      const originalSize = content.length

      // Get converter
      const converterKey = `${sourceFormat.toUpperCase()}_TO_${options.targetFormat.toUpperCase()}`
      const converter = this.converters.get(converterKey)

      if (!converter) {
        throw new Error(`Conversion from ${sourceFormat} to ${options.targetFormat} is not supported`)
      }

      // Perform conversion
      const result = await converter(contentString, options)

      // Upload converted content
      const convertedStorageKey = `converted_${datasetId}_${Date.now()}.${options.targetFormat.toLowerCase()}`
      const convertedFile = await cloudStorageService.uploadDatasetFile(
        `converted_${datasetId}.${options.targetFormat.toLowerCase()}`,
        typeof result.convertedContent === 'string' ? 
          Buffer.from(result.convertedContent) : 
          result.convertedContent,
        'system',
        datasetId
      )

      const conversionTime = Date.now() - startTime

      return {
        ...result,
        conversionTime,
        convertedSize: typeof result.convertedContent === 'string' ? 
          result.convertedContent.length : 
          result.convertedContent.length
      }
    } catch (error) {
      console.error('Error converting dataset:', error)
      throw error
    }
  }

  private async convertJSONLToCSV(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const records: any[] = []
    const fields: Set<string> = new Set()

    // Parse JSONL records
    const lines = content.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      try {
        const record = JSON.parse(line)
        records.push(record)
        
        // Collect all field names
        Object.keys(record).forEach(field => fields.add(field))
        
      } catch (error) {
        warnings.push({
          code: 'INVALID_JSON',
          message: `Invalid JSON at line ${i + 1}: ${error.message}`,
          record: i,
          severity: 'error'
        })
      }
    }

    // Limit records if specified
    const limitedRecords = options.maxRecords ? 
      records.slice(0, options.maxRecords) : 
      records

    // Generate CSV content
    const fieldArray = Array.from(fields).sort()
    let csvContent = ''

    // Add headers if requested
    if (options.includeHeaders !== false) {
      csvContent += fieldArray.join(options.delimiter || ',') + '\n'
    }

    // Convert records to CSV rows
    limitedRecords.forEach((record, index) => {
      const row = fieldArray.map(field => {
        const value = record[field]
        
        // Handle different data types
        if (value === null || value === undefined) {
          return ''
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains delimiter or quotes
          const delimiter = options.delimiter || ','
          if (value.includes(delimiter) || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        } else if (typeof value === 'object') {
          return JSON.stringify(value)
        } else {
          return String(value)
        }
      })
      
      csvContent += row.join(options.delimiter || ',') + '\n'
    })

    // Apply compression if requested
    let convertedContent = csvContent
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(csvContent, 'gzip')
    }

    // Infer schema
    const schema = options.schemaInference ? 
      this.inferSchema(limitedRecords, 'CSV') : 
      undefined

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: limitedRecords.length,
      conversionTime: 0, // Will be set by caller
      warnings,
      schema
    }
  }

  private async convertJSONLToJSON(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const records: any[] = []

    // Parse JSONL records
    const lines = content.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      try {
        const record = JSON.parse(line)
        records.push(record)
        
      } catch (error) {
        warnings.push({
          code: 'INVALID_JSON',
          message: `Invalid JSON at line ${i + 1}: ${error.message}`,
          record: i,
          severity: 'error'
        })
      }
    }

    // Limit records if specified
    const limitedRecords = options.maxRecords ? 
      records.slice(0, options.maxRecords) : 
      records

    // Generate JSON content
    const jsonString = options.prettyPrint ? 
      JSON.stringify(limitedRecords, null, 2) : 
      JSON.stringify(limitedRecords)

    // Apply compression if requested
    let convertedContent = jsonString
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(jsonString, 'gzip')
    }

    // Infer schema
    const schema = options.schemaInference ? 
      this.inferSchema(limitedRecords, 'JSON') : 
      undefined

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: limitedRecords.length,
      conversionTime: 0, // Will be set by caller
      warnings,
      schema
    }
  }

  private async convertJSONLToTXT(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    // Limit records if specified
    const limitedLines = options.maxRecords ? 
      lines.slice(0, options.maxRecords) : 
      lines

    // Convert to plain text by extracting text content
    const textLines = limitedLines.map((line, index) => {
      try {
        const record = JSON.parse(line)
        
        // Extract text fields
        const textParts: string[] = []
        this.extractTextFromObject(record, textParts)
        
        return textParts.join(' ')
        
      } catch (error) {
        warnings.push({
          code: 'INVALID_JSON',
          message: `Invalid JSON at line ${index + 1}: ${error.message}`,
          record: index,
          severity: 'error'
        })
        return ''
      }
    }).filter(line => line.length > 0)

    // Generate TXT content
    let txtContent = textLines.join('\n')

    // Apply compression if requested
    let convertedContent = txtContent
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(txtContent, 'gzip')
    }

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: textLines.length,
      conversionTime: 0, // Will be set by caller
      warnings
    }
  }

  private async convertCSVToJSONL(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return {
        convertedContent: '',
        targetFormat: options.targetFormat,
        originalSize: content.length,
        convertedSize: 0,
        compressionRatio: 0,
        recordsConverted: 0,
        conversionTime: 0,
        warnings: [{
          code: 'EMPTY_FILE',
          message: 'CSV file is empty',
          severity: 'error'
        }]
      }
    }

    // Parse headers
    const headers = this.parseCSVRow(lines[0], options.delimiter)
    
    // Parse data rows
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      
      try {
        const values = this.parseCSVRow(line, options.delimiter)
        const record: any = {}
        
        headers.forEach((header, index) => {
          if (index < values.length) {
            record[header] = this.parseCSVValue(values[index])
          } else {
            record[header] = null
          }
        })
        
        records.push(record)
        
      } catch (error) {
        warnings.push({
          code: 'INVALID_CSV_ROW',
          message: `Invalid CSV row at line ${i + 1}: ${error.message}`,
          record: i,
          severity: 'error'
        })
      }
    }

    // Limit records if specified
    const limitedRecords = options.maxRecords ? 
      records.slice(0, options.maxRecords) : 
      records

    // Generate JSONL content
    const jsonlContent = limitedRecords.map(record => JSON.stringify(record)).join('\n')

    // Apply compression if requested
    let convertedContent = jsonlContent
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(jsonlContent, 'gzip')
    }

    // Infer schema
    const schema = options.schemaInference ? 
      this.inferSchema(limitedRecords, 'JSONL') : 
      undefined

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: limitedRecords.length,
      conversionTime: 0, // Will be set by caller
      warnings,
      schema
    }
  }

  private async convertCSVToJSON(content: string, options: ConversionOptions): Promise<ConversionResult> {
    // Convert to JSONL first, then to JSON
    const jsonlResult = await this.convertCSVToJSONL(content, options)
    
    // Parse JSONL and convert to JSON
    const lines = jsonlResult.convertedContent.toString().split('\n').filter(line => line.trim())
    const records = lines.map(line => JSON.parse(line))
    
    const jsonString = options.prettyPrint ? 
      JSON.stringify(records, null, 2) : 
      JSON.stringify(records)

    // Apply compression if requested
    let convertedContent = jsonString
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(jsonString, 'gzip')
    }

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: records.length,
      conversionTime: 0, // Will be set by caller
      warnings: jsonlResult.warnings,
      schema: jsonlResult.schema
    }
  }

  private async convertCSVToTXT(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return {
        convertedContent: '',
        targetFormat: options.targetFormat,
        originalSize: content.length,
        convertedSize: 0,
        compressionRatio: 0,
        recordsConverted: 0,
        conversionTime: 0,
        warnings: [{
          code: 'EMPTY_FILE',
          message: 'CSV file is empty',
          severity: 'error'
        }]
      }
    }

    // Skip header row if present
    const dataLines = options.includeHeaders !== false ? lines : lines.slice(1)
    
    // Limit records if specified
    const limitedLines = options.maxRecords ? 
      dataLines.slice(0, options.maxRecords) : 
      dataLines

    // Convert to plain text
    const txtContent = limitedLines.join('\n')

    // Apply compression if requested
    let convertedContent = txtContent
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(txtContent, 'gzip')
    }

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: limitedLines.length,
      conversionTime: 0, // Will be set by caller
      warnings
    }
  }

  private async convertJSONToJSONL(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    
    try {
      const data = JSON.parse(content)
      const records = Array.isArray(data) ? data : [data]
      
      // Limit records if specified
      const limitedRecords = options.maxRecords ? 
        records.slice(0, options.maxRecords) : 
        records

      // Generate JSONL content
      const jsonlContent = limitedRecords.map(record => JSON.stringify(record)).join('\n')

      // Apply compression if requested
      let convertedContent = jsonlContent
      if (options.compression === 'gzip') {
        convertedContent = await this.compressContent(jsonlContent, 'gzip')
      }

      // Infer schema
      const schema = options.schemaInference ? 
        this.inferSchema(limitedRecords, 'JSONL') : 
        undefined

      return {
        convertedContent,
        targetFormat: options.targetFormat,
        originalSize: content.length,
        convertedSize: convertedContent.length,
        compressionRatio: convertedContent.length / content.length,
        recordsConverted: limitedRecords.length,
        conversionTime: 0, // Will be set by caller
        warnings,
        schema
      }
    } catch (error) {
      warnings.push({
        code: 'INVALID_JSON',
        message: `Invalid JSON: ${error.message}`,
        severity: 'error'
      })
      
      return {
        convertedContent: '',
        targetFormat: options.targetFormat,
        originalSize: content.length,
        convertedSize: 0,
        compressionRatio: 0,
        recordsConverted: 0,
        conversionTime: 0,
        warnings
      }
    }
  }

  private async convertJSONToCSV(content: string, options: ConversionOptions): Promise<ConversionResult> {
    // Convert to JSONL first, then to CSV
    const jsonlResult = await this.convertJSONToJSONL(content, options)
    return this.convertJSONLToCSV(jsonlResult.convertedContent.toString(), options)
  }

  private async convertJSONToTXT(content: string, options: ConversionOptions): Promise<ConversionResult> {
    // Convert to JSONL first, then to TXT
    const jsonlResult = await this.convertJSONToJSONL(content, options)
    return this.convertJSONLToTXT(jsonlResult.convertedContent.toString(), options)
  }

  private async convertTXTToJSONL(content: string, options: ConversionOptions): Promise<ConversionResult> {
    const warnings: ConversionWarning[] = []
    const lines = content.split('\n').filter(line => line.trim())
    
    // Limit records if specified
    const limitedLines = options.maxRecords ? 
      lines.slice(0, options.maxRecords) : 
      lines

    // Convert each line to a JSON record
    const records = limitedLines.map((line, index) => ({
      id: index + 1,
      text: line,
      length: line.length,
      word_count: line.split(/\s+/).length
    }))

    // Generate JSONL content
    const jsonlContent = records.map(record => JSON.stringify(record)).join('\n')

    // Apply compression if requested
    let convertedContent = jsonlContent
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(jsonlContent, 'gzip')
    }

    // Infer schema
    const schema = options.schemaInference ? 
      this.inferSchema(records, 'JSONL') : 
      undefined

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: records.length,
      conversionTime: 0, // Will be set by caller
      warnings,
      schema
    }
  }

  private async convertTXTToCSV(content: string, options: ConversionOptions): Promise<ConversionResult> {
    // Convert to JSONL first, then to CSV
    const jsonlResult = await this.convertTXTToJSONL(content, options)
    return this.convertJSONLToCSV(jsonlResult.convertedContent.toString(), options)
  }

  private async convertTXTToJSON(content: string, options: ConversionOptions): Promise<ConversionResult> {
    // Convert to JSONL first, then to JSON
    const jsonlResult = await this.convertTXTToJSONL(content, options)
    
    // Parse JSONL and convert to JSON
    const lines = jsonlResult.convertedContent.toString().split('\n').filter(line => line.trim())
    const records = lines.map(line => JSON.parse(line))
    
    const jsonString = options.prettyPrint ? 
      JSON.stringify(records, null, 2) : 
      JSON.stringify(records)

    // Apply compression if requested
    let convertedContent = jsonString
    if (options.compression === 'gzip') {
      convertedContent = await this.compressContent(jsonString, 'gzip')
    }

    return {
      convertedContent,
      targetFormat: options.targetFormat,
      originalSize: content.length,
      convertedSize: convertedContent.length,
      compressionRatio: convertedContent.length / content.length,
      recordsConverted: records.length,
      conversionTime: 0, // Will be set by caller
      warnings: jsonlResult.warnings,
      schema: jsonlResult.schema
    }
  }

  private parseCSVRow(row: string, delimiter?: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    const delim = delimiter || ','

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
      } else if (char === delim && !inQuotes) {
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

  private parseCSVValue(value: string): any {
    // Try to parse as number
    if (/^-?\d*\.?\d+$/.test(value)) {
      return parseFloat(value)
    }
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    
    // Try to parse as JSON (for arrays/objects)
    try {
      return JSON.parse(value)
    } catch {
      // Return as string
      return value
    }
  }

  private extractTextFromObject(obj: any, textParts: string[]): void {
    if (typeof obj === 'string') {
      textParts.push(obj)
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.extractTextFromObject(item, textParts))
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => this.extractTextFromObject(value, textParts))
    }
  }

  private async compressContent(content: string, algorithm: 'gzip'): Promise<Buffer> {
    // In a real implementation, use zlib or similar
    // For now, return original content
    return Buffer.from(content)
  }

  private inferSchema(records: any[], format: string): Schema {
    const fields: Map<string, SchemaField> = new Map()
    
    // Analyze each record to infer field types
    records.forEach(record => {
      Object.keys(record).forEach(fieldName => {
        const value = record[fieldName]
        
        if (!fields.has(fieldName)) {
          fields.set(fieldName, {
            name: fieldName,
            type: this.inferFieldType(value),
            nullable: value === null || value === undefined,
            constraints: []
          })
        } else {
          // Update existing field definition
          const field = fields.get(fieldName)!
          field.nullable = field.nullable || (value === null || value === undefined)
          
          // Update type if we find a more general type
          const currentType = field.type
          const newType = this.inferFieldType(value)
          field.type = this.getMostGeneralType(currentType, newType)
        }
      })
    })

    return {
      fields: Array.from(fields.values()),
      format,
      encoding: 'utf-8',
      recordCount: records.length
    }
  }

  private inferFieldType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' {
    if (value === null || value === undefined) {
      return 'string' // Default to string for null values
    }
    
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    
    if (typeof value === 'number') {
      return 'number'
    }
    
    if (typeof value === 'string') {
      // Check if it's a date
      if (!isNaN(Date.parse(value))) {
        return 'date'
      }
      return 'string'
    }
    
    if (Array.isArray(value)) {
      return 'array'
    }
    
    if (typeof value === 'object') {
      return 'object'
    }
    
    return 'string'
  }

  private getMostGeneralType(type1: string, type2: string): string {
    const typeHierarchy = {
      'boolean': 0,
      'number': 1,
      'date': 2,
      'string': 3,
      'array': 4,
      'object': 5
    }
    
    const level1 = typeHierarchy[type1 as keyof typeof typeHierarchy] || 3
    const level2 = typeHierarchy[type2 as keyof typeof typeHierarchy] || 3
    
    return level1 >= level2 ? type1 : type2
  }

  async getSupportedConversions(): Promise<{ from: string; to: string[] }[]> {
    const supportedFormats = ['JSONL', 'CSV', 'JSON', 'TXT']
    const conversions: { from: string; to: string[] }[] = []
    
    supportedFormats.forEach(fromFormat => {
      const toFormats = supportedFormats.filter(toFormat => toFormat !== fromFormat)
      conversions.push({
        from: fromFormat,
        to: toFormats
      })
    })
    
    return conversions
  }

  async estimateConversionSize(
    originalSize: number,
    sourceFormat: string,
    targetFormat: string,
    options: ConversionOptions
  ): Promise<number> {
    // Simple estimation based on format characteristics
    let sizeMultiplier = 1.0
    
    // JSON to JSONL: usually smaller due to less whitespace
    if (sourceFormat === 'JSON' && targetFormat === 'JSONL') {
      sizeMultiplier = 0.8
    }
    
    // JSONL to JSON: usually larger due to array structure
    if (sourceFormat === 'JSONL' && targetFormat === 'JSON') {
      sizeMultiplier = 1.2
    }
    
    // CSV to JSON: usually larger due to JSON structure
    if (sourceFormat === 'CSV' && (targetFormat === 'JSON' || targetFormat === 'JSONL')) {
      sizeMultiplier = 1.5
    }
    
    // JSON to CSV: usually smaller due to compact format
    if ((sourceFormat === 'JSON' || sourceFormat === 'JSONL') && targetFormat === 'CSV') {
      sizeMultiplier = 0.7
    }
    
    // Compression
    if (options.compression === 'gzip') {
      sizeMultiplier *= 0.3 // Typical gzip compression ratio
    }
    
    return Math.round(originalSize * sizeMultiplier)
  }
}

// Export singleton instance
export const formatConversionService = new FormatConversionService()