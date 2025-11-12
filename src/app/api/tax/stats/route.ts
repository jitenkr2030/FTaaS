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

    const stats = await TaxService.getTaxStats(session.user.id)
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching tax stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax stats' },
      { status: 500 }
    )
  }
}