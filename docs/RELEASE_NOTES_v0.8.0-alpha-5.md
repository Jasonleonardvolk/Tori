# ALAN v0.8.0-alpha-5 Release Notes

## Summary

This release focuses on performance improvements, cross-platform compatibility, and developer experience enhancements. It introduces snapshot compression, better error messages, grammar versioning, comprehensive CI/CD for Rust components, and various stability improvements.

## Key Improvements

### Snapshot Compression (ALSC)

- **Performance**: 10k-node state snapshots compressed from 11.9 MB → 740 KB (-93%)
- **Speed**: Python→Rust decode latency < 2.4 ms
- **WebSocket**: Maintains 60 fps without frame drops
- **Auto-threshold**: Automatically compresses snapshots > 256 KB
- **Cross-platform**: Verified on x86-64 Linux, macOS M3, Windows 11
- **Magic identifier**: Added "ALSC" header for compressed snapshots

### Developer Experience Enhancements

- **Friendly Unit Errors**: CLI now provides helpful suggestions, e.g., "unit 'Khz' unknown – did you mean 'kHz'?"
- **Grammar Versioning**: Added `@version 1.0` tag to ELFIN grammar
  - Ensures IDE cache invalidation when grammar is updated
  - Maintains stable token IDs for cross-language compatibility
- **License Compliance**: THIRD_PARTY_NOTICES.txt now included in wheels and source distributions

### Stability & Robustness

- **Eigenvalue Fallback**: Added guard for singular weight matrices in Hopfield memory
  - Prevents NaN explosions with safe λ=0.01 default
  - Log message added at DEBUG level
- **WebSocket Cleanup**: Improved resource management for disconnections

### Rust Integration & Testing

- **Comprehensive CI Pipeline**: 
  - Matrix testing across Windows, Linux, macOS
  - Multiple toolchains: stable, nightly
  - WebAssembly target: wasm32-unknown-unknown
- **Code Quality**: Added Clippy and rustfmt checks
- **Test Coverage**: Added coverage reporting with grcov

## Compatibility

This release is compatible with all previous v0.8.0-alpha versions. It introduces performance improvements and stability fixes without breaking API changes.

## Known Issues

- WebGL heat-map visualization not yet implemented (planned for next sprint)
- Mass-matrix float64 path not yet available (planned post Rust port)
- MyPy .pyi stubs not yet auto-generated for FlatBuffers tables

## Upgrade Steps

1. Upgrade with pip:
```
pip install --pre alan-core==0.8.0a5
```

2. Update your code to take advantage of the new features:
```python
# Use auto-compressed snapshots (no code changes needed)
from alan_backend.snapshot import StateSnapshot

# Snapshots > 256KB will be automatically compressed
snapshot = StateSnapshot(...)
bytes_data = snapshot.to_bytes()  # Auto-compression

# Force compression mode if needed
from alan_backend.snapshot.compression import CompressMode
bytes_data = snapshot.to_bytes(compress_mode=CompressMode.ALWAYS)
```

## Contributors

Thanks to everyone who contributed to this release!
