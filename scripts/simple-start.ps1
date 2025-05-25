# Simplified backend start without database
Write-Host "🎾 Starting Tennis Connect Backend (Simplified Mode)..." -ForegroundColor Green

# Set minimal environment variables
$env:APP_ENV = "development"
$env:SERVER_PORT = "8080"
$env:JWT_SECRET = "dev-secret"

# Navigate to backend
Set-Location backend

# Try to start without database dependency
Write-Host "Starting Go server on port 8080..." -ForegroundColor Cyan
go run main.go 