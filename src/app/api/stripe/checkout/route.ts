import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planType } = await request.json()
    
    if (!planType || !['pro', 'enterprise'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get Stripe price ID based on plan type
    const priceId = process.env[`STRIPE_${planType.toUpperCase()}_PRICE_ID`]
    
    if (!priceId && planType !== 'enterprise') {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    // For enterprise plan, create a custom price or handle differently
    if (planType === 'enterprise') {
      return NextResponse.json({ 
        error: 'Enterprise plan requires custom pricing. Please contact sales.',
        contactSales: true 
      }, { status: 400 })
    }

    const checkoutSession = await createCheckoutSession(user.id, priceId, planType)

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}