# Migration Verification Scripts

This folder contains a set of PowerShell scripts to help verify and fix the directory migration from `client/` to `ide_frontend/` and `chat/` to `tori_chat_frontend/`.

## Available Scripts

### 1. `verify-imports.ps1`
Checks for import statements across the codebase to verify there are no references to old directory names.

**Features:**
- Extracts all import statements from JS/TS/JSX/TSX files
- Checks for references to old directory names in imports
- Runs TypeScript compiler to check for module resolution errors
- Optionally generates detailed module resolution log
- Runs ESLint to check for import errors (if available)

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File verify-imports.ps1
```

### 2. `auto-fix-imports.ps1`
Automatically fixes import statements that reference old directory names.

**Features:**
- Scans all JS/TS/JSX/TSX files for imports with old directory references
- Automatically updates imports to use the new directory names
- Reports statistics on files modified and replacements made

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File auto-fix-imports.ps1
```

### 3. `check-script-references.ps1`
Checks script files (bat, sh, ps1, cmd, Makefile) for references to old directory names.

**Features:**
- Scans script files for references to old directory names
- Reports line numbers where references were found
- Provides guidance on manual fixes

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File check-script-references.ps1
```

### 4. `final-sweep.ps1`
Performs a comprehensive sweep of all files in the codebase for any remaining references to old directory names.

**Features:**
- Searches all non-binary files for references to old directory names
- Groups and reports matches by file
- Outputs detailed results to a CSV file
- Provides final verification steps

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File final-sweep.ps1
```

### 5. `fix-jsx-files.ps1`
Identifies JavaScript files containing JSX code and renames them to use the `.jsx` extension.

**Features:**
- Scans for JS files containing JSX syntax patterns
- Automatically renames matching files to use `.jsx` extension
- Reports statistics on files renamed

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File fix-jsx-files.ps1
```

### 6. `rename-ts-to-tsx.ps1`
Identifies TypeScript files containing JSX code and renames them to use the `.tsx` extension.

**Features:**
- Scans for TS files containing JSX syntax patterns
- Automatically renames matching files to use `.tsx` extension
- Reports statistics on files renamed

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File rename-ts-to-tsx.ps1
```

## Recommended Verification Process

For a thorough verification of the migration, follow these steps:

1. Run `fix-jsx-files.ps1` and `rename-ts-to-tsx.ps1` to ensure proper file extensions
2. Run `verify-imports.ps1` to identify any import issues
3. If issues are found, run `auto-fix-imports.ps1` to fix them
4. Run `check-script-references.ps1` to find and manually fix script references
5. Run `final-sweep.ps1` as a final check for any remaining references
6. Verify builds work correctly:
   ```
   pnpm --filter @itori/ide build --mode production.ide
   pnpm --filter @itori/chat build --mode production.chat
   ```
7. Test both applications in development mode:
   ```
   pnpm --filter @itori/ide dev
   pnpm --filter @itori/chat dev
   ```

## Notes

- These scripts are designed to be non-destructive and will not modify files without reporting their actions
- CSV output files are generated for detailed analysis when issues are found
- The final-sweep script can take some time to run as it searches through all files in the codebase
