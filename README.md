# ITORI Platform

The ITORI Platform is an integrated development environment for concept evolution visualization and manipulation.

## Project Structure

This project is organized as a monorepo using pnpm workspaces:

```
itori/
├─ apps/                 # Applications
│  ├─ chat/              # Chat application
│  ├─ chatenterprise/    # Enterprise chat application
│  └─ ide/               # IDE application
├─ packages/             # Shared packages
│  ├─ runtime-bridge/    # Runtime communication (WebSockets)
│  ├─ ui-kit/            # UI components
│  ├─ data-model/        # Data models and types
│  └─ ingest/            # Document ingestion utilities
├─ client/               # Legacy client code (being migrated)
├─ backend/              # Backend services
└─ ingest_pdf/           # PDF processing routines
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- Python 3.10+ for backend services

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build
```

### Development

```bash
# Start the development server for a specific app
pnpm --filter @itori/chat dev

# Build a specific package
pnpm --filter @itori/ui-kit build

# Run all packages in development mode
pnpm -r dev
```

## Environment Configuration

Each application has its own environment configuration in `.env.*` files:

- `.env.development` - Development settings
- `.env.production` - Production settings

Key environment variables:

- `VITE_ITORI_API_URL`: Backend API URL
- `VITE_ITORI_WS_URL`: WebSocket server URL
- `VITE_ITORI_API_PORT`: API server port
- `VITE_ITORI_WS_PORT`: WebSocket server port

## Shared Packages

### @itori/runtime-bridge

Communication layer for WebSocket connections and real-time updates.

```js
import { useAlanSocket } from '@itori/runtime-bridge';

// Create WebSocket connection
const { status, send } = useAlanSocket(handleMessage);
```

### @itori/ui-kit

Reusable UI components with consistent styling.

```jsx
import { WebSocketStatus } from '@itori/ui-kit';

// Display WebSocket status
<WebSocketStatus status={status} onReconnect={reconnect} />
```

### @itori/data-model

Shared data models and types.

```ts
import { Document, Concept } from '@itori/data-model';

// Use shared types
const document: Document = { /* ... */ };
```

### @itori/ingest

Document ingestion utilities.

```ts
import { pollUploadStatus } from '@itori/ingest';

// Poll for document processing status
const document = await pollUploadStatus(jobId);
```

## Port Configuration

The platform uses several ports for different services:

- `3000`: Main web application (default)
- `3003`: Backend API server
- `8000`: WebSocket server
- `5173`: Vite development server

To avoid port conflicts, the port-check utility will verify available ports before starting.

### Workspace scripts

| Purpose                      | Command                                 |
|------------------------------|-----------------------------------------|
| bootstrap deps              | `pnpm install`                          |
| codemod legacy → workspace  | `pnpm run codemod:apps` / `codemod:client` |
| lint + typecheck (turbo)    | `pnpm turbo run lint typecheck --parallel` |
| build everything            | `pnpm build`                            |
| dev servers                 | `pnpm dev:chat` • `dev:enterprise` • `dev:ide` |

### Codemod helpers
```bash
# monorepo apps (new)
pnpm exec jscodeshift -t scripts/update-imports.js "apps/**/*.{ts,tsx,jsx}"

# legacy client folder (old)
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/**/*.{js,ts,jsx,tsx}"
```

## Environment Setup Instructions

To complete the setup, you'll need to:

1. **Install pnpm globally**:

   ```bash
   npm install -g pnpm
   ```

2. **Install workspace dependencies**:

   ```bash
   pnpm install
   ```

3. **Build all packages**:

   ```bash
   pnpm -r build
   ```

4. **Run the import path migration tool**:

   ```bash
   # Process monorepo apps
   pnpm run codemod:apps
   
   # Process legacy client code
   pnpm run codemod:client
   ```

## Component Migration Plan

For migrating additional components:

1. **Identify shared components** in the client directory
2. **Create TypeScript versions** in appropriate packages
3. **Update imports** using the provided codemod tool
4. **Test the integration** after migration

## IDE Integration Approach

The CodeMirror integration should follow these steps:

1. Add CodeMirror as a dependency in `packages/ui-kit`
2. Create a reusable editor component with TypeScript typing
3. Integrate it with the existing IDE layout
4. Add state management for file editing
