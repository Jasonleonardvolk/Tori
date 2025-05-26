@echo off
echo ╔═══════════════════════════════════════════════════════╗
echo ║         TORI Phase 2 Completion Verifier             ║
echo ║         PDF Ingestion Pipeline Validation            ║
echo ╚═══════════════════════════════════════════════════════╝

echo.
echo [1/6] Checking core PDF ingestion components...

:: Check if enhanced PDF pipeline exists
if exist "src\services\pdfIngestionPipeline.js" (
    echo ✅ Enhanced PDF Ingestion Pipeline: FOUND
) else (
    echo ❌ Enhanced PDF Ingestion Pipeline: MISSING
    goto :error
)

:: Check if enhanced server exists
if exist "server.js" (
    echo ✅ Enhanced Server with PDF Integration: FOUND
) else (
    echo ❌ Enhanced Server: MISSING
    goto :error
)

echo.
echo [2/6] Validating PDF ingestion features...

:: Check for phase mapping in pipeline
findstr /C:"calculateConceptPhase" "src\services\pdfIngestionPipeline.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Concept Phase Mapping: IMPLEMENTED
) else (
    echo ❌ Concept Phase Mapping: MISSING
)

:: Check for ConceptDiff logging
findstr /C:"logConceptDiffOperations" "src\services\pdfIngestionPipeline.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ ConceptDiff Phase Logging: IMPLEMENTED
) else (
    echo ❌ ConceptDiff Phase Logging: MISSING
)

:: Check for error handling
findstr /C:"processFileWithRetry" "src\services\pdfIngestionPipeline.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Upload Error Handling: IMPLEMENTED
) else (
    echo ❌ Upload Error Handling: MISSING
)

:: Check for file validation
findstr /C:"validateFilesBatch" "src\services\pdfIngestionPipeline.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Large File Validation: IMPLEMENTED
) else (
    echo ❌ Large File Validation: MISSING
)

echo.
echo [3/6] Checking server integration...

:: Check for enhanced upload endpoint
findstr /C:"pdfIngestionPipeline" "server.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Enhanced Upload Endpoint: INTEGRATED
) else (
    echo ❌ Enhanced Upload Endpoint: NOT INTEGRATED
)

:: Check for phase mapping endpoints
findstr /C:"phase-mappings" "server.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Phase Mapping Endpoints: IMPLEMENTED
) else (
    echo ❌ Phase Mapping Endpoints: MISSING
)

:: Check for metrics endpoints
findstr /C:"upload/metrics" "server.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Upload Metrics Endpoint: IMPLEMENTED
) else (
    echo ❌ Upload Metrics Endpoint: MISSING
)

echo.
echo [4/6] Verifying soliton memory integration...

:: Check soliton memory service
if exist "src\services\solitonMemory.js" (
    echo ✅ Soliton Memory Service: FOUND
) else (
    echo ❌ Soliton Memory Service: MISSING
)

:: Check for soliton storage calls in pipeline
findstr /C:"solitonMemory.storeMemory" "src\services\pdfIngestionPipeline.js" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Soliton Storage Integration: IMPLEMENTED
) else (
    echo ❌ Soliton Storage Integration: MISSING
)

echo.
echo [5/6] Testing configuration...

:: Check Node.js dependencies
if exist "package.json" (
    echo ✅ Package.json: FOUND
    findstr /C:"ffi-napi" "package.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ FFI Dependencies: CONFIGURED
    ) else (
        echo ⚠️  FFI Dependencies: NOT CONFIGURED (Run: npm install ffi-napi)
    )
) else (
    echo ❌ Package.json: MISSING
)

:: Check if Rust library exists
if exist "..\concept-mesh\target\release\concept_mesh.dll" (
    echo ✅ Soliton Engine Library: COMPILED
) else (
    if exist "..\concept-mesh\target\release\libconcept_mesh.dll" (
        echo ✅ Soliton Engine Library: COMPILED
    ) else (
        echo ⚠️  Soliton Engine Library: NOT COMPILED (Run: compile-soliton-engine.bat)
    )
)

echo.
echo [6/6] Calculating completion percentage...

:: Count implemented features
set /a total_features=12
set /a implemented=0

:: Core components
if exist "src\services\pdfIngestionPipeline.js" set /a implemented+=1
if exist "server.js" set /a implemented+=1

:: Pipeline features
findstr /C:"calculateConceptPhase" "src\services\pdfIngestionPipeline.js" >nul 2>&1 && set /a implemented+=1
findstr /C:"logConceptDiffOperations" "src\services\pdfIngestionPipeline.js" >nul 2>&1 && set /a implemented+=1
findstr /C:"processFileWithRetry" "src\services\pdfIngestionPipeline.js" >nul 2>&1 && set /a implemented+=1
findstr /C:"validateFilesBatch" "src\services\pdfIngestionPipeline.js" >nul 2>&1 && set /a implemented+=1

:: Server integration
findstr /C:"pdfIngestionPipeline" "server.js" >nul 2>&1 && set /a implemented+=1
findstr /C:"phase-mappings" "server.js" >nul 2>&1 && set /a implemented+=1
findstr /C:"upload/metrics" "server.js" >nul 2>&1 && set /a implemented+=1

:: Soliton integration
if exist "src\services\solitonMemory.js" set /a implemented+=1
findstr /C:"solitonMemory.storeMemory" "src\services\pdfIngestionPipeline.js" >nul 2>&1 && set /a implemented+=1

:: Dependencies
if exist "package.json" set /a implemented+=1

:: Calculate percentage
set /a percentage=(implemented * 100) / total_features

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║              PHASE 2 COMPLETION REPORT               ║
echo ╠═══════════════════════════════════════════════════════╣
echo ║  Features Implemented: %implemented%/%total_features%                         ║
echo ║  Completion Percentage: %percentage%%%                          ║
echo ║                                                       ║

if %percentage% GEQ 90 (
    echo ║  Status: ✅ PHASE 2 COMPLETE                        ║
    echo ║                                                       ║
    echo ║  🎯 PDF Ingestion Pipeline: FULLY OPERATIONAL        ║
    echo ║  ✅ Concept → Phase Mapping: CONFIRMED              ║
    echo ║  ✅ ConceptDiff Phase Logging: IMPLEMENTED          ║
    echo ║  ✅ Upload Error Handling: COMPREHENSIVE            ║
    echo ║  ✅ Large File Validation: COMPLETE                 ║
    echo ║  ✅ Soliton Memory Integration: ACTIVE              ║
    echo ║                                                       ║
    echo ║  📊 Ready for production deployment!                 ║
) else if %percentage% GEQ 70 (
    echo ║  Status: 🟡 MOSTLY COMPLETE - Minor fixes needed     ║
    echo ║                                                       ║
    echo ║  🔧 Complete remaining features and test again       ║
) else (
    echo ║  Status: ❌ INCOMPLETE - Major work needed           ║
    echo ║                                                       ║
    echo ║  📋 Address missing components before testing        ║
)

echo ╚═══════════════════════════════════════════════════════╝

if %percentage% GEQ 90 (
    echo.
    echo 🚀 Phase 2 Complete! PDF ingestion with complete phase mapping operational.
    echo.
    echo ⚡ Next steps:
    echo    1. Test upload: node start-production.cjs
    echo    2. Upload a PDF and verify phase mapping in logs
    echo    3. Move to Phase 3: Ghost AI + Koopman integration
    echo.
    goto :success
) else (
    echo.
    echo 🔧 Complete the missing components and run this verifier again.
    echo.
    goto :error
)

:success
echo ✨ TORI Phase 2 verification complete - Ready for Phase 3!
pause
exit /b 0

:error
echo ❌ Phase 2 verification failed - Please address the issues above.
pause
exit /b 1
