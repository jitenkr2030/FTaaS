import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deploymentService, DeploymentConfig } from "@/lib/deployment-service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deployment = await deploymentService.getDeployment(params.id, session.user.id)

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json(deployment)
  } catch (error) {
    console.error("Error fetching deployment:", error)
    return NextResponse.json(
      { error: "Failed to fetch deployment" },
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

    const success = await deploymentService.deleteDeployment(params.id, session.user.id)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete deployment" }, { status: 500 })
    }

    return NextResponse.json({ message: "Deployment deleted successfully" })
  } catch (error) {
    console.error("Error deleting deployment:", error)
    return NextResponse.json(
      { error: "Failed to delete deployment" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      endpointConfig, 
      scalingConfig, 
      monitoringConfig 
    } = body

    const updates: Partial<DeploymentConfig> = {}
    
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (endpointConfig !== undefined) updates.endpointConfig = endpointConfig
    if (scalingConfig !== undefined) updates.scalingConfig = scalingConfig
    if (monitoringConfig !== undefined) updates.monitoringConfig = monitoringConfig

    const deployment = await deploymentService.updateDeployment(params.id, session.user.id, updates)

    return NextResponse.json(deployment)
  } catch (error) {
    console.error("Error updating deployment:", error)
    return NextResponse.json(
      { error: "Failed to update deployment" },
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

    switch (action) {
      case "restart":
        // Restart deployment by updating it
        const deployment = await deploymentService.getDeployment(params.id, session.user.id)
        if (!deployment) {
          return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
        }
        
        // Simulate restart by updating with same config
        const updatedDeployment = await deploymentService.updateDeployment(
          params.id, 
          session.user.id, 
          {
            name: deployment.name,
            description: deployment.description,
            endpointConfig: deployment.endpointConfig,
            scalingConfig: deployment.scalingConfig,
            monitoringConfig: deployment.monitoringConfig
          }
        )
        
        return NextResponse.json(updatedDeployment)
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating deployment:", error)
    return NextResponse.json(
      { error: "Failed to update deployment" },
      { status: 500 }
    )
  }
}