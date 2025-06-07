# PowerShell version of the curl login command

# Method 1: Using curl.exe (if available)
Write-Host "🔐 Method 1: Using curl.exe in PowerShell" -ForegroundColor Green
Write-Host "Command:"
Write-Host 'curl.exe -X POST "http://localhost:8443/api/auth/login" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"username\":\"operator\",\"password\":\"operator123\"}"' -ForegroundColor Yellow

Write-Host "`n📋 Running now..."
curl.exe -X POST "http://localhost:8443/api/auth/login" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"username\":\"operator\",\"password\":\"operator123\"}"

Write-Host "`n" -NoNewline

# Method 2: Using Invoke-RestMethod (PowerShell native)
Write-Host "🔐 Method 2: Using Invoke-RestMethod (PowerShell native)" -ForegroundColor Green

$loginData = @{
    username = "operator"
    password = "operator123"
} | ConvertTo-Json

Write-Host "Command:"
Write-Host 'Invoke-RestMethod -Uri "http://localhost:8443/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData' -ForegroundColor Yellow

Write-Host "`n📋 Running now..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8443/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    Write-Host "✅ Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
    # Extract token for next step
    $token = $response.token
    Write-Host "`n🎫 Token extracted: $($token.Substring(0, 20))..." -ForegroundColor Cyan
    
    # Show upload command
    Write-Host "`n📤 Next step - Upload command:" -ForegroundColor Yellow
    Write-Host "curl.exe -X POST `"http://localhost:8443/api/upload`" -H `"Authorization: Bearer $token`" -F `"file=@2407.15527v2.pdf;type=application/pdf`"" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure TORI is running on localhost:8443" -ForegroundColor Yellow
}
