import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await requestPasswordReset(email)

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, a reset link will be sent.'
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    
    // Always return the same message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, a reset link will be sent.'
    })
  }
}