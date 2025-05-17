# Post-Alpha Improvements for ALAN Core

This document outlines the planned improvements for ALAN Core post v0.8.0-alpha-6 release.
These enhancements are non-blocking for the current release but will provide valuable
functionality for the next development cycle.

## 1. FFI Improvements

### `alan_state_len()` C Helper Function

**Priority:** Medium
**Benefit:** Enables Unity to allocate memory correctly without directly accessing snapshots

**Implementation Plan:**
```c
// Add to alan_core/src/ffi.rs
#[no_mangle]
pub unsafe extern "C" fn alan_state_buffer_size(num_oscillators: c_uint) -> c_uint {
    // Each oscillator has a phase and momentum (2 f64 values)
    let num_phase_vars = num_oscillators as usize;
    let state_size = num_phase_vars * 2;
    state_size as c_uint
}
```

**Usage Example:**
```c
// Unity/C# example
[DllImport("alan_core")]
private static extern uint alan_state_buffer_size(uint numOscillators);

void InitializeSystem(uint oscillatorCount) {
    uint bufferSize = alan_state_buffer_size(oscillatorCount);
    double[] stateBuffer = new double[bufferSize];
    
    // Now we can use this buffer with alan_set_state and alan_get_state
    // without having to manually calculate the buffer size
}
```

## 2. CLI Improvements

### Expose Yoshida vs. Velocity Verlet Performance Toggle

**Priority:** Medium
**Benefit:** Provides easy benchmarking capabilities for researchers

**Implementation Plan:**
1. Add a CLI option in `alan_cli/src/main.rs`:
```rust
#[derive(Debug, clap::Parser)]
struct IntegratorOpts {
    /// Integration method (verlet or yoshida4)
    #[clap(long, default_value = "verlet")]
    integrator: String,
    
    /// Time step for integration
    #[clap(long, default_value = "0.01")]
    dt: f64,
}
```

2. Use the option to configure the TrsOde controller:
```rust
let method = match opts.integrator.as_str() {
    "yoshida4" => IntegrationMethod::Yoshida4,
    _ => IntegrationMethod::VelocityVerlet,
};

let params = TrsParameters {
    dt: opts.dt,
    lambda_trs: 0.1,
    method,
    max_iterations: 100,
    tolerance: 1e-6,
};

let controller = TrsOde::with_params(params, force);
```

3. Add automatic benchmark comparison between the two:
```rust
if opts.benchmark {
    // Run the same simulation with both methods
    println!("Benchmarking integration methods...");
    
    // ... benchmark code ...
    
    println!("VV average time per step: {:.3} µs", vv_time);
    println!("Y4 average time per step: {:.3} µs", y4_time);
    println!("Y4/VV speed ratio: {:.2}x", vv_time / y4_time);
    println!("Y4/VV error ratio: {:.2}x", vv_error / y4_error);
}
```

## 3. WebAssembly Optimizations

### SIMD Support for WebAssembly

**Priority:** High
**Benefit:** ~1.6× speed-up in browser applications

**Implementation Plan:**

1. Add SIMD-specific build target in Cargo.toml:
```toml
[target.wasm32-unknown-unknown.dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
```

2. Create a specialized build script for SIMD-enabled WebAssembly:
```bash
#!/bin/bash
# build_wasm_simd.sh

RUSTFLAGS="-C target-feature=+simd128" \
wasm-pack build --target web -- \
  --features "wasm-simd"
```

3. Add SIMD-optimized vector operations in core computations:
```rust
#[cfg(all(target_arch = "wasm32", feature = "wasm-simd"))]
fn simd_optimized_step(&mut self, t: &mut f64, state: &mut [f64]) -> Result<(), TrsError> {
    // SIMD-optimized implementation using wasm_bindgen
    // ...
}
```

4. Update CI to test and report SIMD performance:
```yaml
# In .github/workflows/rust-ci.yml
- name: Build WebAssembly with SIMD
  working-directory: ./alan_core
  run: |
    RUSTFLAGS="-C target-feature=+simd128" \
    wasm-pack build --target web -- --features "wasm-simd"
    
    # Report size difference
    WASM_SIZE=$(ls -la pkg/alan_core_bg.wasm | awk '{print $5}')
    echo "WebAssembly SIMD size: $WASM_SIZE bytes"
```

## Implementation Timeline

| Improvement | Estimated Effort | Target Release |
|-------------|------------------|----------------|
| `alan_state_buffer_size()` C helper | 1-2 hours | v0.8.1 |
| Yoshida vs. VV CLI toggle | 2-4 hours | v0.8.1 |
| Wasm SIMD support | 1-2 days | v0.9.0 |

## Getting Started

To begin implementing these improvements:

1. Create a new branch from the `main` branch after v0.8.0-alpha-6 is released
2. Implement the improvements in order of priority
3. Add appropriate tests for each new feature
4. Submit PRs for review

This approach ensures we continue to make progress on usability and performance while maintaining compatibility with the existing v0.8.0-alpha-6 codebase.
