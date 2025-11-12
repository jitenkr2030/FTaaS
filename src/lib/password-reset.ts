import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function generatePasswordResetToken(email: string) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

  await db.user.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExpires: expires
    }
  })

  return token
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: {
        gt: new Date()
      }
    }
  })

  if (!user) {
    throw new Error('Invalid or expired reset token')
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  // Hash the new password
  const hashedPassword = await hash(newPassword, 12)

  await db.user.update({
    where: { id: user.id },
    data: {
      // In a real app, you would update the password hash
      // password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null
    }
  })

  return user
}

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('If an account exists with this email, a reset link will be sent.')
  }

  const token = await generatePasswordResetToken(email)
  
  // In a real application, you would send an email here
  // For now, we'll just log the token
  console.log(`Password reset token for ${email}: ${token}`)
  console.log(`Password reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`)

  return { token, email }
}