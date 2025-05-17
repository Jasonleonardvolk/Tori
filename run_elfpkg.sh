#!/bin/bash
# ELFIN Package Manager CLI wrapper for Unix-like systems

echo "ELFIN Package Manager"
echo "---------------------"

# Set Python path
export PYTHONPATH=$PYTHONPATH:$(dirname "$0")

# Get command
command=$1
shift

# Run the appropriate command
case "$command" in
    "new")
        python3 -m alan_backend.elfin.cli.packaging_cli new "$@"
        ;;
    "build")
        python3 -m alan_backend.elfin.cli.packaging_cli build "$@"
        ;;
    "publish")
        python3 -m alan_backend.elfin.cli.packaging_cli publish "$@"
        ;;
    "install")
        python3 -m alan_backend.elfin.cli.packaging_cli install "$@"
        ;;
    "fmt")
        python3 -m alan_backend.elfin.cli.packaging_cli fmt "$@"
        ;;
    "clippy")
        python3 -m alan_backend.elfin.cli.packaging_cli clippy "$@"
        ;;
    "setup-registry")
        python3 -m alan_backend.elfin.cli.packaging_cli setup_registry "$@"
        ;;
    "semver-check")
        python3 -m alan_backend.elfin.cli.packaging_cli semver_check "$@"
        ;;
    "")
        echo "Available commands:"
        echo "  new            - Create a new ELFIN package"
        echo "  build          - Build the package"
        echo "  publish        - Publish the package to the registry"
        echo "  install        - Install a package from the registry"
        echo "  fmt            - Format ELFIN source files"
        echo "  clippy         - Run the ELFIN linter"
        echo "  setup-registry - Initialize a local package registry"
        echo "  semver-check   - Check if two versions are semver compatible"
        echo ""
        echo "Example usage:"
        echo "  ./run_elfpkg.sh new my_package"
        echo "  ./run_elfpkg.sh build --release"
        echo "  ./run_elfpkg.sh install elfin-core"
        ;;
    *)
        echo "Unknown command: $command"
        echo "Use './run_elfpkg.sh' without arguments to see available commands"
        exit 1
        ;;
esac
