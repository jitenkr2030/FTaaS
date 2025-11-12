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

    const exemption = await TaxService.getTaxExemption(session.user.id)
    
    return NextResponse.json({ exemption })
  } catch (error) {
    console.error('Error fetching tax exemption:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax exemption' },
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

    const data = await request.json()
    
    const exemption = await TaxService.createTaxExemption(session.user.id, {
      type: data.type,
      certificate: data.certificate,
      regions: data.regions,
      validFrom: new Date(data.validFrom),
      validTo: data.validTo ? new Date(data.validTo) : undefined,
      documents: data.documents
    })
    
    return NextResponse.json({ exemption })
  } catch (error) {
    console.error('Error creating tax exemption:', error)
    return NextResponse.json(
      { error: 'Failed to create tax exemption' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const exemption = await TaxService.updateTaxExemption(session.user.id, {
      type: data.type,
      certificate: data.certificate,
      regions: data.regions,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
      documents: data.documents
    })
    
    return NextResponse.json({ exemption })
  } catch (error) {
    console.error('Error updating tax exemption:', error)
    return NextResponse.json(
      { error: 'Failed to update tax exemption' },
      { status: 500 }
    )
  }
}