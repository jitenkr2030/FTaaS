from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import asyncio
import json
import subprocess
import os
import psutil
import uuid
from datetime import datetime
import redis
import logging
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Felafax Service API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection for job storage
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class HardwareType(str, Enum):
    TPU = "tpu"
    TRAINIUM = "trainium"
    GPU = "gpu"
    AMD = "amd"

class ModelPrecision(str, Enum):
    BFLOAT16 = "bfloat16"
    FLOAT32 = "float32"

class FineTuningRequest(BaseModel):
    model: str = Field(..., description="Model name (e.g., 'llama3-2-1b')")
    dataset: str = Field(..., description="Dataset name or path")
    config: Dict[str, Any] = Field(..., description="Training configuration")
    hardware: HardwareType = Field(default=HardwareType.TPU, description="Hardware type")
    precision: ModelPrecision = Field(default=ModelPrecision.BFLOAT16, description="Model precision")
    user_id: Optional[str] = Field(None, description="User ID for tracking")

class TrainingJob(BaseModel):
    job_id: str
    model: str
    dataset: str
    status: str
    progress: float
    hardware: HardwareType
    precision: ModelPrecision
    created_at: datetime
    updated_at: datetime
    config: Dict[str, Any]
    logs: List[str] = []
    metrics: Dict[str, Any] = {}

class HardwareMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    gpu_usage: Optional[float] = None
    gpu_memory: Optional[float] = None
    tpu_usage: Optional[float] = None
    disk_usage: float

class CostEstimate(BaseModel):
    estimated_cost: float
    currency: str = "USD"
    duration_hours: float
    hardware_type: HardwareType
    cost_per_hour: float

# Connection manager for WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)

    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            self.active_connections[job_id].remove(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

    async def send_message(self, message: str, job_id: str):
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Connection might be closed, remove it
                    self.active_connections[job_id].remove(connection)

manager = ConnectionManager()

# Hardware cost configuration
HARDWARE_COSTS = {
    HardwareType.TPU: 3.22,  # $3.22 per hour per TPU v3 core
    HardwareType.TRAINIUM: 4.03,  # $4.03 per hour per Trainium
    HardwareType.GPU: 1.00,  # $1.00 per hour per GPU (example)
    HardwareType.AMD: 0.80,  # $0.80 per hour per AMD GPU
}

@app.get("/")
async def root():
    return {"message": "Felafax Service API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/felafax/tune", response_model=Dict[str, str])
async def start_fine_tuning(request: FineTuningRequest, background_tasks: BackgroundTasks):
    """Start a fine-tuning job using Felafax"""
    try:
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        
        # Create job record
        job = TrainingJob(
            job_id=job_id,
            model=request.model,
            dataset=request.dataset,
            status="pending",
            progress=0.0,
            hardware=request.hardware,
            precision=request.precision,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            config=request.config
        )
        
        # Store job in Redis
        redis_client.set(f"job:{job_id}", json.dumps(job.dict(), default=str))
        
        # Start background task
        background_tasks.add_task(run_felafax_training, job_id, request)
        
        logger.info(f"Started fine-tuning job {job_id} for model {request.model}")
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": "Fine-tuning job initiated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error starting fine-tuning job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/felafax/jobs/{job_id}", response_model=TrainingJob)
async def get_job_status(job_id: str):
    """Get the status of a specific training job"""
    try:
        job_data = redis_client.get(f"job:{job_id}")
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_dict = json.loads(job_data)
        job_dict['created_at'] = datetime.fromisoformat(job_dict['created_at'])
        job_dict['updated_at'] = datetime.fromisoformat(job_dict['updated_at'])
        
        return TrainingJob(**job_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/felafax/jobs", response_model=List[TrainingJob])
async def list_jobs(user_id: Optional[str] = None, limit: int = 50):
    """List all training jobs, optionally filtered by user"""
    try:
        jobs = []
        job_keys = redis_client.keys("job:*")
        
        for key in job_keys[:limit]:
            job_data = redis_client.get(key)
            if job_data:
                job_dict = json.loads(job_data)
                job_dict['created_at'] = datetime.fromisoformat(job_dict['created_at'])
                job_dict['updated_at'] = datetime.fromisoformat(job_dict['updated_at'])
                
                job = TrainingJob(**job_dict)
                
                # Filter by user_id if provided
                if user_id is None or job.config.get('user_id') == user_id:
                    jobs.append(job)
        
        return jobs
        
    except Exception as e:
        logger.error(f"Error listing jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/felafax/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running training job"""
    try:
        job_data = redis_client.get(f"job:{job_id}")
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_dict = json.loads(job_data)
        job_dict['status'] = "cancelled"
        job_dict['updated_at'] = datetime.now().isoformat()
        
        redis_client.set(f"job:{job_id}", json.dumps(job_dict))
        
        # Here you would implement actual process termination
        # For now, just mark as cancelled
        
        return {"message": f"Job {job_id} cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/felafax/metrics/hardware", response_model=HardwareMetrics)
async def get_hardware_metrics():
    """Get current hardware utilization metrics"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        metrics = HardwareMetrics(
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent
        )
        
        # Add GPU metrics if available
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            if gpus:
                metrics.gpu_usage = gpus[0].load * 100
                metrics.gpu_memory = gpus[0].memoryUtil * 100
        except ImportError:
            pass
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error getting hardware metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/felafax/cost-estimate", response_model=CostEstimate)
async def estimate_cost(request: FineTuningRequest):
    """Estimate the cost of a fine-tuning job"""
    try:
        # Estimate duration based on model size and dataset
        # This is a simplified calculation - in practice, you'd use more sophisticated estimates
        model_size_factor = {
            'llama3-2-1b': 1.0,
            'llama3-2-3b': 2.5,
            'llama3-1-8b': 6.0,
            'llama3-1-70b': 50.0,
            'llama3-1-405b': 300.0
        }
        
        base_hours = model_size_factor.get(request.model, 1.0)
        batch_size = request.config.get('batch_size', 8)
        estimated_hours = base_hours * (8 / batch_size)  # Adjust for batch size
        
        cost_per_hour = HARDWARE_COSTS[request.hardware]
        estimated_cost = estimated_hours * cost_per_hour
        
        return CostEstimate(
            estimated_cost=estimated_cost,
            duration_hours=estimated_hours,
            hardware_type=request.hardware,
            cost_per_hour=cost_per_hour
        )
        
    except Exception as e:
        logger.error(f"Error estimating cost: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/felafax/models")
async def list_available_models():
    """List available models for fine-tuning"""
    return {
        "models": [
            {
                "name": "llama3-2-1b",
                "description": "LLaMA 3.2 1B parameters",
                "hardware": ["tpu", "trainium", "gpu", "amd"],
                "precision": ["bfloat16", "float32"]
            },
            {
                "name": "llama3-2-3b", 
                "description": "LLaMA 3.2 3B parameters",
                "hardware": ["tpu", "trainium", "gpu", "amd"],
                "precision": ["bfloat16", "float32"]
            },
            {
                "name": "llama3-1-8b",
                "description": "LLaMA 3.1 8B parameters", 
                "hardware": ["tpu", "trainium", "gpu"],
                "precision": ["bfloat16", "float32"]
            },
            {
                "name": "llama3-1-70b",
                "description": "LLaMA 3.1 70B parameters",
                "hardware": ["tpu", "trainium"],
                "precision": ["bfloat16"]
            },
            {
                "name": "llama3-1-405b",
                "description": "LLaMA 3.1 405B parameters",
                "hardware": ["tpu", "amd"],
                "precision": ["bfloat16"]
            }
        ]
    }

@app.websocket("/felafax/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for real-time job updates"""
    await manager.connect(websocket, job_id)
    try:
        while True:
            # Send periodic updates
            job_data = redis_client.get(f"job:{job_id}")
            if job_data:
                await manager.send_message(job_data, job_id)
            await asyncio.sleep(5)  # Update every 5 seconds
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)

async def run_felafax_training(job_id: str, request: FineTuningRequest):
    """Background task to run Felafax training"""
    try:
        # Update job status to running
        job_data = redis_client.get(f"job:{job_id}")
        if job_data:
            job_dict = json.loads(job_data)
            job_dict['status'] = 'running'
            job_dict['updated_at'] = datetime.now().isoformat()
            redis_client.set(f"job:{job_id}", json.dumps(job_dict))
        
        # Create config file
        config_path = f"/tmp/{job_id}_config.yml"
        with open(config_path, 'w') as f:
            import yaml
            yaml.dump(request.config, f)
        
        # Build felafax command
        cmd = [
            'python', '-m', 'felafax.trainer_engine.trainer',
            '--model', request.model,
            '--dataset', request.dataset,
            '--config', config_path,
            '--precision', request.precision.value,
            '--hardware', request.hardware.value
        ]
        
        # Run the training process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd='/home/z/my-project/felafax'
        )
        
        # Monitor the process and update job status
        logs = []
        for line in iter(process.stdout.readline, ''):
            if line:
                logs.append(line.strip())
                
                # Update job with new logs
                job_data = redis_client.get(f"job:{job_id}")
                if job_data:
                    job_dict = json.loads(job_data)
                    job_dict['logs'] = logs[-100:]  # Keep last 100 lines
                    job_dict['updated_at'] = datetime.now().isoformat()
                    
                    # Parse progress from logs (simplified)
                    if 'step' in line.lower() and 'loss' in line.lower():
                        try:
                            # Extract step number for progress calculation
                            import re
                            step_match = re.search(r'step\s*(\d+)', line.lower())
                            if step_match:
                                step = int(step_match.group(1))
                                max_steps = request.config.get('num_steps', 1000)
                                progress = min((step / max_steps) * 100, 100)
                                job_dict['progress'] = progress
                        except:
                            pass
                    
                    redis_client.set(f"job:{job_id}", json.dumps(job_dict))
        
        # Wait for process to complete
        return_code = process.wait()
        
        # Update final job status
        job_data = redis_client.get(f"job:{job_id}")
        if job_data:
            job_dict = json.loads(job_data)
            job_dict['status'] = 'completed' if return_code == 0 else 'failed'
            job_dict['progress'] = 100.0
            job_dict['updated_at'] = datetime.now().isoformat()
            redis_client.set(f"job:{job_id}", json.dumps(job_dict))
        
        logger.info(f"Training job {job_id} completed with return code {return_code}")
        
    except Exception as e:
        logger.error(f"Error in training job {job_id}: {str(e)}")
        
        # Update job status to failed
        job_data = redis_client.get(f"job:{job_id}")
        if job_data:
            job_dict = json.loads(job_data)
            job_dict['status'] = 'failed'
            job_dict['updated_at'] = datetime.now().isoformat()
            redis_client.set(f"job:{job_id}", json.dumps(job_dict))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)