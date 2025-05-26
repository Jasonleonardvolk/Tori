# TORI Memory Consolidation Services Makefile

# Global configuration
PYTHON_VERSION ?= 3.11
MEMORY_SYSTEM_VERSION ?= 1.0.0
REGISTRY ?= localhost:5000

.PHONY: all setup proto run test lint clean dev-up dev-down restart logs grafana view \
        containers-build containers-build-all containers-clean containers-dev containers-test

# Default target
all: setup proto

# Setup development environment
setup:
	@echo "Setting up development environment..."
	python -m pip install -r requirements.txt
	mkdir -p ~/.tori
	mkdir -p ~/.tori/kcl_inbox
	mkdir -p ~/.tori/pruner_backups
	@echo "Development environment set up successfully"

# Generate Protocol Buffer code
proto:
	@echo "Generating Python code from Protocol Buffer definitions..."
	python generate_protos.py
	@echo "Protocol Buffer code generated successfully"

# Run individual services for development
run-vault:
	@echo "Running EpisodicVault service..."
	python -m mcp_services.episodic_vault.server --debug

run-scheduler:
	@echo "Running SleepScheduler service..."
	python -m mcp_services.sleep_scheduler.server --debug

run-pruner:
	@echo "Running SparsePruner service..."
	python -m mcp_services.sparse_pruner.server --debug

run-kcl:
	@echo "Running KoopmanLearner service..."
	python -m mcp_services.koopman_learner.server --debug

# Run tests
test:
	@echo "Running tests..."
	pytest -xvs tests/

# Run linting
lint:
	@echo "Running linters..."
	black mcp_services/
	isort mcp_services/
	pylint mcp_services/
	mypy mcp_services/

# Clean up generated files
clean:
	@echo "Cleaning up generated files..."
	python generate_protos.py --clean
	find . -name "__pycache__" -type d -exec rm -rf {} +
	find . -name "*.pyc" -delete
	find . -name "*.pyo" -delete
	find . -name "*.pyd" -delete
	find . -name ".pytest_cache" -type d -exec rm -rf {} +
	find . -name ".coverage" -delete
	find . -name "htmlcov" -type d -exec rm -rf {} +
	@echo "Cleanup complete"

# Docker Compose commands for development
dev-up:
	@echo "Starting development environment with Docker Compose..."
	docker-compose up -d

dev-down:
	@echo "Stopping development environment..."
	docker-compose down

restart:
	@echo "Restarting development environment..."
	docker-compose restart

logs:
	@echo "Showing logs from all services..."
	docker-compose logs -f

# Service-specific logs
logs-vault:
	docker-compose logs -f episodic-vault

logs-scheduler:
	docker-compose logs -f sleep-scheduler

logs-pruner:
	docker-compose logs -f sparse-pruner

logs-kcl:
	docker-compose logs -f koopman-learner

# Open Grafana dashboard
grafana:
	@echo "Opening Grafana dashboard..."
	python -c "import webbrowser; webbrowser.open('http://localhost:3000')"

# Open control panel
view:
	@echo "Opening control panel..."
	python -c "import webbrowser; webbrowser.open('http://localhost:8080')"

# Init directories for services
init-directories:
	@echo "Creating service directories..."
	mkdir -p mcp_services/episodic_vault/proto
	mkdir -p mcp_services/sleep_scheduler/proto
	mkdir -p mcp_services/sparse_pruner/proto
	mkdir -p mcp_services/koopman_learner/proto
	mkdir -p mcp_services/common
	mkdir -p tests/episodic_vault
	mkdir -p tests/sleep_scheduler
	mkdir -p tests/sparse_pruner
	mkdir -p tests/koopman_learner
	mkdir -p logs
	mkdir -p control_panel
	mkdir -p scripts
	touch mcp_services/__init__.py
	touch mcp_services/episodic_vault/__init__.py
	touch mcp_services/sleep_scheduler/__init__.py
	touch mcp_services/sparse_pruner/__init__.py
	touch mcp_services/koopman_learner/__init__.py
	touch mcp_services/common/__init__.py
	chmod +x scripts/dev-entrypoint.sh
	chmod +x build-system.sh
	@echo "Service directories created successfully"

# Container build targets
containers-build:
	@echo "🐳 Building containers..."
	./build-system.sh build $(SERVICE) $(ENV)

containers-build-all:
	@echo "🐳 Building all containers for all environments..."
	./build-system.sh build-all

containers-dev:
	@echo "🔧 Building development containers..."
	@for service in episodic_vault sleep_scheduler sparse_pruner koopman_learner; do \
		./build-system.sh build $$service dev; \
	done

containers-test:
	@echo "🧪 Building test containers..."
	@for service in episodic_vault sleep_scheduler sparse_pruner koopman_learner; do \
		./build-system.sh build $$service test; \
	done

containers-clean:
	@echo "🧹 Cleaning container artifacts..."
	./build-system.sh clean
	@docker system prune -f

# Development workflow with containers
dev-up-containers: containers-dev
	@echo "🚀 Starting development environment with containers..."
	@docker-compose -f docker-compose.dev.yml up -d

# Testing workflow with containers
test-containers: containers-test
	@echo "🧪 Running container tests..."
	@docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Production deployment
prod-build: containers-build-all
	@echo "🏭 Building production containers..."
	@./build-system.sh build-all prod

prod-push: prod-build
	@echo "📤 Pushing to registry..."
	@docker images --format "table {{.Repository}}:{{.Tag}}" | grep "$(REGISTRY)/tori-memory" | \
		while read image; do docker push "$$image"; done

# Help command
help:
	@echo "TORI Memory Consolidation Services Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  all                Run setup and proto targets"
	@echo "  setup              Set up development environment"
	@echo "  proto              Generate Protocol Buffer code"
	@echo "  run-vault          Run EpisodicVault service"
	@echo "  run-scheduler      Run SleepScheduler service"
	@echo "  run-pruner         Run SparsePruner service"
	@echo "  run-kcl            Run KoopmanLearner service"
	@echo "  test               Run tests"
	@echo "  lint               Run linters"
	@echo "  clean              Clean up generated files"
	@echo "  dev-up             Start development environment with Docker Compose"
	@echo "  dev-down           Stop development environment"
	@echo "  restart            Restart development environment"
	@echo "  logs               Show logs from all services"
	@echo "  logs-vault         Show logs from EpisodicVault service"
	@echo "  logs-scheduler     Show logs from SleepScheduler service"
	@echo "  logs-pruner        Show logs from SparsePruner service"
	@echo "  logs-kcl           Show logs from KoopmanLearner service"
	@echo "  grafana            Open Grafana dashboard"
	@echo "  view               Open control panel"
	@echo "  init-directories   Create directory structure for services"
	@echo "  containers-build   Build specific container (requires SERVICE and ENV)"
	@echo "  containers-build-all Build all containers for all environments"
	@echo "  containers-dev     Build all development containers"
	@echo "  containers-test    Build all test containers"
	@echo "  containers-clean   Clean container artifacts"
	@echo "  dev-up-containers  Start development environment with containers"
	@echo "  test-containers    Run tests in containers"
	@echo "  prod-build         Build production containers"
	@echo "  prod-push          Push production containers to registry"
	@echo "  help               Show this help message"
