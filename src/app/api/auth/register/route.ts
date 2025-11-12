import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateVerificationToken } from '@/lib/email-verification'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        // In a real app, you would store the password hash
        // password: hashedPassword,
        emailVerified: false // Email verification required
      }
    })

    // Create subscription for the user
    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE'
      }
    })

    // Generate verification token
    const verificationToken = await generateVerificationToken(email)

    // In a real application, you would send an email here
    // For now, we'll just log the token
    console.log(`Verification token for ${email}: ${verificationToken}`)
    console.log(`Verification link: ${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`)

    return NextResponse.json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}