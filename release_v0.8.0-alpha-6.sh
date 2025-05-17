#!/bin/bash
# Release script for ALAN Core v0.8.0-alpha-6
# This script automates the release process for the v0.8.0-alpha-6 tag
# including tagging, artifact building, and publishing.

set -e  # Exit on any error

echo "===== ALAN Core v0.8.0-alpha-6 Release Process ====="
echo "This script will guide you through the release process."
echo "Ensure you have already squash-merged your PR to main branch."
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "WARNING: You are not on the main branch. Currently on: $CURRENT_BRANCH"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting release process. Please checkout main branch first."
        exit 1
    fi
fi

# Ensure we have the latest code
echo "Pulling latest changes from main..."
git pull origin main

# Create and push the tag
echo "Creating signed tag v0.8.0-alpha-6..."
git tag -s v0.8.0-alpha-6 -m "TRS controller, FFI, fuzz, wasm-opt"

echo "Pushing tag to origin..."
git push origin v0.8.0-alpha-6

# Build and publish wheel
echo "Building and publishing Python wheel..."
cd alan_core
make wheel
echo "Uploading to PyPI..."
twine upload dist/*

# Build and publish wasm package
echo "Building WebAssembly package..."
make wasm
echo "Uploading WebAssembly package to GitHub release..."
cd ..
gh release create v0.8.0-alpha-6 --title "ALAN Core v0.8.0-alpha-6" --notes "Release notes to be added"
gh release upload v0.8.0-alpha-6 alan_core/pkg/alan_core.wasm

echo ""
echo "===== Release Notes ====="
echo "Please add the following to your GitHub release notes:"
echo ""
echo "## ALAN Core v0.8.0-alpha-6"
echo ""
echo "### Key Components"
echo ""
echo "1. **Time-Reversal-Symmetric ODE Controller** (`alan_core/src/controller/trs_ode.rs`)"
echo "   - Velocity Verlet symplectic integrator"
echo "   - Thread-safety with Send + Sync"
echo "   - Feature-gated Yoshida 4th-order integrator"
echo "   - Comprehensive statistics tracking"
echo ""
echo "2. **C API / FFI Layer** (`alan_core/src/ffi.rs`)"
echo "   - Little-endian validation with clear error codes"
echo "   - 64-byte SIMD-aligned memory handling"
echo "   - Thread-safe global simulation state"
echo ""
echo "3. **Fuzzing Infrastructure**"
echo "   - Stability and TRS property validation"
echo "   - Diverse seed corpus"
echo ""
echo "4. **Build and Release Optimizations**"
echo "   - Reduced Wasm size by ~19KB"
echo "   - CI workflow with fuzzing integration"
echo ""
echo "5. **Documentation Improvements**"
echo "   - See [Binary Protocols](docs/binary_protocols.md) for format specifications"
echo "   - Troubleshooting guide updated with cross-references"
echo ""
echo "### Next Steps"
echo ""
echo "- Hardware team can begin SPI bring-up using the stable C API"
echo "- UI team can integrate TrsStats for dashboard visualizations"
echo ""
echo "===== End of Release Notes ====="
echo ""
echo "Release process completed successfully!"
