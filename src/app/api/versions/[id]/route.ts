import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { VersioningService } from "@/lib/versioning"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const versioningService = new VersioningService()
    const version = await versioningService.getVersion(params.id, session.user.id)

    return NextResponse.json(version)
  } catch (error) {
    console.error("Error fetching version:", error)
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const versioningService = new VersioningService()
    
    const updatedVersion = await versioningService.updateVersion({
      versionId: params.id,
      userId: session.user.id,
      ...updates,
    })

    return NextResponse.json(updatedVersion)
  } catch (error) {
    console.error("Error updating version:", error)
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const versioningService = new VersioningService()
    await versioningService.deleteVersion(params.id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting version:", error)
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()
    const versioningService = new VersioningService()

    switch (action) {
      case "promote-to-production":
        const productionVersion = await versioningService.promoteToProduction(params.id, session.user.id)
        return NextResponse.json(productionVersion)
      
      case "promote-to-staging":
        const stagingVersion = await versioningService.promoteToStaging(params.id, session.user.id)
        return NextResponse.json(stagingVersion)
      
      case "demote":
        const demotedVersion = await versioningService.demoteVersion(params.id, session.user.id)
        return NextResponse.json(demotedVersion)
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating version:", error)
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    )
  }
}