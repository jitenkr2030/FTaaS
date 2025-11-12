import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { logAPIKeyEvent } from '@/lib/audit-log'

export async function generateApiKey() {
  return `ftaas_${randomBytes(32).toString('hex')}`
}

export async function createApiKey(userId: string, name: string, permissions: any = {}, expiresAt?: Date) {
  const key = await generateApiKey()

  const apiKey = await db.apiKey.create({
    data: {
      name,
      key,
      userId,
      permissions,
      expiresAt,
      isActive: true
    }
  })

  // Log API key creation event
  await logAPIKeyEvent(userId, 'created', apiKey.id, {
    keyName: name,
    hasExpiry: !!expiresAt,
    expiresAt: expiresAt?.toISOString()
  })

  return apiKey
}

export async function validateApiKey(apiKey: string) {
  const keyRecord = await db.apiKey.findUnique({
    where: { key: apiKey },
    include: {
      user: {
        include: {
          subscriptions: true
        }
      }
    }
  })

  if (!keyRecord) {
    throw new Error('Invalid API key')
  }

  if (!keyRecord.isActive) {
    throw new Error('API key is deactivated')
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    throw new Error('API key has expired')
  }

  // Check if user has active subscription
  const activeSubscription = keyRecord.user.subscriptions.find(
    sub => sub.status === 'ACTIVE' && (!sub.endsAt || sub.endsAt > new Date())
  )

  if (!activeSubscription) {
    throw new Error('User subscription is not active')
  }

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() }
  })

  // Log API key usage event
  await logAPIKeyEvent(keyRecord.userId, 'used', keyRecord.id, {
    keyName: keyRecord.name,
    subscriptionActive: !!activeSubscription
  })

  return keyRecord
}

export async function getUserApiKeys(userId: string) {
  return await db.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function revokeApiKey(apiKeyId: string, userId: string) {
  const apiKey = await db.apiKey.findFirst({
    where: {
      id: apiKeyKeyId,
      userId
    }
  })

  if (!apiKey) {
    throw new Error('API key not found or access denied')
  }

  await db.apiKey.update({
    where: { id: apiKeyKeyId },
    data: { isActive: false }
  })

  // Log API key revocation event
  await logAPIKeyEvent(userId, 'revoked', apiKeyKeyId, {
    keyName: apiKey.name,
    wasActive: apiKey.isActive,
    hadExpiry: !!apiKey.expiresAt
  })

  return apiKey
}

export async function updateApiKeyPermissions(apiKeyId: string, userId: string, permissions: any) {
  const apiKey = await db.apiKey.findFirst({
    where: {
      id: apiKeyKeyId,
      userId
    }
  })

  if (!apiKey) {
    throw new Error('API key not found or access denied')
  }

  await db.apiKey.update({
    where: { id: apiKeyKeyId },
    data: { permissions }
  })

  return apiKey
}