import { NextRequest, NextResponse } from 'next/server'
import { DunningService } from '@/lib/dunning'

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected with a secret key in production
    const authHeader = request.headers.get('authorization')
    
    // Simple authorization check - in production, use proper authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await DunningService.processOverdueInvoices()
    
    return NextResponse.json({ success: true, message: 'Dunning process completed' })
  } catch (error) {
    console.error('Error processing dunning:', error)
    return NextResponse.json(
      { error: 'Failed to process dunning' },
      { status: 500 }
    )
  }
}