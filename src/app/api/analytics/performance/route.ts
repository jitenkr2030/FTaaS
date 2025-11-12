import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AnalyticsService } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const analyticsService = new AnalyticsService()
    const performanceData = await analyticsService.getModelPerformance(session.user.id, {
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) })
    })

    return NextResponse.json(performanceData)
  } catch (error) {
    console.error("Error fetching performance data:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    )
  }
}