@echo off
REM 🔐 TORI EXACT Authentication Steps - Windows Version

echo 🚀 TORI EXACT Authentication Steps
echo =================================
echo.
echo 🔴 CRITICAL: You MUST include -H "Authorization: Bearer <TOKEN>" or you get 403!
echo.

REM Step 1: Show exact login command
echo 1️⃣ STEP 1: Login to get token
echo Command to run:
echo.
echo curl.exe -X POST "http://localhost:8443/api/auth/login" ^
echo   -H "accept: application/json" ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"username\":\"operator\",\"password\":\"operator123\"}"
echo.
echo 📋 Running login now...

REM Execute login
curl.exe -s -X POST "http://localhost:8443/api/auth/login" ^
  -H "accept: application/json" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"operator\",\"password\":\"operator123\"}" ^
  -o login_response.json

if %errorlevel% neq 0 (
    echo ❌ Login failed. Make sure TORI is running!
    exit /b 1
)

echo Response:
type login_response.json
echo.

REM Extract token (simplified for Windows)
for /f "tokens=2 delims=:" %%a in ('findstr "token" login_response.json') do (
    set TOKEN_RAW=%%a
)

REM Clean token
set TOKEN=%TOKEN_RAW:"=%
set TOKEN=%TOKEN: =%
set TOKEN=%TOKEN:,=%

if "%TOKEN%"=="" (
    echo ❌ Failed to extract token. Check login response above.
    exit /b 1
)

echo ✅ Token extracted: %TOKEN%
echo.

REM Step 2: Show exact upload command
echo 2️⃣ STEP 2: Upload with Authorization header (THE CRITICAL PART)
echo Command to run:
echo.
echo curl.exe -X POST "http://localhost:8443/api/upload" ^
echo   -H "accept: application/json" ^
echo   -H "Authorization: Bearer %TOKEN%" ^
echo   -F "file=@2407.15527v2.pdf;type=application/pdf"
echo.
echo 🔴 NOTICE: The -H "Authorization: Bearer ..." line is REQUIRED!
echo 🔴 Without it, you get 403 EVERY TIME!
echo.

REM Check if PDF exists, create dummy if not
set PDF_FILE=2407.15527v2.pdf
if not exist "%PDF_FILE%" (
    echo 📄 Creating test PDF file: %PDF_FILE%
    echo Test PDF content for TORI authentication > "%PDF_FILE%"
)

echo 📋 Running upload now with Authorization header...

REM Execute upload with Authorization header
curl.exe -s -X POST "http://localhost:8443/api/upload" ^
  -H "accept: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -F "file=@%PDF_FILE%;type=application/pdf" ^
  -o upload_response.json

echo Upload Response:
type upload_response.json
echo.

REM Check if successful
findstr /i "success\|uploaded" upload_response.json > nul
if %errorlevel% equ 0 (
    echo 🎆 SUCCESS! Upload worked with Authorization header!
) else (
    echo ❌ Upload failed. Check response above.
)

echo.
echo 📋 SUMMARY - These are the EXACT commands you need:
echo.
echo 1. Login:
echo    curl.exe -X POST "http://localhost:8443/api/auth/login" ^
echo      -H "accept: application/json" ^
echo      -H "Content-Type: application/json" ^
echo      -d "{\"username\":\"operator\",\"password\":\"operator123\"}"
echo.
echo 2. Copy the token from the response
echo.
echo 3. Upload with Authorization header:
echo    curl.exe -X POST "http://localhost:8443/api/upload" ^
echo      -H "accept: application/json" ^
echo      -H "Authorization: Bearer YOUR_ACTUAL_TOKEN_HERE" ^
echo      -F "file=@2407.15527v2.pdf;type=application/pdf"
echo.
echo 🔴 CRITICAL: Replace YOUR_ACTUAL_TOKEN_HERE with the real token!
echo 🔴 The Authorization header is MANDATORY!

REM Cleanup
del login_response.json 2>nul
