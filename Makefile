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

db: ## Connect to database
	@docker-compose exec db psql -U postgres -d tennis_connect

db-status: ## Check database status and show user count
	@echo "🗄️ Database Status:"
	@docker-compose exec db pg_isready -U postgres
	@echo "📊 User count:"
	@docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT COUNT(*) as total_users FROM users;"
	@echo "📋 Recent users:"
	@docker-compose exec db psql -U postgres -d tennis_connect -c "SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 5;"

db-backup: ## Backup database to file
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@docker-compose exec db pg_dump -U postgres tennis_connect > backups/tennis_connect_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"

db-restore: ## Restore database from latest backup (DANGEROUS!)
	@echo "⚠️  This will REPLACE all current data!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read
	@echo "🔄 Restoring from latest backup..."
	@ls -t backups/*.sql | head -1 | xargs -I {} sh -c 'cat {} | docker-compose exec -T db psql -U postgres -d tennis_connect'
	@echo "✅ Database restored!" 