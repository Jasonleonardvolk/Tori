# Import Path Migration Tool

This tool helps you update your imports from relative paths to the new `@itori` package structure.

## Usage

The simplest way to run the import path migration tool is to use the provided batch script:

```bash
run-import-migration.bat
```

This will scan all relevant directories for files that need import path updates.

## Manual Usage

If you need more control over which files are processed, you can run the tool manually:

```bash
# Process all JS/TS files in client/src
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/**/*.{js,ts,jsx,tsx}"

# Process specific directories
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/hooks/**/*.{js,ts,jsx,tsx}"
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/components/**/*.{js,ts,jsx,tsx}"

# Process files in app directories
pnpm exec jscodeshift -t scripts/update-imports.js "apps/**/*.{js,ts,jsx,tsx}"
```

## What It Does

The tool will transform imports like:

```javascript
import { useAlanSocket } from '../hooks/useAlanSocket';
import { WebSocketStatus } from '../../components/WebSocketStatus';
```

To:

```javascript
import { useAlanSocket } from '@itori/runtime-bridge';
import { WebSocketStatus } from '@itori/ui-kit';
```

## Adding New Mappings

If you need to add more import path mappings, edit the `importMappings` object in `scripts/update-imports.js`.
