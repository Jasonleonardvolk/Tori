# ITORI Platform Monorepo Setup

This document provides a step-by-step guide to setting up the ITORI Platform monorepo environment.

## Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)

## Setup Steps

1. **Install pnpm globally**:
   ```bash
   npm install -g pnpm
   ```

2. **Install workspace dependencies**:
   ```bash
   pnpm install
   ```
   This will install all dependencies for all packages in the monorepo.

3. **Fix any build errors**:
   If you encounter any build errors when running `pnpm -r build`, address them before proceeding.
   
   Common issues:
   - Unused imports (e.g., the `isValidMessage` issue in `useAlanSocket.ts`)
   - Missing dependencies
   - TypeScript type errors

4. **Build all packages**:
   ```bash
   pnpm -r build
   ```
   This will build all packages in the workspace.

5. **Run the import path migration tool**:
   ```bash
   run-import-migration.bat
   ```
   This will update import paths from relative paths to package imports (`@itori/*`).

   See `IMPORT_MIGRATION.md` for more details on this tool.

## Project Structure

The monorepo is organized using pnpm workspaces with the following structure:

- `apps/`: Contains the main applications
  - `chat/`: Chat application
  - `chatenterprise/`: Enterprise chat application
  - `ide/`: IDE application

- `packages/`: Contains shared packages
  - `data-model/`: Type definitions and data structures
  - `ingest/`: Document processing utilities
  - `runtime-bridge/`: WebSocket communications and message handling
  - `ui-kit/`: Reusable UI components with styling

## Development Workflow

1. **Run development servers**:
   ```bash
   # Run the IDE development server
   pnpm dev:ide

   # Run the Chat development server
   pnpm dev:chat

   # Run the Enterprise Chat development server
   pnpm dev:enterprise
   ```

2. **Build for production**:
   ```bash
   # Build all packages and apps
   pnpm build

   # Build specific apps
   pnpm build:ide
   pnpm build:chat
   pnpm build:enterprise
   ```

## Troubleshooting

- If you encounter build errors, check for unused imports or missing dependencies.
- If the import path migration tool doesn't update all imports, you may need to run it with different file patterns.
- If there are peer dependency warnings, review your package versions to ensure compatibility.

For more information, refer to the documentation in the individual package directories.
