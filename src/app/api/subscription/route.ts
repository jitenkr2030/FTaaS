import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payment-service'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const userId = 'default-user-id' // In real app, get from auth

    const subscription = await paymentService.getUserSubscription(userId)

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, immediate = false } = body
    const userId = 'default-user-id' // In real app, get from auth

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // For free plan, update directly
    if (plan === SubscriptionPlan.FREE) {
      await paymentService.cancelSubscription(userId, immediate)
      return NextResponse.json({ message: 'Downgraded to free plan' })
    }

    // For paid plans, return checkout session URL
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`

    const checkoutSession = await paymentService.createCheckoutSession(
      userId,
      plan.toLowerCase(),
      successUrl,
      cancelUrl
    )

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const immediately = searchParams.get('immediately') === 'true'
    const userId = 'default-user-id' // In real app, get from auth

    await paymentService.cancelSubscription(userId, immediately)

    return NextResponse.json({ message: 'Subscription cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}