# ALAN Core Architecture: Phase Synchronization and Spectral Analysis

This document describes the core mechanisms of the ALAN cognitive architecture, focusing on the Phase Engine and Koopman Spectral Analysis components - the neurodynamic foundation of the system.

## System Overview

The ALAN core consists of two primary subsystems that work together to create a cognitively-inspired computational architecture:

1. **Phase Engine**: Implements concept synchronization through phase-coupled oscillators
2. **Spectral Analysis Pipeline**: Analyzes system dynamics using Koopman operator theory

These components interact in a closed-loop system, where:
- The phase engine manages concept relationships and synchronization
- The spectral analysis detects patterns, instabilities, and emergent properties
- Feedback from spectral analysis modulates phase coupling behavior

## Phase Engine (ψ-Coupling)

The phase engine implements a modified Kuramoto oscillator model where each concept is represented as an oscillator with a phase angle. Concepts are connected through a graph structure, with weighted edges representing their relationships.

### Key Features

- **Phase Dynamics**: Each concept has a phase that evolves over time based on its intrinsic frequency and coupling with connected concepts
- **Weighted Coupling**: Relationships between concepts have weighted strengths that control coupling influence
- **Phase Offsets**: Support for desired phase differences between connected concepts
- **Spectral Feedback**: Coupling strength can be modulated by spectral analysis feedback

### Mathematical Model

For each concept node, the phase evolution is governed by:

$$\frac{d\phi_i}{dt} = \omega_i + \sum_{j} K_{ij} \sin(\phi_j - \phi_i - \alpha_{ij})$$

Where:
- $\phi_i$ is the phase of concept $i$
- $\omega_i$ is the natural frequency
- $K_{ij}$ is the effective coupling strength (product of global coupling, edge weight, and spectral feedback)
- $\alpha_{ij}$ is the desired phase offset between concepts $i$ and $j$

### Performance Optimizations

- **O(E+N) Algorithm**: Single pass over all edges with pre-initialized updates
- **Periodic Sine**: Using sine's periodicity instead of explicit modulo operations
- **Cached Calculations**: Reuse of error calculations between step() and calculate_sync_ratio()
- **Matrix Generation**: ability to export coupling and offset matrices for testing

## Koopman Spectral Analysis

The spectral analysis pipeline uses Koopman operator theory to analyze the dynamical behavior of the concept system, identifying stable and unstable modes, frequencies, and emergent patterns.

### Key Components

- **Snapshot Buffer**: Captures system state (concept phases) over time in a configurable buffer
- **EDMD Decomposition**: Performs Extended Dynamic Mode Decomposition to compute Koopman eigenvalues and modes
- **Stability Analysis**: Identifies stable and unstable modes, calculates overall stability index
- **Feedback Generation**: Provides feedback to the phase engine to modulate coupling strength

### Mathematical Foundation

The Koopman operator K is an infinite-dimensional linear operator that governs the evolution of observables in dynamical systems:

$$Kg = g \circ F$$

Where:
- $F$ is the state transition map of the dynamical system
- $g$ is an observable function on the state space
- $K$ is the Koopman operator

The EDMD algorithm approximates the Koopman operator using SVD:

1. Collect snapshots of system states into matrices X and Y where Y contains states one step after X
2. Compute the SVD of X: $X = U\Sigma V^*$
3. Approximate the Koopman operator: $K = YV\Sigma^{-1}$
4. Compute eigendecomposition of K: $K\phi = \lambda\phi$

### Numerical Considerations

- **Regularization**: Small singular values are thresholded to prevent numerical instability
- **Mode Selection**: Dominant modes are selected based on both amplitude and growth rate
- **Eigenvalue Processing**: Continuous-time eigenvalues are computed from discrete eigenvalues

## System Integration

The phase engine and spectral analysis components are integrated through a feedback loop:

1. **State Capture**: Phase engine states are periodically captured in the snapshot buffer
2. **Spectral Analysis**: EDMD decomposition is performed on the collected states
3. **Stability Assessment**: Stability indices and unstable modes are identified
4. **Feedback**: Phase coupling is modulated based on stability (reduced coupling for unstable modes)
5. **Adaptation**: The system self-regulates, adapting coupling to maintain stability

### Design Principles

- **Decoupled Components**: Components can operate independently for testing and flexibility
- **Optimized Algorithms**: Performance-optimized implementations for large-scale systems
- **Numerical Stability**: Robust numerical methods with regularization and thresholding
- **Self-Regulation**: Automatic adaptation to changing dynamics through feedback

## Applications

This architecture enables several key capabilities:

- **Concept Relationship Modeling**: Represent and evolve complex concept relationships
- **Dynamical Pattern Detection**: Identify emergent patterns and modes in cognitive systems
- **Instability Prevention**: Automatically detect and mitigate potential instabilities
- **Predictive Analysis**: Forecast future system states based on spectral decomposition

## Examples

See the `alan_backend/elfin/examples/phase_spectral_demo.py` for a complete demonstration of the integrated system, including:

1. Baseline synchronization behavior
2. Effect of spectral feedback
3. Response to introduced instability
4. Visualization of system dynamics

Run the example using the `run_phase_spectral_demo.bat` script.

## Technical Details

- The phase engine supports systems with 10k+ nodes and 100k+ edges through optimized algorithms
- The spectral analysis can handle hundreds of snapshots with state dimensions in the thousands
- Regularization parameters can be tuned for specific applications and data characteristics
