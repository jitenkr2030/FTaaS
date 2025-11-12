import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await resendVerificationEmail(email)

    return NextResponse.json({
      message: 'Verification email resent successfully',
      email: result.email
    })
  } catch (error) {
    console.error('Error resending verification email:', error)
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      if (error.message === 'Email already verified') {
        return NextResponse.json(
          { error: 'Email already verified' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}