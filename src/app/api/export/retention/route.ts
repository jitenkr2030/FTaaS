import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataExportService } from '@/lib/data-export'

// GET /api/export/retention - Get data retention information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const retentionInfo = await DataExportService.getDataRetentionInfo(session.user.id)

    return NextResponse.json({ retentionInfo })
  } catch (error) {
    console.error('Error fetching retention info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retention info' },
      { status: 500 }
    )
  }
}

// DELETE /api/export/retention - Clean up old data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const retentionDays = parseInt(searchParams.get('days') || '30')

    const cleanupResult = await DataExportService.cleanupOldData(session.user.id, retentionDays)

    return NextResponse.json({ 
      success: true,
      cleanupResult 
    })
  } catch (error) {
    console.error('Error cleaning up old data:', error)
    return NextResponse.json(
      { error: 'Failed to clean up old data' },
      { status: 500 }
    )
  }
}