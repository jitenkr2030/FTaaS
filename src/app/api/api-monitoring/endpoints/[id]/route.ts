import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiMonitoringService } from '@/lib/api-monitoring'

// GET /api/api-monitoring/endpoints/[id] - Get endpoint details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const endpointDetails = await ApiMonitoringService.getEndpointDetails(params.id)

    return NextResponse.json({ endpointDetails })
  } catch (error) {
    console.error('Error fetching endpoint details:', error)
    if (error instanceof Error && error.message === 'Endpoint not found') {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch endpoint details' },
      { status: 500 }
    )
  }
}