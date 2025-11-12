import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trainingService, TrainingConfig } from '@/lib/training'
import { FineTuningStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId') || 'default-user-id' // In real app, get from auth

    let whereClause: any = { userId }
    
    if (status && status !== 'all') {
      whereClause.status = status as FineTuningStatus
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const jobs = await db.fineTuningJob.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        baseModel: {
          select: { id: true, name, provider, modelId }
        },
        dataset: {
          select: { id: true, name, format, recordCount }
        },
        fineTunedModel: {
          select: { id: true, name, status, endpoint }
        }
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching fine-tuning jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fine-tuning jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      baseModelId, 
      datasetId, 
      hyperparameters,
      gpuRequirements,
      checkpointConfig,
      earlyStopping
    } = body
    const userId = 'default-user-id' // In real app, get from auth

    if (!name || !baseModelId || !datasetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify base model and dataset exist
    const baseModel = await db.baseModel.findUnique({
      where: { id: baseModelId }
    })

    const dataset = await db.dataset.findUnique({
      where: { id: datasetId }
    })

    if (!baseModel || !dataset) {
      return NextResponse.json(
        { error: 'Base model or dataset not found' },
        { status: 404 }
      )
    }

    if (dataset.userId !== userId) {
      return NextResponse.json(
        { error: 'Dataset not owned by user' },
        { status: 403 }
      )
    }

    // Create job in database
    const job = await db.fineTuningJob.create({
      data: {
        name,
        description,
        baseModelId,
        datasetId,
        userId,
        hyperparameters: hyperparameters || {},
        status: FineTuningStatus.PENDING
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        baseModel: {
          select: { id: true, name, provider, modelId }
        },
        dataset: {
          select: { id: true, name, format, recordCount }
        }
      }
    })

    // Prepare training configuration
    const trainingConfig: TrainingConfig = {
      jobId: job.id,
      baseModelId,
      datasetId,
      hyperparameters: hyperparameters || {
        learningRate: 0.0001,
        batchSize: 8,
        epochs: 3,
        fp16: true
      },
      gpuRequirements: gpuRequirements || {
        minMemory: 16,
        minGPUs: 1,
        preferredGPUType: 'V100',
        region: 'us-east-1'
      },
      checkpointConfig: checkpointConfig || {
        saveInterval: 500,
        maxCheckpoints: 5,
        saveBest: true
      },
      earlyStopping: earlyStopping || {
        patience: 3,
        minDelta: 0.01,
        monitor: 'val_loss'
      }
    }

    // Start training process
    const trainingJob = await trainingService.startTrainingJob(trainingConfig)

    return NextResponse.json({
      ...job,
      ...trainingJob,
      message: 'Training job started successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating fine-tuning job:', error)
    return NextResponse.json(
      { error: 'Failed to create fine-tuning job' },
      { status: 500 }
    )
  }
}