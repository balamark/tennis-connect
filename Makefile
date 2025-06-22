# Tennis Connect - Simplified Makefile for Fast Iteration
.PHONY: help start stop restart logs test clean build reset

# Default target
.DEFAULT_GOAL := help

help: ## Show available commands
	@echo "🎾 Tennis Connect - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

start: ## Start the application (creates .env if needed)
	@./scripts/start.sh

stop: ## Stop all services
	@echo "🛑 Stopping Tennis Connect..."
	@docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting Tennis Connect..."
	@docker-compose down
	@docker-compose up --build -d

logs: ## View application logs
	@docker-compose logs -f

test: ## Run tests
	@echo "🧪 Running tests..."
	@docker-compose exec backend go test ./...
	@docker-compose exec frontend npm test -- --watchAll=false

build: ## Build all services
	@echo "🔨 Building services..."
	@docker-compose build

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@docker system prune -f

reset: ## Reset everything (clean + start fresh)
	@echo "🔄 Resetting Tennis Connect..."
	@docker-compose down -v
	@docker system prune -f
	@./scripts/start.sh

status: ## Show service status
	@echo "📊 Service Status:"
	@docker-compose ps

deploy: ## Deploy to production (uses docker-compose.prod.yml)
	@echo "🚀 Deploying to production..."
	@docker-compose -f docker-compose.prod.yml up -d --build

deploy-stop: ## Stop production deployment
	@echo "🛑 Stopping production deployment..."
	@docker-compose -f docker-compose.prod.yml down

db-check: ## Check database connection (Supabase)
	@echo "🗄️ Checking Supabase database connection..."
	@curl -s http://localhost:8080/api/health | grep -q "ok" && echo "✅ Database connection: OK" || echo "❌ Database connection: FAILED"
	@echo "📊 Backend logs (database-related):"
	@docker-compose logs backend | grep -i "database\|postgres\|supabase" | tail -5

db-status: ## Show database connection status
	@echo "🗄️ Supabase Database Status:"
	@echo "🔗 Dashboard: https://supabase.com/dashboard/projects"
	@echo "📊 Connection test:"
	@curl -s -w "Response time: %{time_total}s\n" http://localhost:8080/api/health || echo "❌ Backend not responding"
	@echo "🔧 Environment check:"
	@docker-compose exec backend env | grep DB_ | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***HIDDEN***/'

db-logs: ## View database-related logs
	@echo "📋 Database connection logs:"
	@docker-compose logs backend | grep -i "database\|postgres\|supabase\|connection" | tail -20

db-dashboard: ## Open Supabase dashboard
	@echo "🌐 Opening Supabase dashboard..."
	@echo "Visit: https://supabase.com/dashboard/projects"
	@echo "💡 Use the web interface to:"
	@echo "   - View and edit data (Table Editor)"
	@echo "   - Run SQL queries (SQL Editor)"
	@echo "   - Check logs and metrics"
	@echo "   - Manage backups" 