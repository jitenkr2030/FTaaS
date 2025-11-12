import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has a subscription with Stripe customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id }
    })

    if (!subscription || !(subscription.metadata as any)?.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 })
    }

    const portalSession = await createPortalSession(user.id)

    return NextResponse.json({ 
      url: portalSession.url 
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}