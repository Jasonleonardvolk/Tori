# TORI Memory Consolidation & Koopman Continual Learner

This repository contains the implementation of TORI's Lifelong-Learning & Memory-Consolidation services with the Koopman Continual Learner (KCL) system.

## Architecture Overview

The system consists of four main services that work together to provide memory consolidation and continuous learning:

1. **EpisodicVault**: Stores raw episodes of concept activations
2. **SleepScheduler**: Performs energy-based replay for memory consolidation
3. **SparsePruner**: Optimizes the concept graph using L1 regularization
4. **KoopmanLearner**: Extracts spectral modes and updates oscillator couplings

![Architecture Diagram](docs/architecture.png)

## Key Features

- **Episodic Memory Storage**: Efficient storage and retrieval of concept activation patterns
- **Energy-Based Consolidation**: Simulated annealing with wake-sleep updates
- **Sparse Optimization**: L1-regularized pruning for efficient concept graphs
- **Spectral Mode Extraction**: Dynamic Mode Decomposition for predictive modeling
- **Comprehensive Metrics**: Prometheus integration for monitoring and dashboards
- **Docker Compose Setup**: Easy development and deployment

## Getting Started

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- Protobuf compiler (protoc)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/tori-memory.git
cd tori-memory
```

2. Initialize the directory structure:

```bash
make init-directories
```

3. Install dependencies:

```bash
make setup
```

4. Generate Python code from Protocol Buffer definitions:

```bash
make proto
```

### Running the Services

You can run the services individually for development:

```bash
make run-vault     # Run EpisodicVault
make run-scheduler # Run SleepScheduler
make run-pruner    # Run SparsePruner
make run-kcl       # Run KoopmanLearner
```

Or use Docker Compose to run all services together:

```bash
make dev-up        # Start all services
make logs          # View logs from all services
make dev-down      # Stop all services
```

## Component Integration Contract

The services communicate via gRPC and use standardized metrics for monitoring.

### Service Interfaces

- **EpisodicVault**: Provides storage and retrieval of episodes
  - `PutEpisode`: Store a new episode
  - `GetEpisode`: Retrieve an episode by ID
  - `ListRecent`: List recent episodes with filtering

- **SleepScheduler**: Manages memory consolidation
  - `StartConsolidation`: Trigger a consolidation cycle
  - `GetConsolidationStatus`: Check the status of consolidation
  - `UpdateConfig`: Update scheduler configuration

- **SparsePruner**: Optimizes concept connections
  - `TriggerPruning`: Start a pruning operation
  - `GetPruningStatus`: Check pruning status
  - `PreviewPruning`: Preview impact of pruning

- **KoopmanLearner**: Extracts and manages spectral modes
  - `ProcessActivationBatch`: Process concept activation traces
  - `GetSpectralModes`: Retrieve current spectral modes
  - `UpdateOscillatorCouplings`: Update oscillator couplings

### Communication Flow

1. Episodes are stored in the EpisodicVault
2. SleepScheduler retrieves episodes and performs energy-based replay
3. ConceptDeltas are emitted after consolidation
4. SparsePruner optimizes the concept graph periodically
5. KoopmanLearner processes activation traces from consolidation
6. Oscillator couplings are updated based on spectral modes

### Prometheus Metrics

All services expose metrics on dedicated ports:
- EpisodicVault: 9091
- SleepScheduler: 9092
- SparsePruner: 9093
- KoopmanLearner: 9094

Key metrics include:
- `tori_memory_vault_episodes_total`: Total episodes stored
- `tori_memory_scheduler_consol_ops_total`: Consolidation operations
- `tori_memory_pruner_pruned_edges_total`: Edges pruned
- `tori_memory_kcl_modes_added_total`: Spectral modes added

## Development Workflow

1. Make changes to the code
2. Run linting: `make lint`
3. Run tests: `make test`
4. Start the services: `make dev-up`
5. View logs: `make logs`
6. View metrics in Grafana: `make grafana`

## Implementation Roadmap

### Sprint A (Week 1): Core Consolidation

- Stand-up EpisodicVault (gRPC)
- Implement SleepScheduler with energy-based replay
- Add L1 sparse pruning loop

### Sprint B (Week 2-3): Initial KCL

- Deploy KCL-lite: streaming DMD on concept-activation logs
- Store top-20 ψ-modes with sparsity
- Feed coupling tweaks to oscillator core

### Sprint C (Week 4): Merging & UI

- Turn on category-typed merge utility
- Add UI "Dream Diary" panel for consolidation visualization

### Sprint D (Week 5+): Advanced KCL

- Upgrade KCL to incremental sparse EDMD
- Integrate Koopman-predicted instability alarms

## Implementation Details

### 1. Energy Formulation & Wake-Sleep Schedule

The energy of a concept pattern $x \in \{-1,1\}^N$ is:

$$E(x) = -\frac{1}{2} x^T W x$$

where $W$ is the weight matrix learned from episodes.

The wake-sleep update for the weight matrix is:

$$W \leftarrow W + \eta(x^+ {x^+}^T - x^- {x^-}^T)$$

where $x^+$ is the positive pattern from replay and $x^-$ is a negative sample.

### 2. Sparse-Optim Pruning Strategy

We use L1 regularization to promote sparsity:

$$\min_W \|W\|_1 \quad \text{s.t.} \quad \|A \cdot W - R\|_2 \leq \epsilon$$

where $A$ is the incidence matrix of needed edges and $R$ are retention targets.

### 3. Component Integration

The integration between components is handled through:
- gRPC API calls defined in proto files
- Pub/Sub mechanism for event notifications
- Shared metric definitions for consistent monitoring

## License

[MIT License](LICENSE)
