#!/bin/bash
# scripts/prod-entrypoint.sh - Production environment entrypoint for TORI memory services

set -euo pipefail

echo "🚀 Starting TORI Memory Service Production Environment"
echo "Service: ${TORI_SERVICE_NAME:-unknown}"
echo "Mode: ${MEMORY_CONSOLIDATION_MODE:-production}"

# Generate Python stubs from proto files if they don't exist
if [ ! -d "/app/mcp_services/${TORI_SERVICE_NAME}/proto" ] || [ -z "$(ls -A /app/mcp_services/${TORI_SERVICE_NAME}/proto)" ]; then
    echo "🔄 Generating protobuf code..."
    python -m generate_protos
fi

# Initialize directories with proper permissions
mkdir -p /app/data
mkdir -p /app/logs
mkdir -p /app/checkpoints

# Set resource limits if specified
if [[ -n "${MEMORY_LIMIT:-}" ]]; then
    echo "Setting memory limit to ${MEMORY_LIMIT}"
    # In a real environment, this would use cgroups or container runtime settings
fi

# Handle signals properly
function handle_sigterm() {
    echo "Received SIGTERM, shutting down gracefully..."
    # Add any cleanup code here
    exit 0
}

trap handle_sigterm SIGTERM

# Start the service based on service type
if [[ "${TORI_SERVICE_NAME}" == "episodic_vault" ]]; then
    echo "📦 Starting EpisodicVault service (port 50051, metrics 9091)..."
    python -m mcp_services.episodic_vault.server
    
elif [[ "${TORI_SERVICE_NAME}" == "sleep_scheduler" ]]; then
    echo "😴 Starting SleepScheduler service (port 50051, metrics 9092)..."
    python -m mcp_services.sleep_scheduler.server
    
elif [[ "${TORI_SERVICE_NAME}" == "sparse_pruner" ]]; then
    echo "✂️ Starting SparsePruner service (port 50051, metrics 9093)..."
    python -m mcp_services.sparse_pruner.server
    
elif [[ "${TORI_SERVICE_NAME}" == "koopman_learner" ]]; then
    echo "🧠 Starting KoopmanLearner service (port 50051, metrics 9094)..."
    python -m mcp_services.koopman_learner.server
    
else
    echo "⚠️ Unknown service: ${TORI_SERVICE_NAME}. Starting generic service..."
    python -m "mcp_services.${TORI_SERVICE_NAME}.server"
fi
