#!/bin/bash

# Tennis Connect Development Setup Script
# This script sets up the development environment

set -e  # Exit on any error

echo "🎾 Tennis Connect Development Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required tools are available
check_tools() {
    print_status "Checking required tools..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Installing via Docker..."
    else
        print_success "Node.js is installed: $(node --version)"
    fi
    
    # Check for Go
    if ! command -v go &> /dev/null; then
        print_warning "Go is not installed. Development will use Docker..."
    else
        print_success "Go is installed: $(go version)"
    fi
}

# Setup environment files
setup_env() {
    print_status "Setting up environment files..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
        else
            print_warning "No env.example found, creating basic .env file"
            cat > .env << 'EOF'
# Environment Configuration
APP_ENV=development

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tennis_connect_dev
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRATION=60

# Postgres Database Configuration (for Docker)
POSTGRES_DB=tennis_connect_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8080/api
EOF
        fi
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Setup backend dependencies
setup_backend() {
    print_status "Setting up backend dependencies..."
    
    if [ -f backend/go.mod ]; then
        cd backend
        if command -v go &> /dev/null; then
            print_status "Downloading Go dependencies..."
            go mod download
            go mod tidy
            print_success "Go dependencies updated"
        else
            print_warning "Go not installed locally, dependencies will be handled in Docker"
        fi
        cd ..
    else
        print_error "backend/go.mod not found!"
        exit 1
    fi
}

# Setup frontend dependencies
setup_frontend() {
    print_status "Setting up frontend dependencies..."
    
    if [ -f frontend/package.json ]; then
        cd frontend
        if command -v npm &> /dev/null; then
            print_status "Installing npm dependencies..."
            npm install
            print_success "npm dependencies installed"
        else
            print_warning "npm not installed locally, dependencies will be handled in Docker"
        fi
        cd ..
    else
        print_error "frontend/package.json not found!"
        exit 1
    fi
}

# Start development services
start_services() {
    print_status "Starting development services..."
    
    # Start database first
    print_status "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Check if database is ready
    if docker-compose exec db pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Database is ready"
    else
        print_error "Database failed to start"
        exit 1
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    cd backend
    if command -v go &> /dev/null; then
        go run cmd/migrate/main.go up
    else
        # Run migrations in Docker
        docker-compose exec backend go run cmd/migrate/main.go up
    fi
    cd ..
    
    print_success "Development environment is ready!"
}

# Main execution
main() {
    print_status "Starting development setup..."
    
    check_docker
    check_tools
    setup_env
    setup_backend
    setup_frontend
    start_services
    
    echo ""
    print_success "🎾 Development setup complete!"
    echo ""
    echo "Next steps:"
    echo "  🚀 Start development servers:"
    echo "     make dev-start        # Start all services"
    echo "     make dev-backend      # Start only backend"
    echo "     make dev-frontend     # Start only frontend"
    echo ""
    echo "  📊 Access your application:"
    echo "     Frontend: http://localhost:3000"
    echo "     Backend:  http://localhost:8080"
    echo "     Database: localhost:5432"
    echo ""
    echo "  🛠  Useful commands:"
    echo "     make help             # Show all available commands"
    echo "     make test             # Run tests"
    echo "     make migrate          # Run database migrations"
    echo ""
}

# Run main function
main "$@" 