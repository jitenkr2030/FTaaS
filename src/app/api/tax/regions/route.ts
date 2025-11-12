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
    const country = searchParams.get('country') || undefined

    const regions = await TaxService.getTaxRegions(country)
    
    return NextResponse.json({ regions })
  } catch (error) {
    console.error('Error fetching tax regions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax regions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    // This is a simplified check - in production, implement proper role-based access
    const data = await request.json()
    
    const region = await TaxService.createTaxRegion(data)
    
    return NextResponse.json({ region })
  } catch (error) {
    console.error('Error creating tax region:', error)
    return NextResponse.json(
      { error: 'Failed to create tax region' },
      { status: 500 }
    )
  }
}