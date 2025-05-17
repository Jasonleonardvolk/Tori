# ITORI UI Kit

A shared component library for the ITORI platform applications.

## Features

- 🎨 Modern, responsive UI components
- 📝 CodeMirror-based code editing with ELFIN syntax highlighting
- 🔄 WebSocket status indicators and connection management
- 🛡️ Error boundary components for fallback UIs
- 📚 Storybook integration for component development and documentation

## Getting Started

### Installation

This package is installed automatically as a workspace dependency. To manually install dependencies:

```bash
pnpm install
```

### Development

Build the package in watch mode:

```bash
pnpm dev
```

Run linting and type checking:

```bash
pnpm lint
pnpm typecheck
```

### Storybook

The Storybook development environment allows you to browse and interact with UI components in isolation:

```bash
pnpm storybook
```

This will start Storybook on http://localhost:6006 where you can see all available components, their variants, and documentation.

To build a static version of Storybook for deployment:

```bash
pnpm build-storybook
```

## Components

### CodeWorkspace

The `CodeWorkspace` component provides a code editor with syntax highlighting, based on CodeMirror.

```tsx
import { CodeWorkspace } from '@itori/ui-kit';

// For JSON editing
<CodeWorkspace 
  value={jsonString}
  onChange={handleChange}
  language="json"
  height="400px"
/>

// For ELFIN language editing
<CodeWorkspace
  value={elfinCode}
  onChange={handleChange}
  language="elfin"
  height="400px"
/>
```

#### ELFIN Language Support

The UI Kit includes custom syntax highlighting for the ELFIN language. The ELFIN language mode supports:

- Keywords: `agent`, `intent`, `concept`, `belief`, `perceive`, `action`, `decide`, `learn`, `adapt`
- Flow control: `fn`, `let`, `const`, `if`, `else`, `loop`, `break`, `continue`, `return`
- Comments with `;;`
- Strings, numbers, and identifiers
- Block-level indentation

### WebSocketStatus

The `WebSocketStatus` component displays the current connection status of a WebSocket connection.

```tsx
import { WebSocketStatus } from '@itori/ui-kit';

<WebSocketStatus 
  status="connected" // or "connecting", "disconnected"
  onReconnect={handleReconnect}
/>
```

### ErrorBoundary

The `ErrorBoundary` component provides a fallback UI when errors occur in child components.

```tsx
import { ErrorBoundary } from '@itori/ui-kit';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Contributing

When adding new components, please:

1. Create the component in `src/components/ComponentName/ComponentName.tsx`
2. Add an export in `src/components/ComponentName/index.ts`
3. Add the component to `src/index.ts`
4. Create a Storybook story in `src/components/ComponentName/ComponentName.stories.tsx`
5. Add Jest tests in `src/components/ComponentName/ComponentName.test.tsx`
6. Update this README with usage examples
