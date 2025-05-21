# ψ-Trajectory Fuzzing Framework

This directory contains fuzzing targets and corpus files for the ψ-Trajectory system. The fuzzing framework is designed to identify potential crashes, memory leaks, and security vulnerabilities before they reach production.

## Overview

We use [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz) with [libFuzzer](https://llvm.org/docs/LibFuzzer.html) for continuous fuzzing and [AFL++](https://github.com/AFLplusplus/AFLplusplus) for nightly fuzzing runs in CI.

## Target Areas

The fuzzing framework focuses on three critical areas:

1. **Frame Decoder** - Tests the robustness of our frame decoding logic against malformed inputs
2. **Crypto Layer** - Verifies the security and stability of our encryption/decryption implementation
3. **GPU Kernel Dispatcher** - Ensures our GPU kernel dispatch logic handles edge cases gracefully

## Usage

### Local Fuzzing

```bash
# Install cargo-fuzz if you don't have it
cargo install cargo-fuzz

# Run the frame decoder fuzzer for 1 minute
cargo fuzz run frame_decoder -- -max_total_time=60

# Run the crypto fuzzer with the seed corpus
cargo fuzz run crypto_layer -- -max_total_time=60 fuzz/corpus/crypto

# Run the GPU kernel dispatcher fuzzer with address sanitizer
RUSTFLAGS="-Z sanitizer=address" cargo fuzz run kernel_dispatcher -- -max_total_time=60
```

### Analyzing Results

Crashes will be saved to `fuzz/artifacts/[target_name]/`. You can reproduce a crash with:

```bash
cargo fuzz run frame_decoder fuzz/artifacts/frame_decoder/crash-abcdef
```

### Generating Coverage Reports

```bash
# Generate HTML coverage report
./ci/generate_fuzz_coverage.sh
```

This will create a report in `fuzz/coverage/index.html`.

## Corpus Files

The `corpus/` directory contains seed inputs for each fuzzing target. These are valid inputs that help the fuzzer explore the code more efficiently:

- `corpus/frame_decoder/` - Valid ψ-frames with various oscillator counts
- `corpus/crypto/` - Valid encrypted archives with different key derivation methods
- `corpus/kernel_dispatcher/` - Valid kernel parameter sets for different GPUs

## Integration with CI

Fuzzing runs automatically in CI:
- Quick fuzz runs on every PR
- Extended nightly fuzzing with AFL++ in "quick-cross" mode

See `ci/fuzz_nightly.yml` for the configuration.
