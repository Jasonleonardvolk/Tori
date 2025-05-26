#!/bin/bash
# build-system.sh - Container build orchestrator for TORI memory consolidation services

set -euo pipefail

# Configuration
REGISTRY=${REGISTRY:-"localhost:5000"}
PYTHON_VERSION=${PYTHON_VERSION:-"3.11"}
MEMORY_SYSTEM_VERSION=${MEMORY_SYSTEM_VERSION:-"1.0.0"}

# Available services
SERVICES=(
    "episodic_vault"
    "sleep_scheduler" 
    "sparse_pruner"
    "koopman_learner"
)

# Build environments
ENVIRONMENTS=("dev" "prod" "test")

# Function to generate service-specific Dockerfile
generate_service_dockerfile() {
    local service=$1
    local env=$2
    local output_file="Dockerfile.${service}.${env}"
    
    echo "Generating ${output_file}..."
    
    cat > "${output_file}" << EOF
# Auto-generated Dockerfile for ${service} (${env})
# Generated at: $(date)
# Memory System Version: ${MEMORY_SYSTEM_VERSION}

ARG PYTHON_VERSION=${PYTHON_VERSION}
ARG SERVICE_NAME=${service}
ARG BUILD_ENV=${env}

# Import base template
$(cat Dockerfile.template)

# Service-specific optimizations
$(generate_service_optimizations "${service}" "${env}")
EOF

    echo "✅ Generated ${output_file}"
}

# Function to generate service-specific optimizations
generate_service_optimizations() {
    local service=$1
    local env=$2
    
    case "${service}" in
        "episodic_vault")
            cat << EOF
# EpisodicVault specific optimizations
ENV VAULT_DB_PATH=/app/data/vault/episodic.db
ENV TTL_HOURS=48
ENV MAX_EPISODES=100000
ENV METRICS_PORT=9091
EOF
            ;;
        "sleep_scheduler")
            cat << EOF
# SleepScheduler specific optimizations
ENV SCHEDULER_WEIGHTS_PATH=/app/data/scheduler/weights.npz
ENV INITIAL_TEMPERATURE=2.0
ENV COOLING_RATE=0.95
ENV ANNEALING_STEPS=1000
ENV LEARNING_RATE=0.01
ENV NEGATIVE_SAMPLES=5
ENV L1_REGULARIZATION=0.001
ENV METRICS_PORT=9092
EOF
            ;;
        "sparse_pruner")
            cat << EOF
# SparsePruner specific optimizations
ENV PRUNER_BACKUP_DIR=/app/data/pruner_backups
ENV L1_STRENGTH=0.01
ENV MIN_EDGE_WEIGHT=0.001
ENV RETENTION_TARGET=0.9
ENV MAX_QUALITY_DROP=0.05
ENV METRICS_PORT=9093
EOF
            ;;
        "koopman_learner")
            cat << EOF
# KoopmanLearner specific optimizations
ENV KCL_MODES_PATH=/app/data/kcl_modes/modes.npz
ENV KCL_INBOX_DIR=/app/data/kcl_inbox
ENV DMD_RANK=50
ENV MAX_MODES=100
ENV L1_STRENGTH=0.01
ENV COUPLING_UPDATE_INTERVAL=3600
ENV METRICS_PORT=9094
EOF
            ;;
        *)
            echo "# Standard service configuration"
            ;;
    esac
}

# Function to build all services
build_all_services() {
    local env=${1:-prod}
    
    echo "Building all services for environment: ${env}"
    
    for service in "${SERVICES[@]}"; do
        build_service "${service}" "${env}"
    done
}

# Function to build single service
build_service() {
    local service=$1
    local env=${2:-prod}
    local tag="${REGISTRY}/tori-memory/${service}:${env}-${MEMORY_SYSTEM_VERSION}"
    
    echo "Building ${service} for ${env}..."
    
    # Generate service-specific Dockerfile
    generate_service_dockerfile "${service}" "${env}"
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile.${service}.${env}" ]; then
        echo "❌ Dockerfile not found: Dockerfile.${service}.${env}"
        return 1
    fi
    
    # Create necessary directories
    mkdir -p mcp_services/${service}/proto
    if [ ! -f "mcp_services/${service}/__init__.py" ]; then
        touch "mcp_services/${service}/__init__.py"
    fi
    
    # Build the container
    docker build \
        --file "Dockerfile.${service}.${env}" \
        --build-arg "PYTHON_VERSION=${PYTHON_VERSION}" \
        --build-arg "SERVICE_NAME=${service}" \
        --build-arg "BUILD_ENV=${env}" \
        --tag "${tag}" \
        --progress=plain \
        .
    
    # Save build metadata
    save_build_metadata "${service}" "${env}" "${tag}"
    
    echo "✅ Built ${tag}"
}

# Function to save build metadata
save_build_metadata() {
    local service=$1
    local env=$2
    local tag=$3
    local metadata_file="build_metadata/${service}_${env}.json"
    
    mkdir -p build_metadata
    
    cat > "${metadata_file}" << EOF
{
    "service": "${service}",
    "environment": "${env}",
    "tag": "${tag}",
    "build_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "python_version": "${PYTHON_VERSION}",
    "memory_system_version": "${MEMORY_SYSTEM_VERSION}",
    "dockerfile": "Dockerfile.${service}.${env}",
    "image_id": "$(docker images --format "{{.ID}}" "${tag}" | head -1)"
}
EOF

    echo "✅ Saved metadata to ${metadata_file}"
}

# Function to create a docker-compose file for development
generate_docker_compose_dev() {
    echo "Generating docker-compose.dev.yml..."
    
    cat > "docker-compose.dev.yml" << EOF
version: '3.8'

services:
  # Shared services
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 3
    networks:
      - tori-memory-net

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - tori-memory-net

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=tori-memory
    depends_on:
      - prometheus
    networks:
      - tori-memory-net

EOF

    # Add service containers
    for service in "${SERVICES[@]}"; do
        case "${service}" in
            "episodic_vault")
                cat >> "docker-compose.dev.yml" << EOF
  # EpisodicVault service
  episodic-vault:
    image: ${REGISTRY}/tori-memory/episodic_vault:dev-${MEMORY_SYSTEM_VERSION}
    ports:
      - "50051:50051"
      - "9091:9091"
    volumes:
      - .:/app
      - tori-data:/app/data
    environment:
      - TORI_SERVICE_NAME=episodic_vault
      - METRICS_PORT=9091
      - REDIS_HOST=redis
    depends_on:
      - redis
    networks:
      - tori-memory-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

EOF
                ;;
            "sleep_scheduler")
                cat >> "docker-compose.dev.yml" << EOF
  # SleepScheduler service
  sleep-scheduler:
    image: ${REGISTRY}/tori-memory/sleep_scheduler:dev-${MEMORY_SYSTEM_VERSION}
    ports:
      - "50052:50051"
      - "9092:9091"
    volumes:
      - .:/app
      - tori-data:/app/data
    environment:
      - TORI_SERVICE_NAME=sleep_scheduler
      - METRICS_PORT=9092
      - REDIS_HOST=redis
      - VAULT_ADDRESS=episodic-vault:50051
    depends_on:
      - episodic-vault
      - redis
    networks:
      - tori-memory-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9092/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

EOF
                ;;
            "sparse_pruner")
                cat >> "docker-compose.dev.yml" << EOF
  # SparsePruner service
  sparse-pruner:
    image: ${REGISTRY}/tori-memory/sparse_pruner:dev-${MEMORY_SYSTEM_VERSION}
    ports:
      - "50053:50051"
      - "9093:9091"
    volumes:
      - .:/app
      - tori-data:/app/data
    environment:
      - TORI_SERVICE_NAME=sparse_pruner
      - METRICS_PORT=9093
      - REDIS_HOST=redis
      - SCHEDULER_ADDRESS=sleep-scheduler:50051
    depends_on:
      - sleep-scheduler
      - redis
    networks:
      - tori-memory-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9093/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

EOF
                ;;
            "koopman_learner")
                cat >> "docker-compose.dev.yml" << EOF
  # KoopmanLearner service
  koopman-learner:
    image: ${REGISTRY}/tori-memory/koopman_learner:dev-${MEMORY_SYSTEM_VERSION}
    ports:
      - "50054:50051"
      - "9094:9091"
    volumes:
      - .:/app
      - tori-data:/app/data
    environment:
      - TORI_SERVICE_NAME=koopman_learner
      - METRICS_PORT=9094
      - REDIS_HOST=redis
      - VAULT_ADDRESS=episodic-vault:50051
    depends_on:
      - episodic-vault
      - redis
    networks:
      - tori-memory-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9094/metrics"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

EOF
                ;;
        esac
    done

    # Add networks and volumes
    cat >> "docker-compose.dev.yml" << EOF
networks:
  tori-memory-net:
    driver: bridge

volumes:
  redis-data:
  prometheus-data:
  tori-data:
EOF

    echo "✅ Generated docker-compose.dev.yml"
}

# Function to create a docker-compose file for testing
generate_docker_compose_test() {
    echo "Generating docker-compose.test.yml..."
    
    cat > "docker-compose.test.yml" << EOF
version: '3.8'

services:
  # Base test services
  redis:
    image: redis:alpine
    networks:
      - tori-memory-test-net

EOF

    # Add test containers
    for service in "${SERVICES[@]}"; do
        cat >> "docker-compose.test.yml" << EOF
  # ${service} tests
  ${service}-test:
    image: ${REGISTRY}/tori-memory/${service}:test-${MEMORY_SYSTEM_VERSION}
    volumes:
      - .:/app
      - tori-test-data:/app/data
    environment:
      - TORI_SERVICE_NAME=${service}
      - REDIS_HOST=redis
      - TESTING=1
    depends_on:
      - redis
    networks:
      - tori-memory-test-net

EOF
    done

    # Add networks and volumes
    cat >> "docker-compose.test.yml" << EOF
networks:
  tori-memory-test-net:
    driver: bridge

volumes:
  tori-test-data:
EOF

    echo "✅ Generated docker-compose.test.yml"
}

# Main execution
main() {
    case "${1:-help}" in
        "build")
            if [[ $# -eq 3 ]]; then
                build_service "$2" "$3"
            elif [[ $# -eq 2 ]]; then
                build_service "$2"
            else
                build_all_services
            fi
            ;;
        "build-all")
            for env in "${ENVIRONMENTS[@]}"; do
                build_all_services "${env}"
            done
            ;;
        "clean")
            echo "Cleaning generated Dockerfiles and metadata..."
            rm -f Dockerfile.*.* 
            rm -rf build_metadata/
            echo "✅ Cleaned"
            ;;
        "list")
            echo "Available services:"
            printf '%s\n' "${SERVICES[@]}"
            ;;
        "generate-compose")
            generate_docker_compose_dev
            generate_docker_compose_test
            ;;
        *)
            cat << EOF
TORI Memory Consolidation System Container Build System

Usage: $0 <command> [options]

Commands:
    build [service] [env]  - Build specific service (default: all services, prod env)
    build-all              - Build all services for all environments
    clean                  - Remove generated files
    list                   - List available services
    generate-compose       - Generate docker-compose files for dev and test
    help                   - Show this help

Examples:
    $0 build episodic_vault dev
    $0 build sleep_scheduler
    $0 build-all
    $0 clean
    $0 generate-compose

Available services: ${SERVICES[*]}
Available environments: ${ENVIRONMENTS[*]}
EOF
            ;;
    esac
}

# Make script executable
chmod +x "$0"

# Execute main function with all arguments
main "$@"
