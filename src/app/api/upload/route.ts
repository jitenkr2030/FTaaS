import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cloudStorageService } from '@/lib/storage'
import { dataValidationService } from '@/lib/data-validation'
import { DatasetStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const autoValidate = formData.get('autoValidate') === 'true'
    const autoPreprocess = formData.get('autoPreprocess') === 'true'
    const userId = 'default-user-id' // In real app, get from auth

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Dataset name is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/json',
      'text/csv',
      'text/plain',
      'application/jsonl'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload JSON, CSV, TXT, or JSONL files.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to cloud storage
    const storageFile = await cloudStorageService.uploadDatasetFile(
      file.name,
      buffer,
      userId
    )

    // Process file to count records and extract metadata
    let recordCount = 0
    let metadata = {}
    let validationResult: any = null
    let preprocessingResult: any = null

    try {
      const fileContent = buffer.toString('utf-8')
      const format = cloudStorageService['getContentType'](file.name)
      
      if (format.includes('json')) {
        const lines = fileContent.split('\n').filter(line => line.trim())
        recordCount = lines.length
        
        // Sample first few records for metadata
        const sampleRecords = lines.slice(0, 5).map(line => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        }).filter(Boolean)
        
        metadata = {
          sampleRecords,
          totalLines: lines.length,
          estimatedTokens: fileContent.split(' ').length,
          storageKey: storageFile.key,
          storageLocation: storageFile.location,
          fileSize: storageFile.size,
        }
      } else if (format.includes('csv')) {
        const lines = fileContent.split('\n').filter(line => line.trim())
        recordCount = Math.max(0, lines.length - 1) // Subtract header row
        
        const headers = lines[0]?.split(',').map(h => h.trim()) || []
        metadata = {
          headers,
          totalRows: lines.length,
          estimatedTokens: fileContent.split(' ').length,
          storageKey: storageFile.key,
          storageLocation: storageFile.location,
          fileSize: storageFile.size,
        }
      } else if (format.includes('plain')) {
        const lines = fileContent.split('\n').filter(line => line.trim())
        recordCount = lines.length
        
        metadata = {
          totalLines: lines.length,
          estimatedTokens: fileContent.split(' ').length,
          averageLineLength: Math.round(fileContent.length / lines.length),
          storageKey: storageFile.key,
          storageLocation: storageFile.location,
          fileSize: storageFile.size,
        }
      }

      // Auto-validate if requested
      if (autoValidate) {
        validationResult = await dataValidationService.validateDataset(
          'temp', // Will be replaced with actual dataset ID
          storageFile.key,
          format.replace('application/', '').replace('text/', '').toUpperCase()
        )
      }

      // Auto-preprocess if requested and validation passed
      if (autoPreprocess && validationResult && validationResult.isValid) {
        preprocessingResult = await dataValidationService.preprocessDataset(
          'temp', // Will be replaced with actual dataset ID
          storageFile.key,
          format.replace('application/', '').replace('text/', '').toUpperCase(),
          {
            removeDuplicates: true,
            handleMissingValues: 'fill',
            normalizeText: true,
            standardizeFormat: true,
            filterByQuality: 70,
            maxRecords: 100000
          }
        )
      }

    } catch (error) {
      console.error('Error processing file:', error)
      // Continue with basic metadata
    }

    // Determine format from file type
    let format = 'unknown'
    if (file.type === 'application/json' || file.name.endsWith('.jsonl')) {
      format = 'JSONL'
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      format = 'CSV'
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      format = 'TXT'
    }

    // Create dataset record in database
    const dataset = await db.dataset.create({
      data: {
        name,
        description: description || '',
        fileName: file.name,
        fileSize: Math.round(file.size / (1024 * 1024) * 100) / 100, // Convert to MB
        format,
        recordCount,
        filePath: storageFile.location,
        storageKey: storageFile.key,
        metadata: {
          ...metadata,
          validationResult,
          preprocessingResult,
          autoValidated: autoValidate,
          autoPreprocessed: autoPreprocess,
          processedAt: autoPreprocess ? new Date().toISOString() : null
        },
        userId,
        status: validationResult ? 
          (validationResult.isValid ? DatasetStatus.READY : DatasetStatus.FAILED) : 
          DatasetStatus.PROCESSING
      }
    })

    // If validation was performed but not during initial upload, run it now
    if (autoValidate && !validationResult) {
      setTimeout(async () => {
        try {
          const validation = await dataValidationService.validateDataset(
            dataset.id,
            storageFile.key,
            format
          )

          await db.dataset.update({
            where: { id: dataset.id },
            data: {
              metadata: {
                ...dataset.metadata as any,
                validationResult: validation
              },
              status: validation.isValid ? DatasetStatus.READY : DatasetStatus.FAILED
            }
          })
        } catch (error) {
          console.error('Error in delayed validation:', error)
          await db.dataset.update({
            where: { id: dataset.id },
            data: {
              status: DatasetStatus.FAILED,
              errorMessage: 'Validation failed'
            }
          })
        }
      }, 2000)
    }

    return NextResponse.json({
      id: dataset.id,
      name: dataset.name,
      fileName: dataset.fileName,
      fileSize: dataset.fileSize,
      format: dataset.format,
      recordCount: dataset.recordCount,
      status: dataset.status,
      storageKey: storageFile.key,
      storageLocation: storageFile.location,
      validationResult,
      preprocessingResult,
      message: 'File uploaded successfully to cloud storage' + 
        (autoValidate ? ' with validation' : '') +
        (autoPreprocess ? ' and preprocessing' : '')
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}