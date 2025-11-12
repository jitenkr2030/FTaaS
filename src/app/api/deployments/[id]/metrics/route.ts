import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DeploymentService } from "@/lib/deployment"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deploymentService = new DeploymentService()
    const metrics = await deploymentService.getDeploymentMetrics(params.id, session.user.id)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching deployment metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch deployment metrics" },
      { status: 500 }
    )
  }
}