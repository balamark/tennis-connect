# PowerShell script to start the Tennis Connect backend
Write-Host "🎾 Starting Tennis Connect Backend..." -ForegroundColor Green

# Set environment variables
$env:APP_ENV = "development"
$env:SERVER_PORT = "8080"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$env:DB_NAME = "tennis_connect_dev"
$env:DB_SSLMODE = "disable"
$env:JWT_SECRET = "dev-secret-key-not-for-production"
$env:JWT_EXPIRATION = "60"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "  APP_ENV: $env:APP_ENV"
Write-Host "  SERVER_PORT: $env:SERVER_PORT"
Write-Host "  DB_HOST: $env:DB_HOST"
Write-Host "  DB_NAME: $env:DB_NAME"

# Navigate to backend directory
Set-Location -Path "backend"

Write-Host "Starting Go server..." -ForegroundColor Cyan

# Check if tennis-connect.exe exists
if (Test-Path "tennis-connect.exe") {
    Write-Host "Using compiled binary..." -ForegroundColor Green
    .\tennis-connect.exe
} else {
    Write-Host "Running with go run..." -ForegroundColor Green
    go run main.go
} 