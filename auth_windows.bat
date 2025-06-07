@echo off
echo 🔐 Step 1: Get Token
echo.

curl.exe -X POST "http://localhost:8443/api/auth/login" ^
  -H "accept: application/json" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"operator\",\"password\":\"operator123\"}"

echo.
echo.
echo 📋 Copy the token from above, then run:
echo.
echo curl.exe -X POST "http://localhost:8443/api/upload" ^
echo   -H "accept: application/json" ^
echo   -H "Authorization: Bearer PASTE_YOUR_TOKEN_HERE" ^
echo   -F "file=@2407.15527v2.pdf;type=application/pdf"
echo.
echo 🔴 CRITICAL: Replace PASTE_YOUR_TOKEN_HERE with actual token!
