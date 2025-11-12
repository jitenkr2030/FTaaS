import { db } from "@/lib/db"

export interface BenchmarkConfig {
  testDataset?: string
  sampleSize: number
  iterations: number
  metrics: string[]
  timeout?: number
  environment?: {
    hardware: string
    software: string
    framework: string
  }
}

export interface BenchmarkResult {
  id: string
  benchmarkType: string
  metrics: Record<string, number>
  configuration: BenchmarkConfig
  environment: any
  duration: number
  timestamp: string
}

export class BenchmarkingService {
  async createBenchmark(
    fineTunedModelId: string,
    versionId: string | undefined,
    name: string,
    benchmarkType: string,
    config: BenchmarkConfig,
    userId: string
  ) {
    // Check if user owns the model
    const model = await db.fineTunedModel.findFirst({
      where: {
        id: fineTunedModelId,
        userId,
      },
    })

    if (!model) {
      throw new Error("Model not found")
    }

    // If versionId is provided, check if it exists and belongs to the model
    if (versionId) {
      const version = await db.modelVersion.findFirst({
        where: {
          id: versionId,
          fineTunedModelId,
        },
      })

      if (!version) {
        throw new Error("Version not found")
      }
    }

    // Create benchmark record
    const benchmark = await db.performanceBenchmark.create({
      data: {
        fineTunedModelId,
        versionId,
        name,
        benchmarkType,
        configuration: config,
        environment: config.environment || {},
        metrics: {}, // Will be updated after benchmark completes
      },
    })

    // Start benchmark process asynchronously
    this.runBenchmark(benchmark.id, config).catch((error) => {
      console.error("Benchmark failed:", error)
      this.updateBenchmarkMetrics(benchmark.id, {
        error: error.message,
        status: "FAILED"
      })
    })

    return benchmark
  }

  async getBenchmarks(fineTunedModelId: string, userId: string) {
    // Check if user owns the model
    const model = await db.fineTunedModel.findFirst({
      where: {
        id: fineTunedModelId,
        userId,
      },
    })

    if (!model) {
      throw new Error("Model not found")
    }

    const benchmarks = await db.performanceBenchmark.findMany({
      where: {
        fineTunedModelId,
      },
      include: {
        version: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return benchmarks
  }

  async getBenchmark(benchmarkId: string, userId: string) {
    const benchmark = await db.performanceBenchmark.findFirst({
      where: {
        id: benchmarkId,
        fineTunedModel: {
          userId,
        },
      },
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true,
            modelId: true,
          },
        },
        version: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
      },
    })

    if (!benchmark) {
      throw new Error("Benchmark not found")
    }

    return benchmark
  }

  async deleteBenchmark(benchmarkId: string, userId: string) {
    const benchmark = await this.getBenchmark(benchmarkId, userId)
    
    await db.performanceBenchmark.delete({
      where: { id: benchmarkId },
    })

    return { success: true }
  }

  async compareBenchmarks(benchmarkId1: string, benchmarkId2: string, userId: string) {
    const [benchmark1, benchmark2] = await Promise.all([
      this.getBenchmark(benchmarkId1, userId),
      this.getBenchmark(benchmarkId2, userId),
    ])

    if (benchmark1.fineTunedModelId !== benchmark2.fineTunedModelId) {
      throw new Error("Cannot compare benchmarks from different models")
    }

    const comparison = {
      benchmark1: {
        id: benchmark1.id,
        name: benchmark1.name,
        type: benchmark1.benchmarkType,
        metrics: benchmark1.metrics,
        configuration: benchmark1.configuration,
        createdAt: benchmark1.createdAt,
        version: benchmark1.version,
      },
      benchmark2: {
        id: benchmark2.id,
        name: benchmark2.name,
        type: benchmark2.benchmarkType,
        metrics: benchmark2.metrics,
        configuration: benchmark2.configuration,
        createdAt: benchmark2.createdAt,
        version: benchmark2.version,
      },
      differences: this.calculateBenchmarkDifferences(benchmark1.metrics, benchmark2.metrics),
      improvements: this.calculateImprovements(benchmark1.metrics, benchmark2.metrics),
    }

    return comparison
  }

  async getBenchmarkHistory(fineTunedModelId: string, benchmarkType: string, userId: string) {
    const benchmarks = await db.performanceBenchmark.findMany({
      where: {
        fineTunedModelId,
        benchmarkType,
        fineTunedModel: {
          userId,
        },
      },
      include: {
        version: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return benchmarks.map(benchmark => ({
      id: benchmark.id,
      name: benchmark.name,
      metrics: benchmark.metrics,
      createdAt: benchmark.createdAt,
      version: benchmark.version,
    }))
  }

  async getLeaderboard(benchmarkType: string, limit: number = 10) {
    // This would typically aggregate across all users
    // For now, we'll return top performing benchmarks by type
    const benchmarks = await db.performanceBenchmark.findMany({
      where: {
        benchmarkType,
      },
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        version: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit * 2, // Get more to filter by performance
    })

    // Score and rank benchmarks
    const scoredBenchmarks = benchmarks.map(benchmark => {
      const score = this.calculateBenchmarkScore(benchmark.metrics, benchmarkType)
      return {
        ...benchmark,
        score,
      }
    })

    // Sort by score and return top results
    return scoredBenchmarks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private async runBenchmark(benchmarkId: string, config: BenchmarkConfig) {
    const startTime = Date.now()
    
    try {
      // Simulate benchmark execution
      const results = await this.simulateBenchmarkExecution(config)
      
      const duration = Date.now() - startTime
      
      await this.updateBenchmarkMetrics(benchmarkId, {
        ...results,
        duration,
        status: "COMPLETED"
      })
    } catch (error) {
      const duration = Date.now() - startTime
      await this.updateBenchmarkMetrics(benchmarkId, {
        error: error.message,
        duration,
        status: "FAILED"
      })
      throw error
    }
  }

  private async simulateBenchmarkExecution(config: BenchmarkConfig): Promise<Record<string, number>> {
    // Simulate benchmark execution time
    const executionTime = Math.random() * 10000 + 5000 // 5-15 seconds
    await new Promise(resolve => setTimeout(resolve, executionTime))

    // Generate realistic benchmark results based on type
    const baseResults = this.generateBaseResults(config)
    
    // Add some randomness to simulate real-world variation
    const results: Record<string, number> = {}
    for (const [key, value] of Object.entries(baseResults)) {
      results[key] = value * (0.9 + Math.random() * 0.2) // ±10% variation
    }

    return results
  }

  private generateBaseResults(config: BenchmarkConfig): Record<string, number> {
    // Generate different types of benchmark results
    const results: Record<string, number> = {}

    if (config.metrics.includes("latency")) {
      results.latency = Math.random() * 100 + 50 // 50-150ms
    }

    if (config.metrics.includes("throughput")) {
      results.throughput = Math.random() * 1000 + 500 // 500-1500 requests/minute
    }

    if (config.metrics.includes("accuracy")) {
      results.accuracy = 0.85 + Math.random() * 0.12 // 85-97%
    }

    if (config.metrics.includes("memory_usage")) {
      results.memory_usage = Math.random() * 2048 + 512 // 512-2560 MB
    }

    if (config.metrics.includes("cpu_usage")) {
      results.cpu_usage = Math.random() * 80 + 20 // 20-100%
    }

    if (config.metrics.includes("cost_per_prediction")) {
      results.cost_per_prediction = Math.random() * 0.01 + 0.001 // $0.001-$0.011
    }

    if (config.metrics.includes("error_rate")) {
      results.error_rate = Math.random() * 0.05 // 0-5%
    }

    return results
  }

  private async updateBenchmarkMetrics(benchmarkId: string, metrics: any) {
    await db.performanceBenchmark.update({
      where: { id: benchmarkId },
      data: {
        metrics,
      },
    })
  }

  private calculateBenchmarkDifferences(metrics1: any, metrics2: any): Record<string, any> {
    const differences: Record<string, any> = {}
    const allKeys = new Set([...Object.keys(metrics1 || {}), ...Object.keys(metrics2 || {})])

    for (const key of allKeys) {
      const val1 = metrics1?.[key]
      const val2 = metrics2?.[key]

      if (val1 !== undefined && val2 !== undefined) {
        differences[key] = {
          absolute: val2 - val1,
          percentage: ((val2 - val1) / val1) * 100,
        }
      }
    }

    return differences
  }

  private calculateImprovements(metrics1: any, metrics2: any): Record<string, any> {
    const improvements: Record<string, any> = {}
    const allKeys = new Set([...Object.keys(metrics1 || {}), ...Object.keys(metrics2 || {})])

    for (const key of allKeys) {
      const val1 = metrics1?.[key]
      const val2 = metrics2?.[key]

      if (val1 !== undefined && val2 !== undefined) {
        // For metrics where lower is better (latency, error_rate, etc.)
        const lowerIsBetter = ["latency", "memory_usage", "cpu_usage", "cost_per_prediction", "error_rate"].includes(key)
        const improvement = lowerIsBetter ? (val1 - val2) / val1 : (val2 - val1) / val1
        
        improvements[key] = {
          improved: improvement > 0,
          percentage: Math.abs(improvement) * 100,
        }
      }
    }

    return improvements
  }

  private calculateBenchmarkScore(metrics: any, benchmarkType: string): number {
    // Calculate a composite score based on different metrics
    let score = 0
    let weightSum = 0

    // Different weights for different benchmark types
    const weights = {
      latency: benchmarkType === "latency" ? 0.4 : 0.2,
      throughput: benchmarkType === "throughput" ? 0.4 : 0.2,
      accuracy: benchmarkType === "accuracy" ? 0.4 : 0.3,
      cost_per_prediction: benchmarkType === "cost" ? 0.4 : 0.2,
      error_rate: benchmarkType === "reliability" ? 0.4 : 0.1,
    }

    for (const [metric, weight] of Object.entries(weights)) {
      if (metrics[metric] !== undefined) {
        let normalizedValue = 0
        
        // Normalize different metrics to 0-1 scale
        switch (metric) {
          case "latency":
            normalizedValue = Math.max(0, 1 - (metrics[metric] / 1000)) // Lower is better
            break
          case "throughput":
            normalizedValue = Math.min(1, metrics[metric] / 2000) // Higher is better
            break
          case "accuracy":
            normalizedValue = metrics[metric] // Already 0-1
            break
          case "cost_per_prediction":
            normalizedValue = Math.max(0, 1 - (metrics[metric] / 0.1)) // Lower is better
            break
          case "error_rate":
            normalizedValue = Math.max(0, 1 - metrics[metric]) // Lower is better
            break
        }

        score += normalizedValue * weight
        weightSum += weight
      }
    }

    return weightSum > 0 ? score / weightSum : 0
  }
}