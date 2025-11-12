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

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    const attempts = await DunningService.getDunningAttempts(session.user.id, invoiceId || undefined)
    
    return NextResponse.json({ attempts })
  } catch (error) {
    console.error('Error fetching dunning attempts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dunning attempts' },
      { status: 500 }
    )
  }
}