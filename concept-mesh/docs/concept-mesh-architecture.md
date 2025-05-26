# Concept Mesh Architecture

This document describes the architecture of the Concept Mesh system, explaining how the components interact and the flow of data through the system.

## System Overview

The Concept Mesh is built around the concept of ConceptDiffs, which are graph operations that modify a shared concept space. Agents communicate by publishing ConceptDiffs to the mesh, and other agents can subscribe to receive only the diffs they care about.

The architecture follows a distributed pub/sub pattern with persistent logging via the ψarc system.

```
                                       ┌─────────────────┐
                                       │                 │
                                  ┌───►│  UI Components  │
                                  │    │                 │
                                  │    └─────────────────┘
                                  │
┌────────────┐    ┌──────────┐    │    ┌─────────────────┐
│            │    │          │    │    │                 │
│  Content   ├───►│   CBD    ├────┼───►│  Orchestrator   ├──┐
│            │    │          │    │    │                 │  │
└────────────┘    └──────────┘    │    └─────────────────┘  │
                                  │                          │
                                  │    ┌─────────────────┐   │
                                  │    │                 │   │
                                  └───►│     Agents      │◄──┘
                                       │                 │
                                       └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │                 │
                                       │      Mesh       │
                                       │                 │
                                       └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │                 │
                                       │      LCN        │
                                       │                 │
                                       └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │                 │
                                       │     ψArc        │
                                       │                 │
                                       └─────────────────┘
```

## Component Descriptions

### Concept Boundary Detector (CBD)

The CBD segments content at semantic breakpoints rather than arbitrary fixed-size chunks. It analyzes content for:

- Phase shifts in the semantic space
- Koopman-mode inflections
- Eigen-entropy slope changes
- Explicit markers (e.g., section headings)

Output: `ConceptPack` objects that contain coherent segments of content.

### Agentic Orchestrator

The orchestrator is the central coordinator for the mesh. It:

- Manages the lifecycle of ingest jobs
- Routes ConceptPacks to appropriate agents
- Coordinates the GENESIS event
- Handles phase-synchronization between agents

### Large Concept Network (LCN)

The LCN is the storage layer for concepts. Unlike traditional vector databases, it:

- Organizes information around concepts rather than embeddings
- Maintains relationships between concepts
- Supports phase-aligned queries
- Provides temporal consistency

### Mesh Communication Layer

The mesh enables ConceptDiff propagation through the system. It provides:

- Pub/sub patterns for selective receiving
- Filtering based on source, target, and operation type
- Efficient routing of diffs to interested parties

### PsiArc (ψarc) Logging System

The ψarc system provides:

- Persistent storage of ConceptDiffs
- Replay capabilities for time-travel debugging
- System state reconstruction
- Audit trails of concept evolution

### UI Bridge and OscillatorBloom

The UI components provide:

- Visualization of concept activations
- The GENESIS bloom animation
- Real-time feedback on system state
- Interactive concept exploration

## Data Flow

1. **Ingestion**: Content enters the system and is sent to the CBD
2. **Segmentation**: The CBD breaks content into ConceptPacks
3. **Orchestration**: The orchestrator assigns ConceptPacks to agents
4. **Processing**: Agents process ConceptPacks and generate ConceptDiffs
5. **Publication**: ConceptDiffs are published to the mesh
6. **Storage**: ConceptDiffs update the LCN and are logged to ψarc
7. **Visualization**: UI components show system state and concept activations

## The GENESIS Event

The GENESIS event is a special ConceptDiff that initializes the concept mesh. It:

1. Creates the `TIMELESS_ROOT` concept
2. Binds the corpus to this root
3. Sends a `GENESIS_ACTIVATE` signal
4. Triggers the oscillator bloom animation

This establishes the foundational cognitive structure of the system.

## Extensibility and Plugin Architecture

The Concept Mesh is designed to be extensible:

- New agent types can be added by implementing the `MeshNode` interface
- Custom operations can be added via the `Op::Execute` variant
- Storage backends can be swapped by implementing the appropriate traits
- UI visualizations can be customized via the Genesis UI bridge
