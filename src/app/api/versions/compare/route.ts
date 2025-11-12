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
    const versionId1 = searchParams.get("versionId1")
    const versionId2 = searchParams.get("versionId2")

    if (!versionId1 || !versionId2) {
      return NextResponse.json(
        { error: "versionId1 and versionId2 are required" },
        { status: 400 }
      )
    }

    const versioningService = new VersioningService()
    const comparison = await versioningService.compareVersions(versionId1, versionId2, session.user.id)

    return NextResponse.json(comparison)
  } catch (error) {
    console.error("Error comparing versions:", error)
    return NextResponse.json(
      { error: "Failed to compare versions" },
      { status: 500 }
    )
  }
}