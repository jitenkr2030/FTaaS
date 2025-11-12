import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatConversionService, ConversionOptions } from '@/lib/format-conversion'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id
    const body = await request.json()
    const { targetFormat, options = {} } = body

    if (!targetFormat) {
      return NextResponse.json(
        { error: 'Target format is required' },
        { status: 400 }
      )
    }

    // Get dataset from database
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId }
    })

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      )
    }

    if (!dataset.storageKey) {
      return NextResponse.json(
        { error: 'Dataset has no storage key' },
        { status: 400 }
      )
    }

    // Prepare conversion options
    const conversionOptions: ConversionOptions = {
      targetFormat: targetFormat.toUpperCase() as any,
      encoding: options.encoding || 'utf-8',
      compression: options.compression || 'none',
      delimiter: options.delimiter,
      includeHeaders: options.includeHeaders,
      prettyPrint: options.prettyPrint,
      maxRecords: options.maxRecords,
      sampleSize: options.sampleSize,
      schemaInference: options.schemaInference || false
    }

    // Perform conversion
    const result = await formatConversionService.convertDataset(
      datasetId,
      dataset.storageKey,
      dataset.format,
      conversionOptions
    )

    // Create conversion record in database
    const conversion = await db.datasetConversion.create({
      data: {
        datasetId,
        sourceFormat: dataset.format,
        targetFormat: conversionOptions.targetFormat,
        originalSize: dataset.fileSize,
        convertedSize: Math.round(result.convertedSize / (1024 * 1024) * 100) / 100, // Convert to MB
        conversionTime: result.conversionTime,
        recordsConverted: result.recordsConverted,
        warnings: result.warnings.length,
        status: 'COMPLETED',
        convertedStorageKey: `converted_${datasetId}_${Date.now()}`,
        options: conversionOptions as any,
        schema: result.schema
      }
    })

    return NextResponse.json({
      conversionId: conversion.id,
      ...result,
      message: `Dataset converted successfully from ${dataset.format} to ${conversionOptions.targetFormat}`
    })

  } catch (error) {
    console.error('Error converting dataset:', error)
    return NextResponse.json(
      { error: 'Failed to convert dataset' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasetId = params.id

    // Get conversion history for this dataset
    const conversions = await db.datasetConversion.findMany({
      where: { datasetId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(conversions)
  } catch (error) {
    console.error('Error fetching conversion history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversion history' },
      { status: 500 }
    )
  }
}