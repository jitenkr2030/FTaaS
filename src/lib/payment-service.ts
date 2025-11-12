import Stripe from 'stripe'
import { db } from '@/lib/db'
import { SubscriptionPlan, SubscriptionStatus, InvoiceStatus, PaymentMethod } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export interface PaymentProcessingConfig {
  stripe: Stripe
  webhookSecret: string
  currency: string
}

export interface SubscriptionPlanDetails {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  metadata: Record<string, any>
  stripePriceId?: string
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
  metadata: Record<string, any>
}

export interface InvoiceDetails {
  id: string
  amount: number
  currency: string
  status: InvoiceStatus
  dueDate: Date
  paidAt?: Date
  items: InvoiceItem[]
  pdfUrl?: string
}

export interface InvoiceItem {
  id: string
  description: string
  amount: number
  currency: string
  quantity: number
}

export class PaymentService {
  private config: PaymentProcessingConfig
  private plans: Map<string, SubscriptionPlanDetails> = new Map()

  constructor(config?: Partial<PaymentProcessingConfig>) {
    this.config = {
      stripe,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      currency: 'usd',
      ...config
    }

    this.initializePlans()
  }

  private initializePlans() {
    const plans: SubscriptionPlanDetails[] = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: [
          '1 fine-tuned model',
          '5 datasets',
          '1,000 API calls/month',
          'Community support',
          'Basic analytics'
        ],
        metadata: {
          maxModels: 1,
          maxDatasets: 5,
          maxApiCalls: 1000,
          prioritySupport: false
        }
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For professionals and small teams',
        price: 9900, // $99.00 in cents
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
        ],
        metadata: {
          maxModels: 10,
          maxDatasets: 50,
          maxApiCalls: 100000,
          prioritySupport: true,
          dedicatedGPU: true
        },
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: 0, // Custom pricing
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
        ],
        metadata: {
          maxModels: -1, // Unlimited
          maxDatasets: -1, // Unlimited
          maxApiCalls: -1, // Unlimited
          prioritySupport: true,
          dedicatedGPU: true,
          privateCluster: true,
          slaGuarantee: true
        },
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
      }
    ]

    plans.forEach(plan => {
      this.plans.set(plan.id, plan)
    })
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const plan = this.plans.get(planId)
      if (!plan) {
        throw new Error(`Plan ${planId} not found`)
      }

      if (plan.price === 0) {
        throw new Error('Free plan cannot be purchased')
      }

      if (!plan.stripePriceId) {
        throw new Error(`Plan ${planId} does not have a Stripe price ID configured`)
      }

      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId)

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
        },
        subscription_data: {
          metadata: {
            userId,
            planId,
          },
        },
      })

      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  async createPaymentIntent(
    userId: string,
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, any> = {}
  ): Promise<PaymentIntent> {
    try {
      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customer.id,
        metadata: {
          userId,
          ...metadata,
        },
        payment_method_types: ['card'],
      })

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret || '',
        metadata: paymentIntent.metadata as Record<string, any>,
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const customer = await this.getOrCreateStripeCustomer(userId)

      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: returnUrl,
      })

      return session
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      )

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
          break

        default:
          console.log(`Unhandled webhook event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Error handling webhook:', error)
      throw error
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    try {
      const userId = session.metadata?.userId
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        console.error('Missing metadata in checkout session')
        return
      }

      const plan = this.plans.get(planId)
      if (!plan) {
        console.error(`Plan ${planId} not found`)
        return
      }

      // Update user subscription
      await db.subscription.upsert({
        where: { userId },
        update: {
          plan: planId.toUpperCase() as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          renewedAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        create: {
          userId,
          plan: planId.toUpperCase() as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          renewedAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      console.log(`Subscription updated for user ${userId} to plan ${planId}`)
    } catch (error) {
      console.error('Error handling checkout session completed:', error)
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
      const userId = subscription.metadata?.userId
      if (!userId) {
        console.error('Missing userId in subscription metadata')
        return
      }

      const status = this.mapStripeStatusToSubscriptionStatus(subscription.status)

      await db.subscription.update({
        where: { userId },
        data: {
          status,
          stripeSubscriptionId: subscription.id,
          endsAt: new Date(subscription.current_period_end * 1000),
          renewedAt: new Date(subscription.current_period_start * 1000),
        },
      })

      console.log(`Subscription updated for user ${userId}: ${status}`)
    } catch (error) {
      console.error('Error handling subscription updated:', error)
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      const userId = subscription.metadata?.userId
      if (!userId) {
        console.error('Missing userId in subscription metadata')
        return
      }

      await db.subscription.update({
        where: { userId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          endsAt: new Date(subscription.current_period_end * 1000),
        },
      })

      console.log(`Subscription cancelled for user ${userId}`)
    } catch (error) {
      console.error('Error handling subscription deleted:', error)
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      const subscriptionId = invoice.subscription
      if (!subscriptionId) {
        console.error('Invoice has no subscription ID')
        return
      }

      // Get subscription to find user
      const subscription = await db.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId as string }
      })

      if (!subscription) {
        console.error(`Subscription not found for Stripe subscription ${subscriptionId}`)
        return
      }

      // Create invoice record
      await db.invoice.create({
        data: {
          userId: subscription.userId,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: InvoiceStatus.PAID,
          dueDate: new Date(invoice.due_date * 1000),
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
          items: invoice.lines.data.map(line => ({
            description: line.description || '',
            amount: line.amount / 100,
            currency: line.currency,
            quantity: line.quantity || 1,
          })),
          metadata: {
            invoiceNumber: invoice.number,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
          },
        },
      })

      console.log(`Invoice payment succeeded for user ${subscription.userId}`)
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error)
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    try {
      const subscriptionId = invoice.subscription
      if (!subscriptionId) {
        console.error('Invoice has no subscription ID')
        return
      }

      // Get subscription to find user
      const subscription = await db.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId as string }
      })

      if (!subscription) {
        console.error(`Subscription not found for Stripe subscription ${subscriptionId}`)
        return
      }

      // Create invoice record
      await db.invoice.create({
        data: {
          userId: subscription.userId,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          status: InvoiceStatus.FAILED,
          dueDate: new Date(invoice.due_date * 1000),
          items: invoice.lines.data.map(line => ({
            description: line.description || '',
            amount: line.amount / 100,
            currency: line.currency,
            quantity: line.quantity || 1,
          })),
          metadata: {
            invoiceNumber: invoice.number,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
            nextPaymentAttempt: invoice.next_payment_attempt,
          },
        },
      })

      // Trigger dunning process
      await this.triggerDunningProcess(subscription.userId, invoice.id)

      console.log(`Invoice payment failed for user ${subscription.userId}`)
    } catch (error) {
      console.error('Error handling invoice payment failed:', error)
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const userId = paymentIntent.metadata?.userId
      if (!userId) {
        console.error('Missing userId in payment intent metadata')
        return
      }

      // Record one-time payment
      await db.payment.create({
        data: {
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'succeeded',
          method: PaymentMethod.CARD,
          metadata: paymentIntent.metadata,
        },
      })

      console.log(`Payment succeeded for user ${userId}`)
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error)
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const userId = paymentIntent.metadata?.userId
      if (!userId) {
        console.error('Missing userId in payment intent metadata')
        return
      }

      // Record failed payment
      await db.payment.create({
        data: {
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'failed',
          method: PaymentMethod.CARD,
          metadata: paymentIntent.metadata,
        },
      })

      console.log(`Payment failed for user ${userId}`)
    } catch (error) {
      console.error('Error handling payment intent failed:', error)
    }
  }

  private async triggerDunningProcess(userId: string, invoiceId: string) {
    try {
      // Get user's subscription
      const subscription = await db.subscription.findUnique({
        where: { userId }
      })

      if (!subscription) {
        console.error(`Subscription not found for user ${userId}`)
        return
      }

      // Create dunning attempt
      await db.dunningAttempt.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          invoiceId,
          attemptNumber: 1,
          status: 'PENDING',
          nextAttemptAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })

      // Send notification to user
      // In a real implementation, this would send an email
      console.log(`Dunning process initiated for user ${userId}`)

    } catch (error) {
      console.error('Error triggering dunning process:', error)
    }
  }

  private async getOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Check if user already has a Stripe customer ID
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true, email: true, name: true }
      })

      if (!user) {
        throw new Error(`User ${userId} not found`)
      }

      if (user.stripeCustomerId) {
        // Retrieve existing customer
        return await stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || '',
        metadata: {
          userId,
        },
      })

      // Update user with Stripe customer ID
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      })

      return customer
    } catch (error) {
      console.error('Error getting or creating Stripe customer:', error)
      throw error
    }
  }

  private mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE
      case 'past_due':
        return SubscriptionStatus.PAST_DUE
      case 'canceled':
        return SubscriptionStatus.CANCELLED
      case 'unpaid':
        return SubscriptionStatus.UNPAID
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED
      case 'trialing':
        return SubscriptionStatus.TRIALING
      default:
        return SubscriptionStatus.ACTIVE
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlanDetails[]> {
    return Array.from(this.plans.values())
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlanDetails | null> {
    return this.plans.get(planId) || null
  }

  async getUserSubscription(userId: string) {
    try {
      const subscription = await db.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      if (!subscription) {
        // Create default free subscription
        const newSubscription = await db.subscription.create({
          data: {
            userId,
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        })
        return newSubscription
      }

      return subscription
    } catch (error) {
      console.error('Error getting user subscription:', error)
      throw error
    }
  }

  async getUserInvoices(userId: string): Promise<InvoiceDetails[]> {
    try {
      const invoices = await db.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        items: invoice.items as InvoiceItem[],
        pdfUrl: invoice.pdfUrl
      }))
    } catch (error) {
      console.error('Error getting user invoices:', error)
      throw error
    }
  }

  async cancelSubscription(userId: string, immediately = false): Promise<void> {
    try {
      const subscription = await db.subscription.findUnique({
        where: { userId }
      })

      if (!subscription) {
        throw new Error('Subscription not found')
      }

      if (subscription.stripeSubscriptionId) {
        if (immediately) {
          // Cancel immediately
          await stripe.subscriptions.del(subscription.stripeSubscriptionId)
        } else {
          // Cancel at period end
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          })
        }
      }

      // Update database
      await db.subscription.update({
        where: { userId },
        data: {
          status: immediately ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
          cancelledAt: immediately ? new Date() : null,
        },
      })

      console.log(`Subscription cancelled for user ${userId}`)
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()