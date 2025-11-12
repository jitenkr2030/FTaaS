import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DatasetStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const format = searchParams.get('format')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId') || 'default-user-id' // In real app, get from auth

    let whereClause: any = { userId }
    
    if (status && status !== 'all') {
      whereClause.status = status as DatasetStatus
    }
    
    if (format && format !== 'all') {
      whereClause.format = format
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const datasets = await db.dataset.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(datasets)
  } catch (error) {
    console.error('Error fetching datasets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, fileName, fileSize, format, recordCount, metadata } = body
    const userId = 'default-user-id' // In real app, get from auth

    if (!name || !fileName || !format || !recordCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const dataset = await db.dataset.create({
      data: {
        name,
        description,
        fileName,
        fileSize,
        format,
        recordCount,
        metadata: metadata || {},
        userId,
        status: DatasetStatus.UPLOADING
      }
    })

    // Simulate processing - in real app, this would be a background job
    setTimeout(async () => {
      await db.dataset.update({
        where: { id: dataset.id },
        data: { status: DatasetStatus.READY }
      })
    }, 5000)

    return NextResponse.json(dataset, { status: 201 })
  } catch (error) {
    console.error('Error creating dataset:', error)
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    )
  }
}