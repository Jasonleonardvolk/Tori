#!/bin/bash
# Release script for ELFIN v1.0.0-alpha.2
# This script handles the release process for the alpha.2 release,
# including tagging the release and pushing it to the repository.

echo "==========================================="
echo "  ELFIN v1.0.0-alpha.2 Release Process"
echo "==========================================="
echo

# Ensure we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "WARNING: You are not on the main branch."
    echo "You are currently on: $CURRENT_BRANCH"
    read -p "Do you want to continue with the release? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Release process aborted."
        exit 1
    fi
fi

# Ensure the working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Working directory is not clean."
    echo "Please commit or stash your changes before running this script."
    exit 1
fi

# Pull the latest changes
echo "Pulling latest changes from origin..."
git pull origin $CURRENT_BRANCH

# Create the tag
echo "Creating tag v1.0.0-alpha.2..."
git tag -a v1.0.0-alpha.2 -m "Koopman Bridge + CV + CE-refine"

# Push the tag
echo "Pushing tag to origin..."
git push origin v1.0.0-alpha.2

echo
echo "v1.0.0-alpha.2 release has been tagged and pushed!"
echo
echo "Changelog entry:"
echo "----------------"
echo "Added Koopman k-fold CV, MILP counterexample refinement, and live λ-weight tuning API."
echo "ELFIN can now learn, certify, and iteratively improve Lyapunov functions from data with one command."
echo
echo "Next steps:"
echo "1. Update the documentation (docs/model_diagnostics.md)"
echo "2. Update CLI docs for elf verify --cv and /api/koopman/* endpoints"
echo "3. Wire up the dashboard Model Health widget"
echo
echo "Future roadmap:"
echo "- Barrier-Certificate branch"
echo "- LCN-Planner stability guard"
echo "- Nightly CI matrix"
echo
echo "Release completed successfully!"
