import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DunningService } from '@/lib/dunning'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await DunningService.getDunningStats(session.user.id)
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching dunning stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dunning stats' },
      { status: 500 }
    )
  }
}