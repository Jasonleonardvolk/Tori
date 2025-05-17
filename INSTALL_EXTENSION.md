# ELFIN Language Extension Installation Guide

This document provides simplified installation instructions for the ELFIN Language Support extension.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher
- Visual Studio Code

## Installation Steps

### 1. Install the ELFIN Language Server

The language server provides core functionality including diagnostics, hover information, and go-to-definition:

```bash
# Navigate to the project directory
cd /path/to/project

# Install the language server in development mode
pip install -e elfin_lsp/

# Verify installation
python -c "import elfin_lsp; print('ELFIN LSP installed successfully')"
```

### 2. Install the VS Code Extension

We've created a streamlined installation process that avoids packaging vulnerabilities:

```bash
# Navigate to the extension directory
cd tools/vscode-elfin

# Install dependencies if needed
npm install

# Install the extension directly to VS Code
npm run install-extension
```

This installer will:
1. Install required dependencies
2. Fix linting issues where possible
3. Copy extension files to your VS Code extensions directory
4. Set up the extension with minimal dependencies

### 3. Verify the Installation

1. Restart VS Code completely
2. Open an `.elfin` file
3. You should see syntax highlighting and LSP features

## Features

The extension provides:

- **Syntax highlighting** for `.elfin` files
- **Real-time diagnostics** showing dimensional inconsistencies
- **Hover information** displaying dimensional types for variables
- **Go-to-definition** support (F12)
- **File watching** to automatically process external changes

## Troubleshooting

If the extension doesn't work properly:

1. Check the Output panel in VS Code (View > Output) and select "ELFIN Language Server"
2. Verify the language server is installed correctly by running `elfin-lsp version`
3. Try restarting VS Code
4. Check the extension log files by running the VS Code command "Developer: Open Extension Logs Folder"

If you encounter issues with npm dependencies, you can safely ignore most vulnerability warnings as they are related to development tools and don't affect the extension's functionality.
