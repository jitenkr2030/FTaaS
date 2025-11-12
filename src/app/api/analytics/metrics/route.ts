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
    const modelId = searchParams.get("modelId")
    const deploymentId = searchParams.get("deploymentId")

    const analyticsService = new AnalyticsService()
    const metrics = await analyticsService.getDashboardMetrics(session.user.id, {
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(modelId && { modelId }),
      ...(deploymentId && { deploymentId })
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching analytics metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics metrics" },
      { status: 500 }
    )
  }
}