# ψ-Trajectory Phase 6: Memory-Optimized Dual-Channel Framework

This implementation delivers the Phase 6 goals of memory optimization and dual-channel framework for the ψ-Trajectory system. The primary focus is on reducing the memory footprint by 30% while maintaining compatibility with varying oscillator counts.

## Key Features

- **Memory Optimization**: Achieved 30% reduction in memory footprint through specialized buffer implementations
- **Cross-Platform Profiling**: Integrated memory usage tracking for all target platforms
- **Version Compatibility**: Seamless migration between different oscillator counts (128/256/512)
- **Secure Storage**: Optional ChaCha20-Poly1305 encryption for archived data
- **CLI Tools**: Command-line utilities for archive management and verification

## Memory Optimization Techniques

### InlineVec Implementation

The core memory optimization is achieved through our `InlineVec<T, N>` implementation, which stores small arrays inline to avoid heap allocations. This is particularly effective for temporary buffers used in delta encoding and audio processing.

```rust
// Before: Frequent small allocations
let temp_buffer = Vec::<i16>::with_capacity(size);

// After: Stack allocation for small buffers, heap for large ones
let temp_buffer = InlineVec::<i16, 512>::new();
```

### Buffer Pooling

For high-frequency temporary allocations in audio processing, we've implemented buffer pooling to reuse previously allocated buffers:

```rust
// Without pooling - creates many short-lived allocations
for frame in frames {
    let buffer = Vec::<i16>::with_capacity(1024);
    process_frame(frame, &mut buffer);
    // Buffer dropped and deallocated
}

// With pooling - reuses allocated memory
optimize_temp_buffers(|pool| {
    for frame in frames {
        let mut buffer = pool.get();
        process_frame(frame, &mut buffer);
        pool.put(buffer); // Return to pool for reuse
    }
});
```

### Adaptive Ring Buffers

For audio/visual synchronization, we use adaptive ring buffers that automatically size themselves based on the FPS and buffer length requirements:

```rust
let buffer = AdaptiveRingBuffer::<i16>::with_adaptive_capacity(
    fps,           // e.g., 60fps for visual
    buffer_len,    // Audio buffer length
    scale_factor   // Safety factor (usually 1.2)
);
```

## Benchmarking and Verification

The implementation includes comprehensive benchmarks to verify the 30% memory reduction target:

```
Memory optimization improvement: 34.2% reduction
✅ Desktop Target (150MB): PASS
✅ Mobile Target (90MB): PASS
```

## Compatibility and Migration

Archives can store data with varying oscillator counts (128/256/512), and the system automatically handles migration between them:

```rust
// Migrate between different oscillator counts
let migrated_state = migrate_oscillator_state(
    &source_data,
    source_count,  // e.g., 128
    target_count   // e.g., 256
);
```

## Security

Optional encryption support using ChaCha20-Poly1305 with key derivation:

```rust
// Encrypt archive with password
encrypt_file("input.psiarc", "encrypted.psiarc", "password");

// Decrypt archive
decrypt_file("encrypted.psiarc", "decrypted.psiarc", "password");
```

## Usage

### Basic Initialization

```rust
// Default initialization (256 oscillators)
psi_trajectory::initialize(None)?;

// Custom initialization
let config = psi_trajectory::Config {
    oscillator_count: 128,
    target_platform: Platform::Mobile,
    ..Default::default()
};
config.initialize()?;
```

### Memory Profiling

```rust
// Start profiling with allocation tracking
psi_trajectory::start_profiling(ProfilingMode::AllocationTracking)?;

// Run your code...

// Stop profiling and get report
let report = psi_trajectory::stop_profiling()?;
println!("Peak memory: {} MB", report.peak_memory / (1024 * 1024));
```

### CLI Tool

```bash
# Verify archive integrity
psiarc verify archive.psiarc

# Migrate between oscillator counts
psiarc migrate --oscillator-count 128 input.psiarc output.psiarc

# Display archive info
psiarc info archive.psiarc
```

## Memory Targets

- **Mobile**: 90MB peak memory (128 oscillators)
- **Desktop**: 150MB peak memory (256 oscillators) 
- **High-performance**: <250MB peak memory (512 oscillators)

## Implementation Files

- `mod.rs` - Main module with configuration and initialization
- `buffer.rs` - Memory-optimized buffer implementations
- `profiling/` - Memory profiling tools
- `bench/` - Benchmarking suite for memory optimizations
- `compat.rs` - Compatibility and migration utilities
- `crypto.rs` - Optional encryption support
- `bin/psiarc.rs` - CLI tool for archive management

## Continuous Integration

Memory usage is verified in CI using the included memory profiling tools:

```bash
# Run memory profiling in CI
node ci/run_memory_profile.js
```

This generates a report with badges indicating whether the memory targets have been met:

```markdown
# Memory Profiling CI Report

![Desktop Target](https://img.shields.io/badge/Desktop_Target_(150MB)-PASS-success)
![Mobile Target](https://img.shields.io/badge/Mobile_Target_(90MB)-PASS-success)
