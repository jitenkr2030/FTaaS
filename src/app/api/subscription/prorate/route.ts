import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getProrationPreview, handleSubscriptionUpgrade, handleSubscriptionDowngrade } from '@/lib/proration'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, newPlanType, prorationOption } = await request.json()
    
    if (!action || !newPlanType) {
      return NextResponse.json({ error: 'Action and newPlanType are required' }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'preview':
        const preview = await getProrationPreview(user.id, newPlanType)
        return NextResponse.json(preview)
        
      case 'upgrade':
        const upgradedSubscription = await handleSubscriptionUpgrade(
          user.id, 
          newPlanType, 
          prorationOption || 'cycle_end'
        )
        return NextResponse.json({ success: true, subscription: upgradedSubscription })
        
      case 'downgrade':
        const downgradedSubscription = await handleSubscriptionDowngrade(
          user.id, 
          newPlanType, 
          prorationOption || 'cycle_end'
        )
        return NextResponse.json({ success: true, subscription: downgradedSubscription })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling proration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}