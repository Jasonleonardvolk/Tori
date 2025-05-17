#!/bin/bash
# ELFIN Packaging CI Test
# Tests basic functionality of the packaging tools

set -e  # Exit on error

echo "=== ELFIN Packaging CI Test ==="
echo "Running basic functionality tests for packaging tools"

# Create temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "Using temporary directory: $TEST_DIR"

# Clean up on exit
function cleanup {
  echo "Cleaning up..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Copy scripts to test directory
cp -r alan_backend "$TEST_DIR/"
cp -r registry "$TEST_DIR/"

# Change to test directory
cd "$TEST_DIR"

# Test package manifest parsing
echo "Testing manifest parsing..."
python -c "
from alan_backend.elfin.packaging.manifest import Manifest
from pathlib import Path
import tempfile

# Create a test manifest
with tempfile.NamedTemporaryFile('w', suffix='.toml') as f:
    f.write('''
[package]
name = \"test_package\"
version = \"0.1.0\"
authors = [\"test@example.com\"]
edition = \"elfin-1.0\"

[dependencies]
elfin-core = \"^1.0.0\"
cvxpy = \">=1.4.0\"

[solver]
mosek.msk_license_file = \"\${HOME}/mosek.lic\"
''')
    f.flush()
    
    # Load the manifest
    manifest = Manifest.load(Path(f.name))
    
    # Verify basic properties
    assert manifest.name == 'test_package', f'Expected name \"test_package\", got {manifest.name}'
    assert manifest.version == '0.1.0', f'Expected version \"0.1.0\", got {manifest.version}'
    assert len(manifest.dependencies) == 2, f'Expected 2 dependencies, got {len(manifest.dependencies)}'
    
    print('Manifest parsing test passed!')
"

# Test formatter on a sample ELFIN file
echo "Testing ELFIN formatter..."
mkdir -p src
cat > src/test.elfin << 'EOF'
# Test ELFIN file
psi mode1{
x: 10.0;
  y:  20.0;
}

barrier safety {
level: 0.5  ;
}
EOF

python -c "
from alan_backend.elfin.formatting.elffmt import ELFINFormatter
from pathlib import Path

formatter = ELFINFormatter()
file_path = Path('src/test.elfin')
changed = formatter.write_formatted_file(file_path)

with open(file_path, 'r') as f:
    content = f.read()

# Check if the formatting looks correct
lines = content.split('\\n')
assert '# Test ELFIN file' in lines[0], 'Comment not preserved'
assert 'psi mode1 {' in lines[1], 'Block start not formatted correctly'
assert '  x: 10.0;' in lines[2], 'Statement not indented correctly'
assert '  y: 20.0;' in lines[3], 'Statement spacing not corrected'
assert '}' in lines[4], 'Block end not on separate line'

print('Formatter test passed!')
"

# Test linter on a sample ELFIN file with issues
echo "Testing ELFIN linter..."
cat > src/test_with_issues.elfin << 'EOF'
# Test ELFIN file with issues
psi mode1 {
  x: 10.0;
  y: 20.0
}

# Reference to undefined mode
system test {
  use: psi(undefined_mode);
}

# Unused barrier
barrier unused_barrier {
  level: 0.5;
}
EOF

python -c "
from alan_backend.elfin.linting.elfclippy import ELFINLinter
from pathlib import Path

linter = ELFINLinter()
file_path = Path('src/test_with_issues.elfin')
messages = linter.lint_file(file_path)

# Should have at least 3 issues:
# 1. Missing semicolon
# 2. Reference to undefined mode
# 3. Unused barrier
assert len(messages) >= 3, f'Expected at least 3 lint messages, got {len(messages)}'

# Check for specific issues
codes = [msg.code for msg in messages]
assert 'E-SYNTAX-SEMI' in codes, 'Missing semicolon not detected'
assert 'E-PSI-UNDEF' in codes, 'Undefined psi mode not detected'
assert 'E-BARR-UNUSED' in codes, 'Unused barrier not detected'

print('Linter test passed! Found issues:', len(messages))
"

# Test dependency resolution
echo "Testing dependency resolution..."
python -c "
from alan_backend.elfin.packaging.manifest import Manifest, Dependency
from alan_backend.elfin.packaging.resolver import PackageInfo, DependencyResolver
from pathlib import Path
import tempfile

# Create sample package info
resolver = DependencyResolver()

# Add test packages to resolver
resolver.add_package_info(PackageInfo(
    name='elfin-core',
    versions=['1.0.0', '1.1.0']
))

resolver.add_package_info(PackageInfo(
    name='cvxpy',
    versions=['1.4.0']
))

# Create a test manifest
with tempfile.NamedTemporaryFile('w', suffix='.toml') as f:
    f.write('''
[package]
name = \"test_package\"
version = \"0.1.0\"
authors = [\"test@example.com\"]
edition = \"elfin-1.0\"

[dependencies]
elfin-core = \"^1.0.0\"
cvxpy = \">=1.4.0\"
''')
    f.flush()
    
    # Load the manifest
    manifest = Manifest.load(Path(f.name))
    
    # Resolve dependencies
    resolved = resolver.resolve(manifest)
    
    # Verify resolutions
    assert len(resolved) == 2, f'Expected 2 resolved dependencies, got {len(resolved)}'
    
    # Find specific packages
    elfin_core = None
    cvxpy = None
    for pkg_id, dep in resolved.items():
        if dep.name == 'elfin-core':
            elfin_core = dep
        elif dep.name == 'cvxpy':
            cvxpy = dep
    
    assert elfin_core is not None, 'elfin-core not resolved'
    assert cvxpy is not None, 'cvxpy not resolved'
    
    # Check versions
    assert elfin_core.version == '1.1.0', f'Expected elfin-core 1.1.0, got {elfin_core.version}'
    assert cvxpy.version == '1.4.0', f'Expected cvxpy 1.4.0, got {cvxpy.version}'
    
    print('Dependency resolution test passed!')
"

# Create a full package with lockfile
echo "Testing full package creation with lockfile..."
mkdir -p test_package/src
cat > test_package/elfpkg.toml << 'EOF'
[package]
name = "test_package"
version = "0.1.0"
authors = ["test@example.com"]
edition = "elfin-1.0"

[dependencies]
elfin-core = "^1.0.0"
cvxpy = ">=1.4.0"

[solver]
mosek.msk_license_file = "${HOME}/mosek.lic"
EOF

cat > test_package/src/main.py << 'EOF'
"""Main entry point for the package."""

def main():
    """Run the package."""
    print("Hello from ELFIN!")

if __name__ == "__main__":
    main()
EOF

python -c "
from alan_backend.elfin.packaging.manifest import Manifest
from alan_backend.elfin.packaging.resolver import PackageInfo, DependencyResolver
from alan_backend.elfin.packaging.lockfile import generate_lockfile
from pathlib import Path

# Load the manifest
manifest_path = Path('test_package/elfpkg.toml')
manifest = Manifest.load(manifest_path)

# Create resolver with test packages
resolver = DependencyResolver()
resolver.add_package_info(PackageInfo(
    name='elfin-core',
    versions=['1.0.0', '1.1.0']
))
resolver.add_package_info(PackageInfo(
    name='cvxpy',
    versions=['1.4.0']
))

# Resolve dependencies
resolved = resolver.resolve(manifest)

# Generate lockfile
lockfile_path = Path('test_package/elf.lock')
lockfile = generate_lockfile(manifest, resolved, lockfile_path)

# Verify lockfile was created
assert lockfile_path.exists(), 'Lockfile was not created'

# Load lockfile and verify contents
from alan_backend.elfin.packaging.lockfile import Lockfile
loaded_lockfile = Lockfile.load(lockfile_path)

assert len(loaded_lockfile.packages) == 2, f'Expected 2 packages in lockfile, got {len(loaded_lockfile.packages)}'
assert len(loaded_lockfile.root_dependencies) == 2, f'Expected 2 root dependencies, got {len(loaded_lockfile.root_dependencies)}'

print('Package creation with lockfile test passed!')
"

echo "All packaging tests passed successfully!"
