# ELFIN Package Ecosystem

## Overview

The ELFIN Package Ecosystem provides Cargo-grade workflows for ELFIN developers. It includes:

1. **Manifest specification** (`elfpkg.toml`) - A single source of truth for dependencies, solver options, and more
2. **Registry system** - Git-backed index + blob store for package publishing and downloading
3. **CLI tools** - Easy-to-use commands for package management
4. **Formatter & Linter** - Tools to ensure consistent code style and catch common issues
5. **Semver enforcement** - Protection against breaking changes in packages

## Manifest Format (`elfpkg.toml`)

The manifest file uses TOML format and defines all aspects of an ELFIN package:

```toml
[package]
name        = "quadrotor_controller"
version     = "0.1.0"
authors     = ["alice@example.com"]
edition     = "elfin-1.0"

[dependencies]
elfin-core  = ">=1.0.0,<2.0.0"
cvxpy       = ">=1.4.0"

[solver]
mosek.msk_license_file = "${HOME}/mosek.lic"
```

## Lockfile Format (`elf.lock`)

The lockfile ensures reproducible builds by pinning exact dependency versions:

```toml
version = "1"

[[package]]
name = "elfin-core"
version = "1.1.0"
checksum = "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4"

[[package]]
name = "cvxpy"
version = "1.4.0"
checksum = "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6"

[root]
dependencies = ["elfin-core:1.1.0", "cvxpy:1.4.0"]
```

## CLI Commands

The ELFIN CLI provides the following commands:

| Command | Description |
|---------|-------------|
| `elf new <name>` | Create a new ELFIN package |
| `elf build` | Build the current package |
| `elf publish` | Publish the package to the registry |
| `elf install [package]` | Install dependencies or a specific package |
| `elf fmt` | Format ELFIN source files |
| `elf clippy` | Run the linter on ELFIN source files |
| `elf semver-check <v1> <v2>` | Check if two versions are compatible |

### Examples

```bash
# Create a new package
elf new quadrotor

# Change to package directory and build
cd quadrotor
elf build

# Publish to registry
elf publish

# One-line flow
elf new quadrotor && cd quadrotor && elf build && elf publish
```

## Version Resolution

The package manager follows these rules for version resolution:

1. Uses SemVer for version compatibility checks
2. For versions ≥ 1.0.0, only the major version must match
3. For versions < 1.0.0, both major and minor versions must match
4. Allows multiple major versions to coexist if required by different dependencies
5. Generates a conflict error when two dependencies require incompatible minor versions of the same major version

## Formatter and Linter

The formatter (`elffmt`) and linter (`elfclippy`) help maintain code quality:

- **elffmt**: Enforces consistent spacing, indentation, and structure
- **elfclippy**: Checks for:
  - Shadowed psi modes
  - Unused barriers
  - References to undefined entities
  - Missing semicolons
  - Unbalanced braces

## Registry Architecture

The registry uses a git-backed index similar to crates.io:

1. **Index**: JSON files organized by package name, containing metadata and version history
2. **Blob store**: Content-addressable storage for package archives

This design enables:
- 100% OSS operation with no database requirement
- Distributed mirroring capabilities
- Offline package resolution using the git index
