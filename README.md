# Tennis Connect Application

Tennis Connect is a full-stack application designed to help tennis players find partners, courts, events, and communities in their area.

## 🚀 Quick Start

**Get up and running in 30 seconds:**

```bash
# Clone the repository
git clone https://github.com/yourusername/tennis-connect.git
cd tennis-connect

# Start everything (creates .env automatically)
./scripts/start.sh
```

That's it! 🎾

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080  
- **Database**: localhost:5432

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- That's it! No Node.js, Go, or PostgreSQL installation needed.

## 🛠️ Development Commands

```bash
make start      # Start the application
make stop       # Stop all services
make restart    # Restart all services
make logs       # View live logs
make test       # Run all tests
make clean      # Clean up Docker resources
make reset      # Reset everything fresh
make status     # Show service status
make db         # Connect to database
make db-status  # Check database status and user count
make db-backup  # Backup database to file
make db-restore # Restore from latest backup
```

## 🏗️ What You Get

### Backend (Go + Gin)
- RESTful API server
- JWT authentication
- PostgreSQL database
- Hot reload during development

### Frontend (React)
- Modern React application
- Responsive design
- Hot reload during development
- Optimized production builds

### Database (PostgreSQL)
- Persistent data storage
- Automatic migrations
- Pre-configured for development

## 📁 Project Structure

```
tennis-connect/
├── backend/             # Go API server
│   ├── handlers/        # HTTP request handlers  
│   ├── models/          # Data models
│   ├── repository/      # Database layer
│   └── config/          # Configuration
├── frontend/            # React application
│   ├── src/components/  # React components
│   └── src/api/         # API client
├── scripts/             # Utility scripts
└── docker-compose.yml   # Container orchestration
```

## 🔧 Configuration

Environment variables are automatically set for development. To customize:

1. Copy `.env.example` to `.env` (done automatically)
2. Edit `.env` with your values
3. Restart: `make restart`

Key variables:
- `JWT_SECRET` - Change in production!
- `DB_*` - Database configuration  
- `REACT_APP_API_URL` - Frontend API endpoint

## 🧪 Testing

```bash
# Run all tests
make test

# Backend tests only
docker-compose exec backend go test ./...

# Frontend tests only  
docker-compose exec frontend npm test -- --watchAll=false
```

## 🚀 Deployment

### Local Development
```bash
make start    # Uses development React server on port 3000
```

### Production Deployment

1. **Create production environment file**:
   ```bash
   cp env.production.example .env
   # Edit .env with your production values
   ```

2. **Deploy to production**:
   ```bash
   make deploy   # Uses nginx production build on port 80
   ```

3. **For cloud deployment** (GCP, AWS, DigitalOcean):
   ```bash
   # The multi-stage Dockerfile automatically builds for production
   docker build --target production -t tennis-connect-frontend ./frontend
   docker build -t tennis-connect-backend ./backend
   ```

## 🐛 Troubleshooting

**Services won't start?**
```bash
make clean    # Clean up
make reset    # Start fresh
```

**Permission errors?**
```bash
chmod +x scripts/start.sh
```

**Database issues?**
```bash
docker-compose down -v  # Remove volumes
make start              # Start fresh
```

**View logs:**
```bash
make logs               # All services
docker-compose logs backend    # Specific service
```

**Database issues:**
```bash
# Connect to database
docker-compose exec db psql -U postgres -d tennis_connect

# Check if tables exist
docker-compose exec db psql -U postgres -d tennis_connect -c "\dt"

# Check users table (for login persistence)
docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT id, email, created_at FROM users;"

# Check database connection
docker-compose exec db pg_isready -U postgres

# Reset database completely
docker-compose down -v  # Remove volumes (deletes all data!)
make start              # Start fresh
```

## 📊 Monitoring

```bash
# Service status
make status

# Live logs
make logs

# Resource usage
docker stats
```

## 🗄️ Database Troubleshooting

### Check Database Status
```bash
# Is database running?
docker-compose exec db pg_isready -U postgres

# Connect to database
docker-compose exec db psql -U postgres -d tennis_connect
```

### Inspect Database Schema
```bash
# List all tables
docker-compose exec db psql -U postgres -d tennis_connect -c "\dt"

# Describe users table structure
docker-compose exec db psql -U postgres -d tennis_connect -c "\d users"

# Check if migrations ran
docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT * FROM schema_migrations;"
```

### Check Data Persistence
```bash
# View all users (check login persistence)
docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT id, email, created_at FROM users LIMIT 10;"

# Count total users
docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT COUNT(*) FROM users;"

# Check recent activity
docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT * FROM users ORDER BY created_at DESC LIMIT 5;"
```

### Database Backup & Recovery
```bash
# 🚨 ALWAYS backup before making changes!
make db-backup

# View backups
ls -la backups/

# Restore from backup (DANGEROUS - replaces all data!)
make db-restore
```

### ⚠️ CRITICAL: Avoiding Data Loss

**NEVER run these commands if you have important user data:**
```bash
# ❌ These commands DESTROY ALL USER DATA:
docker-compose down -v          # Removes database volume
make clean                      # Removes all Docker data  
make reset                      # Completely resets everything
docker volume rm tennis-connect_postgres_data
```

**✅ Safe restart commands:**
```bash
# Safe - preserves database
make stop && make start
make restart
docker-compose restart
```

## 🎯 Development Tips

- **Hot reload**: Code changes auto-refresh
- **Database**: Data persists between restarts
- **Ports**: Frontend (3000), Backend (8080), DB (5432)
- **API docs**: http://localhost:8080/api/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests: `make test`
5. Commit: `git commit -am 'Add new feature'`
6. Push: `git push origin feature/new-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

**🎾 Ready to serve up some code? Start with `./scripts/start.sh`** 