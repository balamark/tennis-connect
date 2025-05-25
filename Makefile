# Tennis Connect Project Makefile
# Manages the entire project including frontend, backend, and infrastructure

.PHONY: help
help:
	@echo "🎾 Tennis Connect Project Commands"
	@echo "=================================="
	@echo ""
	@echo "📋 Setup & Development:"
	@echo "  setup              - Initial project setup"
	@echo "  dev-setup          - Setup development environment"
	@echo "  dev-start          - Start all development services"
	@echo "  dev-stop           - Stop all development services"
	@echo "  dev-restart        - Restart all development services"
	@echo "  dev-logs           - View development logs"
	@echo ""
	@echo "🚀 Services:"
	@echo "  start              - Start all services (production mode)"
	@echo "  stop               - Stop all services"
	@echo "  restart            - Restart all services"
	@echo "  logs               - View all service logs"
	@echo "  status             - Show service status"
	@echo ""
	@echo "🏗️  Building & Testing:"
	@echo "  build              - Build all services"
	@echo "  build-backend      - Build backend only"
	@echo "  build-frontend     - Build frontend only"
	@echo "  test               - Run all tests"
	@echo "  test-backend       - Run backend tests"
	@echo "  test-frontend      - Run frontend tests"
	@echo "  lint               - Run linting on all projects"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  db-start           - Start database only"
	@echo "  db-stop            - Stop database"
	@echo "  db-reset           - Reset database with fresh data"
	@echo "  db-migrate         - Run database migrations"
	@echo "  db-seed            - Seed database with test data"
	@echo "  db-backup          - Create database backup"
	@echo ""
	@echo "🚢 Deployment:"
	@echo "  deploy-dev         - Deploy to development environment"
	@echo "  deploy-staging     - Deploy to staging environment"
	@echo "  deploy-prod        - Deploy to production environment"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean              - Clean all build artifacts"
	@echo "  clean-docker       - Clean Docker containers and images"
	@echo "  clean-all          - Clean everything"
	@echo ""

# Project variables
DOCKER_COMPOSE := docker-compose
DOCKER_COMPOSE_DEV := $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.override.yml
DOCKER_COMPOSE_PROD := $(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml

# Load environment variables
ifneq (,$(wildcard .env))
    include .env
    export
endif

# =============================================================================
# Setup & Development Commands
# =============================================================================

.PHONY: setup
setup:
	@echo "🎾 Setting up Tennis Connect project..."
	@chmod +x scripts/dev-setup.sh
	@./scripts/dev-setup.sh

.PHONY: dev-setup
dev-setup: setup

.PHONY: dev-start
dev-start:
	@echo "🚀 Starting development services..."
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "✅ Development services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:8080"
	@echo "   Database: localhost:5432"

.PHONY: dev-stop
dev-stop:
	@echo "🛑 Stopping development services..."
	$(DOCKER_COMPOSE_DEV) down

.PHONY: dev-restart
dev-restart: dev-stop dev-start

.PHONY: dev-logs
dev-logs:
	$(DOCKER_COMPOSE_DEV) logs -f

# =============================================================================
# Production Service Commands
# =============================================================================

.PHONY: start
start:
	@echo "🚀 Starting production services..."
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "✅ Production services started!"

.PHONY: stop
stop:
	@echo "🛑 Stopping all services..."
	$(DOCKER_COMPOSE) down

.PHONY: restart
restart: stop start

.PHONY: logs
logs:
	$(DOCKER_COMPOSE) logs -f

.PHONY: status
status:
	$(DOCKER_COMPOSE) ps

# =============================================================================
# Building & Testing Commands
# =============================================================================

.PHONY: build
build: build-backend build-frontend
	@echo "✅ All services built successfully!"

.PHONY: build-backend
build-backend:
	@echo "🏗️ Building backend..."
	cd backend && $(MAKE) build

.PHONY: build-frontend
build-frontend:
	@echo "🏗️ Building frontend..."
	cd frontend && npm run build

.PHONY: test
test: test-backend test-frontend
	@echo "✅ All tests completed!"

.PHONY: test-backend
test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && $(MAKE) test

.PHONY: test-frontend
test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test:ci

.PHONY: test-coverage
test-coverage:
	@echo "📊 Running tests with coverage..."
	cd backend && $(MAKE) test-coverage
	cd frontend && npm run test:coverage

.PHONY: lint
lint:
	@echo "🔍 Running linting..."
	cd backend && $(MAKE) lint
	cd frontend && npm run lint

# =============================================================================
# Database Commands
# =============================================================================

.PHONY: db-start
db-start:
	@echo "🗄️ Starting database..."
	$(DOCKER_COMPOSE) up -d db

.PHONY: db-stop
db-stop:
	@echo "🛑 Stopping database..."
	$(DOCKER_COMPOSE) stop db

.PHONY: db-reset
db-reset:
	@echo "🔄 Resetting database..."
	$(DOCKER_COMPOSE) down db
	$(DOCKER_COMPOSE) rm -f db
	docker volume rm tennis-connect_postgres_data || true
	$(MAKE) db-start
	@echo "⏳ Waiting for database to be ready..."
	@sleep 10
	$(MAKE) db-migrate

.PHONY: db-migrate
db-migrate:
	@echo "📈 Running database migrations..."
	cd backend && $(MAKE) migrate

.PHONY: db-seed
db-seed:
	@echo "🌱 Seeding database with test data..."
	# TODO: Implement database seeding
	@echo "Database seeding not yet implemented"

.PHONY: db-backup
db-backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec db pg_dump -U postgres tennis_connect_dev > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup created in backups/"

# =============================================================================
# Deployment Commands
# =============================================================================

.PHONY: deploy-dev
deploy-dev:
	@echo "🚀 Deploying to development environment..."
	APP_ENV=development $(DOCKER_COMPOSE_DEV) up -d --build
	@echo "✅ Deployed to development!"

.PHONY: deploy-staging
deploy-staging:
	@echo "🚀 Deploying to staging environment..."
	APP_ENV=staging $(DOCKER_COMPOSE_PROD) up -d --build
	@echo "✅ Deployed to staging!"

.PHONY: deploy-prod
deploy-prod:
	@echo "🚀 Deploying to production environment..."
	@echo "⚠️  Are you sure you want to deploy to production? [y/N]"
	@read -r REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		APP_ENV=production $(DOCKER_COMPOSE_PROD) up -d --build; \
		echo "✅ Deployed to production!"; \
	else \
		echo "❌ Deployment cancelled."; \
	fi

# =============================================================================
# Maintenance Commands
# =============================================================================

.PHONY: clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd backend && $(MAKE) clean
	cd frontend && npm run clean || rm -rf frontend/build frontend/node_modules

.PHONY: clean-docker
clean-docker:
	@echo "🧹 Cleaning Docker resources..."
	$(DOCKER_COMPOSE) down --rmi all --volumes --remove-orphans
	docker system prune -f

.PHONY: clean-all
clean-all: clean clean-docker
	@echo "✅ Everything cleaned!"

# =============================================================================
# Development Helpers
# =============================================================================

.PHONY: backend-shell
backend-shell:
	$(DOCKER_COMPOSE_DEV) exec backend sh

.PHONY: frontend-shell
frontend-shell:
	$(DOCKER_COMPOSE_DEV) exec frontend sh

.PHONY: db-shell
db-shell:
	$(DOCKER_COMPOSE) exec db psql -U postgres tennis_connect_dev

.PHONY: install-deps
install-deps:
	@echo "📦 Installing all dependencies..."
	cd backend && go mod download
	cd frontend && npm install

.PHONY: update-deps
update-deps:
	@echo "⬆️ Updating dependencies..."
	cd backend && go mod tidy
	cd frontend && npm update

# =============================================================================
# CI/CD Commands
# =============================================================================

.PHONY: ci-test
ci-test:
	@echo "🔄 Running CI tests..."
	$(MAKE) lint
	$(MAKE) test-coverage

.PHONY: ci-build
ci-build:
	@echo "🔄 Running CI build..."
	$(MAKE) build

.PHONY: ci-deploy
ci-deploy: ci-test ci-build
	@echo "🔄 Running CI deployment..."
	# This would be customized for your CI/CD platform

# Default target
.DEFAULT_GOAL := help 