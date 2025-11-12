import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaxService } from '@/lib/tax'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const result = await TaxService.calculateTax({
      userId: session.user.id,
      amount: data.amount,
      regionCode: data.regionCode,
      country: data.country,
      currency: data.currency,
      items: data.items
    })
    
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error calculating tax:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}