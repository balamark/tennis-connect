# Tennis Connect Backend Makefile

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  setup          - Set up development environment"
	@echo "  run            - Run the application"
	@echo "  dev            - Run with hot reload (requires air)"
	@echo "  build          - Build the application"
	@echo "  test           - Run all tests"
	@echo "  test-unit      - Run unit tests"
	@echo "  test-integration - Run integration tests"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  lint           - Run linter"
	@echo "  fmt            - Format code"
	@echo "  migrate        - Run database migrations"
	@echo "  migrate-down   - Rollback database migrations"
	@echo "  migrate-create - Create new migration (name=migration_name)"
	@echo "  db-setup       - Set up development database"
	@echo "  db-reset       - Reset development database"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run Docker container"
	@echo "  clean          - Clean build files"

# Variables
APP_NAME := tennis-connect-api
BUILD_DIR := bin
DOCKER_TAG := tennis-connect-backend:latest
MIGRATION_DIR := migrations

# Go related variables
GOCMD := go
GOBUILD := $(GOCMD) build
GOTEST := $(GOCMD) test
GOCLEAN := $(GOCMD) clean
GOGET := $(GOCMD) get
GOMOD := $(GOCMD) mod
GOFMT := $(GOCMD) fmt

# Load environment variables
ifneq (,$(wildcard ../.env))
    include ../.env
    export
endif

# Setup development environment
.PHONY: setup
setup:
	@echo "Setting up development environment..."
	$(GOMOD) download
	$(GOMOD) tidy
	@echo "Installing development tools..."
	$(GOGET) github.com/cosmtrek/air@latest
	$(GOGET) github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Setup complete!"

# Build the application
.PHONY: build
build:
	@echo "Building $(APP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 GOOS=linux $(GOBUILD) -a -installsuffix cgo -o $(BUILD_DIR)/$(APP_NAME) .
	@echo "Build complete: $(BUILD_DIR)/$(APP_NAME)"

# Run the application
.PHONY: run
run:
	@echo "Starting $(APP_NAME)..."
	$(GOCMD) run main.go

# Run with hot reload
.PHONY: dev
dev:
	@echo "Starting $(APP_NAME) with hot reload..."
	@if ! command -v air > /dev/null; then \
		echo "Installing air for hot reload..."; \
		$(GOGET) github.com/cosmtrek/air@latest; \
	fi
	air

# Run all tests
.PHONY: test
test:
	@echo "Running all tests..."
	$(GOTEST) -v ./...

# Run unit tests
.PHONY: test-unit
test-unit:
	@echo "Running unit tests..."
	$(GOTEST) -v -short ./...

# Run integration tests
.PHONY: test-integration
test-integration:
	@echo "Running integration tests..."
	$(GOTEST) -v -run Integration ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run linter
.PHONY: lint
lint:
	@echo "Running linter..."
	@if ! command -v golangci-lint > /dev/null; then \
		echo "Installing golangci-lint..."; \
		$(GOGET) github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
	fi
	golangci-lint run

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	$(GOFMT) ./...

# Database migrations
.PHONY: migrate
migrate:
	@echo "Running database migrations..."
	$(GOCMD) run cmd/migrate/main.go up

.PHONY: migrate-down
migrate-down:
	@echo "Rolling back database migrations..."
	$(GOCMD) run cmd/migrate/main.go down

.PHONY: migrate-create
migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: Please provide migration name. Usage: make migrate-create name=migration_name"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)"
	$(GOCMD) run cmd/migrate/main.go create $(name)

# Database setup and management
.PHONY: db-setup
db-setup:
	@echo "Setting up development database..."
	@docker-compose -f ../docker-compose.yml up -d db
	@sleep 5  # Wait for database to be ready
	@echo "Database is ready!"

.PHONY: db-reset
db-reset:
	@echo "Resetting development database..."
	@docker-compose -f ../docker-compose.yml down db
	@docker-compose -f ../docker-compose.yml up -d db
	@sleep 5
	$(MAKE) migrate
	@echo "Database reset complete!"

# Docker operations
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_TAG) .

.PHONY: docker-run
docker-run: docker-build
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file ../.env $(DOCKER_TAG)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning..."
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)
	rm -f coverage.out coverage.html

# Development workflow targets
.PHONY: dev-setup
dev-setup: setup db-setup migrate
	@echo "Development environment ready!"

.PHONY: dev-reset
dev-reset: db-reset
	@echo "Development environment reset!"

.PHONY: pre-commit
pre-commit: fmt lint test
	@echo "Pre-commit checks passed!"

# CI/CD targets
.PHONY: ci-test
ci-test: test-coverage lint
	@echo "CI tests completed!"

.PHONY: ci-build
ci-build: build docker-build
	@echo "CI build completed!" 