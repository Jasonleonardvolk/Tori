@echo off
echo ╔═══════════════════════════════════════════════════════╗
echo ║         TORI gRPC Proto Regeneration Script           ║
echo ║         Complete Phase 4 Implementation              ║
echo ╚═══════════════════════════════════════════════════════╝

echo.
echo [1/6] Checking protobuf compiler installation...

:: Check if protoc is available
protoc --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Protocol Buffers compiler (protoc) not found
    echo.
    echo Please install Protocol Buffers compiler:
    echo   Option 1: Download from https://github.com/protocolbuffers/protobuf/releases
    echo   Option 2: Install via chocolatey: choco install protoc
    echo   Option 3: Install via scoop: scoop install protobuf
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Protocol Buffers compiler found
    protoc --version
)

echo.
echo [2/6] Navigating to proto directory...
cd /d "C:\Users\jason\Desktop\tori\kha\Tori\proto"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Proto directory not found
    pause
    exit /b 1
)

echo.
echo [3/6] Creating output directories...
if not exist "generated" mkdir generated
if not exist "generated\python" mkdir generated\python
if not exist "generated\javascript" mkdir generated\javascript
if not exist "generated\typescript" mkdir generated\typescript

echo.
echo [4/6] Generating Python gRPC stubs...
echo 🔧 Generating episodic.proto stubs...
protoc --python_out=generated\python --grpc_python_out=generated\python episodic.proto
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate episodic.proto Python stubs
    goto :error
)

echo 🔧 Generating vault.proto stubs...
protoc --python_out=generated\python --grpc_python_out=generated\python --proto_path=. vault.proto
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate vault.proto Python stubs
    goto :error
)

echo 🔧 Generating koopman_learner.proto stubs...
protoc --python_out=generated\python --grpc_python_out=generated\python --proto_path=. koopman_learner.proto
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate koopman_learner.proto Python stubs
    goto :error
)

echo 🔧 Generating sleep_scheduler.proto stubs...
protoc --python_out=generated\python --grpc_python_out=generated\python sleep_scheduler.proto
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate sleep_scheduler.proto Python stubs
    goto :error
)

echo 🔧 Generating sparse_pruner.proto stubs...
protoc --python_out=generated\python --grpc_python_out=generated\python sparse_pruner.proto
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate sparse_pruner.proto Python stubs
    goto :error
)

echo.
echo [5/6] Generating JavaScript/Node.js stubs (if grpc-tools available)...
where grpc_tools_node_protoc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 🔧 Generating JavaScript stubs...
    grpc_tools_node_protoc --js_out=import_style=commonjs,binary:generated\javascript --grpc_out=grpc_js:generated\javascript --proto_path=. episodic.proto vault.proto koopman_learner.proto sleep_scheduler.proto sparse_pruner.proto
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  JavaScript stub generation failed (optional)
    ) else (
        echo ✅ JavaScript stubs generated
    )
) else (
    echo ⚠️  grpc-tools not found - skipping JavaScript stubs (optional)
    echo   Install with: npm install -g grpc-tools
)

echo.
echo [6/6] Verifying generated files...
set /a total_files=0
set /a generated_files=0

for %%f in (episodic vault koopman_learner sleep_scheduler sparse_pruner) do (
    set /a total_files+=2
    if exist "generated\python\%%f_pb2.py" (
        echo ✅ %%f_pb2.py
        set /a generated_files+=1
    ) else (
        echo ❌ %%f_pb2.py MISSING
    )
    
    if exist "generated\python\%%f_pb2_grpc.py" (
        echo ✅ %%f_pb2_grpc.py
        set /a generated_files+=1
    ) else (
        echo ❌ %%f_pb2_grpc.py MISSING
    )
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║              gRPC PROTO GENERATION COMPLETE          ║
echo ╠═══════════════════════════════════════════════════════╣
echo ║  Generated Files: %generated_files%/%total_files%                               ║

if %generated_files% EQU %total_files% (
    echo ║  Status: ✅ ALL PROTOS REGENERATED                  ║
    echo ║                                                       ║
    echo ║  📁 Output Location: generated/python/                ║
    echo ║                                                       ║
    echo ║  Generated Stubs:                                     ║
    echo ║  ✅ episodic_pb2.py + episodic_pb2_grpc.py           ║
    echo ║  ✅ vault_pb2.py + vault_pb2_grpc.py                 ║
    echo ║  ✅ koopman_learner_pb2.py + koopman_learner_pb2_grpc.py ║
    echo ║  ✅ sleep_scheduler_pb2.py + sleep_scheduler_pb2_grpc.py ║
    echo ║  ✅ sparse_pruner_pb2.py + sparse_pruner_pb2_grpc.py ║
    echo ║                                                       ║
    echo ║  🎯 Ready for gRPC service integration!              ║
    goto :success
) else (
    echo ║  Status: ⚠️  PARTIAL SUCCESS                        ║
    echo ║                                                       ║
    echo ║  Some proto files may have failed to generate        ║
    echo ║  Check protoc installation and proto file syntax     ║
    goto :error
)

echo ╚═══════════════════════════════════════════════════════╝

:success
echo.
echo 🚀 Proto regeneration complete! 
echo    Next steps:
echo    1. Test vault service: python test_vault_grpc.py
echo    2. Test Koopman service: python test_koopman_grpc.py  
echo    3. Run integration tests: python test_grpc_integration.py
echo.
pause
exit /b 0

:error
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ❌ Proto regeneration failed
echo    Check error messages above and fix issues
echo    Common fixes:
echo    1. Install protoc compiler
echo    2. Check proto file syntax
echo    3. Ensure all import dependencies exist
echo.
pause
exit /b 1
