import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiModelService } from '@/lib/ai-models'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get period from query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' || 'month'

    // Get usage statistics
    const usageStats = await aiModelService.getUsageStats(user.id, period)

    // Get current month's total usage
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const totalUsage = await db.apiUsage.aggregate({
      where: {
        userId: user.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        tokenCount: true,
        cost: true
      },
      _count: {
        requestCount: true
      }
    })

    // Get user's subscription to determine limits
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id }
    })

    let tokenLimit = 1000 // Free plan default
    switch (subscription?.plan) {
      case 'PRO':
        tokenLimit = 100000
        break
      case 'ENTERPRISE':
        tokenLimit = 1000000
        break
    }

    const totalTokensUsed = totalUsage._sum.tokenCount || 0
    const totalCost = totalUsage._sum.cost || 0
    const totalRequests = totalUsage._count.requestCount || 0

    return NextResponse.json({
      usageStats,
      summary: {
        totalTokensUsed,
        totalCost,
        totalRequests,
        tokenLimit,
        usagePercentage: (totalTokensUsed / tokenLimit) * 100,
        remainingTokens: Math.max(0, tokenLimit - totalTokensUsed)
      }
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}