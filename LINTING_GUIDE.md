# VSCode Linting Guide

This guide explains how to run the linting scripts to clean up code formatting and fix linting errors using the VSCode sidebar.

## Setup

The project has been configured with:

1. **NPM/Yarn Scripts** in `package.json`
2. **VSCode Tasks** in `.vscode/tasks.json`

Both of these methods make the linting scripts accessible directly from the VSCode interface.

## Running Linting Scripts from VSCode Sidebar

### Method 1: Using NPM Scripts View

1. Open the Explorer panel in VSCode (Ctrl+Shift+E or click the file icon in the sidebar)
2. Scroll down to find the "NPM SCRIPTS" section (it should be expanded by default)
3. You'll see the following scripts:
   - `lint:docs`: Fixes formatting in markdown, text, and other files in the docs folder
   - `lint:client-errors`: Fixes TypeScript and JavaScript errors in client files
   - `lint:all`: Runs all linting scripts in sequence
   - `lint:fix`: Runs ESLint fix on all source files

4. Click the ▶️ (play) button next to any script to run it

### Method 2: Using VSCode Tasks

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
2. Type "Tasks: Run Task" and select it
3. Choose from the following custom tasks:
   - 🧹 Lint Docs (Fix Formatting)
   - 🧹 Lint Client Files (Fix Errors) 
   - 🧼 Run All Linting Fixes
   - 🔍 ESLint Fix All Files

4. The task will run in a new terminal panel

### Method 3: Using the Terminal

You can also run these commands directly from the terminal:

```bash
# Fix docs formatting
node docs-lint-fix.js

# Fix client linting errors
node fix-client-lint-errors.js

# Run all linting scripts (via yarn)
yarn lint:all

# Run ESLint fix only
yarn lint:fix
```

## Linting Reports

After running the linting scripts, reports will be generated:

- `docs/lint-fix-report.txt`: Report for docs folder linting
- `client-lint-fix-report.txt`: Report for client files linting

## Notes on ESLint Extension

If you have the ESLint extension installed in VSCode:

1. Problems detected by ESLint will be underlined in your code
2. Hover over issues to see details and quick fix options
3. Use Ctrl+Shift+P and search for "ESLint: Fix all auto-fixable Problems" to run ESLint fixes on the current file

## ESLint Configuration

The project uses the following ESLint configuration:

- Main configuration in `.eslintrc.js`
- Parser configuration in `.eslintrc.json`
