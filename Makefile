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