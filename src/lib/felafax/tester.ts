import { felafaxService, FineTuningRequest } from '@/lib/felafax/service'
import { HardwareType, ModelPrecision } from '@/types/felafax'

export interface TestResult {
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  message: string
  duration?: number
  details?: any
}

export interface HardwareTestConfig {
  hardware: HardwareType
  precision: ModelPrecision
  model: string
  dataset: string
  config: Record<string, any>
}

export class FelafaxIntegrationTester {
  private testResults: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    this.testResults = []
    
    console.log('Starting Felafax integration tests...')
    
    // Test 1: Service Health Check
    await this.testServiceHealth()
    
    // Test 2: Model Availability
    await this.testModelAvailability()
    
    // Test 3: Hardware Configurations
    await this.testHardwareConfigurations()
    
    // Test 4: Cost Estimation
    await this.testCostEstimation()
    
    // Test 5: Job Lifecycle
    await this.testJobLifecycle()
    
    // Test 6: Hardware Metrics
    await this.testHardwareMetrics()
    
    console.log('All tests completed!')
    return this.testResults
  }

  private async testServiceHealth(): Promise<void> {
    const startTime = Date.now()
    try {
      const response = await fetch(`${process.env.FELAFAX_SERVICE_URL || 'http://localhost:8000'}/health`)
      if (response.ok) {
        this.addResult({
          testName: 'Service Health Check',
          status: 'passed',
          message: 'Felafax service is healthy',
          duration: Date.now() - startTime
        })
      } else {
        throw new Error(`Service returned status ${response.status}`)
      }
    } catch (error) {
      this.addResult({
        testName: 'Service Health Check',
        status: 'failed',
        message: `Failed to connect to Felafax service: ${error}`,
        duration: Date.now() - startTime
      })
    }
  }

  private async testModelAvailability(): Promise<void> {
    const startTime = Date.now()
    try {
      const models = await felafaxService.getAvailableModels()
      if (models.models && models.models.length > 0) {
        this.addResult({
          testName: 'Model Availability',
          status: 'passed',
          message: `Found ${models.models.length} available models`,
          duration: Date.now() - startTime,
          details: { models: models.models.map(m => m.name) }
        })
      } else {
        throw new Error('No models available')
      }
    } catch (error) {
      this.addResult({
        testName: 'Model Availability',
        status: 'failed',
        message: `Failed to fetch models: ${error}`,
        duration: Date.now() - startTime
      })
    }
  }

  private async testHardwareConfigurations(): Promise<void> {
    const testConfigs: HardwareTestConfig[] = [
      {
        hardware: HardwareType.TPU,
        precision: ModelPrecision.BFLOAT16,
        model: 'llama3-2-1b',
        dataset: 'yahma/alpaca-cleaned',
        config: {
          learning_rate: 1e-4,
          batch_size: 8,
          max_seq_length: 2048,
          num_steps: 10, // Small number for testing
          eval_interval: 5
        }
      },
      {
        hardware: HardwareType.GPU,
        precision: ModelPrecision.FLOAT32,
        model: 'llama3-2-1b',
        dataset: 'yahma/alpaca-cleaned',
        config: {
          learning_rate: 1e-4,
          batch_size: 4,
          max_seq_length: 1024,
          num_steps: 10,
          eval_interval: 5
        }
      },
      {
        hardware: HardwareType.AMD,
        precision: ModelPrecision.BFLOAT16,
        model: 'llama3-2-1b',
        dataset: 'yahma/alpaca-cleaned',
        config: {
          learning_rate: 1e-4,
          batch_size: 6,
          max_seq_length: 1536,
          num_steps: 10,
          eval_interval: 5
        }
      }
    ]

    for (const config of testConfigs) {
      const startTime = Date.now()
      try {
        // Test cost estimation for each configuration
        const request: FineTuningRequest = {
          model: config.model,
          dataset: config.dataset,
          config: config.config,
          hardware: config.hardware,
          precision: config.precision
        }

        const estimate = await felafaxService.estimateCost(request)
        
        this.addResult({
          testName: `Hardware Config - ${config.hardware}`,
          status: 'passed',
          message: `Cost estimation successful: $${estimate.estimated_cost.toFixed(2)}`,
          duration: Date.now() - startTime,
          details: {
            hardware: config.hardware,
            precision: config.precision,
            estimatedCost: estimate.estimated_cost,
            duration: estimate.duration_hours
          }
        })
      } catch (error) {
        this.addResult({
          testName: `Hardware Config - ${config.hardware}`,
          status: 'failed',
          message: `Failed to test ${config.hardware} configuration: ${error}`,
          duration: Date.now() - startTime
        })
      }
    }
  }

  private async testCostEstimation(): Promise<void> {
    const startTime = Date.now()
    try {
      const testCases = [
        {
          model: 'llama3-2-1b',
          dataset: 'yahma/alpaca-cleaned',
          hardware: HardwareType.TPU,
          expectedCostRange: [1.0, 10.0] // Expected cost range in USD
        },
        {
          model: 'llama3-2-3b',
          dataset: 'yahma/alpaca-cleaned',
          hardware: HardwareType.TPU,
          expectedCostRange: [2.0, 20.0]
        },
        {
          model: 'llama3-1-8b',
          dataset: 'yahma/alpaca-cleaned',
          hardware: HardwareType.GPU,
          expectedCostRange: [5.0, 50.0]
        }
      ]

      for (const testCase of testCases) {
        const request: FineTuningRequest = {
          model: testCase.model,
          dataset: testCase.dataset,
          config: {
            learning_rate: 1e-4,
            batch_size: 8,
            max_seq_length: 2048,
            num_steps: 100
          },
          hardware: testCase.hardware
        }

        const estimate = await felafaxService.estimateCost(request)
        
        const isWithinRange = estimate.estimated_cost >= testCase.expectedCostRange[0] && 
                             estimate.estimated_cost <= testCase.expectedCostRange[1]

        this.addResult({
          testName: `Cost Estimation - ${testCase.model} on ${testCase.hardware}`,
          status: isWithinRange ? 'passed' : 'failed',
          message: isWithinRange 
            ? `Cost $${estimate.estimated_cost.toFixed(2)} is within expected range`
            : `Cost $${estimate.estimated_cost.toFixed(2)} is outside expected range $${testCase.expectedCostRange[0]}-$${testCase.expectedCostRange[1]}`,
          details: {
            model: testCase.model,
            hardware: testCase.hardware,
            estimatedCost: estimate.estimated_cost,
            expectedRange: testCase.expectedCostRange
          }
        })
      }
    } catch (error) {
      this.addResult({
        testName: 'Cost Estimation',
        status: 'failed',
        message: `Failed to test cost estimation: ${error}`,
        duration: Date.now() - startTime
      })
    }
  }

  private async testJobLifecycle(): Promise<void> {
    const startTime = Date.now()
    let jobId: string | null = null

    try {
      // Test job creation
      const createRequest: FineTuningRequest = {
        model: 'llama3-2-1b',
        dataset: 'yahma/alpaca-cleaned',
        config: {
          learning_rate: 1e-4,
          batch_size: 8,
          max_seq_length: 2048,
          num_steps: 5 // Very small for testing
        },
        hardware: HardwareType.TPU
      }

      const createResult = await felafaxService.startFineTuning(createRequest)
      jobId = createResult.job_id

      this.addResult({
        testName: 'Job Creation',
        status: 'passed',
        message: `Job created successfully with ID: ${jobId}`,
        details: { jobId }
      })

      // Wait a bit for job to start
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Test job status retrieval
      if (jobId) {
        const jobStatus = await felafaxService.getJobStatus(jobId)
        
        this.addResult({
          testName: 'Job Status Retrieval',
          status: 'passed',
          message: `Job status: ${jobStatus.status}`,
          details: { 
            jobId, 
            status: jobStatus.status, 
            progress: jobStatus.progress 
          }
        })

        // Test job listing
        const jobs = await felafaxService.listJobs()
        const foundJob = jobs.find(job => job.job_id === jobId)
        
        this.addResult({
          testName: 'Job Listing',
          status: foundJob ? 'passed' : 'failed',
          message: foundJob ? 'Job found in job list' : 'Job not found in job list',
          details: { jobId, totalJobs: jobs.length }
        })

        // Test job cancellation
        await felafaxService.cancelJob(jobId)
        
        this.addResult({
          testName: 'Job Cancellation',
          status: 'passed',
          message: `Job ${jobId} cancelled successfully`,
          details: { jobId }
        })
      }
    } catch (error) {
      this.addResult({
        testName: 'Job Lifecycle',
        status: 'failed',
        message: `Failed to test job lifecycle: ${error}`,
        duration: Date.now() - startTime
      })

      // Try to clean up by cancelling the job if it was created
      if (jobId) {
        try {
          await felafaxService.cancelJob(jobId)
        } catch (cleanupError) {
          console.error('Failed to cleanup test job:', cleanupError)
        }
      }
    }
  }

  private async testHardwareMetrics(): Promise<void> {
    const startTime = Date.now()
    try {
      const metrics = await felafaxService.getHardwareMetrics()
      
      const validations = [
        { field: 'cpu_usage', min: 0, max: 100 },
        { field: 'memory_usage', min: 0, max: 100 },
        { field: 'disk_usage', min: 0, max: 100 }
      ]

      let allValidationsPassed = true
      const validationResults: any = {}

      for (const validation of validations) {
        const value = metrics[validation.field as keyof HardwareMetrics]
        const isValid = typeof value === 'number' && value >= validation.min && value <= validation.max
        validationResults[validation.field] = {
          value,
          isValid,
          expected: `${validation.min}-${validation.max}`
        }
        if (!isValid) allValidationsPassed = false
      }

      this.addResult({
        testName: 'Hardware Metrics',
        status: allValidationsPassed ? 'passed' : 'failed',
        message: allValidationsPassed 
          ? 'All hardware metrics are within valid ranges'
          : 'Some hardware metrics are outside valid ranges',
        duration: Date.now() - startTime,
        details: {
          metrics,
          validations: validationResults
        }
      })
    } catch (error) {
      this.addResult({
        testName: 'Hardware Metrics',
        status: 'failed',
        message: `Failed to fetch hardware metrics: ${error}`,
        duration: Date.now() - startTime
      })
    }
  }

  private addResult(result: TestResult): void {
    this.testResults.push(result)
    console.log(`[${result.status.toUpperCase()}] ${result.testName}: ${result.message}`)
  }

  getResults(): TestResult[] {
    return this.testResults
  }

  getSummary(): {
    total: number
    passed: number
    failed: number
    skipped: number
    successRate: number
  } {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.status === 'passed').length
    const failed = this.testResults.filter(r => r.status === 'failed').length
    const skipped = this.testResults.filter(r => r.status === 'skipped').length
    const successRate = total > 0 ? (passed / total) * 100 : 0

    return { total, passed, failed, skipped, successRate }
  }
}

// Export singleton instance
export const felafaxTester = new FelafaxIntegrationTester()