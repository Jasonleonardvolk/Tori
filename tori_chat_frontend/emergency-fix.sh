#!/bin/bash
echo "╔═══════════════════════════════════════╗"
echo "║ TORI Emergency Dependency Fix         ║"
echo "║ Installing Missing Packages           ║"
echo "╚═══════════════════════════════════════╝"

# Delete node_modules and package-lock to start fresh
echo "Clearing old dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install everything fresh
echo "Installing all dependencies..."
npm install

echo "╔═══════════════════════════════════════╗"
echo "║ TORI Dependencies Fixed!              ║"
echo "╚═══════════════════════════════════════╝"
