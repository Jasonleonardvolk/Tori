@echo off
echo ==========================================
echo    TORI Advanced Memory System Activation
echo ==========================================
echo.

echo [1/4] Testing Python environment...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found
    pause
    exit /b 1
)

echo [2/4] Initializing Advanced Memory Components...
python init_advanced_memory.py
if %errorlevel% neq 0 (
    echo ERROR: Advanced memory initialization failed
    pause
    exit /b 1
)

echo [3/4] Testing MCP server packages...
echo Checking @modelcontextprotocol/server-memory...
npx -y @modelcontextprotocol/server-memory --help >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: @modelcontextprotocol/server-memory not available
) else (
    echo ✅ MCP memory server package found
)

echo [4/4] Starting Ingest Bus...
echo Starting ingest bus on port 8080...
cd ingest-bus
start "Ingest Bus" cmd /k "python -m src.main --host 0.0.0.0 --port 8080"
cd ..

echo.
echo ==========================================
echo  TORI Advanced Memory System Status
echo ==========================================
echo ✅ Advanced Memory Components: Loaded
echo ⚠️  MCP Servers: Testing required
echo ✅ Ingest Bus: Starting on port 8080
echo ==========================================
echo.

pause