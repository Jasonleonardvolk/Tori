# ALAN Core v0.8.0-alpha-6 Release Instructions

## Merge & Release Flow

```bash
git switch main && git pull
./release_v0.8.0-alpha-6.sh      # tags, builds, uploads
```

The release script handles:
- Creating and pushing the git tag
- Building and uploading Python wheels to PyPI
- Building and uploading WebAssembly packages
- Generating release notes

## Impact on Teams

### Hardware Team
- C header `alan.h` is now frozen and can be used for SPI driver implementation
- Hardware team can begin board bring-up using the stable C API
- Phase jitter measurements can be collected via `alan_get_stats()`

### UI Team
- WebSocket frame format remains unchanged for compatibility
- Dashboards can now display `TrsStats` for visualization
- WebGL heat-map can use TRS loss data for coherence display

### Researchers
- `--feature y4` flag is available for high-precision simulation runs
- Benchmarking can compare Velocity Verlet vs. Yoshida-4 accuracy
- TRS round-trip error provides metrics for stability assessment

## Post-Release Improvements (Non-Blocking)

| Item | Effort | Gains |
|------|--------|-------|
| `alan_state_len()` in FFI | ~20 LoC | Lets Unity malloc without snapshot parse |
| CLI flag `--integrator y4\|vv` | Trivial | Toggling between integrators for benchmarks |
| wasm32-simd128 target | cargo +nightly one-liner | ~1.6× browser speedup |

See `post_alpha_improvements.md` for detailed implementation plans for these features.

## Verification Checklist

- [ ] PR has been squash-merged to main
- [ ] Release script completed successfully
- [ ] Tag `v0.8.0-alpha-6` appears on GitHub
- [ ] PyPI package shows the new version
- [ ] WebAssembly package is attached to the GitHub release
- [ ] Release notes include all key features

## Support

If you encounter any issues during the release process, refer to:
- `docs/troubleshooting.md` for common problems and solutions
- `docs/binary_protocols.md` for detailed format specifications

## Announcement

Once the release is complete, announce to:
1. Hardware team (for SPI bring-up)
2. UI team (for dashboard integration)
3. Research team (for high-precision experiments)

With this release, the project officially enters hardware bring-up territory! 🚀
