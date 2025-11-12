import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/ab-testing'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const tests = await ABTestingService.getTests(session.user.id, status as any || undefined)
    
    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
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
    
    const test = await ABTestingService.createTest(session.user.id, {
      name: data.name,
      description: data.description,
      type: data.type,
      goal: data.goal,
      config: data.config,
      metrics: data.metrics,
      duration: data.duration,
      trafficSplit: data.trafficSplit,
      sampleSize: data.sampleSize,
      significanceLevel: data.significanceLevel
    })
    
    return NextResponse.json({ test })
  } catch (error) {
    console.error('Error creating A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    )
  }
}