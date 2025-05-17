@echo off
echo ALAN IDE - Navigation Demo with Lyapunov Predictability
echo ==========================================================
echo.
echo Starting the Navigation Demo app with the following features:
echo   - Semantic Search
echo   - Concept Graph
echo   - Spectral Analysis
echo   - Field Replay
echo   - Lyapunov Predictability (NEW!)
echo.
echo The app will be available at: http://localhost:3000/navigation
echo.
echo Installation checks...

cd client

echo Checking for missing dependencies...
call npm list react-router-dom || npm install react-router-dom --save

echo Starting the application...
npm run start
