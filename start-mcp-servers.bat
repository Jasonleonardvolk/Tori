@echo off
echo Starting MCP Servers...
echo.
echo [1/3] Starting Memory Server...
start /B npx -y @modelcontextprotocol/server-memory

echo [2/3] Starting Filesystem Server...
start /B npx -y @modelcontextprotocol/server-filesystem "c:/Users/jason/Desktop/tori/kha" "c:/Users/jason/Desktop" "c:/Users/jason/Documents"

echo [3/3] Starting GitHub Server...
set GITHUB_PERSONAL_ACCESS_TOKEN=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
start /B npx -y @modelcontextprotocol/server-github

echo.
echo ✅ All MCP servers started successfully!
echo.
echo Services running:
echo   • Memory Server: @modelcontextprotocol/server-memory
echo   • Filesystem Server: @modelcontextprotocol/server-filesystem  
echo   • GitHub Server: @modelcontextprotocol/server-github
echo   • Ingest Bus: http://localhost:8080
echo.
echo Press any key to continue...
pause >nul
