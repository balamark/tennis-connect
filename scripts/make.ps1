# Tennis Connect PowerShell Make Equivalent
# Provides make-like functionality for Windows users

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1, ValueFromRemainingArguments=$true)]
    [string[]]$RemainingArgs
)

# Colors for output
$colors = @{
    Red = 'Red'
    Green = 'Green' 
    Yellow = 'Yellow'
    Blue = 'Cyan'
    Magenta = 'Magenta'
}

function Write-Status {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $colors.Red
}

function Invoke-Help {
    Write-Host "Tennis Connect Project Commands" -ForegroundColor $colors.Green
    Write-Host "===============================" -ForegroundColor $colors.Green
    Write-Host ""
    Write-Host "Setup & Development:" -ForegroundColor $colors.Magenta
    Write-Host "  setup              - Initial project setup"
    Write-Host "  dev-setup          - Setup development environment"
    Write-Host "  dev-start          - Start all development services"
    Write-Host "  dev-stop           - Stop all development services"
    Write-Host "  dev-restart        - Restart all development services"
    Write-Host "  dev-logs           - View development logs"
    Write-Host ""
    Write-Host "Services:" -ForegroundColor $colors.Magenta
    Write-Host "  start              - Start all services (production mode)"
    Write-Host "  stop               - Stop all services"
    Write-Host "  restart            - Restart all services"
    Write-Host "  logs               - View all service logs"
    Write-Host "  status             - Show service status"
    Write-Host ""
    Write-Host "Building & Testing:" -ForegroundColor $colors.Magenta
    Write-Host "  build              - Build all services"
    Write-Host "  build-backend      - Build backend only"
    Write-Host "  build-frontend     - Build frontend only"
    Write-Host "  test               - Run all tests"
    Write-Host "  test-backend       - Run backend tests"
    Write-Host "  test-frontend      - Run frontend tests"
    Write-Host "  lint               - Run linting on all projects"
    Write-Host ""
    Write-Host "Database:" -ForegroundColor $colors.Magenta
    Write-Host "  db-start           - Start database only"
    Write-Host "  db-stop            - Stop database"
    Write-Host "  db-reset           - Reset database with fresh data"
    Write-Host "  db-migrate         - Run database migrations"
    Write-Host "  db-backup          - Create database backup"
    Write-Host ""
    Write-Host "Deployment:" -ForegroundColor $colors.Magenta
    Write-Host "  deploy-dev         - Deploy to development environment"
    Write-Host "  deploy-staging     - Deploy to staging environment"
    Write-Host "  deploy-prod        - Deploy to production environment"
    Write-Host ""
    Write-Host "Maintenance:" -ForegroundColor $colors.Magenta
    Write-Host "  clean              - Clean all build artifacts"
    Write-Host "  clean-docker       - Clean Docker containers and images"
    Write-Host "  clean-all          - Clean everything"
    Write-Host ""
    Write-Host "Usage: .\scripts\make.ps1 <command>" -ForegroundColor $colors.Yellow
    Write-Host "Example: .\scripts\make.ps1 dev-start" -ForegroundColor $colors.Yellow
}

function Invoke-Setup {
    Write-Status "Setting up Tennis Connect project..."
    & ".\scripts\setup.ps1"
}

function Invoke-DevStart {
    Write-Status "Starting development services..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Development services started!"
        Write-Host "   Frontend: http://localhost:3000" -ForegroundColor $colors.Yellow
        Write-Host "   Backend:  http://localhost:8080" -ForegroundColor $colors.Yellow
        Write-Host "   Database: localhost:5432" -ForegroundColor $colors.Yellow
    }
}

function Invoke-DevStop {
    Write-Status "Stopping development services..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml down
}

function Invoke-DevRestart {
    Invoke-DevStop
    Invoke-DevStart
}

function Invoke-DevLogs {
    docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f
}

function Invoke-Start {
    Write-Status "Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Production services started!"
    }
}

function Invoke-Stop {
    Write-Status "Stopping all services..."
    docker-compose down
}

function Invoke-Restart {
    Invoke-Stop
    Invoke-Start
}

function Invoke-Logs {
    docker-compose logs -f
}

function Invoke-Status {
    docker-compose ps
}

function Invoke-Build {
    Invoke-BuildBackend
    Invoke-BuildFrontend
    Write-Success "All services built successfully!"
}

function Invoke-BuildBackend {
    Write-Status "Building backend..."
    Push-Location "backend"
    if (Test-Path "Makefile") {
        # If make is available, use it
        if (Get-Command "make" -ErrorAction SilentlyContinue) {
            make build
        } else {
            # Fallback to direct go build
            go build -o bin/tennis-connect-api .
        }
    }
    Pop-Location
}

function Invoke-BuildFrontend {
    Write-Status "Building frontend..."
    Push-Location "frontend"
    npm run build
    Pop-Location
}

function Invoke-Test {
    Invoke-TestBackend
    Invoke-TestFrontend
    Write-Success "All tests completed!"
}

function Invoke-TestBackend {
    Write-Status "Running backend tests..."
    Push-Location "backend"
    go test -v ./...
    Pop-Location
}

function Invoke-TestFrontend {
    Write-Status "Running frontend tests..."
    Push-Location "frontend"
    npm run test:ci
    Pop-Location
}

function Invoke-Lint {
    Write-Status "Running linting..."
    Push-Location "backend"
    if (Get-Command "golangci-lint" -ErrorAction SilentlyContinue) {
        golangci-lint run
    } else {
        Write-Warning "golangci-lint not installed, skipping backend linting"
    }
    Pop-Location
    
    Push-Location "frontend"
    npm run lint
    Pop-Location
}

function Invoke-DbStart {
    Write-Status "Starting database..."
    docker-compose up -d db
}

function Invoke-DbStop {
    Write-Status "Stopping database..."
    docker-compose stop db
}

function Invoke-DbReset {
    Write-Status "Resetting database..."
    docker-compose down db
    docker-compose rm -f db
    docker volume rm tennis-connect_postgres_data -ErrorAction SilentlyContinue
    Invoke-DbStart
    Write-Status "Waiting for database to be ready..."
    Start-Sleep 10
    Invoke-DbMigrate
}

function Invoke-DbMigrate {
    Write-Status "Running database migrations..."
    Push-Location "backend"
    go run cmd/migrate/main.go up
    Pop-Location
}

function Invoke-DbBackup {
    Write-Status "Creating database backup..."
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups"
    }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    docker-compose exec db pg_dump -U postgres tennis_connect_dev > "backups/backup_$timestamp.sql"
    Write-Success "Database backup created in backups/"
}

function Invoke-DeployDev {
    Write-Status "Deploying to development environment..."
    $env:APP_ENV = "development"
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
    Write-Success "Deployed to development!"
}

function Invoke-DeployStaging {
    Write-Status "Deploying to staging environment..."
    $env:APP_ENV = "staging"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    Write-Success "Deployed to staging!"
}

function Invoke-DeployProd {
    Write-Status "Deploying to production environment..."
    $response = Read-Host "Are you sure you want to deploy to production? [y/N]"
    if ($response -eq "y" -or $response -eq "Y") {
        $env:APP_ENV = "production"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        Write-Success "Deployed to production!"
    } else {
        Write-Warning "Deployment cancelled."
    }
}

function Invoke-Clean {
    Write-Status "Cleaning build artifacts..."
    Push-Location "backend"
    if (Test-Path "bin") { Remove-Item -Recurse -Force "bin" }
    Pop-Location
    
    Push-Location "frontend"
    if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
    Pop-Location
}

function Invoke-CleanDocker {
    Write-Status "Cleaning Docker resources..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker system prune -f
}

function Invoke-CleanAll {
    Invoke-Clean
    Invoke-CleanDocker
    Write-Success "Everything cleaned!"
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "help" { Invoke-Help }
    "setup" { Invoke-Setup }
    "dev-setup" { Invoke-Setup }
    "dev-start" { Invoke-DevStart }
    "dev-stop" { Invoke-DevStop }
    "dev-restart" { Invoke-DevRestart }
    "dev-logs" { Invoke-DevLogs }
    "start" { Invoke-Start }
    "stop" { Invoke-Stop }
    "restart" { Invoke-Restart }
    "logs" { Invoke-Logs }
    "status" { Invoke-Status }
    "build" { Invoke-Build }
    "build-backend" { Invoke-BuildBackend }
    "build-frontend" { Invoke-BuildFrontend }
    "test" { Invoke-Test }
    "test-backend" { Invoke-TestBackend }
    "test-frontend" { Invoke-TestFrontend }
    "lint" { Invoke-Lint }
    "db-start" { Invoke-DbStart }
    "db-stop" { Invoke-DbStop }
    "db-reset" { Invoke-DbReset }
    "db-migrate" { Invoke-DbMigrate }
    "db-backup" { Invoke-DbBackup }
    "deploy-dev" { Invoke-DeployDev }
    "deploy-staging" { Invoke-DeployStaging }
    "deploy-prod" { Invoke-DeployProd }
    "clean" { Invoke-Clean }
    "clean-docker" { Invoke-CleanDocker }
    "clean-all" { Invoke-CleanAll }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host "Use '.\scripts\make.ps1 help' to see available commands"
        exit 1
    }
} 