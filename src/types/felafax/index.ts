export enum HardwareType {
  TPU = 'tpu',
  TRAINIUM = 'trainium',
  GPU = 'gpu',
  AMD = 'amd'
}

export enum ModelPrecision {
  BFLOAT16 = 'bfloat16',
  FLOAT32 = 'float32'
}

export interface FelafaxModel {
  name: string;
  description: string;
  hardware: HardwareType[];
  precision: ModelPrecision[];
}

export interface FineTuningRequest {
  model: string;
  dataset: string;
  config: Record<string, any>;
  hardware?: HardwareType;
  precision?: ModelPrecision;
  user_id?: string;
}

export interface TrainingJob {
  job_id: string;
  model: string;
  dataset: string;
  status: string;
  progress: number;
  hardware: HardwareType;
  precision: ModelPrecision;
  created_at: Date;
  updated_at: Date;
  config: Record<string, any>;
  logs: string[];
  metrics: Record<string, any>;
}

export interface HardwareMetrics {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage?: number;
  gpu_memory?: number;
  tpu_usage?: number;
  disk_usage: number;
}

export interface CostEstimate {
  estimated_cost: number;
  currency: string;
  duration_hours: number;
  hardware_type: HardwareType;
  cost_per_hour: number;
}

export interface FelafaxConfig {
  model: {
    name: string;
    precision: ModelPrecision;
    lora_rank: number;
    lora_alpha: number;
  };
  training: {
    learning_rate: number;
    batch_size: number;
    max_seq_length: number;
    num_steps: number | null;
    eval_interval: number;
  };
  hardware: {
    type: HardwareType;
    cores: number;
  };
}