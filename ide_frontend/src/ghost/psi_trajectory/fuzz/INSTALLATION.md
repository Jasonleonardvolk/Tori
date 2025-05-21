# ψ-Trajectory Fuzzing Framework Installation Guide

This guide will walk you through installing and setting up the required components to run the ψ-Trajectory fuzzing framework.

## Prerequisites

### 1. Install Rust and Cargo

You need to install Rust and Cargo first. The recommended way is using rustup:

#### Windows:
1. Download and run the rustup-init.exe from https://rustup.rs/
2. Follow the on-screen instructions
3. Choose option 1 for the default installation

#### macOS and Linux:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation, open a new terminal/command prompt and verify:
```bash
rustc --version
cargo --version
```

### 2. Install cargo-fuzz

Once Rust is installed, you can install cargo-fuzz:

```bash
cargo install cargo-fuzz
```

This will download and install the cargo-fuzz tool, which provides the fuzzing interface.

### 3. Install Additional Dependencies

For full functionality (including coverage reports), install:

#### Windows:
```powershell
# Install Chocolatey if not already installed
# Run in PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install LLVM (for coverage tools)
choco install llvm -y

# Add LLVM to PATH
$env:Path += ";C:\Program Files\LLVM\bin"
```

#### macOS:
```bash
brew install llvm
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y llvm
```

## Running the Fuzzing Tests

### 1. Build and Run the Frame Decoder Fuzzer

Navigate to the project directory and run:

```bash
# Navigate to the psi_trajectory directory
cd client/src/ghost/psi_trajectory

# Run fuzzing for 1 minute
cargo fuzz run frame_decoder -- -max_total_time=60
```

This will:
1. Build the fuzzing target
2. Run the fuzzer for 60 seconds
3. Display results including any crashes or issues found

### 2. Generate Coverage Reports

From the root project directory, run:

```bash
# Make the script executable (Linux/macOS only)
chmod +x ci/generate_fuzz_coverage.sh

# Run the script
./ci/generate_fuzz_coverage.sh
```

This will:
1. Run each fuzzing target with coverage instrumentation
2. Generate HTML coverage reports
3. Create a summary index page

## Viewing Results

### Coverage Reports
Open `client/src/ghost/psi_trajectory/fuzz/coverage/index.html` in a web browser to view the coverage reports.

### Fuzzing Artifacts
Any crashes or interesting inputs discovered during fuzzing will be saved to:
- `client/src/ghost/psi_trajectory/fuzz/artifacts/frame_decoder/`
- `client/src/ghost/psi_trajectory/fuzz/artifacts/crypto_layer/`
- `client/src/ghost/psi_trajectory/fuzz/artifacts/kernel_dispatcher/`

## Troubleshooting

### Common Issues

1. **Missing LLVM components**: If you get errors about missing LLVM components, ensure LLVM is installed and in your PATH.

2. **Permission denied running scripts**: On Linux/macOS, ensure scripts are executable:
   ```bash
   chmod +x ci/generate_fuzz_coverage.sh
   ```

3. **Cargo or Rust command not found**: Make sure to restart your terminal after installing Rust to update your PATH environment variable.

4. **Coverage tools not working**: Make sure you have the nightly Rust toolchain installed:
   ```bash
   rustup install nightly
   rustup default nightly  # Optional: set nightly as default
   ```

For further assistance, please contact the security team.
