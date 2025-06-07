# PowerShell TORI Login - FIXED VERSION

Write-Host "🔐 TORI Login - Fixed PowerShell Commands" -ForegroundColor Green
Write-Host "=" * 50

# Method 1: Using single quotes (prevents PowerShell escaping issues)
Write-Host "`n📋 Method 1: Using single quotes (RECOMMENDED)" -ForegroundColor Yellow
$loginCommand1 = 'curl.exe -X POST "http://localhost:8443/api/auth/login" -H "accept: application/json" -H "Content-Type: application/json" -d ''{"username":"operator","password":"operator123"}'''

Write-Host "Command:" -ForegroundColor Cyan
Write-Host $loginCommand1

Write-Host "`nRunning..." -ForegroundColor Green
try {
    $result1 = Invoke-Expression $loginCommand1
    Write-Host "✅ Result:" -ForegroundColor Green
    Write-Host $result1
} catch {
    Write-Host "❌ Error with Method 1: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: Using PowerShell native Invoke-RestMethod
Write-Host "`n📋 Method 2: PowerShell Native (BEST)" -ForegroundColor Yellow

$headers = @{
    "accept" = "application/json"
    "Content-Type" = "application/json"
}

$body = @{
    username = "operator"
    password = "operator123"
} | ConvertTo-Json

Write-Host "Running Invoke-RestMethod..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8443/api/auth/login" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
    if ($response.token) {
        $token = $response.token
        Write-Host "`n🎫 Token: $token" -ForegroundColor Cyan
        Write-Host "`n📤 Upload command:" -ForegroundColor Yellow
        Write-Host "curl.exe -X POST `"http://localhost:8443/api/upload`" -H `"Authorization: Bearer $token`" -F `"file=@your_file.pdf;type=application/pdf`"" -ForegroundColor Green
        
        # Save token to variable for easy use
        $global:TORI_TOKEN = $token
        Write-Host "`n💾 Token saved to `$global:TORI_TOKEN for easy use" -ForegroundColor Magenta
    }
} catch {
    Write-Host "❌ Error with Method 2: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure TORI is running on localhost:8443" -ForegroundColor Yellow
}

# Method 3: Using here-string to avoid escaping
Write-Host "`n📋 Method 3: Using here-string" -ForegroundColor Yellow

$jsonBody = @"
{"username":"operator","password":"operator123"}
"@

$curlCommand = @"
curl.exe -X POST "http://localhost:8443/api/auth/login" -H "accept: application/json" -H "Content-Type: application/json" -d '$jsonBody'
"@

Write-Host "Command:" -ForegroundColor Cyan
Write-Host $curlCommand

Write-Host "`nRunning..." -ForegroundColor Green
try {
    $result3 = Invoke-Expression $curlCommand
    Write-Host "✅ Result:" -ForegroundColor Green
    Write-Host $result3
} catch {
    Write-Host "❌ Error with Method 3: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Summary:" -ForegroundColor Yellow
Write-Host "- Method 2 (Invoke-RestMethod) is recommended for PowerShell"
Write-Host "- If you got a token, use it with: curl.exe upload command"
Write-Host "- Token is saved in `$global:TORI_TOKEN if successful"
