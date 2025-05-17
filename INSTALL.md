# Installation Guide for ELFIN Language Server and VS Code Extension

This guide provides step-by-step instructions for installing and setting up the ELFIN Language Server and VS Code extension.

## Features

The ELFIN Language Server provides:

- **Real-time diagnostics**: Shows dimensional inconsistencies as warnings
- **Hover Information**: Shows dimensional types when hovering over variables
- **Go-to-Definition**: Navigate to symbol definitions with F12
- **File Watching**: Automatically processes changes to files on disk

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher
- Visual Studio Code

## 1. Install the ELFIN Language Server

```bash
# Navigate to the project directory
cd /path/to/project

# Install the language server in development mode
pip install -e elfin_lsp/

# Verify installation
elfin-lsp version
```

## 2. Install the VS Code Extension

```bash
# Navigate to the extension directory
cd tools/vscode-elfin

# Install dependencies
npm install

# Install global tools if needed
npm install -g vsce

# Package the extension
vsce package

# Install the extension in VS Code
code --install-extension elfin-language-support-0.1.0.vsix
```

## 3. Configure the Extension (Optional)

1. Open VS Code
2. Go to Settings (File > Preferences > Settings)
3. Search for "ELFIN"
4. Configure the following settings:
   - `elfin.languageServer.enabled`: Enable/disable the ELFIN Language Server
   - `elfin.languageServer.path`: Path to the ELFIN Language Server executable
   - `elfin.formatting.enabled`: Enable/disable formatting on save

## 4. Verify Installation

1. Open an `.elfin` file in VS Code
2. The language server should start automatically
3. If you have a file with dimensional errors, they should appear in the Problems panel
4. You can check the OUTPUT panel (View > Output) and select "ELFIN Language Server" to see logs

## Troubleshooting

### Language Server Not Starting

1. Check that the `elfin-lsp` command is in your PATH
   ```bash
   which elfin-lsp  # On Unix/Linux/macOS
   where elfin-lsp  # On Windows
   ```

2. Check the VS Code extension logs
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "Developer: Open Extension Logs Folder"
   - Look for logs related to "elfin-language-support"

3. Check the language server logs
   - The logs are stored in `elfin_lsp.log` in the current working directory
   - You can specify a different log file with `elfin-lsp run --log-file path/to/log`

### VS Code Extension Not Working

1. Verify the extension is installed
   - Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS) to open the Extensions view
   - Search for "ELFIN"
   - The extension should be listed as "ELFIN Language Support"

2. Manually restart the language server
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "ELFIN: Restart Language Server"
