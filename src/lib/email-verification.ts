import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

export async function generateVerificationToken(email: string) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await db.user.update({
    where: { email },
    data: {
      verificationToken: token,
      verificationTokenExpires: expires
    }
  })

  return token
}

export async function verifyEmail(token: string) {
  const user = await db.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: {
        gt: new Date()
      }
    }
  })

  if (!user) {
    throw new Error('Invalid or expired verification token')
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpires: null
    }
  })

  return user
}

export async function resendVerificationEmail(email: string) {
  const user = await db.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.emailVerified) {
    throw new Error('Email already verified')
  }

  const token = await generateVerificationToken(email)
  
  // In a real application, you would send an email here
  // For now, we'll just log the token
  console.log(`Verification token for ${email}: ${token}`)
  console.log(`Verification link: ${process.env.NEXTAUTH_URL}/verify-email?token=${token}`)

  return { token, email }
}