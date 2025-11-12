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
    const search = searchParams.get("search")

    let whereClause: any = { userId: session.user.id }
    
    if (category && category !== "all") {
      whereClause.category = category
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const templates = await db.promptTemplate.findMany({
      where: whereClause,
      include: {
        performance: true,
        tests: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        optimizations: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching prompt templates:", error)
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
    const { name, description, category, template, variables } = body

    if (!name || !template) {
      return NextResponse.json({ error: "Name and template are required" }, { status: 400 })
    }

    // Extract variables from template (simple regex for {variable} pattern)
    const variableRegex = /\{([^}]+)\}/g
    const extractedVariables = []
    let match
    while ((match = variableRegex.exec(template)) !== null) {
      extractedVariables.push(match[1])
    }

    const promptTemplate = await db.promptTemplate.create({
      data: {
        name,
        description,
        category: category || "General",
        template,
        variables: extractedVariables,
        userId: session.user.id
      }
    })

    return NextResponse.json({ template: promptTemplate })
  } catch (error) {
    console.error("Error creating prompt template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}