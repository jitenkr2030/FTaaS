import { db } from '@/lib/db'
import { DunningStatus, DunningMethod, InvoiceStatus } from '@prisma/client'

export interface DunningConfig {
  enabled: boolean
  maxAttempts: number
  retryIntervalDays: number
  methods: DunningMethod[]
  emailTemplate?: string
  smsTemplate?: string
  inAppTemplate?: string
  gracePeriodDays: number
  autoSuspend: boolean
  customRules?: any
}

export interface DunningAttemptData {
  invoiceId: string
  userId: string
  attempt: number
  method: DunningMethod
  message: string
  nextAttempt?: Date
}

export class DunningService {
  static async getConfiguration(userId: string): Promise<DunningConfig | null> {
    const config = await db.dunningConfiguration.findUnique({
      where: { userId }
    })

    if (!config) {
      // Return default configuration
      return {
        enabled: true,
        maxAttempts: 3,
        retryIntervalDays: 3,
        methods: [DunningMethod.EMAIL],
        gracePeriodDays: 7,
        autoSuspend: true
      }
    }

    return {
      enabled: config.enabled,
      maxAttempts: config.maxAttempts,
      retryIntervalDays: config.retryIntervalDays,
      methods: config.methods as DunningMethod[],
      emailTemplate: config.emailTemplate || undefined,
      smsTemplate: config.smsTemplate || undefined,
      inAppTemplate: config.inAppTemplate || undefined,
      gracePeriodDays: config.gracePeriodDays,
      autoSuspend: config.autoSuspend,
      customRules: config.customRules
    }
  }

  static async updateConfiguration(userId: string, config: Partial<DunningConfig>): Promise<DunningConfig> {
    const existing = await db.dunningConfiguration.findUnique({
      where: { userId }
    })

    if (existing) {
      const updated = await db.dunningConfiguration.update({
        where: { userId },
        data: {
          enabled: config.enabled,
          maxAttempts: config.maxAttempts,
          retryIntervalDays: config.retryIntervalDays,
          methods: config.methods,
          emailTemplate: config.emailTemplate,
          smsTemplate: config.smsTemplate,
          inAppTemplate: config.inAppTemplate,
          gracePeriodDays: config.gracePeriodDays,
          autoSuspend: config.autoSuspend,
          customRules: config.customRules
        }
      })

      return {
        enabled: updated.enabled,
        maxAttempts: updated.maxAttempts,
        retryIntervalDays: updated.retryIntervalDays,
        methods: updated.methods as DunningMethod[],
        emailTemplate: updated.emailTemplate || undefined,
        smsTemplate: updated.smsTemplate || undefined,
        inAppTemplate: updated.inAppTemplate || undefined,
        gracePeriodDays: updated.gracePeriodDays,
        autoSuspend: updated.autoSuspend,
        customRules: updated.customRules
      }
    } else {
      const created = await db.dunningConfiguration.create({
        data: {
          userId,
          enabled: config.enabled ?? true,
          maxAttempts: config.maxAttempts ?? 3,
          retryIntervalDays: config.retryIntervalDays ?? 3,
          methods: config.methods ?? [DunningMethod.EMAIL],
          emailTemplate: config.emailTemplate,
          smsTemplate: config.smsTemplate,
          inAppTemplate: config.inAppTemplate,
          gracePeriodDays: config.gracePeriodDays ?? 7,
          autoSuspend: config.autoSuspend ?? true,
          customRules: config.customRules
        }
      })

      return {
        enabled: created.enabled,
        maxAttempts: created.maxAttempts,
        retryIntervalDays: created.retryIntervalDays,
        methods: created.methods as DunningMethod[],
        emailTemplate: created.emailTemplate || undefined,
        smsTemplate: created.smsTemplate || undefined,
        inAppTemplate: created.inAppTemplate || undefined,
        gracePeriodDays: created.gracePeriodDays,
        autoSuspend: created.autoSuspend,
        customRules: created.customRules
      }
    }
  }

  static async processOverdueInvoices(): Promise<void> {
    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: {
          lt: new Date()
        },
        paidAt: null
      },
      include: {
        user: {
          include: {
            dunningConfiguration: true
          }
        },
        dunningAttempts: {
          orderBy: {
            attempt: 'desc'
          },
          take: 1
        }
      }
    })

    for (const invoice of overdueInvoices) {
      const config = await this.getConfiguration(invoice.userId)
      
      if (!config?.enabled) continue

      const lastAttempt = invoice.dunningAttempts[0]
      const nextAttemptNumber = lastAttempt ? lastAttempt.attempt + 1 : 1

      // Check if we've exceeded max attempts
      if (nextAttemptNumber > config.maxAttempts) {
        await this.handleMaxAttemptsExceeded(invoice, config)
        continue
      }

      // Check if it's time for next attempt
      if (lastAttempt && lastAttempt.nextAttempt && lastAttempt.nextAttempt > new Date()) {
        continue
      }

      // Create dunning attempt
      await this.createDunningAttempt(invoice, nextAttemptNumber, config)
    }
  }

  static async createDunningAttempt(
    invoice: any,
    attemptNumber: number,
    config: DunningConfig
  ): Promise<void> {
    const method = config.methods[(attemptNumber - 1) % config.methods.length]
    const nextAttemptDate = new Date()
    nextAttemptDate.setDate(nextAttemptDate.getDate() + config.retryIntervalDays)

    const message = this.generateDunningMessage(invoice, attemptNumber, config, method)

    const dunningAttempt = await db.dunningAttempt.create({
      data: {
        invoiceId: invoice.id,
        userId: invoice.userId,
        attempt: attemptNumber,
        method,
        status: DunningStatus.PENDING,
        message,
        nextAttempt: nextAttemptDate
      }
    })

    // Send the dunning notification
    await this.sendDunningNotification(dunningAttempt, invoice, method)
  }

  static generateDunningMessage(
    invoice: any,
    attemptNumber: number,
    config: DunningConfig,
    method: DunningMethod
  ): string {
    const template = this.getTemplateForMethod(config, method)
    const amount = invoice.amount.toFixed(2)
    const dueDate = invoice.dueDate.toLocaleDateString()
    const daysOverdue = Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))

    return template
      .replace('{{amount}}', amount)
      .replace('{{dueDate}}', dueDate)
      .replace('{{daysOverdue}}', daysOverdue.toString())
      .replace('{{attempt}}', attemptNumber.toString())
      .replace('{{maxAttempts}}', config.maxAttempts.toString())
      .replace('{{gracePeriod}}', config.gracePeriodDays.toString())
  }

  static getTemplateForMethod(config: DunningConfig, method: DunningMethod): string {
    switch (method) {
      case DunningMethod.EMAIL:
        return config.emailTemplate || `
          Dear Customer,

          This is a reminder that your invoice of {{amount}} is {{daysOverdue}} days overdue.
          The due date was {{dueDate}}.

          This is attempt {{attempt}} of {{maxAttempts}}.
          Please settle your payment within {{gracePeriod}} days to avoid service suspension.

          Best regards,
          FTaaS Team
        `
      case DunningMethod.SMS:
        return config.smsTemplate || `
          FTaaS: Invoice {{amount}} is {{daysOverdue}} days overdue. Attempt {{attempt}} of {{maxAttempts}}. Please pay within {{gracePeriod}} days.
        `
      case DunningMethod.IN_APP:
        return config.inAppTemplate || `
          Your invoice of {{amount}} is {{daysOverdue}} days overdue. This is attempt {{attempt}} of {{maxAttempts}}.
        `
      default:
        return 'Your payment is overdue. Please settle your invoice.'
    }
  }

  static async sendDunningNotification(
    attempt: any,
    invoice: any,
    method: DunningMethod
  ): Promise<void> {
    try {
      // In a real implementation, this would integrate with email/SMS services
      // For now, we'll just mark it as sent
      
      await db.dunningAttempt.update({
        where: { id: attempt.id },
        data: {
          status: DunningStatus.SENT,
          sentAt: new Date()
        }
      })

      // Log the notification
      console.log(`Dunning notification sent via ${method} for invoice ${invoice.id}`)
    } catch (error) {
      await db.dunningAttempt.update({
        where: { id: attempt.id },
        data: {
          status: DunningStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  static async handleMaxAttemptsExceeded(invoice: any, config: DunningConfig): Promise<void> {
    if (config.autoSuspend) {
      // Suspend user's subscription
      await db.subscription.updateMany({
        where: {
          userId: invoice.userId,
          status: 'ACTIVE'
        },
        data: {
          status: 'CANCELLED'
        }
      })

      // Log the suspension
      console.log(`User ${invoice.userId} suspended due to failed payments`)
    }

    // Update invoice status
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.CANCELLED
      }
    })
  }

  static async getDunningAttempts(userId: string, invoiceId?: string): Promise<any[]> {
    const where: any = { userId }
    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    return await db.dunningAttempt.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async markDunningAsPaid(invoiceId: string): Promise<void> {
    await db.dunningAttempt.updateMany({
      where: {
        invoiceId,
        status: {
          in: [DunningStatus.PENDING, DunningStatus.SENT, DunningStatus.OPENED]
        }
      },
      data: {
        status: DunningStatus.PAID,
        paidAt: new Date()
      }
    })
  }

  static async getDunningStats(userId: string): Promise<any> {
    const attempts = await db.dunningAttempt.findMany({
      where: { userId },
      include: {
        invoice: true
      }
    })

    const stats = {
      totalAttempts: attempts.length,
      successfulRecoveries: attempts.filter(a => a.status === DunningStatus.PAID).length,
      pendingAttempts: attempts.filter(a => a.status === DunningStatus.PENDING).length,
      failedAttempts: attempts.filter(a => a.status === DunningStatus.FAILED).length,
      recoveryRate: attempts.length > 0 
        ? (attempts.filter(a => a.status === DunningStatus.PAID).length / attempts.length) * 100 
        : 0,
      averageAttemptsPerRecovery: 0
    }

    // Calculate average attempts per recovery
    const recoveries = attempts.filter(a => a.status === DunningStatus.PAID)
    if (recoveries.length > 0) {
      stats.averageAttemptsPerRecovery = recoveries.reduce((sum, a) => sum + a.attempt, 0) / recoveries.length
    }

    return stats
  }
}