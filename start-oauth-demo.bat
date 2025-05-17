@echo off
echo Starting Google OAuth Demo...
echo.
echo Starting Backend on port 3001...
start "Google OAuth Server" cmd /c "start-google-auth.bat"
echo.
echo Starting Frontend on port 3000...
start "React Client" cmd /c "start-client.bat"
echo.
echo Services started! Open your browser to http://localhost:3000
