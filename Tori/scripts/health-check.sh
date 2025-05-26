#!/bin/bash
# scripts/health-check.sh - Health check script for TORI memory services

set -euo pipefail

# Get service name from argument or environment variable
SERVICE_NAME=${1:-${TORI_SERVICE_NAME:-unknown}}

# Determine the metrics port based on service
if [[ "${SERVICE_NAME}" == "episodic_vault" ]]; then
    METRICS_PORT=${METRICS_PORT:-9091}
elif [[ "${SERVICE_NAME}" == "sleep_scheduler" ]]; then
    METRICS_PORT=${METRICS_PORT:-9092}
elif [[ "${SERVICE_NAME}" == "sparse_pruner" ]]; then
    METRICS_PORT=${METRICS_PORT:-9093}
elif [[ "${SERVICE_NAME}" == "koopman_learner" ]]; then
    METRICS_PORT=${METRICS_PORT:-9094}
else
    METRICS_PORT=${METRICS_PORT:-9090}
fi

# Check if metrics endpoint is accessible
if ! curl -s -f "http://localhost:${METRICS_PORT}/metrics" > /dev/null; then
    echo "❌ Metrics endpoint not accessible"
    exit 1
fi

# Check gRPC service health using grpcurl (if available)
if command -v grpcurl &> /dev/null; then
    if ! grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check > /dev/null 2>&1; then
        echo "❌ gRPC health check failed"
        exit 1
    fi
fi

# Check service-specific health indicators
case "${SERVICE_NAME}" in
    episodic_vault)
        # Check if episodic vault can list episodes
        if ! python -c "
import os
import sys
try:
    from mcp_services.episodic_vault.client import VaultClient
    client = VaultClient()
    client.list_recent(limit=1)
    sys.exit(0)
except Exception as e:
    print(f'Health check failed: {e}')
    sys.exit(1)
" > /dev/null 2>&1; then
            echo "❌ EpisodicVault service health check failed"
            exit 1
        fi
        ;;
        
    sleep_scheduler)
        # Check if scheduler metrics exist
        if ! curl -s "http://localhost:${METRICS_PORT}/metrics" | grep -q "tori_memory_scheduler"; then
            echo "❌ SleepScheduler metrics not found"
            exit 1
        fi
        ;;
        
    sparse_pruner)
        # Check if pruner metrics exist
        if ! curl -s "http://localhost:${METRICS_PORT}/metrics" | grep -q "tori_memory_pruner"; then
            echo "❌ SparsePruner metrics not found"
            exit 1
        fi
        ;;
        
    koopman_learner)
        # Check if KCL metrics exist
        if ! curl -s "http://localhost:${METRICS_PORT}/metrics" | grep -q "tori_memory_kcl"; then
            echo "❌ KoopmanLearner metrics not found"
            exit 1
        fi
        ;;
        
    *)
        # Generic check
        echo "ℹ️ No service-specific health check for ${SERVICE_NAME}"
        ;;
esac

# Check resource usage
MEM_USAGE=$(ps -o rss= -p "$$" | awk '{print $1/1024}')
CPU_USAGE=$(ps -o %cpu= -p "$$" | awk '{print $1}')

if (( $(echo "${MEM_USAGE} > 1024" | bc -l) )); then
    echo "⚠️ High memory usage: ${MEM_USAGE} MB"
fi

if (( $(echo "${CPU_USAGE} > 90" | bc -l) )); then
    echo "⚠️ High CPU usage: ${CPU_USAGE}%"
fi

# All checks passed
echo "✅ Service ${SERVICE_NAME} is healthy"
exit 0
