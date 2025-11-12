# FTaaS - Fine-Tuning as a Service Platform

A comprehensive, production-ready Fine-Tuning as a Service platform built with Next.js 15, featuring advanced Felafax framework integration for optimized AI model training across multiple hardware types.

## 🚀 Features

### Core Platform
- **🎯 Modern Tech Stack**: Next.js 15, TypeScript 5, Tailwind CSS 4, shadcn/ui
- **🔐 Authentication**: NextAuth.js with secure user management
- **🗄️ Database**: Prisma ORM with SQLite for development
- **📊 Analytics**: Comprehensive monitoring and cost tracking
- **💳 Billing**: Stripe integration with subscription management

### Felafax Integration
- **⚡ Advanced Fine-Tuning**: Felafax framework for optimized model training
- **🖥️ Multi-Hardware Support**: TPU, Trainium, GPU, and AMD GPU optimization
- **💰 Cost Optimization**: Up to 30% cost savings with TPU training
- **📈 Real-time Monitoring**: Live training progress and hardware metrics
- **🔧 Comprehensive Testing**: Integration testing across all hardware configurations

### Training Capabilities
- **🤖 Model Management**: Browse, deploy, and monitor AI models
- **📊 Dataset Handling**: Upload, validate, and process training datasets
- **⚙️ Advanced Configuration**: LoRA, precision settings, batch optimization
- **📉 Performance Tracking**: Training metrics, cost analysis, and ROI calculations
- **🔄 Job Management**: Queue, monitor, and control training jobs

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Radix UI
- **State Management**: Zustand + TanStack Query
- **Charts**: Recharts with custom visualizations
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js v4
- **Real-time**: Socket.IO for live updates
- **Queue**: Bull Queue for job processing
- **File Upload**: Multer with cloud storage

### Felafax Service
- **Framework**: FastAPI (Python)
- **Hardware**: Multi-hardware optimization (TPU, Trainium, GPU, AMD)
- **Real-time**: WebSocket support for live updates
- **Storage**: Redis for job management
- **Monitoring**: Hardware metrics and performance tracking

### Integration & DevOps
- **Payment**: Stripe for billing and subscriptions
- **Email**: Ready for email service integration
- **Monitoring**: Comprehensive logging and error tracking
- **Testing**: ESLint, TypeScript validation
- **Deployment**: Docker-ready with production configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Redis server
- OpenAI API key (for traditional fine-tuning)
- Stripe API keys (for billing)

### Installation

1. **Clone and setup the repository**
```bash
git clone <repository-url>
cd ftaaS-platform
npm install
```

2. **Configure environment variables**
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys and configuration
```

3. **Set up the Felafax Python service**
```bash
cd felafax-service
pip install -r requirements.txt
python main.py  # Starts on http://localhost:8000
```

4. **Start Redis server**
```bash
redis-server --daemonize yes
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ftaaS-platform/
├── felafax-service/              # Python FastAPI service for Felafax
│   ├── main.py                  # Main service application
│   ├── requirements.txt         # Python dependencies
│   └── start.sh                 # Service startup script
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── felafax/        # Felafax integration APIs
│   │   │   ├── fine-tuning/    # Traditional fine-tuning APIs
│   │   │   ├── models/         # Model management APIs
│   │   │   ├── monitoring/     # Monitoring APIs
│   │   │   └── billing/        # Billing and payment APIs
│   │   ├── auth/               # Authentication pages
│   │   ├── fine-tuning/        # Fine-tuning dashboard
│   │   ├── models/             # Model management
│   │   ├── monitoring/         # System monitoring
│   │   └── billing/            # Billing and subscriptions
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── fine-tuning/        # Fine-tuning components
│   │   ├── monitoring/         # Monitoring dashboards
│   │   ├── models/             # Model management UI
│   │   └── dashboard/          # Dashboard components
│   ├── lib/                    # Utility libraries
│   │   ├── felafax/           # Felafax service client
│   │   ├── auth/              # Authentication utilities
│   │   ├── db/                # Database connection
│   │   ├── fine-tuning/       # Fine-tuning service
│   │   ├── stripe/            # Stripe integration
│   │   └── utils/             # General utilities
│   ├── types/                  # TypeScript type definitions
│   │   └── felafax/           # Felafax-specific types
│   └── hooks/                 # Custom React hooks
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets
├── FELAFAX_SETUP.md           # Felafax integration guide
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following configuration:

```env
# OpenAI API Key (required for traditional fine-tuning)
OPENAI_API_KEY=your-openai-api-key-here

# Stripe API Keys (required for billing)
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here

# Felafax Service Configuration
FELAFAX_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Felafax Service Setup

The Felafax service provides advanced fine-tuning capabilities with hardware optimization:

1. **Install Python dependencies**
```bash
cd felafax-service
pip install -r requirements.txt
```

2. **Start the service**
```bash
python main.py
# or use the startup script
./start.sh
```

3. **Verify service health**
```bash
curl http://localhost:8000/health
```

## 🎯 Key Features

### Felafax Fine-Tuning Dashboard

Access the Felafax integration at `/fine-tuning` → **Felafax** tab:

- **Model Selection**: Choose from LLaMA-3.1 variants (1B, 3B, 8B, 70B, 405B)
- **Hardware Configuration**: Select TPU, Trainium, GPU, or AMD
- **Precision Options**: bfloat16 or float32 precision
- **Advanced Parameters**: LoRA configuration, learning rates, batch sizes
- **Cost Estimation**: Real-time cost calculations with hardware-specific pricing
- **Real-time Monitoring**: Live training progress and hardware metrics

### Hardware Optimization

The platform supports multiple hardware types with automatic optimization:

| Hardware | Cost/Hour | Best For | Performance |
|-----------|-----------|----------|-------------|
| **TPU** | $3.22 | Large models (8B+) | 30% cost savings |
| **Trainium** | $4.03 | Medium-Large models | High performance |
| **GPU** | $1.00 | Small-Medium models | Flexible |
| **AMD** | $0.80 | Small models | Cost-effective |

### Monitoring & Analytics

Comprehensive monitoring across all components:

- **Real-time Training**: Live progress updates and metrics
- **Hardware Metrics**: CPU, GPU, memory, disk utilization
- **Cost Tracking**: Per-job costs with optimization insights
- **Performance Analytics**: Training efficiency and ROI calculations
- **System Health**: Overall platform monitoring and alerts

### Cost Management

Advanced cost tracking and optimization:

- **Hardware Breakdown**: Cost analysis by hardware type
- **Monthly Trends**: Historical cost patterns and forecasting
- **Optimization Tips**: AI-powered cost reduction recommendations
- **Budget Alerts**: Customizable spending thresholds
- **ROI Analysis**: Return on investment calculations

## 🧪 Testing

### Integration Testing

The platform includes comprehensive integration testing for Felafax:

1. **Access Test Suite**: Navigate to `/fine-tuning` → **Integration Tests** tab
2. **Run Tests**: Click "Run Tests" to execute the full test suite
3. **Test Categories**:
   - Service Health Checks
   - Model Availability
   - Hardware Configurations
   - Cost Estimation Accuracy
   - Job Lifecycle Management
   - Hardware Metrics Validation

### Code Quality

```bash
# Run ESLint
npm run lint

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ftaas-platform .

# Run with Docker Compose
docker-compose up -d
```

### Environment Configuration

For production, update your environment variables:

```env
# Production URLs
NEXTAUTH_URL=https://your-domain.com
FELAFAX_SERVICE_URL=https://your-felafax-service.com

# Production API Keys
OPENAI_API_KEY=your-production-openai-key
STRIPE_SECRET_KEY=your-production-stripe-key

# Production Database
DATABASE_URL=postgresql://user:password@localhost:5432/ftaaS
```

## 🔒 Security

### Authentication & Authorization
- **NextAuth.js**: Secure authentication with multiple providers
- **Role-based Access**: User permissions and access control
- **Session Management**: Secure session handling and timeouts
- **API Security**: Protected routes and endpoint validation

### Data Protection
- **Encryption**: Sensitive data encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Built-in Next.js security features

### API Security
- **Rate Limiting**: Request throttling and abuse prevention
- **CORS**: Cross-origin resource sharing configuration
- **Environment Variables**: Secure configuration management
- **Webhook Security**: Signature verification for external services

## 📊 Monitoring & Observability

### Application Monitoring
- **Real-time Metrics**: Live performance and usage statistics
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Response times and resource utilization
- **User Analytics**: User behavior and feature usage tracking

### Infrastructure Monitoring
- **Hardware Metrics**: CPU, memory, disk, and network utilization
- **Service Health**: Felafax service and dependency monitoring
- **Database Performance**: Query optimization and connection pooling
- **Network Health**: Latency and availability monitoring

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Log Aggregation**: Centralized log collection and analysis
- **Error Tracking**: Detailed error reports with stack traces
- **Audit Logs**: User actions and system changes tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Run the test suite**
6. **Submit a pull request**

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint configuration
- Write comprehensive tests
- Update documentation
- Follow the established code style

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. **Documentation**: Check the [FELAFAX_SETUP.md](FELAFAX_SETUP.md) for Felafax integration
2. **Issues**: Create an issue on GitHub with detailed description
3. **Discussions**: Join community discussions for feature requests
4. **Email**: Contact the development team for enterprise support

## 🎉 Roadmap

### Upcoming Features
- **Multi-tenant Architecture**: Support for multiple organizations
- **Advanced Analytics**: ML-powered insights and recommendations
- **Mobile App**: React Native mobile application
- **API Gateway**: Centralized API management and documentation
- **Advanced Monitoring**: AIOps and predictive maintenance
- **Marketplace**: Model and dataset marketplace integration

### Technology Enhancements
- **GraphQL**: API modernization with GraphQL
- **Microservices**: Service decomposition and scalability
- **Kubernetes**: Container orchestration and scaling
- **WebAssembly**: Performance optimization for compute-intensive tasks
- **Edge Computing**: Global content delivery and performance

---

Built with ❤️ for the AI/ML community. Powered by [Z.ai](https://chat.z.ai) 🚀