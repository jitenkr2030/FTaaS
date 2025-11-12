import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const stripePlans = {
  free: {
    priceId: null, // Free plan doesn't have a Stripe price
    name: 'Free',
    amount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '1 fine-tuned model',
      '5 datasets',
      '1,000 API calls/month',
      'Community support',
      'Basic analytics'
    ]
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    name: 'Pro',
    amount: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '10 fine-tuned models',
      '50 datasets',
      '100,000 API calls/month',
      'Priority support',
      'Advanced analytics',
      'Dedicated GPU',
      'Priority queue',
      'Custom model access'
    ]
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    name: 'Enterprise',
    amount: 0, // Custom pricing
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited fine-tuned models',
      'Unlimited datasets',
      'Unlimited API calls',
      '24/7 dedicated support',
      'Custom analytics',
      'Private GPU cluster',
      'SLA guarantee',
      'Custom models',
      'On-premise deployment',
      'Advanced security',
      'Compliance support'
    ]
  }
}

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  planType: 'pro' | 'enterprise'
) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId,
        planType,
      },
    })

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function createPortalSession(userId: string) {
  try {
    // In a real implementation, you would retrieve the customer ID from your database
    const customerId = await getStripeCustomerId(userId)
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return session
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutSessionCompleted(session)
      break
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(subscription)
      break
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(deletedSubscription)
      break
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentSucceeded(invoice)
      break
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentFailed(failedInvoice)
      break
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Update user subscription in database
  const userId = session.metadata?.userId
  const planType = session.metadata?.planType as 'pro' | 'enterprise'
  
  if (userId && planType) {
    // Update subscription in database
    // This would be implemented with Prisma
    console.log(`Updating subscription for user ${userId} to ${planType}`)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update subscription status in database
  console.log(`Subscription updated: ${subscription.id}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Handle subscription cancellation
  console.log(`Subscription deleted: ${subscription.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payment
  console.log(`Invoice payment succeeded: ${invoice.id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - trigger dunning process
  console.log(`Invoice payment failed: ${invoice.id}`)
}

async function getStripeCustomerId(userId: string): Promise<string> {
  // In a real implementation, you would retrieve this from your database
  // For now, return a mock customer ID
  return 'cus_mock_customer_id'
}

export default stripe