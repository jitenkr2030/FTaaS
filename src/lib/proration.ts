import { db } from '@/lib/db'
import stripe from '@/lib/stripe'

export interface ProrationCalculation {
  upcomingInvoice: {
    amount_due: number
    subtotal: number
    tax: number
    currency: string
  }
  prorationDetails: {
    amount: number
    description: string
    type: 'credit' | 'charge'
  }[]
  effectiveDate: Date
}

export async function calculateProration(
  userId: string,
  newPriceId: string,
  billingCycleAnchor?: 'immediate' | 'cycle_end'
): Promise<ProrationCalculation> {
  try {
    // Get user's current subscription
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: {
        user: true
      }
    })

    if (!subscription || !(subscription.metadata as any)?.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    const stripeSubscriptionId = (subscription.metadata as any).stripeSubscriptionId

    // Get Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    // Calculate proration
    const prorationInvoice = await stripe.invoices.retrieveUpcoming({
      customer: stripeSubscription.customer as string,
      subscription: stripeSubscriptionId,
      subscription_items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
          quantity: 1,
        }
      ],
      subscription_proration_date: billingCycleAnchor === 'immediate' 
        ? Math.floor(Date.now() / 1000) 
        : undefined
    })

    // Calculate proration details
    const prorationDetails = prorationInvoice.lines.data
      .filter(line => line.type === 'invoiceitem')
      .map(line => ({
        amount: Math.abs(line.amount || 0) / 100, // Convert from cents
        description: line.description || 'Proration adjustment',
        type: (line.amount || 0) < 0 ? 'credit' as const : 'charge' as const
      }))

    return {
      upcomingInvoice: {
        amount_due: prorationInvoice.amount_due / 100,
        subtotal: prorationInvoice.subtotal / 100,
        tax: prorationInvoice.tax / 100,
        currency: prorationInvoice.currency
      },
      prorationDetails,
      effectiveDate: new Date(prorationInvoice.period_end * 1000)
    }
  } catch (error) {
    console.error('Error calculating proration:', error)
    throw error
  }
}

export async function updateSubscriptionWithProration(
  userId: string,
  newPriceId: string,
  billingCycleAnchor?: 'immediate' | 'cycle_end'
) {
  try {
    // Get user's current subscription
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription || !(subscription.metadata as any)?.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    const stripeSubscriptionId = (subscription.metadata as any).stripeSubscriptionId

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        }
      ],
      proration_behavior: billingCycleAnchor === 'immediate' ? 'create_prorations' : 'none',
      billing_cycle_anchor: billingCycleAnchor === 'cycle_end' ? 'unchanged' : undefined
    })

    // Update local subscription record
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        metadata: {
          ...subscription.metadata,
          stripeSubscriptionStatus: updatedSubscription.status,
          currentPeriodEnd: updatedSubscription.current_period_end,
          currentPeriodStart: updatedSubscription.current_period_start,
          lastUpdated: new Date().toISOString()
        }
      }
    })

    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription with proration:', error)
    throw error
  }
}

export async function cancelSubscriptionWithProration(
  userId: string,
  cancelImmediately: boolean = false
) {
  try {
    // Get user's current subscription
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription || !(subscription.metadata as any)?.stripeSubscriptionId) {
      throw new Error('No active subscription found')
    }

    const stripeSubscriptionId = (subscription.metadata as any).stripeSubscriptionId

    // Cancel Stripe subscription
    const cancelledSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: !cancelImmediately
    })

    // Update local subscription record
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: cancelImmediately ? 'CANCELLED' : 'ACTIVE',
        cancelledAt: cancelImmediately ? new Date() : null,
        endsAt: cancelImmediately ? new Date() : new Date(cancelledSubscription.current_period_end * 1000),
        metadata: {
          ...subscription.metadata,
          stripeSubscriptionStatus: cancelledSubscription.status,
          currentPeriodEnd: cancelledSubscription.current_period_end,
          currentPeriodStart: cancelledSubscription.current_period_start,
          cancelledAt: cancelImmediately ? new Date().toISOString() : null
        }
      }
    })

    return cancelledSubscription
  } catch (error) {
    console.error('Error cancelling subscription with proration:', error)
    throw error
  }
}

export async function getProrationPreview(
  userId: string,
  newPlanType: 'pro' | 'enterprise'
): Promise<{
  immediateProration: ProrationCalculation
  cycleEndProration: ProrationCalculation
  recommendation: 'immediate' | 'cycle_end' | 'custom'
}> {
  try {
    // Get price ID for new plan
    const newPriceId = process.env[`STRIPE_${newPlanType.toUpperCase()}_PRICE_ID`]
    
    if (!newPriceId) {
      throw new Error('Price ID not configured for plan')
    }

    // Calculate proration for immediate change
    const immediateProration = await calculateProration(userId, newPriceId, 'immediate')
    
    // Calculate proration for cycle end change
    const cycleEndProration = await calculateProration(userId, newPriceId, 'cycle_end')

    // Generate recommendation based on proration amounts
    let recommendation: 'immediate' | 'cycle_end' | 'custom' = 'cycle_end'
    
    const immediateNetChange = immediateProration.prorationDetails.reduce(
      (sum, detail) => sum + (detail.type === 'charge' ? detail.amount : -detail.amount), 0
    )
    
    const cycleEndNetChange = cycleEndProration.prorationDetails.reduce(
      (sum, detail) => sum + (detail.type === 'charge' ? detail.amount : -detail.amount), 0
    )

    // Simple recommendation logic
    if (Math.abs(immediateNetChange) < 10) {
      recommendation = 'immediate' // Small change, do it immediately
    } else if (immediateNetChange < 0 && Math.abs(immediateNetChange) > cycleEndNetChange) {
      recommendation = 'immediate' // Immediate credit is better
    } else {
      recommendation = 'cycle_end' // Wait for cycle end
    }

    return {
      immediateProration,
      cycleEndProration,
      recommendation
    }
  } catch (error) {
    console.error('Error getting proration preview:', error)
    throw error
  }
}

export async function handleSubscriptionUpgrade(
  userId: string,
  newPlanType: 'pro' | 'enterprise',
  prorationOption: 'immediate' | 'cycle_end' = 'cycle_end'
) {
  try {
    // Get price ID for new plan
    const newPriceId = process.env[`STRIPE_${newPlanType.toUpperCase()}_PRICE_ID`]
    
    if (!newPriceId) {
      throw new Error('Price ID not configured for plan')
    }

    // Update subscription with proration
    const updatedSubscription = await updateSubscriptionWithProration(
      userId, 
      newPriceId, 
      prorationOption
    )

    // Update local subscription plan
    await db.subscription.update({
      where: { userId },
      data: {
        plan: newPlanType.toUpperCase() as 'PRO' | 'ENTERPRISE'
      }
    })

    return updatedSubscription
  } catch (error) {
    console.error('Error handling subscription upgrade:', error)
    throw error
  }
}

export async function handleSubscriptionDowngrade(
  userId: string,
  newPlanType: 'free' | 'pro',
  effectiveDate: 'immediate' | 'cycle_end' = 'cycle_end'
) {
  try {
    if (newPlanType === 'free') {
      // Cancel subscription
      return await cancelSubscriptionWithProration(userId, effectiveDate === 'immediate')
    } else {
      // Downgrade to pro plan
      const newPriceId = process.env.STRIPE_PRO_PRICE_ID
      
      if (!newPriceId) {
        throw new Error('Price ID not configured for plan')
      }

      const updatedSubscription = await updateSubscriptionWithProration(
        userId, 
        newPriceId, 
        effectiveDate
      )

      // Update local subscription plan
      await db.subscription.update({
        where: { userId },
        data: {
          plan: newPlanType.toUpperCase() as 'PRO'
        }
      })

      return updatedSubscription
    }
  } catch (error) {
    console.error('Error handling subscription downgrade:', error)
    throw error
  }
}