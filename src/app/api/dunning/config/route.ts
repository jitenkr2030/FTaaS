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

    const config = await DunningService.getConfiguration(session.user.id)
    
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching dunning configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dunning configuration' },
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
    
    const config = await DunningService.updateConfiguration(session.user.id, data)
    
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating dunning configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update dunning configuration' },
      { status: 500 }
    )
  }
}