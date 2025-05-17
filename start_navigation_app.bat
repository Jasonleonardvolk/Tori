@echo off
echo Starting ALAN IDE with NavigationDemoApp...
echo =========================================
echo.
echo This will launch the full ALAN IDE with all 6 tabs including Lyapunov Predictability.
echo.

echo 1. Starting server...
start cmd /k "cd server && node index.js"

echo 2. Waiting for server to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo 3. Setting environment variables to disable ESLint...
cd client
if not exist ".env.local" (
    echo DISABLE_ESLINT_PLUGIN=true > .env.local
    echo SKIP_PREFLIGHT_CHECK=true >> .env.local
    echo BROWSER=none >> .env.local
)

echo 4. Starting React application...
echo.
echo The application will open at: http://localhost:3000
echo.
echo The interface includes all 6 tabs:
echo  - Semantic Search
echo  - Concept Graph
echo  - Spectral Analysis
echo  - Field Replay
echo  - Affective Computing
echo  - Lyapunov Predictability (with enhanced Rosenstein algorithm)
echo.
echo Press Ctrl+C to stop the client application.
echo Close the server window when done.
echo.

start cmd /k "npm start"
