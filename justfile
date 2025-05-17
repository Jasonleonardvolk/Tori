# ALAN IDE Task Runner
# To use this file, install 'just': https://github.com/casey/just

# List available recipes
default:
    @just --list

# Start the entire application (client + server)
start: 
    yarn dev

# Start just the server
server:
    yarn dev:server

# Start just the client
client:
    yarn dev:client

# Build the client application
build:
    yarn build

# Run all tests
test:
    yarn test

# Run just server tests
test-server:
    yarn test:server

# Run just client tests
test-client:
    yarn test:client

# Run tests with coverage
test-coverage:
    yarn test:coverage

# Check dependency constraints
constraints:
    yarn constraints

# Fix dependency constraints automatically
fix-constraints:
    yarn constraints --fix

# Setup development environment (Windows)
setup-windows:
    powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1

# Setup development environment (macOS/Linux)
setup-unix:
    chmod +x scripts/bootstrap.sh && ./scripts/bootstrap.sh

# Clean node_modules and reinstall
clean-install:
    rm -rf node_modules client/node_modules server/node_modules
    yarn install

# Create .env file for development
setup-env:
    if [ ! -f .env ]; then echo "SKIP_PREFLIGHT_CHECK=true" > .env; fi
    if [ ! -f client/.env ]; then echo "SKIP_PREFLIGHT_CHECK=true\nBROWSER=none" > client/.env; fi
