import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataExportService } from '@/lib/data-export'

// GET /api/export/formats - Get available export formats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formats = DataExportService.getAvailableFormats()

    return NextResponse.json({ formats })
  } catch (error) {
    console.error('Error fetching export formats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export formats' },
      { status: 500 }
    )
  }
}