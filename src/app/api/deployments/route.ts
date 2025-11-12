import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { deploymentService, DeploymentConfig } from "@/lib/deployment-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      modelId, 
      endpointConfig, 
      scalingConfig, 
      monitoringConfig 
    } = body

    if (!name || !modelId) {
      return NextResponse.json(
        { error: "Name and modelId are required" },
        { status: 400 }
      )
    }

    // Check if user owns the model
    const model = await db.fineTunedModel.findFirst({
      where: {
        id: modelId,
        userId: session.user.id,
      },
    })

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    if (model.status !== "READY") {
      return NextResponse.json(
        { error: "Model must be in READY status to deploy" },
        { status: 400 }
      )
    }

    // Prepare deployment configuration
    const deploymentConfig: DeploymentConfig = {
      modelId,
      name,
      description: description || '',
      endpointConfig: endpointConfig || {
        instanceType: 't3.medium',
        instanceCount: 1,
        memory: 4,
        region: 'us-east-1',
        authType: 'api-key',
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        }
      },
      scalingConfig: scalingConfig || {
        minInstances: 1,
        maxInstances: 3,
        targetCPUUtilization: 70,
        targetMemoryUtilization: 80,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600
      },
      monitoringConfig: monitoringConfig || {
        enableMetrics: true,
        enableLogging: true,
        enableAlerts: true,
        metricsRetentionDays: 30,
        logRetentionDays: 7,
        alertRules: [
          {
            name: 'High Error Rate',
            metric: 'errorRate',
            condition: 'gt',
            threshold: 5,
            duration: 300,
            severity: 'high',
            actions: ['email']
          },
          {
            name: 'High Response Time',
            metric: 'averageResponseTime',
            condition: 'gt',
            threshold: 1000,
            duration: 300,
            severity: 'medium',
            actions: ['email']
          }
        ]
      },
      userId: session.user.id
    }

    const deployment = await deploymentService.createDeployment(deploymentConfig)

    return NextResponse.json(deployment)
  } catch (error) {
    console.error("Error creating deployment:", error)
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deployments = await deploymentService.listDeployments(session.user.id)

    return NextResponse.json(deployments)
  } catch (error) {
    console.error("Error fetching deployments:", error)
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    )
  }
}