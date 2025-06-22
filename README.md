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
- **Database**: Supabase (Remote PostgreSQL)

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Supabase Account](https://supabase.com) for database
- That's it! No Node.js, Go, or PostgreSQL installation needed locally.

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

### Database (Supabase PostgreSQL)
- Managed PostgreSQL database
- Built-in authentication & real-time features
- Automatic backups and scaling
- Web-based database management interface

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
- `DB_*` - Supabase database connection details
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
# Check backend logs for database connection errors
docker-compose logs backend

# Test database connection
curl http://localhost:8080/api/health

# Check environment variables
docker-compose exec backend env | grep DB_
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

## 🗄️ Database (Supabase) Troubleshooting

### Check Database Connection
```bash
# Check if backend can connect to Supabase
curl http://localhost:8080/api/health

# View backend connection logs
docker-compose logs backend | grep -i "database\|supabase\|postgres"

# Check environment variables
docker-compose exec backend env | grep DB_
```

### Manage Database via Supabase Dashboard
```bash
# Open your Supabase project dashboard at:
# https://supabase.com/dashboard/projects

# Database management:
# - Table Editor: View and edit data
# - SQL Editor: Run custom queries  
# - Database: Schema and migrations
# - Logs: Connection and query logs
```

### Inspect Database Schema & Data
1. **Go to**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project**: tennis-connect
3. **Table Editor**: View and edit data directly
4. **SQL Editor**: Run queries like:
   ```sql
   -- List all tables
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   
   -- Check users table
   SELECT id, email, created_at FROM users LIMIT 10;
   
   -- Count total users
   SELECT COUNT(*) FROM users;
   ```

### Database Backup & Recovery
- **Automatic Backups**: Supabase handles daily backups automatically
- **Manual Backup**: Use Supabase Dashboard → Settings → Database → Backup
- **Export Data**: Use Table Editor to export CSV/JSON
- **Point-in-time Recovery**: Available in Supabase Pro plan

### ⚠️ Database Management

**✅ Safe operations:**
```bash
# Restart application (preserves Supabase data)
make stop && make start
make restart
docker-compose restart
```

**⚠️ Data is stored in Supabase cloud:**
- Local container restarts don't affect database
- Data persists across deployments
- Use Supabase Dashboard for data management

## 🎯 Development Tips

- **Hot reload**: Code changes auto-refresh
- **Database**: Supabase cloud database - data persists between restarts
- **Ports**: Frontend (3000), Backend (8080)
- **API docs**: http://localhost:8080/api/health
- **Database UI**: Use Supabase Dashboard for data management

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