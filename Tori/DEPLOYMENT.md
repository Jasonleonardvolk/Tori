# TORI Memory System Deployment Guide

This guide provides instructions for deploying the TORI Memory Consolidation & Koopman Continual Learner system.

## Quick Start

```bash
# Initialize required directories
make init-directories

# Build development containers
make containers-dev

# Start development environment
make dev-up-containers

# Open Grafana dashboard
make open-grafana

# Run a put-get test on EpisodicVault
docker compose run vault-cli put-get-loop 50

# Trigger a consolidation cycle
docker compose exec sleep-scheduler python -m mcp_services.sleep_scheduler.trigger --once

# View logs
docker compose logs -f
```

## Architecture Overview

The system consists of four main services:

1. **EpisodicVault** (port 50051, metrics 9091) - Stores raw episodes of concept activations
2. **SleepScheduler** (port 50052, metrics 9092) - Performs energy-based replay for memory consolidation
3. **SparsePruner** (port 50053, metrics 9093) - Optimizes the concept graph using L1 regularization
4. **KoopmanLearner** (port 50054, metrics 9094) - Extracts spectral modes and updates oscillator couplings

These services communicate via gRPC and Redis pub/sub messaging. Metrics are collected by Prometheus and visualized in Grafana.

## Development Environment

### Prerequisites

- Docker and Docker Compose
- Make
- Python 3.11+
- Protobuf compiler (protoc)

### Setup Development Environment

1. Initialize directories:

```bash
make init-directories
```

2. Generate Protocol Buffer code:

```bash
make proto
```

3. Build development containers:

```bash
make containers-dev
```

4. Start development environment:

```bash
make dev-up-containers
```

5. View logs:

```bash
make logs
```

6. Access services:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (admin/tori-memory)
   - Service metrics:
     - EpisodicVault: http://localhost:9091/metrics
     - SleepScheduler: http://localhost:9092/metrics
     - SparsePruner: http://localhost:9093/metrics
     - KoopmanLearner: http://localhost:9094/metrics

### Debugging Services

You can debug services using VS Code:

1. Press F5 and select the service you want to debug
2. Set breakpoints in the Python code
3. Trigger actions via the CLI tools

## Load Testing

Run a 24-hour soak test:

```bash
# Start the load generator
docker compose up -d loadgen

# Monitor in Grafana
make open-grafana

# Stop the load generator when finished
make soak-stop
```

Key metrics to monitor:
- EpisodicVault: vault_episode_count, vault_size_mb
- SleepScheduler: consol_ops_total, energy_delta
- SparsePruner: pruned_edges_total, edge_count
- KoopmanLearner: kcl_modes_total, coupling_updates_total

## Production Deployment

### Secrets Management

1. Generate an API key:

```bash
make generate-secret-key
```

2. Start secrets management:

```bash
make secrets-up
```

### Building Production Containers

```bash
make prod-build
```

### Pushing to Registry

```bash
make prod-push
```

### Canary Deployment

For production deployment, it's recommended to use a canary approach:

1. Deploy the system with a 1% shard in the gateway
2. Monitor performance metrics for 48 hours
3. If stable, gradually increase the shard percentage (e.g., 1% → 50% → 100%)

## Tuning Parameters

Key parameters that might need tuning:

| Parameter | Description | Default | Adjust if |
|-----------|-------------|---------|-----------|
| Anneal T₀ | Initial temperature | 2.0 | Energy drop < 5% → raise; settle loops > 50 → lower |
| Learning η | Learning rate | 0.01 | ΔE oscillates → halve η |
| Sparsity τ | L1 regularization strength | 0.001 | Graph growth > 5%/week → raise by ×1.5 |
| KCL rank r | DMD rank | 50 | ψ-drift > 0.2 rad → raise to 75 |

These parameters can be adjusted in `docker-compose.override.yml`.

## Health Checks

Check the health of all services:

```bash
for svc in episodic-vault sleep-scheduler sparse-pruner koopman-learner; do
  docker compose exec $svc scripts/health-check.sh && echo "$svc OK"
done
```

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| SleepScheduler restart loop | Bad path in entrypoint script | Check logs and environment variables |
| gRPC timeouts | Default timeout too short | Add GRPC_MAX_CONNECTION_AGE_MS=300000 to service env |
| Pruner deletes too much | τ too high | Lower PRUNE_L1_THRESHOLD in override file |
| KCL modes count growing | Sparsity too low | Increase KCL_L1_STRENGTH in override file |

## MCP Gateway Integration

The memory system is integrated with the MCP gateway to expose its functionality to other systems.

Key endpoints:
- `memory.put` - Store an episode in the EpisodicVault
- `memory.sleep` - Trigger memory consolidation
- `memory.prune` - Trigger graph pruning
- `memory.kcl_status` - Get spectral modes from the KoopmanLearner

Front-end integration:

```javascript
import { mcp } from 'lib/mcpClient';

// Store an episode
await mcp('memory.put', { episodeBlob, meta });

// Trigger consolidation
await mcp('memory.sleep', { once: true });
