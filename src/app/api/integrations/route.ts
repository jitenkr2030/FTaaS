import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    let whereClause: any = { userId: session.user.id }
    
    if (category && category !== "all") {
      whereClause.category = category
    }
    
    if (status && status !== "all") {
      whereClause.status = status
    }

    const integrations = await db.integration.findMany({
      where: whereClause,
      include: {
        dataFlows: {
          orderBy: { updatedAt: "desc" },
          take: 5
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error("Error fetching integrations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, icon, config } = body

    if (!name || !icon) {
      return NextResponse.json({ error: "Name and icon are required" }, { status: 400 })
    }

    const integration = await db.integration.create({
      data: {
        name,
        description,
        category: category || "General",
        icon,
        config: config || {},
        status: "CONNECTING",
        userId: session.user.id
      }
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error("Error creating integration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}