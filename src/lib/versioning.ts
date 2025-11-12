import { db } from "@/lib/db"
import { VersionStatus } from "@prisma/client"

export interface CreateVersionParams {
  fineTunedModelId: string
  version: string
  name: string
  description?: string
  checkpoint?: string
  parameters: any
  userId: string
}

export interface UpdateVersionParams {
  versionId: string
  status?: VersionStatus
  name?: string
  description?: string
  checkpoint?: string
  parameters?: any
  isActive?: boolean
  isProduction?: boolean
}

export class VersioningService {
  async createVersion(params: CreateVersionParams) {
    const { fineTunedModelId, version, name, description, checkpoint, parameters, userId } = params

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

    // Check if version already exists
    const existingVersion = await db.modelVersion.findFirst({
      where: {
        fineTunedModelId,
        version,
      },
    })

    if (existingVersion) {
      throw new Error("Version already exists")
    }

    // Create the version
    const newVersion = await db.modelVersion.create({
      data: {
        fineTunedModelId,
        version,
        name,
        description,
        checkpoint,
        parameters,
        status: VersionStatus.DRAFT,
      },
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true,
            modelId: true,
            status: true,
          },
        },
      },
    })

    return newVersion
  }

  async getVersions(fineTunedModelId: string, userId: string) {
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

    const versions = await db.modelVersion.findMany({
      where: {
        fineTunedModelId,
      },
      include: {
        benchmarks: {
          select: {
            id: true,
            name: true,
            benchmarkType: true,
            metrics: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return versions
  }

  async getVersion(versionId: string, userId: string) {
    const version = await db.modelVersion.findFirst({
      where: {
        id: versionId,
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
            status: true,
          },
        },
        benchmarks: {
          select: {
            id: true,
            name: true,
            benchmarkType: true,
            metrics: true,
            createdAt: true,
          },
        },
      },
    })

    if (!version) {
      throw new Error("Version not found")
    }

    return version
  }

  async updateVersion(params: UpdateVersionParams & { userId: string }) {
    const { versionId, userId, ...updates } = params

    // Check if user owns the version
    const version = await db.modelVersion.findFirst({
      where: {
        id: versionId,
        fineTunedModel: {
          userId,
        },
      },
    })

    if (!version) {
      throw new Error("Version not found")
    }

    // Handle production version logic
    if (updates.isProduction === true) {
      // Deactivate other production versions
      await db.modelVersion.updateMany({
        where: {
          fineTunedModelId: version.fineTunedModelId,
          isProduction: true,
          id: { not: versionId },
        },
        data: {
          isProduction: false,
        },
      })
    }

    // Handle active version logic
    if (updates.isActive === true) {
      // Deactivate other active versions
      await db.modelVersion.updateMany({
        where: {
          fineTunedModelId: version.fineTunedModelId,
          isActive: true,
          id: { not: versionId },
        },
        data: {
          isActive: false,
        },
      })
    }

    const updatedVersion = await db.modelVersion.update({
      where: { id: versionId },
      data: {
        ...updates,
        ...(updates.status === VersionStatus.PRODUCTION && {
          releasedAt: new Date(),
        }),
      },
      include: {
        fineTunedModel: {
          select: {
            id: true,
            name: true,
            modelId: true,
            status: true,
          },
        },
        benchmarks: {
          select: {
            id: true,
            name: true,
            benchmarkType: true,
            metrics: true,
            createdAt: true,
          },
        },
      },
    })

    return updatedVersion
  }

  async deleteVersion(versionId: string, userId: string) {
    // Check if user owns the version
    const version = await db.modelVersion.findFirst({
      where: {
        id: versionId,
        fineTunedModel: {
          userId,
        },
      },
    })

    if (!version) {
      throw new Error("Version not found")
    }

    // Don't allow deletion of production versions
    if (version.isProduction) {
      throw new Error("Cannot delete production version")
    }

    await db.modelVersion.delete({
      where: { id: versionId },
    })

    return { success: true }
  }

  async promoteToProduction(versionId: string, userId: string) {
    return await this.updateVersion({
      versionId,
      userId,
      status: VersionStatus.PRODUCTION,
      isProduction: true,
      isActive: true,
    })
  }

  async promoteToStaging(versionId: string, userId: string) {
    return await this.updateVersion({
      versionId,
      userId,
      status: VersionStatus.STAGING,
      isActive: true,
    })
  }

  async demoteVersion(versionId: string, userId: string) {
    return await this.updateVersion({
      versionId,
      userId,
      status: VersionStatus.DRAFT,
      isActive: false,
      isProduction: false,
    })
  }

  async getVersionHistory(fineTunedModelId: string, userId: string) {
    const versions = await this.getVersions(fineTunedModelId, userId)
    
    return versions.map(version => ({
      id: version.id,
      version: version.version,
      name: version.name,
      description: version.description,
      status: version.status,
      isActive: version.isActive,
      isProduction: version.isProduction,
      createdAt: version.createdAt,
      releasedAt: version.releasedAt,
      metrics: version.metrics,
      benchmarks: version.benchmarks,
    }))
  }

  async compareVersions(versionId1: string, versionId2: string, userId: string) {
    const [version1, version2] = await Promise.all([
      this.getVersion(versionId1, userId),
      this.getVersion(versionId2, userId),
    ])

    if (version1.fineTunedModelId !== version2.fineTunedModelId) {
      throw new Error("Cannot compare versions from different models")
    }

    const comparison = {
      version1: {
        id: version1.id,
        version: version1.version,
        name: version1.name,
        status: version1.status,
        parameters: version1.parameters,
        metrics: version1.metrics,
        benchmarks: version1.benchmarks,
        createdAt: version1.createdAt,
      },
      version2: {
        id: version2.id,
        version: version2.version,
        name: version2.name,
        status: version2.status,
        parameters: version2.parameters,
        metrics: version2.metrics,
        benchmarks: version2.benchmarks,
        createdAt: version2.createdAt,
      },
      differences: this.calculateVersionDifferences(version1, version2),
    }

    return comparison
  }

  private calculateVersionDifferences(version1: any, version2: any) {
    const differences: any = {}

    // Compare parameters
    const paramDiffs = this.compareObjects(version1.parameters, version2.parameters)
    if (Object.keys(paramDiffs).length > 0) {
      differences.parameters = paramDiffs
    }

    // Compare metrics
    if (version1.metrics && version2.metrics) {
      const metricDiffs = this.compareObjects(version1.metrics, version2.metrics)
      if (Object.keys(metricDiffs).length > 0) {
        differences.metrics = metricDiffs
      }
    }

    // Compare benchmark results
    if (version1.benchmarks.length > 0 || version2.benchmarks.length > 0) {
      const benchmarkDiffs = this.compareBenchmarks(version1.benchmarks, version2.benchmarks)
      if (Object.keys(benchmarkDiffs).length > 0) {
        differences.benchmarks = benchmarkDiffs
      }
    }

    return differences
  }

  private compareObjects(obj1: any, obj2: any): any {
    const differences: any = {}
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])

    for (const key of allKeys) {
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences[key] = {
          from: val1,
          to: val2,
        }
      }
    }

    return differences
  }

  private compareBenchmarks(benchmarks1: any[], benchmarks2: any[]): any {
    const differences: any = {}
    
    // Group benchmarks by type
    const benchmarks1ByType = benchmarks1.reduce((acc, b) => {
      acc[b.benchmarkType] = b
      return acc
    }, {} as any)

    const benchmarks2ByType = benchmarks2.reduce((acc, b) => {
      acc[b.benchmarkType] = b
      return acc
    }, {} as any)

    const allTypes = new Set([
      ...Object.keys(benchmarks1ByType),
      ...Object.keys(benchmarks2ByType)
    ])

    for (const type of allTypes) {
      const bench1 = benchmarks1ByType[type]
      const bench2 = benchmarks2ByType[type]

      if (!bench1 || !bench2 || JSON.stringify(bench1.metrics) !== JSON.stringify(bench2.metrics)) {
        differences[type] = {
          from: bench1?.metrics || null,
          to: bench2?.metrics || null,
        }
      }
    }

    return differences
  }

  async getNextVersion(fineTunedModelId: string, userId: string): Promise<string> {
    const versions = await this.getVersions(fineTunedModelId, userId)
    
    if (versions.length === 0) {
      return "1.0.0"
    }

    // Find the highest version and increment it
    const latestVersion = versions.reduce((latest, version) => {
      return this.compareVersions(version.version, latest.version) > 0 ? version : latest
    }, versions[0])

    return this.incrementVersion(latestVersion.version)
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0

      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }

    return 0
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number)
    parts[2]++ // Increment patch version
    
    return parts.join('.')
  }
}