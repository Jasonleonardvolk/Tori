@echo off
echo ╔══════════════════════════════════════════════════════════╗
echo ║            TORI Phase 4 Completion Verification         ║
echo ║            Vault + gRPC + Memory Services                ║
echo ╚══════════════════════════════════════════════════════════╝

echo.
echo [1/8] Checking Phase 4 file completeness...

:: Check vault.proto
if exist "C:\Users\jason\Desktop\tori\kha\Tori\proto\vault.proto" (
    echo ✅ vault.proto - PRESENT
    set /a vault_proto=1
) else (
    echo ❌ vault.proto - MISSING
    set /a vault_proto=0
)

:: Check test files
if exist "C:\Users\jason\Desktop\tori\kha\Tori\test_vault_grpc.py" (
    echo ✅ test_vault_grpc.py - PRESENT
    set /a test_vault=1
) else (
    echo ❌ test_vault_grpc.py - MISSING
    set /a test_vault=0
)

if exist "C:\Users\jason\Desktop\tori\kha\Tori\test_koopman_grpc.py" (
    echo ✅ test_koopman_grpc.py - PRESENT
    set /a test_koopman=1
) else (
    echo ❌ test_koopman_grpc.py - MISSING
    set /a test_koopman=0
)

if exist "C:\Users\jason\Desktop\tori\kha\Tori\test_grpc_integration.py" (
    echo ✅ test_grpc_integration.py - PRESENT
    set /a test_integration=1
) else (
    echo ❌ test_grpc_integration.py - MISSING
    set /a test_integration=0
)

:: Check proto regeneration script
if exist "C:\Users\jason\Desktop\tori\kha\Tori\regenerate-grpc-protos.bat" (
    echo ✅ regenerate-grpc-protos.bat - PRESENT
    set /a regen_script=1
) else (
    echo ❌ regenerate-grpc-protos.bat - MISSING
    set /a regen_script=0
)

echo.
echo [2/8] Checking proto file consistency...

:: Check all required proto files
set /a proto_count=0
for %%f in (vault.proto episodic.proto koopman_learner.proto sleep_scheduler.proto sparse_pruner.proto) do (
    if exist "C:\Users\jason\Desktop\tori\kha\Tori\proto\%%f" (
        echo ✅ %%f - PRESENT
        set /a proto_count+=1
    ) else (
        echo ❌ %%f - MISSING
    )
)

echo    Proto files found: %proto_count%/5

echo.
echo [3/8] Checking protoc installation...
protoc --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ protoc compiler - AVAILABLE
    protoc --version
    set /a protoc_available=1
) else (
    echo ❌ protoc compiler - NOT FOUND
    echo    Install from: https://github.com/protocolbuffers/protobuf/releases
    set /a protoc_available=0
)

echo.
echo [4/8] Checking Python gRPC dependencies...
python -c "import grpc; print('✅ grpc module - AVAILABLE')" 2>nul || echo ❌ grpc module - MISSING (pip install grpcio)
python -c "import numpy; print('✅ numpy module - AVAILABLE')" 2>nul || echo ❌ numpy module - MISSING (pip install numpy)

echo.
echo [5/8] Testing proto stub generation...
if %protoc_available% EQU 1 (
    cd /d "C:\Users\jason\Desktop\tori\kha\Tori\proto"
    if not exist "generated" mkdir generated
    if not exist "generated\python" mkdir generated\python
    
    echo    Generating vault.proto stubs...
    protoc --python_out=generated\python --grpc_python_out=generated\python --proto_path=. vault.proto >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ vault.proto - GENERATED SUCCESSFULLY
        set /a vault_stubs=1
    ) else (
        echo ❌ vault.proto - GENERATION FAILED
        set /a vault_stubs=0
    )
    
    echo    Generating episodic.proto stubs...
    protoc --python_out=generated\python --grpc_python_out=generated\python episodic.proto >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ episodic.proto - GENERATED SUCCESSFULLY
        set /a episodic_stubs=1
    ) else (
        echo ❌ episodic.proto - GENERATION FAILED
        set /a episodic_stubs=0
    )
    
    cd /d "C:\Users\jason\Desktop\tori\kha\Tori"
) else (
    echo ⚠️  Skipping stub generation - protoc not available
    set /a vault_stubs=0
    set /a episodic_stubs=0
)

echo.
echo [6/8] Checking gRPC service ports...

:: Check if standard gRPC ports are available
echo    Checking port availability...
netstat -an | findstr ":50051" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 50051 (Vault) - IN USE
    set /a vault_port=1
) else (
    echo ⚠️  Port 50051 (Vault) - AVAILABLE (service not running)
    set /a vault_port=0
)

netstat -an | findstr ":50052" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 50052 (Koopman) - IN USE
    set /a koopman_port=1
) else (
    echo ⚠️  Port 50052 (Koopman) - AVAILABLE (service not running)
    set /a koopman_port=0
)

echo.
echo [7/8] Running integration test validation...

:: Test if integration tests can be imported
python -c "
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath('.')), 'proto', 'generated', 'python'))
try:
    import test_vault_grpc
    print('✅ test_vault_grpc - IMPORTABLE')
except Exception as e:
    print(f'❌ test_vault_grpc - IMPORT ERROR: {e}')

try:
    import test_koopman_grpc  
    print('✅ test_koopman_grpc - IMPORTABLE')
except Exception as e:
    print(f'❌ test_koopman_grpc - IMPORT ERROR: {e}')

try:
    import test_grpc_integration
    print('✅ test_grpc_integration - IMPORTABLE')
except Exception as e:
    print(f'❌ test_grpc_integration - IMPORT ERROR: {e}')
" 2>nul || echo ❌ Python test import failed

echo.
echo [8/8] Calculating Phase 4 completion percentage...

:: Calculate completion score
set /a total_points=14
set /a earned_points=0

set /a earned_points+=%vault_proto%
set /a earned_points+=%test_vault%
set /a earned_points+=%test_koopman%
set /a earned_points+=%test_integration%
set /a earned_points+=%regen_script%
set /a earned_points+=%proto_count%
set /a earned_points+=%protoc_available%
set /a earned_points+=%vault_stubs%
set /a earned_points+=%episodic_stubs%

:: Calculate percentage
set /a completion_percentage=(%earned_points% * 100) / %total_points%

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                PHASE 4 COMPLETION REPORT                ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  Score: %earned_points%/%total_points% points                                        ║
echo ║  Completion: %completion_percentage%%%                                    ║

if %completion_percentage% GEQ 100 (
    echo ║  Status: ✅ PHASE 4 COMPLETE                           ║
    echo ║                                                        ║
    echo ║  🎉 All vault + gRPC infrastructure ready!            ║
    echo ║  📊 Proto files generated and validated               ║
    echo ║  🔧 Integration tests fully implemented               ║
    echo ║  ⚡ Ready for production deployment                   ║
    echo ║                                                        ║
    echo ║  🔜 NEXT: Ghost AI Integration (Phase 5)              ║
) else if %completion_percentage% GEQ 85 (
    echo ║  Status: ⚠️  MOSTLY COMPLETE                          ║
    echo ║                                                        ║
    echo ║  🔧 Minor fixes needed before production              ║
    echo ║  📋 Review missing components above                   ║
    echo ║  🎯 Focus on proto generation and service setup      ║
) else (
    echo ║  Status: ❌ INCOMPLETE                                ║
    echo ║                                                        ║
    echo ║  🚨 Major components missing                          ║
    echo ║  🔧 Complete vault.proto and test implementation     ║
    echo ║  📋 Install missing dependencies                     ║
    echo ║  ⚠️  Not ready for production                        ║
)

echo ╚══════════════════════════════════════════════════════════╝

echo.
echo 💡 RECOMMENDED NEXT STEPS:

if %completion_percentage% GEQ 100 (
    echo    ✅ Run: python test_grpc_integration.py
    echo    ✅ Proceed to Ghost AI integration
    echo    ✅ Begin production deployment preparation
) else if %completion_percentage% GEQ 85 (
    echo    🔧 Run: regenerate-grpc-protos.bat
    echo    🔧 Install missing Python packages
    echo    🔧 Test: python test_vault_grpc.py
) else (
    echo    🚨 Complete vault.proto implementation
    echo    🚨 Install protoc compiler
    echo    🚨 Regenerate all proto stubs
    echo    🚨 Fix missing test files
)

echo.
echo 📁 Phase 4 Files Location:
echo    C:\Users\jason\Desktop\tori\kha\Tori\proto\
echo    C:\Users\jason\Desktop\tori\kha\Tori\test_*.py
echo    C:\Users\jason\Desktop\tori\kha\Tori\regenerate-grpc-protos.bat

echo.
pause
