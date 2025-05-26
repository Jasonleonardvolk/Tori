# Test Data for TORI Memory System

This directory contains test data files for the TORI Memory Consolidation & Koopman Continual Learner system.

## Contents

- Sample test episodes
- Mock concept activations
- Test PsiArc files
- Benchmark datasets

## Usage

Test data files are used in integration and unit tests to verify system functionality without requiring live data.
They are automatically loaded by the test suite.

## Data Format

Each subdirectory contains test data for a specific component:

- `episodic_vault/` - Test episodes for the EpisodicVault
- `sleep_scheduler/` - Test activation patterns for the SleepScheduler
- `sparse_pruner/` - Test concept graphs for the SparsePruner
- `koopman_learner/` - Test spectral modes for the KoopmanLearner

## Generation

Test data can be regenerated using the scripts in the `tests/generators/` directory.
