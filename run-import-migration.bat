@echo off
REM Script to run the import path migration tool on all relevant files

echo Running import path migration tool...

REM Run against all potential JS/TS files in client/src
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/**/*.{js,ts,jsx,tsx}"

REM Run against specific component and hook directories
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/hooks/**/*.{js,ts,jsx,tsx}"
pnpm exec jscodeshift -t scripts/update-imports.js "client/src/components/**/*.{js,ts,jsx,tsx}"

REM Run against app directories
pnpm exec jscodeshift -t scripts/update-imports.js "apps/**/*.{js,ts,jsx,tsx}"

echo Import path migration complete!
