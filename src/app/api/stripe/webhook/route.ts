import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import stripe from '@/lib/stripe'
import { db } from '@/lib/db'
import { handleInvoicePaid } from '@/lib/invoice'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.CheckoutSession)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId
    const planType = session.metadata?.planType as 'pro' | 'enterprise'
    
    if (!userId || !planType) {
      console.error('Missing metadata in checkout session')
      return
    }

    // Update user subscription in database
    await db.subscription.upsert({
      where: { userId },
      update: {
        plan: planType.toUpperCase() as 'PRO' | 'ENTERPRISE',
        status: 'ACTIVE',
        startedAt: new Date(),
        metadata: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        }
      },
      create: {
        userId,
        plan: planType.toUpperCase() as 'PRO' | 'ENTERPRISE',
        status: 'ACTIVE',
        startedAt: new Date(),
        metadata: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        }
      }
    })

    console.log(`Updated subscription for user ${userId} to ${planType}`)
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const stripeCustomerId = subscription.customer as string
    
    // Find user by Stripe customer ID
    const userSubscription = await db.subscription.findFirst({
      where: {
        metadata: {
          path: ['stripeCustomerId'],
          equals: stripeCustomerId
        }
      }
    })
    
    if (!userSubscription) {
      console.error('No subscription found for Stripe customer:', stripeCustomerId)
      return
    }

    // Update subscription status
    let status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' = 'ACTIVE'
    
    switch (subscription.status) {
      case 'active':
        status = 'ACTIVE'
        break
      case 'past_due':
      case 'unpaid':
        status = 'PENDING'
        break
      case 'canceled':
        status = 'CANCELLED'
        break
      default:
        status = 'PENDING'
    }

    await db.subscription.update({
      where: { id: userSubscription.id },
      data: {
        status,
        endsAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        metadata: {
          ...userSubscription.metadata,
          stripeSubscriptionStatus: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          currentPeriodStart: subscription.current_period_start,
        }
      }
    })

    console.log(`Updated subscription status for user ${userSubscription.userId} to ${status}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const stripeCustomerId = subscription.customer as string
    
    // Find user by Stripe customer ID
    const userSubscription = await db.subscription.findFirst({
      where: {
        metadata: {
          path: ['stripeCustomerId'],
          equals: stripeCustomerId
        }
      }
    })
    
    if (!userSubscription) {
      console.error('No subscription found for Stripe customer:', stripeCustomerId)
      return
    }

    // Update subscription to cancelled
    await db.subscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        endsAt: new Date(subscription.current_period_end * 1000),
        metadata: {
          ...userSubscription.metadata,
          stripeSubscriptionStatus: subscription.status,
        }
      }
    })

    console.log(`Cancelled subscription for user ${userSubscription.userId}`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`)
    
    // Handle invoice payment in our system
    await handleInvoicePaid(invoice.id)
    
    // Additional post-payment workflows can be added here
    console.log(`Invoice ${invoice.id} processed successfully`)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log(`Invoice payment failed: ${invoice.id}`)
    
    // Trigger dunning process
    const stripeCustomerId = invoice.customer as string
    
    // Find user by Stripe customer ID
    const userSubscription = await db.subscription.findFirst({
      where: {
        metadata: {
          path: ['stripeCustomerId'],
          equals: stripeCustomerId
        }
      }
    })
    
    if (userSubscription) {
      // Update subscription status to pending
      await db.subscription.update({
        where: { id: userSubscription.id },
        data: {
          status: 'PENDING',
          metadata: {
            ...userSubscription.metadata,
            lastFailedInvoice: invoice.id,
            failedPaymentAttempts: ((userSubscription.metadata as any)?.failedPaymentAttempts || 0) + 1,
          }
        }
      })
      
      // Here you could add logic to:
      // 1. Send notification to user about failed payment
      // 2. Retry payment based on your dunning strategy
      // 3. Eventually downgrade or cancel subscription after multiple failures
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}