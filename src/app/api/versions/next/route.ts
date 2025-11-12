import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { VersioningService } from "@/lib/versioning"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fineTunedModelId = searchParams.get("fineTunedModelId")

    if (!fineTunedModelId) {
      return NextResponse.json(
        { error: "fineTunedModelId is required" },
        { status: 400 }
      )
    }

    const versioningService = new VersioningService()
    const nextVersion = await versioningService.getNextVersion(fineTunedModelId, session.user.id)

    return NextResponse.json({ nextVersion })
  } catch (error) {
    console.error("Error fetching next version:", error)
    return NextResponse.json(
      { error: "Failed to fetch next version" },
      { status: 500 }
    )
  }
}