import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = 'default-user-id' // In real app, get from auth

    // Get user statistics
    const [
      totalModels,
      totalDatasets,
      totalJobs,
      totalEvaluations,
      activeModels,
      readyDatasets,
      completedJobs,
      completedEvaluations,
      totalApiCalls,
      totalCost
    ] = await Promise.all([
      // Total fine-tuned models
      db.fineTunedModel.count({ where: { userId } }),
      
      // Total datasets
      db.dataset.count({ where: { userId } }),
      
      // Total fine-tuning jobs
      db.fineTuningJob.count({ where: { userId } }),
      
      // Total evaluations
      db.evaluation.count({ where: { userId } }),
      
      // Active models (READY or DEPLOYED)
      db.fineTunedModel.count({ 
        where: { 
          userId,
          status: { in: ['READY', 'DEPLOYED'] }
        }
      }),
      
      // Ready datasets
      db.dataset.count({ 
        where: { 
          userId,
          status: 'READY'
        }
      }),
      
      // Completed jobs
      db.fineTuningJob.count({ 
        where: { 
          userId,
          status: 'COMPLETED'
        }
      }),
      
      // Completed evaluations
      db.evaluation.count({ 
        where: { 
          userId,
          status: 'COMPLETED'
        }
      }),
      
      // Total API calls
      db.apiUsage.aggregate({
        where: { userId },
        _sum: { requestCount: true }
      }),
      
      // Total cost across jobs and API usage
      Promise.all([
        db.fineTuningJob.aggregate({
          where: { userId },
          _sum: { cost: true }
        }),
        db.apiUsage.aggregate({
          where: { userId },
          _sum: { cost: true }
        })
      ])
    ])

    // Get recent activity
    const recentJobs = await db.fineTuningJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        baseModel: {
          select: { name: true, provider: true }
        },
        dataset: {
          select: { name: true, recordCount: true }
        }
      }
    })

    const recentEvaluations = await db.evaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        fineTunedModel: {
          select: { name: true }
        },
        baseModel: {
          select: { name: true, provider: true }
        }
      }
    })

    // Get system status
    const systemStatus = {
      trainingQueue: await db.fineTuningJob.count({
        where: { status: { in: ['PENDING', 'QUEUED'] } }
      }),
      activeTraining: await db.fineTuningJob.count({
        where: { status: 'TRAINING' }
      }),
      gpuAvailability: 8, // Mock value - in real app, get from infrastructure
      apiResponseTime: 45 // Mock value in ms
    }

    // Calculate total cost
    const jobCost = totalCost[0]?._sum.cost || 0
    const apiCost = totalCost[1]?._sum.cost || 0
    const totalCostSum = jobCost + apiCost

    const stats = {
      models: {
        total: totalModels,
        active: activeModels
      },
      datasets: {
        total: totalDatasets,
        ready: readyDatasets
      },
      jobs: {
        total: totalJobs,
        completed: completedJobs
      },
      evaluations: {
        total: totalEvaluations,
        completed: completedEvaluations
      },
      api: {
        totalCalls: totalApiCalls._sum.requestCount || 0
      },
      billing: {
        totalCost: totalCostSum
      },
      recentActivity: {
        jobs: recentJobs,
        evaluations: recentEvaluations
      },
      systemStatus
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}