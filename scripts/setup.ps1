# Tennis Connect Development Setup Script for Windows
# PowerShell script to set up the development environment

param(
    [switch]$SkipDocker = $false,
    [switch]$SkipDeps = $false
)

# Colors for output
$colors = @{
    Red = 'Red'
    Green = 'Green' 
    Yellow = 'Yellow'
    Blue = 'Cyan'
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

Write-Host "🎾 Tennis Connect Development Setup" -ForegroundColor Green
Write-Host "=================================="

# Check if Docker is installed
if (-not $SkipDocker) {
    Write-Status "Checking Docker installation..."
    
    if (-not (Test-Command "docker")) {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        Write-Host "Download from: https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe"
        exit 1
    }
    
    if (-not (Test-Command "docker-compose")) {
        Write-Error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    }
    
    Write-Success "Docker and Docker Compose are installed"
}

# Check for required tools
Write-Status "Checking required tools..."

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js is installed: $nodeVersion"
} else {
    Write-Warning "Node.js is not installed. Development will use Docker..."
}

if (Test-Command "go") {
    $goVersion = go version
    Write-Success "Go is installed: $goVersion"
} else {
    Write-Warning "Go is not installed. Development will use Docker..."
}

# Setup environment file
Write-Status "Setting up environment files..."

if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Success "Created .env file from env.example"
    } else {
        Write-Warning "No env.example found, creating basic .env file"
        @"
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
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
} else {
    Write-Warning ".env file already exists, skipping..."
}

# Setup backend dependencies
if (-not $SkipDeps) {
    Write-Status "Setting up backend dependencies..."
    
    if (Test-Path "backend/go.mod") {
        Push-Location "backend"
        if (Test-Command "go") {
            Write-Status "Downloading Go dependencies..."
            go mod download
            go mod tidy
            Write-Success "Go dependencies updated"
        } else {
            Write-Warning "Go not installed locally, dependencies will be handled in Docker"
        }
        Pop-Location
    } else {
        Write-Error "backend/go.mod not found!"
        exit 1
    }
    
    # Setup frontend dependencies
    Write-Status "Setting up frontend dependencies..."
    
    if (Test-Path "frontend/package.json") {
        Push-Location "frontend"
        if (Test-Command "npm") {
            Write-Status "Installing npm dependencies..."
            npm install
            Write-Success "npm dependencies installed"
        } else {
            Write-Warning "npm not installed locally, dependencies will be handled in Docker"
        }
        Pop-Location
    } else {
        Write-Error "frontend/package.json not found!"
        exit 1
    }
}

# Start development services
if (-not $SkipDocker) {
    Write-Status "Starting development services..."
    
    # Start database first
    Write-Status "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    Write-Status "Waiting for database to be ready..."
    Start-Sleep 10
    
    # Check if database is ready
    $dbReady = docker-compose exec db pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database is ready"
    } else {
        Write-Error "Database failed to start"
        exit 1
    }
    
    # Run migrations
    Write-Status "Running database migrations..."
    Push-Location "backend"
    if (Test-Command "go") {
        go run cmd/migrate/main.go up
    } else {
        # Run migrations in Docker
        docker-compose exec backend go run cmd/migrate/main.go up
    }
    Pop-Location
}

Write-Host ""
Write-Success "🎾 Development setup complete!"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  🚀 Start development servers:"
Write-Host "     make dev-start        # Start all services"
Write-Host "     make dev-backend      # Start only backend"
Write-Host "     make dev-frontend     # Start only frontend"
Write-Host ""
Write-Host "  📊 Access your application:"
Write-Host "     Frontend: http://localhost:3000"
Write-Host "     Backend:  http://localhost:8080"
Write-Host "     Database: localhost:5432"
Write-Host ""
Write-Host "  🛠  Useful commands:"
Write-Host "     make help             # Show all available commands"
Write-Host "     make test             # Run tests"
Write-Host "     make migrate          # Run database migrations"
Write-Host "" 