import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaxService } from '@/lib/tax'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const calculations = await TaxService.getTaxCalculations(session.user.id, limit)
    
    return NextResponse.json({ calculations })
  } catch (error) {
    console.error('Error fetching tax calculations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax calculations' },
      { status: 500 }
    )
  }
}