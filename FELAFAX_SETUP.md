# Felafax Integration Setup Guide

This guide will help you set up and configure the Felafax integration with your FTaaS platform.

## Prerequisites

Before starting, ensure you have the following:

- Python 3.8+ installed
- Node.js 18+ installed
- Redis server running
- Access to TPU/GPU hardware (optional, for actual training)

## 1. Set Up Felafax Python Service

### 1.1 Navigate to the Felafax Service Directory

```bash
cd felafax-service
```

### 1.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 1.3 Start Redis Server (if not already running)

```bash
# Start Redis server
redis-server

# Or start in background
redis-server --daemonize yes
```

### 1.4 Start the Felafax Service

```bash
# Start the service
python main.py

# Or use the startup script
./start.sh
```

The service will start on `http://localhost:8000`

### 1.5 Verify Service Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 2. Configure FTaaS Environment

### 2.1 Set Environment Variables

Create or update your `.env.local` file:

```bash
# Felafax Service Configuration
FELAFAX_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

### 2.2 Install Additional Dependencies

The FTaaS platform already includes the necessary dependencies, but if you need to add them:

```bash
npm install
```

## 3. Start the FTaaS Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 4. Verify Integration

### 4.1 Access the Felafax Dashboard

1. Navigate to `http://localhost:3000/fine-tuning`
2. Click on the "Felafax" tab
3. You should see the Felafax fine-tuning dashboard

### 4.2 Test the Integration

1. Go to the "Integration Tests" tab
2. Click "Run Tests"
3. Wait for all tests to complete
4. Check the test results

### 4.3 Verify API Endpoints

Test the following endpoints:

```bash
# Test health check
curl http://localhost:3000/api/felafax/health

# Test model listing
curl http://localhost:3000/api/felafax/models

# Test cost estimation
curl -X POST http://localhost:3000/api/felafax/cost-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-2-1b",
    "dataset": "yahma/alpaca-cleaned",
    "config": {
      "learning_rate": 0.0001,
      "batch_size": 8,
      "max_seq_length": 2048
    },
    "hardware": "tpu"
  }'
```

## 5. Hardware Configuration

### 5.1 TPU Setup (Google Cloud)

For TPU support, you'll need:

1. Google Cloud account with TPU quota
2. Google Cloud SDK installed
3. TPU VM configured

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create TPU VM
gcloud compute tpus create \
  --zone=us-central2-a \
  --version=v2-alpha \
  --accelerator-type=v3-8 \
  my-tpu
```

### 5.2 GPU Setup

For GPU support, ensure you have:

1. NVIDIA GPU with CUDA support
2. CUDA toolkit installed
3. cuDNN installed

```bash
# Install CUDA (Ubuntu)
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda

# Install cuDNN
sudo apt-get install libcudnn8 libcudnn8-dev
```

### 5.3 AMD GPU Setup

For AMD GPU support:

1. AMD GPU with ROCm support
2. ROCm installed

```bash
# Install ROCm (Ubuntu)
sudo apt-get update
sudo apt-get install rocm-hip-sdk
```

## 6. Production Deployment

### 6.1 Docker Deployment

Create a `Dockerfile` for the Felafax service:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
```

Build and run:

```bash
# Build Docker image
docker build -t felafax-service .

# Run container
docker run -p 8000:8000 --link redis:redis felafax-service
```

### 6.2 Environment Configuration for Production

Update your production environment variables:

```bash
# Production Felafax Service URL
FELAFAX_SERVICE_URL=https://your-felafax-service.com

# Production Redis
REDIS_URL=redis://your-redis-host:6379

# Security (if needed)
FELAFAX_API_KEY=your-api-key
```

### 6.3 Monitoring and Logging

Set up monitoring for the Felafax service:

1. **Health Checks**: Monitor `/health` endpoint
2. **Metrics**: Track hardware metrics from `/felafax/metrics/hardware`
3. **Logging**: Configure centralized logging
4. **Alerting**: Set up alerts for failed jobs or high resource usage

## 7. Troubleshooting

### 7.1 Common Issues

#### Service Not Starting

**Problem**: Felafax service fails to start
**Solution**: Check Redis connection and port availability

```bash
# Check if Redis is running
redis-cli ping

# Check if port 8000 is available
netstat -tulpn | grep :8000
```

#### API Connection Errors

**Problem**: FTaaS cannot connect to Felafax service
**Solution**: Verify environment variables and network connectivity

```bash
# Test connection from FTaaS
curl http://localhost:8000/health

# Check environment variables
echo $FELAFAX_SERVICE_URL
```

#### Hardware Not Detected

**Problem**: Hardware (TPU/GPU) not detected
**Solution**: Verify hardware installation and drivers

```bash
# Check GPU (NVIDIA)
nvidia-smi

# Check GPU (AMD)
rocm-smi

# Check TPU
gcloud compute tpus list
```

### 7.2 Debug Mode

Enable debug logging:

```bash
# For Felafax service
export PYTHONPATH=/app
python -m debugpy --listen 5678 main.py

# For FTaaS
DEBUG=true npm run dev
```

### 7.3 Log Files

Check log files for detailed error information:

```bash
# Felafax service logs
tail -f felafax-service.log

# FTaaS logs
tail -f dev.log
```

## 8. Performance Optimization

### 8.1 Service Configuration

Optimize the Felafax service for better performance:

```python
# In main.py, add to FastAPI app configuration
app = FastAPI(
    title="Felafax Service API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware for performance
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 8.2 Database Optimization

Optimize Redis usage:

```bash
# Configure Redis for better performance
redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

### 8.3 Hardware Optimization

Choose the right hardware for your use case:

- **TPU**: Best for large models (8B+ parameters), 30% cost savings
- **Trainium**: Good for medium to large models, high performance
- **GPU**: Flexible, good for small to medium models
- **AMD**: Cost-effective for smaller models

## 9. Security Considerations

### 9.1 API Security

Implement authentication and authorization:

```python
# Add to main.py
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Depends(api_key_header)):
    if api_key != os.getenv("FELAFAX_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key

# Protect endpoints
@app.post("/felafax/tune", dependencies=[Depends(get_api_key)])
async def start_fine_tuning(request: FineTuningRequest):
    # Your existing code
```

### 9.2 Network Security

- Use HTTPS in production
- Implement rate limiting
- Configure firewall rules
- Use VPN for private networks

### 9.3 Data Security

- Encrypt sensitive data
- Implement proper data validation
- Use secure random generation for job IDs
- Regular security audits

## 10. Scaling and Maintenance

### 10.1 Horizontal Scaling

Scale the Felafax service:

```bash
# Run multiple instances
docker run -p 8001:8000 --name felafax-1 felafax-service
docker run -p 8002:8000 --name felafax-2 felafax-service

# Use load balancer (nginx example)
upstream felafax_backend {
    server localhost:8001;
    server localhost:8002;
}

server {
    listen 80;
    location / {
        proxy_pass http://felafax_backend;
    }
}
```

### 10.2 Database Scaling

Scale Redis:

```bash
# Use Redis Cluster
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 \
  127.0.0.1:7002 127.0.0.1:7003 \
  --cluster-replicas 1
```

### 10.3 Maintenance Procedures

Regular maintenance tasks:

1. **Monitor resource usage**
2. **Update dependencies**
3. **Backup configurations**
4. **Clean up old jobs**
5. **Optimize database performance**

## Conclusion

You have successfully set up the Felafax integration with your FTaaS platform. The integration provides:

- **Advanced fine-tuning capabilities** with Felafax framework
- **Hardware optimization** for TPU, Trainium, GPU, and AMD
- **Real-time monitoring** of training jobs
- **Cost tracking** and optimization
- **Comprehensive testing** and validation

For additional support or questions, refer to the documentation or contact the development team.