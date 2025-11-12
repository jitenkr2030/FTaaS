import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ABTestingService } from '@/lib/ab-testing'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const variant = await ABTestingService.addVariant(data.testId, {
      name: data.name,
      description: data.description,
      modelId: data.modelId,
      config: data.config,
      isControl: data.isControl,
      weight: data.weight
    })
    
    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Error creating A/B test variant:', error)
    return NextResponse.json(
      { error: 'Failed to create A/B test variant' },
      { status: 500 }
    )
  }
}