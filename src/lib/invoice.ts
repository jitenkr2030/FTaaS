import { db } from '@/lib/db'
import stripe from '@/lib/stripe'
import { InvoiceStatus } from '@prisma/client'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
  metadata?: Record<string, any>
}

export interface CreateInvoiceData {
  userId: string
  subscriptionId?: string
  amount: number
  currency?: string
  description?: string
  items: InvoiceItem[]
  dueDate?: Date
  metadata?: Record<string, any>
}

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  // Get the last invoice number for this month
  const lastInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let sequence = 1
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`
}

export async function createInvoice(data: CreateInvoiceData) {
  try {
    const invoiceNumber = await generateInvoiceNumber()
    
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency || 'usd',
        description: data.description,
        items: data.items,
        metadata: data.metadata,
        dueDate: data.dueDate,
        status: InvoiceStatus.DRAFT
      }
    })

    return invoice
  } catch (error) {
    console.error('Error creating invoice:', error)
    throw error
  }
}

export async function createStripeInvoice(invoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true,
        subscription: true
      }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Get or create Stripe customer
    let stripeCustomer
    const existingCustomer = await stripe.customers.list({
      email: invoice.user.email,
      limit: 1
    })

    if (existingCustomer.data.length > 0) {
      stripeCustomer = existingCustomer.data[0]
    } else {
      stripeCustomer = await stripe.customers.create({
        email: invoice.user.email,
        name: invoice.user.name || undefined,
        metadata: {
          userId: invoice.user.id
        }
      })
    }

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      auto_advance: false, // Don't automatically finalize/send
      description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      }
    })

    // Add invoice items
    for (const item of invoice.items as InvoiceItem[]) {
      await stripe.invoiceItems.create({
        customer: stripeCustomer.id,
        invoice: stripeInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
        currency: invoice.currency,
        metadata: item.metadata
      })
    }

    // Update invoice with Stripe invoice ID
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        stripeInvoiceId: stripeInvoice.id,
        status: InvoiceStatus.PENDING
      }
    })

    return stripeInvoice
  } catch (error) {
    console.error('Error creating Stripe invoice:', error)
    throw error
  }
}

export async function finalizeAndSendInvoice(invoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice || !invoice.stripeInvoiceId) {
      throw new Error('Invoice not found or not linked to Stripe')
    }

    // Finalize and send the invoice
    const stripeInvoice = await stripe.invoices.finalizeInvoice(invoice.stripeInvoiceId)
    await stripe.invoices.sendInvoice(invoice.stripeInvoiceId)

    // Update invoice status
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PENDING,
        dueDate: new Date(stripeInvoice.due_date * 1000)
      }
    })

    return stripeInvoice
  } catch (error) {
    console.error('Error finalizing invoice:', error)
    throw error
  }
}

export async function handleInvoicePaid(stripeInvoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { stripeInvoiceId },
      include: {
        user: true,
        subscription: true
      }
    })

    if (!invoice) {
      console.error('Invoice not found for Stripe invoice:', stripeInvoiceId)
      return
    }

    // Update invoice status
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date()
      }
    })

    // Generate PDF URL
    const pdfUrl = await generateInvoicePDF(invoice.id)
    
    // Update invoice with PDF URL
    await db.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl }
    })

    // Send confirmation email (would be implemented with email service)
    console.log(`Invoice ${invoice.invoiceNumber} paid. Confirmation sent to ${invoice.user.email}`)

    return invoice
  } catch (error) {
    console.error('Error handling invoice payment:', error)
    throw error
  }
}

export async function generateInvoicePDF(invoiceId: string): Promise<string> {
  // In a real implementation, this would generate a PDF using a library like Puppeteer
  // For now, return a mock URL
  return `/api/invoices/${invoiceId}/pdf`
}

export async function getUserInvoices(userId: string) {
  try {
    const invoices = await db.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return invoices
  } catch (error) {
    console.error('Error fetching user invoices:', error)
    throw error
  }
}

export async function getInvoiceById(invoiceId: string, userId?: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { 
        id: invoiceId,
        ...(userId && { userId })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true
          }
        }
      }
    })

    return invoice
  } catch (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }
}

export async function createUsageInvoice(userId: string, period: { start: Date; end: Date }) {
  try {
    // Get usage data for the period
    const usage = await getUsageData(userId, period)
    
    // Calculate costs based on usage
    const items = calculateUsageCosts(usage)
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    
    if (totalAmount === 0) {
      return null // No usage, no invoice
    }

    // Create invoice
    const invoice = await createInvoice({
      userId,
      amount: totalAmount,
      description: `Usage Invoice ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
      items,
      dueDate: new Date(period.end.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days after period end
    })

    // Create Stripe invoice
    await createStripeInvoice(invoice.id)
    
    // Finalize and send invoice
    await finalizeAndSendInvoice(invoice.id)

    return invoice
  } catch (error) {
    console.error('Error creating usage invoice:', error)
    throw error
  }
}

async function getUsageData(userId: string, period: { start: Date; end: Date }) {
  // This would fetch actual usage data from the database
  // For now, return mock data
  return {
    apiCalls: 5000,
    modelInference: 2000,
    storageGB: 5.2,
    fineTuningJobs: 3
  }
}

function calculateUsageCosts(usage: any): InvoiceItem[] {
  const items: InvoiceItem[] = []
  
  // API calls cost
  if (usage.apiCalls > 1000) {
    const extraCalls = usage.apiCalls - 1000
    items.push({
      description: 'Extra API Calls',
      quantity: extraCalls,
      unitPrice: 0.001, // $0.001 per call
      amount: extraCalls * 0.001
    })
  }
  
  // Model inference cost
  if (usage.modelInference > 0) {
    items.push({
      description: 'Model Inference',
      quantity: usage.modelInference,
      unitPrice: 0.01, // $0.01 per inference
      amount: usage.modelInference * 0.01
    })
  }
  
  // Storage cost
  if (usage.storageGB > 1) {
    const extraStorage = usage.storageGB - 1
    items.push({
      description: 'Extra Storage',
      quantity: extraStorage,
      unitPrice: 0.5, // $0.50 per GB
      amount: extraStorage * 0.5
    })
  }
  
  // Fine-tuning cost
  if (usage.fineTuningJobs > 0) {
    items.push({
      description: 'Fine-tuning Jobs',
      quantity: usage.fineTuningJobs,
      unitPrice: 25, // $25 per job
      amount: usage.fineTuningJobs * 25
    })
  }

  return items
}