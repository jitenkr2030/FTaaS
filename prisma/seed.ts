import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data (optional - comment out if you want to preserve existing data)
  // await prisma.apiUsage.deleteMany()
  // await prisma.evaluation.deleteMany()
  // await prisma.fineTunedModel.deleteMany()
  // await prisma.fineTuningJob.deleteMany()
  // await prisma.dataset.deleteMany()
  // await prisma.subscription.deleteMany()
  // await prisma.baseModel.deleteMany()
  // await prisma.user.deleteMany()

  // Create Base Models
  const baseModels = await Promise.all([
    prisma.baseModel.create({
      data: {
        name: 'GPT-4',
        description: 'OpenAI\'s most capable model, great for complex tasks',
        provider: 'openai',
        modelId: 'gpt-4',
        parameters: {
          contextLength: 8192,
          maxTokens: 8192,
          trainingData: 'Sep 2021',
          capabilities: ['text-generation', 'code-generation', 'reasoning']
        },
        isActive: true
      }
    }),
    prisma.baseModel.create({
      data: {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and capable model for most tasks',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        parameters: {
          contextLength: 4096,
          maxTokens: 4096,
          trainingData: 'Sep 2021',
          capabilities: ['text-generation', 'code-generation']
        },
        isActive: true
      }
    }),
    prisma.baseModel.create({
      data: {
        name: 'Claude 3 Opus',
        description: 'Anthropic\'s most intelligent model',
        provider: 'anthropic',
        modelId: 'claude-3-opus',
        parameters: {
          contextLength: 200000,
          maxTokens: 4096,
          trainingData: 'Aug 2023',
          capabilities: ['text-generation', 'reasoning', 'analysis']
        },
        isActive: true
      }
    }),
    prisma.baseModel.create({
      data: {
        name: 'Llama 3 70B',
        description: 'Meta\'s open-source large language model',
        provider: 'meta',
        modelId: 'llama-3-70b',
        parameters: {
          contextLength: 8192,
          maxTokens: 4096,
          trainingData: 'Mar 2024',
          capabilities: ['text-generation', 'code-generation', 'reasoning']
        },
        isActive: true
      }
    }),
    prisma.baseModel.create({
      data: {
        name: 'Mistral 7B',
        description: 'Efficient open-source model',
        provider: 'mistral',
        modelId: 'mistral-7b',
        parameters: {
          contextLength: 8192,
          maxTokens: 4096,
          trainingData: 'Sep 2023',
          capabilities: ['text-generation', 'code-generation']
        },
        isActive: true
      }
    })
  ])

  console.log(`✅ Created ${baseModels.length} base models`)

  // Create Users
  const hashedPassword = await hash('password123', 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        subscriptions: {
          create: {
            plan: 'PRO',
            status: 'ACTIVE',
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        subscriptions: {
          create: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE'
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Regular User',
        subscriptions: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE'
          }
        }
      }
    })
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create Datasets for each user
  const datasets = await Promise.all([
    // Demo user datasets
    prisma.dataset.create({
      data: {
        name: 'Customer Support Chat Logs',
        description: 'Anonymized customer support conversations for training',
        fileName: 'support_chat_logs.jsonl',
        fileSize: 2048000,
        format: 'jsonl',
        recordCount: 5000,
        status: 'READY',
        filePath: '/datasets/support_chat_logs.jsonl',
        metadata: {
          language: 'en',
          averageTokens: 150,
          topics: ['billing', 'technical', 'general']
        },
        userId: users[0].id
      }
    }),
    prisma.dataset.create({
      data: {
        name: 'Code Review Dataset',
        description: 'Code snippets and review comments for fine-tuning',
        fileName: 'code_reviews.jsonl',
        fileSize: 1024000,
        format: 'jsonl',
        recordCount: 2500,
        status: 'READY',
        filePath: '/datasets/code_reviews.jsonl',
        metadata: {
          languages: ['javascript', 'python', 'java'],
          averageTokens: 200
        },
        userId: users[0].id
      }
    }),
    // Admin user datasets
    prisma.dataset.create({
      data: {
        name: 'Legal Documents Corpus',
        description: 'Legal document samples for legal AI training',
        fileName: 'legal_docs.jsonl',
        fileSize: 5120000,
        format: 'jsonl',
        recordCount: 10000,
        status: 'READY',
        filePath: '/datasets/legal_docs.jsonl',
        metadata: {
          documentTypes: ['contracts', 'briefs', 'motions'],
          averageTokens: 500
        },
        userId: users[1].id
      }
    }),
    // Regular user datasets
    prisma.dataset.create({
      data: {
        name: 'Product Descriptions',
        description: 'E-commerce product descriptions for marketing AI',
        fileName: 'product_descriptions.jsonl',
        fileSize: 512000,
        format: 'jsonl',
        recordCount: 1000,
        status: 'READY',
        filePath: '/datasets/product_descriptions.jsonl',
        metadata: {
          categories: ['electronics', 'clothing', 'home'],
          averageTokens: 100
        },
        userId: users[2].id
      }
    })
  ])

  console.log(`✅ Created ${datasets.length} datasets`)

  // Create Fine-tuning Jobs
  const fineTuningJobs = await Promise.all([
    prisma.fineTuningJob.create({
      data: {
        name: 'Customer Support Assistant',
        description: 'Fine-tune GPT-4 for customer support tasks',
        status: 'COMPLETED',
        baseModelId: baseModels[0].id,
        datasetId: datasets[0].id,
        userId: users[0].id,
        hyperparameters: {
          learningRate: 0.0001,
          batchSize: 8,
          epochs: 3,
          warmupSteps: 100
        },
        trainingMetrics: {
          trainLoss: 0.45,
          valLoss: 0.52,
          accuracy: 0.89
        },
        cost: 45.50,
        estimatedTime: 120,
        actualTime: 115,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    }),
    prisma.fineTuningJob.create({
      data: {
        name: 'Code Review Assistant',
        description: 'Fine-tune Claude 3 for code review tasks',
        status: 'TRAINING',
        baseModelId: baseModels[2].id,
        datasetId: datasets[1].id,
        userId: users[0].id,
        hyperparameters: {
          learningRate: 0.0002,
          batchSize: 4,
          epochs: 2,
          warmupSteps: 50
        },
        trainingMetrics: {
          trainLoss: 0.38,
          valLoss: 0.41,
          accuracy: 0.92,
          progress: 0.67
        },
        cost: 32.00,
        estimatedTime: 90,
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    }),
    prisma.fineTuningJob.create({
      data: {
        name: 'Legal Document Analyzer',
        description: 'Fine-tune Llama 3 for legal document analysis',
        status: 'QUEUED',
        baseModelId: baseModels[3].id,
        datasetId: datasets[2].id,
        userId: users[1].id,
        hyperparameters: {
          learningRate: 0.0001,
          batchSize: 16,
          epochs: 4,
          warmupSteps: 200
        },
        estimatedTime: 180,
        cost: 85.00
      }
    })
  ])

  console.log(`✅ Created ${fineTuningJobs.length} fine-tuning jobs`)

  // Create Fine-tuned Models
  const fineTunedModels = await Promise.all([
    prisma.fineTunedModel.create({
      data: {
        name: 'Support-GPT-4-v1',
        description: 'GPT-4 fine-tuned for customer support',
        modelId: 'ft:gpt-4:my-org:customer-support:7q8r9s0t',
        baseModelId: baseModels[0].id,
        jobId: fineTuningJobs[0].id,
        status: 'DEPLOYED',
        endpoint: 'https://api.openai.com/v1/fine_tuned_models/ft:gpt-4:my-org:customer-support:7q8r9s0t',
        parameters: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9
        },
        metrics: {
          bleuScore: 0.85,
          rougeScore: 0.78,
          perplexity: 12.5
        },
        userId: users[0].id,
        deployedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    }),
    prisma.fineTunedModel.create({
      data: {
        name: 'Code-Claude-3-v1',
        description: 'Claude 3 fine-tuned for code review',
        modelId: 'ft:claude-3-opus:my-org:code-review:1a2b3c4d',
        baseModelId: baseModels[2].id,
        jobId: fineTuningJobs[1].id,
        status: 'TRAINING',
        parameters: {
          temperature: 0.3,
          maxTokens: 2000,
          topP: 0.95
        },
        userId: users[0].id
      }
    })
  ])

  console.log(`✅ Created ${fineTunedModels.length} fine-tuned models`)

  // Create Evaluations
  const evaluations = await Promise.all([
    prisma.evaluation.create({
      data: {
        name: 'Support Model Evaluation',
        fineTunedModelId: fineTunedModels[0].id,
        baseModelId: baseModels[0].id,
        metrics: {
          bleuScore: 0.85,
          rougeScore: 0.78,
          perplexity: 12.5,
          accuracy: 0.89,
          f1Score: 0.87
        },
        testResults: {
          precision: 0.88,
          recall: 0.86,
          responseTime: 1200,
          throughput: 45
        },
        userId: users[0].id,
        jobId: fineTuningJobs[0].id
      }
    }),
    prisma.evaluation.create({
      data: {
        name: 'Code Model Benchmark',
        fineTunedModelId: fineTunedModels[1].id,
        baseModelId: baseModels[2].id,
        metrics: {
          bleuScore: 0.92,
          rougeScore: 0.88,
          perplexity: 8.3,
          accuracy: 0.94
        },
        userId: users[0].id,
        jobId: fineTuningJobs[1].id
      }
    })
  ])

  console.log(`✅ Created ${evaluations.length} evaluations`)

  // Create API Usage records
  const apiUsage = await Promise.all([
    prisma.apiUsage.create({
      data: {
        userId: users[0].id,
        fineTunedModelId: fineTunedModels[0].id,
        endpoint: '/v1/chat/completions',
        requestCount: 1250,
        tokenCount: 256000,
        cost: 12.80,
        date: new Date()
      }
    }),
    prisma.apiUsage.create({
      data: {
        userId: users[0].id,
        fineTunedModelId: fineTunedModels[1].id,
        endpoint: '/v1/chat/completions',
        requestCount: 850,
        tokenCount: 180000,
        cost: 9.20,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }),
    prisma.apiUsage.create({
      data: {
        userId: users[1].id,
        endpoint: '/v1/models',
        requestCount: 150,
        tokenCount: 0,
        cost: 0.50,
        date: new Date()
      }
    })
  ])

  console.log(`✅ Created ${apiUsage.length} API usage records`)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })