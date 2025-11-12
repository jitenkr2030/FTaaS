import { db } from '@/lib/db'
import { aiModelService } from '@/lib/ai-models'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface FineTuningConfig {
  model: string
  trainingFile: string
  validationFile?: string
  n_epochs?: number
  batch_size?: number
  learning_rate_multiplier?: number
  prompt_loss_weight?: number
  compute_classification_metrics?: boolean
  classification_n_classes?: number
  classification_positive_class?: string
  classification_betas?: number[]
  suffix?: string
}

export interface FineTuningJob {
  id: string
  object: string
  model: string
  training_file: string
  validation_file?: string
  hyperparameters: any
  status: 'validating_files' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  trained_tokens?: number
  error?: any
  created_at: number
  finished_at?: number
  fine_tuned_model?: string
  organization_id: string
  result_files?: string[]
}

export interface TrainingMetrics {
  training_loss?: number
  validation_loss?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  epochs_completed?: number
  tokens_trained?: number
}

export class FineTuningService {
  async createFineTuningJob(
    userId: string,
    datasetId: string,
    baseModelId: string,
    config: Partial<FineTuningConfig>
  ) {
    try {
      // Get dataset
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId, userId }
      })

      if (!dataset) {
        throw new Error('Dataset not found')
      }

      // Get base model
      const baseModel = await db.baseModel.findUnique({
        where: { id: baseModelId }
      })

      if (!baseModel) {
        throw new Error('Base model not found')
      }

      // Check user's subscription limits
      await this.checkFineTuningLimits(userId)

      // Create fine-tuning job in database
      const fineTuningJob = await db.fineTuningJob.create({
        data: {
          name: `Fine-tuned ${baseModel.name}`,
          description: `Fine-tuned model based on ${baseModel.name} with dataset ${dataset.name}`,
          baseModelId: baseModel.id,
          datasetId: dataset.id,
          userId,
          hyperparameters: config,
          status: 'PENDING',
          estimatedTime: this.estimateTrainingTime(dataset.recordCount, baseModel.modelId)
        }
      })

      // Prepare training data
      const trainingFileId = await this.prepareTrainingData(dataset, userId)

      // Create fine-tuning job with OpenAI
      const openAIConfig: FineTuningConfig = {
        model: baseModel.modelId,
        trainingFile: trainingFileId,
        validationFile: config.validationFile,
        n_epochs: config.n_epochs || 3,
        batch_size: config.batch_size,
        learning_rate_multiplier: config.learning_rate_multiplier,
        prompt_loss_weight: config.prompt_loss_weight,
        compute_classification_metrics: config.compute_classification_metrics,
        classification_n_classes: config.classification_n_classes,
        classification_positive_class: config.classification_positive_class,
        classification_betas: config.classification_betas,
        suffix: config.suffix || `ft_${Date.now()}`
      }

      const openAIJob = await openai.fineTuning.jobs.create(openAIConfig)

      // Update job with OpenAI job ID
      await db.fineTuningJob.update({
        where: { id: fineTuningJob.id },
        data: {
          status: this.mapOpenAIStatus(openAIJob.status),
          startedAt: new Date(),
          metadata: {
            openAIJobId: openAIJob.id,
            openAIModel: openAIJob.model,
            trainingFileId: trainingFileId
          }
        }
      })

      return { fineTuningJob, openAIJob }
    } catch (error) {
      console.error('Error creating fine-tuning job:', error)
      throw error
    }
  }

  async getFineTuningJob(jobId: string, userId: string) {
    try {
      const job = await db.fineTuningJob.findUnique({
        where: { id: jobId, userId },
        include: {
          baseModel: true,
          dataset: true,
          fineTunedModel: true
        }
      })

      if (!job) {
        throw new Error('Fine-tuning job not found')
      }

      // If job is still running, check status with OpenAI
      if (['QUEUED', 'TRAINING'].includes(job.status)) {
        const openAIJobId = (job.metadata as any)?.openAIJobId
        if (openAIJobId) {
          const openAIJob = await openai.fineTuning.jobs.retrieve(openAIJobId)
          
          // Update job status
          await db.fineTuningJob.update({
            where: { id: jobId },
            data: {
              status: this.mapOpenAIStatus(openAIJob.status),
              trainingMetrics: {
                tokens_trained: openAIJob.trained_tokens,
                epochs_completed: openAIJob.hyperparameters?.n_epochs
              }
            }
          })

          // If job is completed, create fine-tuned model
          if (openAIJob.status === 'succeeded' && openAIJob.fine_tuned_model) {
            await this.createFineTunedModel(job, openAIJob.fine_tuned_model)
          }
        }
      }

      return job
    } catch (error) {
      console.error('Error getting fine-tuning job:', error)
      throw error
    }
  }

  async listFineTuningJobs(userId: string, limit = 10, offset = 0) {
    try {
      const jobs = await db.fineTuningJob.findMany({
        where: { userId },
        include: {
          baseModel: true,
          dataset: true,
          fineTunedModel: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      // Update status for running jobs
      for (const job of jobs) {
        if (['QUEUED', 'TRAINING'].includes(job.status)) {
          const openAIJobId = (job.metadata as any)?.openAIJobId
          if (openAIJobId) {
            try {
              const openAIJob = await openai.fineTuning.jobs.retrieve(openAIJobId)
              
              await db.fineTuningJob.update({
                where: { id: job.id },
                data: {
                  status: this.mapOpenAIStatus(openAIJob.status),
                  trainingMetrics: {
                    tokens_trained: openAIJob.trained_tokens,
                    epochs_completed: openAIJob.hyperparameters?.n_epochs
                  }
                }
              })

              if (openAIJob.status === 'succeeded' && openAIJob.fine_tuned_model) {
                await this.createFineTunedModel(job, openAIJob.fine_tuned_model)
              }
            } catch (error) {
              console.error('Error updating job status:', error)
            }
          }
        }
      }

      return jobs
    } catch (error) {
      console.error('Error listing fine-tuning jobs:', error)
      throw error
    }
  }

  async cancelFineTuningJob(jobId: string, userId: string) {
    try {
      const job = await db.fineTuningJob.findUnique({
        where: { id: jobId, userId }
      })

      if (!job) {
        throw new Error('Fine-tuning job not found')
      }

      const openAIJobId = (job.metadata as any)?.openAIJobId
      if (openAIJobId) {
        await openai.fineTuning.jobs.cancel(openAIJobId)
      }

      await db.fineTuningJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      })

      return true
    } catch (error) {
      console.error('Error cancelling fine-tuning job:', error)
      throw error
    }
  }

  async getFineTuningJobEvents(jobId: string, userId: string) {
    try {
      const job = await db.fineTuningJob.findUnique({
        where: { id: jobId, userId }
      })

      if (!job) {
        throw new Error('Fine-tuning job not found')
      }

      const openAIJobId = (job.metadata as any)?.openAIJobId
      if (!openAIJobId) {
        return []
      }

      const events = await openai.fineTuning.jobs.listEvents(openAIJobId)
      return events.data
    } catch (error) {
      console.error('Error getting fine-tuning job events:', error)
      throw error
    }
  }

  private async prepareTrainingData(dataset: any, userId: string): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Read the dataset file
      // 2. Convert it to the required format for fine-tuning
      // 3. Upload it to OpenAI
      // 4. Return the file ID

      // For now, return a mock file ID
      return `file_${dataset.id}_${Date.now()}`
    } catch (error) {
      console.error('Error preparing training data:', error)
      throw error
    }
  }

  private async createFineTunedModel(job: any, openAIModelId: string) {
    try {
      // Create fine-tuned model in database
      const fineTunedModel = await db.fineTunedModel.create({
        data: {
          name: job.name,
          description: job.description,
          modelId: openAIModelId,
          baseModelId: job.baseModelId,
          jobId: job.id,
          userId: job.userId,
          status: 'READY',
          parameters: {
            ...job.hyperparameters,
            trainingFile: (job.metadata as any)?.trainingFileId
          },
          deployedAt: new Date()
        }
      })

      // Update job status
      await db.fineTuningJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      return fineTunedModel
    } catch (error) {
      console.error('Error creating fine-tuned model:', error)
      throw error
    }
  }

  private mapOpenAIStatus(openAIStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'validating_files': 'PENDING',
      'queued': 'QUEUED',
      'running': 'TRAINING',
      'succeeded': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED'
    }

    return statusMap[openAIStatus] || 'PENDING'
  }

  private estimateTrainingTime(recordCount: number, modelId: string): number {
    // Simple estimation based on record count and model size
    const baseTime = 30 // minutes
    const recordMultiplier = recordCount / 1000
    const modelMultiplier = modelId.includes('gpt-4') ? 2 : 1
    
    return Math.ceil(baseTime * recordMultiplier * modelMultiplier)
  }

  private async checkFineTuningLimits(userId: string) {
    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      throw new Error('User subscription not found')
    }

    // Get current month's fine-tuning jobs
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const jobCount = await db.fineTuningJob.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Check limits based on subscription plan
    let jobLimit = 1 // Free plan default

    switch (subscription.plan) {
      case 'PRO':
        jobLimit = 10
        break
      case 'ENTERPRISE':
        jobLimit = 100
        break
    }

    if (jobCount >= jobLimit) {
      throw new Error('Fine-tuning job limit exceeded for this billing period')
    }
  }

  async getFineTuningCostEstimate(
    datasetId: string,
    baseModelId: string,
    config: Partial<FineTuningConfig>
  ) {
    try {
      // Get dataset
      const dataset = await db.dataset.findUnique({
        where: { id: datasetId }
      })

      if (!dataset) {
        throw new Error('Dataset not found')
      }

      // Get base model
      const baseModel = await db.baseModel.findUnique({
        where: { id: baseModelId }
      })

      if (!baseModel) {
        throw new Error('Base model not found')
      }

      // Estimate tokens based on dataset size
      const estimatedTokens = dataset.recordCount * 1000 // Rough estimate
      const epochs = config.n_epochs || 3

      // Get model pricing
      const model = await aiModelService.getModelDetails(baseModel.modelId)
      if (!model) {
        throw new Error('Model not found')
      }

      // Calculate cost (fine-tuning is typically more expensive than inference)
      const costPerToken = model.pricing.input * 2 // 2x multiplier for training
      const totalCost = (estimatedTokens * epochs * costPerToken) / 1000

      return {
        estimatedTokens,
        epochs,
        estimatedCost: totalCost,
        estimatedTime: this.estimateTrainingTime(dataset.recordCount, baseModel.modelId)
      }
    } catch (error) {
      console.error('Error estimating fine-tuning cost:', error)
      throw error
    }
  }
}

// Export singleton instance
export const fineTuningService = new FineTuningService()