@echo off
echo ======================================================
echo         ITORI IDE Production Build Process
echo ======================================================
echo.

rem Check if dependencies are installed
if not exist "node_modules" (
  echo Installing dependencies...
  npm install --legacy-peer-deps
  echo.
)

echo Running production build...
echo.
echo This will:
echo   - Optimize all JavaScript and CSS
echo   - Create production bundles with code splitting
echo   - Generate sourcemaps for debugging
echo   - Place files in the build/ directory
echo.

rem Run in production mode using the .env.production file
npx vite build --mode production

echo.
if %ERRORLEVEL% EQU 0 (
  echo ======================================================
  echo Build completed successfully!
  echo Files are in the build/ directory
  echo ======================================================
  echo.
  echo To preview the production build:
  echo   npx vite preview
  echo.
) else (
  echo ======================================================
  echo Build failed with error code %ERRORLEVEL%
  echo ======================================================
  echo.
)
