@echo off
REM 🚀 TORI Entropy Pruning - Production Deployment Checklist (Windows)
REM ===================================================================

title TORI Entropy Pruning - Production Deployment Checklist

echo 🚀 TORI ENTROPY PRUNING - PRODUCTION DEPLOYMENT CHECKLIST
echo ==========================================================

set PASSED=0
set FAILED=0
set WARNINGS=0

echo.
echo 🧪 TEST 1: Entropy Pruning Module Verification
echo ==============================================

REM Test entropy pruning module
python -c "from ingest_pdf.entropy_prune import entropy_prune, entropy_prune_with_categories; print('✅ Entropy pruning module imported successfully')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Entropy pruning module imports correctly
    set /a PASSED+=1
) else (
    echo ❌ Entropy pruning module import failed
    set /a FAILED+=1
)

REM Test dependencies
python -c "import numpy, sklearn, sentence_transformers; print('✅ Dependencies available')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Required dependencies available
    set /a PASSED+=1
) else (
    echo ❌ Missing required dependencies (numpy, sklearn, sentence-transformers)
    set /a FAILED+=1
)

echo.
echo 🔧 TEST 2: Pipeline Integration Verification
echo ===========================================

REM Test pipeline integration
python -c "from ingest_pdf.pipeline import ENABLE_ENTROPY_PRUNING, ENTROPY_CONFIG; print(f'✅ Entropy enabled: {ENABLE_ENTROPY_PRUNING}'); print(f'Config loaded: {len(ENTROPY_CONFIG)} settings')" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Pipeline integration successful
    set /a PASSED+=1
) else (
    echo ❌ Pipeline integration failed
    set /a FAILED+=1
)

echo.
echo 📊 TEST 3: File Verification
echo ===========================

REM Check core files
if exist "ingest_pdf\entropy_prune.py" (
    echo ✅ Core file exists: entropy_prune.py
    set /a PASSED+=1
) else (
    echo ❌ Missing: ingest_pdf\entropy_prune.py
    set /a FAILED+=1
)

if exist "test_entropy_pruning.py" (
    echo ✅ Test file exists: test_entropy_pruning.py
    set /a PASSED+=1
) else (
    echo ❌ Missing: test_entropy_pruning.py
    set /a FAILED+=1
)

if exist "ENTROPY_PRUNING_INTEGRATION.md" (
    echo ✅ Documentation exists: ENTROPY_PRUNING_INTEGRATION.md
    set /a PASSED+=1
) else (
    echo ❌ Missing: ENTROPY_PRUNING_INTEGRATION.md
    set /a FAILED+=1
)

echo.
echo 🧪 TEST 4: Functional Testing
echo ============================

echo Running entropy pruning test suite...
python test_entropy_pruning.py > test_output.log 2>&1
if %errorlevel% equ 0 (
    echo ✅ Entropy pruning test suite passed
    set /a PASSED+=1
    
    REM Check for completion message
    findstr /C:"All tests complete" test_output.log >nul
    if %errorlevel% equ 0 (
        echo ✅ All entropy tests completed successfully
        set /a PASSED+=1
    ) else (
        echo ⚠️  Tests completed with warnings
        set /a WARNINGS+=1
    )
) else (
    echo ❌ Entropy pruning test suite failed
    echo    Check test_output.log for details
    set /a FAILED+=1
)

echo.
echo 🔍 TEST 5: Configuration Validation
echo =================================

python -c "
from ingest_pdf.pipeline import ENTROPY_CONFIG
print('📋 Current Entropy Configuration:')
for key, value in ENTROPY_CONFIG.items():
    print(f'   {key}: {value}')

# Validate ranges
issues = []
if ENTROPY_CONFIG['default_top_k'] < 10 or ENTROPY_CONFIG['default_top_k'] > 100:
    issues.append('default_top_k should be 10-100')
if ENTROPY_CONFIG['admin_top_k'] < 50 or ENTROPY_CONFIG['admin_top_k'] > 500:
    issues.append('admin_top_k should be 50-500')
if ENTROPY_CONFIG['entropy_threshold'] < 0.001 or ENTROPY_CONFIG['entropy_threshold'] > 0.1:
    issues.append('entropy_threshold should be 0.001-0.1')
if ENTROPY_CONFIG['similarity_threshold'] < 0.7 or ENTROPY_CONFIG['similarity_threshold'] > 0.95:
    issues.append('similarity_threshold should be 0.7-0.95')

if issues:
    print('⚠️  Configuration issues found')
    for issue in issues:
        print(f'   - {issue}')
    exit(1)
else:
    print('✅ Configuration values are within recommended ranges')
" 2>nul

if %errorlevel% equ 0 (
    echo ✅ Configuration validation passed
    set /a PASSED+=1
) else (
    echo ❌ Configuration validation failed
    set /a FAILED+=1
)

echo.
echo 🎯 TEST 6: Expected Behavior Validation
echo =====================================

python -c "
from ingest_pdf.entropy_prune import entropy_prune

# Mock concept data
test_concepts = [
    {'name': 'machine learning', 'score': 0.95, 'embedding': None},
    {'name': 'deep learning', 'score': 0.93, 'embedding': None},
    {'name': 'quantum computing', 'score': 0.88, 'embedding': None},
]

try:
    selected, stats = entropy_prune(test_concepts, top_k=2, verbose=False)
    
    # Validate expected behavior
    assert len(selected) <= 2, 'Should respect top_k limit'
    assert stats['total'] == 3, 'Should track total concepts'
    assert stats['selected'] <= stats['total'], 'Selected should not exceed total'
    assert 'final_entropy' in stats, 'Should provide entropy metrics'
    
    print('✅ Basic entropy pruning behavior validated')
except Exception as e:
    print(f'❌ Behavior validation failed: {e}')
    exit(1)
" 2>nul

if %errorlevel% equ 0 (
    echo ✅ Expected behavior validation passed
    set /a PASSED+=1
) else (
    echo ❌ Expected behavior validation failed
    set /a FAILED+=1
)

echo.
echo 🚀 DEPLOYMENT READINESS SUMMARY
echo ===============================

echo ✅ Passed: %PASSED%
echo ⚠️  Warnings: %WARNINGS%
echo ❌ Failed: %FAILED%

echo.
if %FAILED% equ 0 (
    if %WARNINGS% equ 0 (
        echo 🎉 DEPLOYMENT READY! All tests passed.
        echo.
        echo 📋 Next Steps:
        echo 1. Start the unified TORI system: python start_unified_tori.py
        echo 2. Test PDF upload at http://localhost:8001/docs ^(Prajna admin^)
        echo 3. Test public upload at http://localhost:5173 ^(ScholarSphere^)
        echo 4. Monitor entropy pruning logs for performance
        echo.
        echo 🎯 Expected Results:
        echo - Standard users: Up to 50 diverse concepts
        echo - Admin users: Up to 200 diverse concepts
        echo - Semantic diversity: No similar concepts ^(^>85%% similarity^)
        echo - Category balance: Even distribution across domains
        echo.
        echo Press any key to start the system...
        pause >nul
        python start_unified_tori.py
    ) else (
        echo ⚠️  DEPLOYMENT READY WITH WARNINGS
        echo Please review warnings above before deploying to production.
        pause
    )
) else (
    echo ❌ DEPLOYMENT NOT READY
    echo Please fix the failed tests before deploying.
    pause
)
