# ψ-Trajectory Fuzzing Framework - Quick Start Guide

This document provides the essential commands to get started with the ψ-Trajectory fuzzing framework after installing Rust.

## Running the Fuzzing Tests

Once Rust is installed on your system, you can run the fuzzing tests using either:

### 1. **The interactive helper script:**

```powershell
powershell -ExecutionPolicy Bypass -File client/src/ghost/psi_trajectory/fuzz/run_fuzzing.ps1
```

This script will:
- Check if you have the required tools installed
- Offer to install missing dependencies
- Provide a menu-driven interface for running specific fuzzers and generating reports

### 2. **Direct commands as requested:**

```bash
# Install cargo-fuzz
cargo install cargo-fuzz

# Run the frame decoder fuzzer for 1 minute
cargo fuzz run frame_decoder -- -max_total_time=60

# Generate coverage reports
./ci/generate_fuzz_coverage.sh
```

## What's Next?

- Check `README.md` for a comprehensive overview of the fuzzing framework
- See `INSTALLATION.md` for detailed installation instructions if you need to set up Rust first
- Examine the corpus files in the `corpus/` directories to understand the seed inputs for each target

## Viewing Results

After running the fuzzing tests:

1. Crashes and interesting inputs will be saved to the `fuzz/artifacts/` directory
2. Coverage reports will be available at `fuzz/coverage/index.html`

For any questions or issues, please contact the security team.
