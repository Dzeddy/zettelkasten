.PHONY: build run test clean docker-build docker-run deps fmt lint

# Variables
BINARY_NAME=zettelkasten
DOCKER_IMAGE=zettelkasten-backend
GO_VERSION=1.21

# Build the application
build:
	go build -o $(BINARY_NAME) ./cmd/main.go

# Run the application
run:
	go run ./cmd/main.go

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	go clean
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Build Docker image
docker-build:
	docker build -t $(DOCKER_IMAGE) .

# Run with Docker Compose
docker-run:
	docker-compose up --build

# Run only dependencies (MongoDB, Redis)
docker-deps:
	docker-compose up mongo redis

# Stop Docker services
docker-stop:
	docker-compose down

# Development setup
dev-setup: deps
	cp env.example .env
	@echo "Please edit .env with your API keys"

# Production build
build-prod:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o $(BINARY_NAME) ./cmd/main.go

# Database migrations (placeholder)
migrate:
	@echo "Database migrations not implemented yet"

# Flush all databases and caches
flush-all:
	./scripts/flush_databases.sh

# Flush only MongoDB
flush-mongodb:
	./scripts/flush_databases.sh --mongodb-only

# Flush only Redis cache
flush-redis:
	./scripts/flush_databases.sh --redis-only

# Flush only Pinecone vectors
flush-pinecone:
	./scripts/flush_databases.sh --pinecone-only

# Flush databases without Pinecone
flush-no-pinecone:
	./scripts/flush_databases.sh --skip-pinecone

# Build and run Go flush utility
flush-go:
	go run ./cmd/flush/main.go

# Build Go flush utility
build-flush:
	go build -o flush ./cmd/flush/main.go

# Generate API documentation
docs:
	@echo "API documentation available in README.md"

# Health check
health:
	curl -f http://localhost:8080/health || exit 1

# Load test (requires hey tool)
load-test:
	hey -n 1000 -c 10 http://localhost:8080/health

# Security scan
security-scan:
	gosec ./...

# Benchmark tests
benchmark:
	go test -bench=. -benchmem ./...

# Install development tools
install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest

# Help
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  run           - Run the application"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  clean         - Clean build artifacts"
	@echo "  deps          - Install dependencies"
	@echo "  fmt           - Format code"
	@echo "  lint          - Lint code"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run with Docker Compose"
	@echo "  docker-deps   - Run only MongoDB and Redis"
	@echo "  docker-stop   - Stop Docker services"
	@echo "  dev-setup     - Set up development environment"
	@echo "  build-prod    - Production build"
	@echo "  flush-all     - Flush all databases and caches"
	@echo "  flush-mongodb - Flush only MongoDB"
	@echo "  flush-redis   - Flush only Redis cache"
	@echo "  flush-pinecone - Flush only Pinecone vectors"
	@echo "  flush-no-pinecone - Flush databases without Pinecone"
	@echo "  health        - Health check"
	@echo "  load-test     - Load test (requires hey)"
	@echo "  security-scan - Security scan"
	@echo "  benchmark     - Run benchmark tests"
	@echo "  install-tools - Install development tools"
	@echo "  help          - Show this help" 