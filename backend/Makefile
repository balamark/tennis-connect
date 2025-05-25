.PHONY: all build run dev test test-unit test-integration clean migrate migrate-up migrate-down

# Build the application
build:
	go build -o bin/tennis-connect-api

# Run the application
run: build
	./bin/tennis-connect-api

# Run with automatic restart on file changes (requires 'air' tool)
dev:
	air

# Run all tests
test:
	go test -v ./...

# Run unit tests only
test-unit:
	go test -v -short ./...

# Run integration tests only
test-integration:
	go test -v -run Integration ./...

# Clean build artifacts
clean:
	rm -rf bin

# Run database migrations
migrate:
	go run cmd/migrate/main.go

# Run database migrations up
migrate-up:
	go run cmd/migrate/main.go up

# Run database migrations down
migrate-down:
	go run cmd/migrate/main.go down

# Initialize a new development environment
init-dev:
	cp ../.env.example .env
	go mod download
	go build -o bin/tennis-connect-api

# Help command
help:
	@echo "Available commands:"
	@echo "  make build             - Build the application"
	@echo "  make run               - Build and run the application"
	@echo "  make dev               - Run with automatic restart on file changes"
	@echo "  make test              - Run all tests"
	@echo "  make test-unit         - Run unit tests only"
	@echo "  make test-integration  - Run integration tests only"
	@echo "  make clean             - Clean build artifacts"
	@echo "  make migrate           - Run database migrations"
	@echo "  make migrate-up        - Run database migrations up"
	@echo "  make migrate-down      - Run database migrations down"
	@echo "  make init-dev          - Initialize a new development environment" 