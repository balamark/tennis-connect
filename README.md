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

For production deployment:

1. **Update environment variables** in `.env`:
   ```bash
   APP_ENV=production
   JWT_SECRET=your-secure-production-secret
   # Add other production values
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

3. **Or use any Docker hosting** (DigitalOcean, AWS ECS, etc.)

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

## 📊 Monitoring

```bash
# Service status
make status

# Live logs
make logs

# Resource usage
docker stats
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