# Tennis Connect Application

Tennis Connect is a full-stack application designed to help tennis players find partners, courts, events, and communities in their area.

## Features

- User authentication and profiles
- Court finder with maps integration
- Nearby player matching based on skill level and location
- Play bulletins to find match partners
- Tennis events and RSVPs
- Tennis communities and discussions

## Technology Stack

### Backend
- Go (Gin framework)
- PostgreSQL database
- JWT authentication
- Docker for containerization

### Frontend
- React
- React Router for navigation
- CSS for styling
- Axios for API requests

## Project Structure

```
tennis-connect/
├── backend/             # Go backend API
│   ├── cmd/             # Command line tools (migrations, etc.)
│   ├── config/          # Application configuration
│   ├── database/        # Database connection and management
│   ├── handlers/        # HTTP request handlers
│   ├── migrations/      # Database migrations
│   ├── models/          # Data models
│   ├── repository/      # Database repositories
│   ├── utils/           # Utility functions
│   ├── .air.toml        # Hot reload configuration
│   └── Makefile         # Backend automation
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API services
│   └── package.json     # Frontend dependencies and scripts
├── scripts/             # Setup and automation scripts
├── docker-compose.yml   # Main Docker Compose configuration
├── docker-compose.override.yml  # Development overrides
├── docker-compose.prod.yml      # Production overrides
├── env.example          # Environment variables example
└── Makefile            # Project-wide automation
```

## Quick Start

### Option 1: Automated Setup (Recommended)

**For Unix/Linux/Mac:**
```bash
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect
make setup
```

**For Windows (PowerShell):**
```powershell
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect
.\scripts\setup.ps1
```

### Option 2: Manual Setup

1. **Prerequisites:**
   - Docker and Docker Compose
   - Node.js 16+ (optional, for local development)
   - Go 1.20+ (optional, for local development)

2. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/tennis-connect.git
   cd tennis-connect
   cp env.example .env
   ```

3. **Start development environment:**
   ```bash
   make dev-start
   ```

## Development Commands

The project includes comprehensive automation through Makefiles. Use `make help` to see all available commands:

### 🚀 Quick Development Commands
```bash
make dev-start          # Start all development services
make dev-stop           # Stop all development services  
make dev-logs           # View development logs
make test               # Run all tests
make lint               # Run linting on all projects
```

### 🏗️ Building & Testing
```bash
make build              # Build all services
make build-backend      # Build backend only
make build-frontend     # Build frontend only
make test-coverage      # Run tests with coverage
```

### 🗄️ Database Management
```bash
make db-start           # Start database only
make db-reset           # Reset database with fresh data
make db-migrate         # Run database migrations
make db-backup          # Create database backup
```

### 🚢 Deployment
```bash
make deploy-dev         # Deploy to development
make deploy-staging     # Deploy to staging  
make deploy-prod        # Deploy to production
```

## Environment Configuration

The application supports multiple environments through configuration files:

- **Development**: Uses `docker-compose.override.yml` with hot reload
- **Staging**: Uses production compose with staging environment variables
- **Production**: Uses `docker-compose.prod.yml` with production optimizations

### Environment Variables

Copy `env.example` to `.env` and customize:

```bash
# Environment
APP_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tennis_connect_dev

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=60

# Frontend
REACT_APP_API_URL=http://localhost:8080/api
```

## Development Workflow

### 1. Initial Setup
```bash
# One-time setup
make setup              # Sets up everything automatically

# Or manual setup
make dev-setup         # Setup development environment
make db-migrate        # Run database migrations
```

### 2. Daily Development
```bash
make dev-start         # Start all services with hot reload
# Make your changes...
make test              # Run tests
make lint              # Check code quality
make dev-stop          # Stop when done
```

### 3. Before Committing
```bash
make pre-commit        # Runs formatting, linting, and tests
```

### 4. Backend Development
```bash
cd backend
make help              # See backend-specific commands
make dev               # Start with hot reload
make test-coverage     # Run tests with coverage
make migrate-create name=new_feature  # Create new migration
```

### 5. Frontend Development
```bash
cd frontend
npm start              # Start development server
npm run test:coverage  # Run tests with coverage
npm run lint:fix       # Fix linting issues
```

## Testing

### Running Tests
```bash
# All tests
make test

# Backend tests only
make test-backend

# Frontend tests only  
make test-frontend

# With coverage
make test-coverage
```

### Test Structure
- **Backend**: Uses Go's built-in testing framework with testify
- **Frontend**: Uses Jest and React Testing Library
- **Integration**: Database integration tests with real PostgreSQL

## Deployment

### Local Development Deployment
```bash
make deploy-dev
```

### Google Cloud Platform Deployment

#### Prerequisites
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Terraform](https://www.terraform.io/downloads)
- [Docker](https://docs.docker.com/get-docker/)
- A GCP project with billing enabled

#### Automated GCP Deployment
```bash
# 1. Edit the deployment script with your project ID
nano scripts/deploy-gcp.sh
# Set PROJECT_ID="your-gcp-project-id"

# 2. Run the deployment script
./scripts/deploy-gcp.sh
```

#### Manual GCP Deployment Steps

1. **Setup GCP Project**
   ```bash
   # Set your project ID
   export PROJECT_ID="your-gcp-project-id"
   gcloud config set project $PROJECT_ID
   
   # Enable required APIs
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   ```

2. **Deploy Infrastructure**
   ```bash
   cd terraform
   
   # Copy and edit terraform variables
   cp tf.prod.tfvars terraform.tfvars
   nano terraform.tfvars  # Edit with your values
   
   # Deploy infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

3. **Build and Deploy Services**
   ```bash
   # Configure Docker for GCR
   gcloud auth configure-docker
   
   # Build and push images
   docker build -t gcr.io/$PROJECT_ID/tennis-connect-backend ./backend
   docker push gcr.io/$PROJECT_ID/tennis-connect-backend
   
   docker build -t gcr.io/$PROJECT_ID/tennis-connect-frontend ./frontend
   docker push gcr.io/$PROJECT_ID/tennis-connect-frontend
   
   # Deploy to Cloud Run
   gcloud run deploy tennis-connect-backend \
     --image gcr.io/$PROJECT_ID/tennis-connect-backend \
     --region us-central1 --allow-unauthenticated
   
   gcloud run deploy tennis-connect-frontend \
     --image gcr.io/$PROJECT_ID/tennis-connect-frontend \
     --region us-central1 --allow-unauthenticated
   ```

### Docker Deployment (Local)
```bash
# Build images
make build

# Deploy with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Architecture & Best Practices

### Backend Architecture
- **Clean Architecture**: Separation of concerns with handlers, repositories, and models
- **Dependency Injection**: Handlers receive repository dependencies
- **Environment-based Configuration**: Different configs for dev/staging/prod
- **Database Migrations**: Versioned schema changes
- **Comprehensive Testing**: Unit tests, integration tests, and mocks

### Frontend Architecture  
- **Component-based**: Reusable React components
- **CSS Modules**: Scoped styling for components
- **Environment Configuration**: Build-time environment variables
- **Testing**: Component tests with good coverage

### DevOps Best Practices
- **Infrastructure as Code**: Docker Compose for local and production
- **Environment Parity**: Same containers for dev, staging, and production
- **Automated Testing**: Pre-commit hooks and CI/CD ready
- **Health Checks**: Application and database health monitoring
- **Secrets Management**: Environment-based secret configuration

## Troubleshooting

### Common Issues

**Docker Issues:**
```bash
make clean-docker      # Clean Docker resources
make dev-reset         # Reset development environment
```

**Database Issues:**
```bash
make db-reset          # Reset database
make db-migrate        # Run migrations
```

**Dependency Issues:**
```bash
make clean-all         # Clean everything
make setup             # Reinstall everything
```

**Port Conflicts:**
```bash
# Check what's using ports
netstat -an | grep LISTEN
# Stop conflicting services or change ports in .env
```

### Getting Help

1. Check `make help` for available commands
2. Review logs with `make dev-logs`
3. Check environment configuration in `.env`
4. Ensure Docker is running and healthy

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests: `make pre-commit`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Logs & Monitoring

### 🔍 Diagnostic Commands

When services aren't working (like localhost:3000 not showing), use these commands to diagnose issues:

#### Check Service Status
```bash
make status                    # Check all container statuses
docker ps -a                   # Show all containers including stopped ones
```

#### View Logs
```bash
# View logs for all services
make dev-logs                  # Development logs (all services)
make logs                      # Production logs (all services)

# View logs for specific services
docker-compose logs frontend   # Frontend only
docker-compose logs backend    # Backend only 
docker-compose logs db         # Database only

# Follow logs in real-time
docker-compose logs -f frontend
docker-compose logs -f backend

# View recent logs (last 50 lines)
docker-compose logs --tail=50 frontend
```

#### Service-Specific Diagnostics
```bash
# Frontend debugging
docker-compose exec frontend npm run build    # Test build process
docker-compose exec frontend ls -la /app      # Check file permissions
docker-compose exec frontend node --version   # Check Node version

# Backend debugging  
docker-compose exec backend curl http://localhost:8080/api/health
docker-compose exec backend go version

# Database debugging
docker-compose exec db pg_isready -U postgres
docker-compose exec db psql -U postgres -d tennis_connect_dev -c "SELECT version();"
```

#### Fix Common Issues
```bash
# Frontend not starting (common fixes)
make dev-stop                  # Stop all services
make clean-docker             # Clean Docker resources  
make dev-start                # Restart services

# Permission issues
docker-compose exec frontend chmod +x node_modules/.bin/react-scripts

# Node version issues (rebuild with correct version)
docker-compose down frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Port conflicts
netstat -an | grep LISTEN      # Check what's using ports
lsof -i :3000                  # Check what's using port 3000
```

#### Container Inspection
```bash
# Get inside a container for debugging
docker-compose exec frontend sh    # Access frontend container
docker-compose exec backend sh     # Access backend container
docker-compose exec db psql -U postgres tennis_connect_dev

# Check container resources
docker stats tennis-connect-frontend
docker inspect tennis-connect-frontend
```

#### Health Checks
```bash
# Manual health checks
curl http://localhost:8080/api/health    # Backend health
curl http://localhost:3000               # Frontend health (if running)

# Database connectivity
psql -h localhost -p 5432 -U postgres -d tennis_connect_dev
```

### 📊 Monitoring During Development

#### Real-time Monitoring
```bash
# Watch logs continuously
make dev-logs &

# Monitor resource usage
watch docker stats

# Monitor file changes (if using volumes)
watch ls -la backend/ frontend/src/
```

#### Performance Monitoring
```bash
# Check startup times
time make dev-start

# Monitor build times
time make build-frontend
time make build-backend

# Database performance
docker-compose exec db psql -U postgres -d tennis_connect_dev -c "SELECT * FROM pg_stat_activity;"
```

### 🚨 Troubleshooting Checklist

When localhost:3000 isn't working:

1. **Check container status**: `make status`
2. **View frontend logs**: `docker-compose logs frontend`
3. **Check for permission issues**: Look for "Permission denied" in logs
4. **Verify Node version**: Should be 18+ for React
5. **Check port conflicts**: `lsof -i :3000`
6. **Try clean restart**: `make clean-docker && make dev-start`

### 📝 Log Levels & Filtering

```bash
# Filter logs by level
docker-compose logs frontend | grep ERROR
docker-compose logs backend | grep -E "(ERROR|WARN)"

# Search logs for specific issues
docker-compose logs | grep -i "permission denied"
docker-compose logs | grep -i "failed"
docker-compose logs | grep -i "error"

# Export logs for analysis
docker-compose logs > debug-logs-$(date +%Y%m%d-%H%M).txt
``` 