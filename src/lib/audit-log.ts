import { db } from '@/lib/db'
import { headers } from 'next/headers'

export interface AuditEvent {
  action: string
  resource?: string
  resourceId?: string
  userId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(event: AuditEvent) {
  try {
    // Get IP address and user agent from headers if not provided
    const headersList = headers()
    const ipAddress = event.ipAddress || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = event.userAgent || headersList.get('user-agent') || 'unknown'

    await db.auditLog.create({
      data: {
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        userId: event.userId,
        details: event.details,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw the error to avoid disrupting the main flow
  }
}

export async function logSecurityEvent(event: AuditEvent) {
  // Add security-specific metadata
  const securityEvent = {
    ...event,
    details: {
      ...event.details,
      security: true,
      timestamp: new Date().toISOString()
    }
  }

  await logAuditEvent(securityEvent)
}

export async function logAuthenticationEvent(userId: string, action: 'login' | 'logout' | 'failed_login', details?: any) {
  await logAuditEvent({
    action,
    resource: 'authentication',
    userId,
    details: {
      ...details,
      method: details?.method || 'credentials'
    }
  })
}

export async function logAuthorizationEvent(userId: string, action: string, resource: string, success: boolean, details?: any) {
  await logAuditEvent({
    action: success ? 'access_granted' : 'access_denied',
    resource: 'authorization',
    userId,
    details: {
      targetResource: resource,
      targetAction: action,
      success,
      ...details
    }
  })
}

export async function logDataModificationEvent(userId: string, action: string, resource: string, resourceId: string, details?: any) {
  await logAuditEvent({
    action,
    resource,
    resourceId,
    userId,
    details: {
      ...details,
      modificationTime: new Date().toISOString()
    }
  })
}

export async function logAPIKeyEvent(userId: string, action: 'created' | 'revoked' | 'used', apiKeyId?: string, details?: any) {
  await logAuditEvent({
    action: `api_key_${action}`,
    resource: 'api_key',
    resourceId: apiKeyId,
    userId,
    details: {
      ...details,
      apiKeyId
    }
  })
}

export async function logPermissionChangeEvent(userId: string, targetUserId: string, action: 'granted' | 'revoked', role: string, details?: any) {
  await logAuditEvent({
    action: `permission_${action}`,
    resource: 'user_role',
    userId,
    details: {
      targetUserId,
      role,
      ...details
    }
  })
}

export async function getAuditLogs(filters?: {
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  try {
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.action) {
      where.action = filters.action
    }

    if (filters?.resource) {
      where.resource = filters.resource
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      db.auditLog.count({ where })
    ])

    return { logs, total }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return { logs: [], total: 0 }
  }
}

export async function getSecurityEvents(filters?: {
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  // Security events are audit events with security-related actions
  const securityActions = [
    'login', 'logout', 'failed_login', 'access_denied',
    'api_key_created', 'api_key_revoked', 'permission_granted', 'permission_revoked'
  ]

  return await getAuditLogs({
    ...filters,
    action: filters?.action || undefined,
    limit: filters?.limit || 100
  })
}

export async function getUserActivity(userId: string, limit: number = 50) {
  return await getAuditLogs({
    userId,
    limit
  })
}