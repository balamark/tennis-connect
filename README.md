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

### Development Deployment
```bash
make deploy-dev
```

### Production Deployment
```bash
# Ensure environment variables are set
export JWT_SECRET="your-production-secret"
export POSTGRES_PASSWORD="secure-password"

make deploy-prod
```

### Docker Deployment
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