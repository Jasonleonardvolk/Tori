#!/bin/bash
# scripts/dev-entrypoint.sh - Development environment entrypoint for TORI memory services

set -euo pipefail

SERVICE_NAME=${TORI_SERVICE_NAME:-unknown}

echo "🚀 Starting TORI Memory Service Development Environment"
echo "Service: ${SERVICE_NAME}"
echo "Mode: ${MEMORY_CONSOLIDATION_MODE:-debug}"

# Generate Python stubs from proto files if needed
if [ ! -d "/app/mcp_services/${SERVICE_NAME}/proto" ] || [ -z "$(ls -A /app/mcp_services/${SERVICE_NAME}/proto 2>/dev/null)" ]; then
    echo "🔄 Generating protobuf code..."
    if command -v python -m generate_protos &> /dev/null; then
        python -m generate_protos
    else
        echo "⚠️ generate_protos module not found. Proto files will be generated at runtime."
    fi
fi

# Initialize directories with proper permissions
mkdir -p /app/data
mkdir -p /app/logs
mkdir -p /app/checkpoints

# Service-specific data directories
case "${SERVICE_NAME}" in
    episodic_vault)
        mkdir -p /app/data/vault
        ;;
    sleep_scheduler)
        mkdir -p /app/data/scheduler
        mkdir -p /app/data/kcl_inbox
        ;;
    sparse_pruner)
        mkdir -p /app/data/pruner_backups
        ;;
    koopman_learner)
        mkdir -p /app/data/kcl_modes
        mkdir -p /app/data/kcl_inbox
        ;;
esac

# Handle signals properly
function handle_sigterm() {
    echo "Received SIGTERM, shutting down gracefully..."
    kill -TERM "$PID" 2>/dev/null
    wait "$PID"
    exit 0
}

trap handle_sigterm SIGTERM

# Start the service with hot reload based on service type
case "${SERVICE_NAME}" in
    episodic_vault)
        echo "📦 Starting EpisodicVault service with hot reload (port 50051, metrics 9091)..."
        python -m watchdog.watchmedo auto-restart \
            --directory=/app/mcp_services/episodic_vault \
            --pattern="*.py" \
            --recursive \
            -- python -m mcp_services.episodic_vault.server --debug &
        ;;
    sleep_scheduler)
        echo "😴 Starting SleepScheduler service with hot reload (port 50051, metrics 9092)..."
        python -m watchdog.watchmedo auto-restart \
            --directory=/app/mcp_services/sleep_scheduler \
            --pattern="*.py" \
            --recursive \
            -- python -m mcp_services.sleep_scheduler.server --debug &
        ;;
    sparse_pruner)
        echo "✂️ Starting SparsePruner service with hot reload (port 50051, metrics 9093)..."
        python -m watchdog.watchmedo auto-restart \
            --directory=/app/mcp_services/sparse_pruner \
            --pattern="*.py" \
            --recursive \
            -- python -m mcp_services.sparse_pruner.server --debug &
        ;;
    koopman_learner)
        echo "🧠 Starting KoopmanLearner service with hot reload (port 50051, metrics 9094)..."
        python -m watchdog.watchmedo auto-restart \
            --directory=/app/mcp_services/koopman_learner \
            --pattern="*.py" \
            --recursive \
            -- python -m mcp_services.koopman_learner.server --debug &
        ;;
    *)
        echo "⚠️ Unknown service: ${SERVICE_NAME}. Starting generic service..."
        python -m "mcp_services.${SERVICE_NAME}.server" --debug &
        ;;
esac

PID=$!
wait "$PID"
