# 🎾 Tennis Connect - Quick Start Guide

Get your Tennis Connect development environment up and running in minutes!

## 🚀 Instant Setup

### Windows (PowerShell)
```powershell
# Clone and setup
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect
.\scripts\setup.ps1

# Start development (use PowerShell make equivalent)
.\scripts\make.ps1 dev-start
```

### macOS/Linux
```bash
# Clone and setup
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect
make setup

# Start development
make dev-start
```

## 📱 Access Your App

After running the setup commands above:

- **Frontend**: http://localhost:3000 (with hot reload)
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## 🛠️ Essential Commands

### Windows (PowerShell)
```powershell
# Show all available commands
.\scripts\make.ps1 help

# Development
.\scripts\make.ps1 dev-start        # Start all services
.\scripts\make.ps1 dev-stop         # Stop all services
.\scripts\make.ps1 dev-logs         # View logs

# Testing
.\scripts\make.ps1 test             # Run all tests
.\scripts\make.ps1 lint             # Check code quality

# Database
.\scripts\make.ps1 db-reset         # Fresh database
.\scripts\make.ps1 db-migrate       # Run migrations
```

### macOS/Linux
```bash
# Show all available commands
make help

# Development
make dev-start        # Start all services
make dev-stop         # Stop all services
make dev-logs         # View logs

# Testing
make test             # Run all tests
make lint             # Check code quality

# Database
make db-reset         # Fresh database
make db-migrate       # Run migrations
```

## 🔧 Quick Fixes

### Issue: Docker error
**Windows:**
```powershell
.\scripts\make.ps1 clean-docker     # Clean Docker
.\scripts\make.ps1 setup           # Re-setup
```

**macOS/Linux:**
```bash
make clean-docker     # Clean Docker
make setup           # Re-setup
```

### Issue: Port conflicts
```bash
# Check what's using ports
netstat -an | findstr LISTEN        # Windows
netstat -an | grep LISTEN          # macOS/Linux

# Or stop other services and restart
.\scripts\make.ps1 dev-restart      # Windows
make dev-restart                   # macOS/Linux
```

### Issue: Database problems
**Windows:**
```powershell
.\scripts\make.ps1 db-reset        # Reset database
```

**macOS/Linux:**
```bash
make db-reset        # Reset database
```

## 📋 What's Running?

After starting development:

1. **PostgreSQL Database** (port 5432)
   - Auto-migrated with latest schema
   - Development data ready

2. **Go Backend** (port 8080)
   - Hot reload enabled
   - API endpoints available

3. **React Frontend** (port 3000)
   - Hot reload enabled
   - Proxy to backend configured

## 🎯 Next Steps

1. **Make some changes** - Edit files and see hot reload in action
2. **Run tests** - Test everything works
3. **Check the APIs** - Visit http://localhost:8080/api/health
4. **Explore the code** - Start in `frontend/src/App.js` and `backend/main.go`

## 📚 Learn More

- Full documentation: `README.md`
- Backend commands: `cd backend && make help` (or check backend/Makefile)
- Frontend scripts: `cd frontend && npm run`

## 💡 Windows Users

Since Windows doesn't have `make` by default, we've created `.\scripts\make.ps1` which provides all the same functionality. You can use it exactly like `make` but with PowerShell syntax:

```powershell
# Instead of: make dev-start
.\scripts\make.ps1 dev-start

# Instead of: make test
.\scripts\make.ps1 test
```

Happy coding! 🚀 