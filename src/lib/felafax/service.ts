import {
  FineTuningRequest,
  TrainingJob,
  HardwareMetrics,
  CostEstimate,
  FelafaxModel,
  FelafaxConfig,
  HardwareType,
  ModelPrecision
} from '@/types/felafax';

const FELAFAX_SERVICE_URL = process.env.FELAFAX_SERVICE_URL || 'http://localhost:8000';

export class FelafaxService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || FELAFAX_SERVICE_URL;
  }

  async startFineTuning(request: FineTuningRequest): Promise<{ job_id: string; status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/felafax/tune`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start fine-tuning');
    }

    return response.json();
  }

  async getJobStatus(jobId: string): Promise<TrainingJob> {
    const response = await fetch(`${this.baseUrl}/felafax/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch job status');
    }

    const data = await response.json();
    // Convert date strings back to Date objects
    data.created_at = new Date(data.created_at);
    data.updated_at = new Date(data.updated_at);
    
    return data;
  }

  async listJobs(userId?: string, limit: number = 50): Promise<TrainingJob[]> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/felafax/jobs?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch jobs');
    }

    const data = await response.json();
    // Convert date strings back to Date objects
    return data.map((job: any) => ({
      ...job,
      created_at: new Date(job.created_at),
      updated_at: new Date(job.updated_at),
    }));
  }

  async cancelJob(jobId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/felafax/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to cancel job');
    }

    return response.json();
  }

  async getHardwareMetrics(): Promise<HardwareMetrics> {
    const response = await fetch(`${this.baseUrl}/felafax/metrics/hardware`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch hardware metrics');
    }

    return response.json();
  }

  async estimateCost(request: FineTuningRequest): Promise<CostEstimate> {
    const response = await fetch(`${this.baseUrl}/felafax/cost-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to estimate cost');
    }

    return response.json();
  }

  async getAvailableModels(): Promise<{ models: FelafaxModel[] }> {
    const response = await fetch(`${this.baseUrl}/felafax/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch available models');
    }

    return response.json();
  }

  // WebSocket connection for real-time updates
  createWebSocketConnection(jobId: string): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/felafax/ws/${jobId}`);
  }

  // Utility method to create default configuration
  createDefaultConfig(modelName: string): FelafaxConfig {
    return {
      model: {
        name: modelName,
        precision: ModelPrecision.BFLOAT16,
        lora_rank: 8,
        lora_alpha: 16,
      },
      training: {
        learning_rate: 1e-4,
        batch_size: 8,
        max_seq_length: 2048,
        num_steps: null,
        eval_interval: 100,
      },
      hardware: {
        type: HardwareType.TPU,
        cores: 8,
      },
    };
  }

  // Convert FelafaxConfig to training config format
  configToTrainingConfig(config: FelafaxConfig): Record<string, any> {
    return {
      learning_rate: config.training.learning_rate,
      batch_size: config.training.batch_size,
      max_seq_length: config.training.max_seq_length,
      num_steps: config.training.num_steps,
      eval_interval: config.training.eval_interval,
      lora_rank: config.model.lora_rank,
      lora_alpha: config.model.lora_alpha,
      precision: config.model.precision,
      hardware_cores: config.hardware.cores,
    };
  }
}

// Singleton instance
export const felafaxService = new FelafaxService();