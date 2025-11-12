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
    const versions = await versioningService.getVersions(fineTunedModelId, session.user.id)

    return NextResponse.json(versions)
  } catch (error) {
    console.error("Error fetching versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fineTunedModelId, version, name, description, checkpoint, parameters } = await request.json()

    if (!fineTunedModelId || !version || !name || !parameters) {
      return NextResponse.json(
        { error: "fineTunedModelId, version, name, and parameters are required" },
        { status: 400 }
      )
    }

    const versioningService = new VersioningService()
    const newVersion = await versioningService.createVersion({
      fineTunedModelId,
      version,
      name,
      description,
      checkpoint,
      parameters,
      userId: session.user.id,
    })

    return NextResponse.json(newVersion)
  } catch (error) {
    console.error("Error creating version:", error)
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    )
  }
}