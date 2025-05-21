@echo off
echo -----------------------------------------------------
echo Starting iTori Platform Bucket Viewer
echo -----------------------------------------------------

REM Set environment variables for the bucket viewer
set UPLOAD_BUCKET=chopin
set GOOGLE_APPLICATION_CREDENTIALS=credentials\service-account-key.json
set API_PORT=8000

echo Starting FastAPI backend...
start cmd /k "cd backend && python -m venv .venv && .venv\Scripts\activate && pip install fastapi uvicorn python-dotenv google-cloud-storage pydantic && python main.py"

echo Waiting for backend to start...
timeout /t 5

echo Starting IDE frontend (with Bucket Viewer)...
start cmd /k "cd ide_frontend && pnpm dev"

echo -----------------------------------------------------
echo Services starting!
echo -----------------------------------------------------
echo.
echo When everything is ready:
echo 1. Backend API will be available at: http://localhost:8000
echo 2. Frontend will be available at: http://localhost:5173
echo 3. Access the Bucket Viewer at: http://localhost:5173/bucket
echo.
echo Press any key to open the Bucket Viewer in your browser...
pause > nul
start http://localhost:5173/bucket
