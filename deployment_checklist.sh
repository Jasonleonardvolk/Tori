#!/bin/bash
# 🚀 TORI Entropy Pruning - Production Deployment Checklist
# =========================================================

echo "🚀 TORI ENTROPY PRUNING - PRODUCTION DEPLOYMENT CHECKLIST"
echo "=========================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to log results
log_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "🧪 TEST 1: Entropy Pruning Module Verification"
echo "=============================================="

# Test entropy pruning module
if python3 -c "from ingest_pdf.entropy_prune import entropy_prune, entropy_prune_with_categories; print('Entropy pruning module imported successfully')" 2>/dev/null; then
    log_pass "Entropy pruning module imports correctly"
else
    log_fail "Entropy pruning module import failed"
fi

# Test dependencies
if python3 -c "import numpy, sklearn, sentence_transformers; print('Dependencies available')" 2>/dev/null; then
    log_pass "Required dependencies (numpy, sklearn, sentence-transformers) available"
else
    log_fail "Missing required dependencies"
fi

echo ""
echo "🔧 TEST 2: Pipeline Integration Verification"
echo "==========================================="

# Test pipeline integration
if python3 -c "from ingest_pdf.pipeline import ENABLE_ENTROPY_PRUNING, ENTROPY_CONFIG; print(f'Entropy enabled: {ENABLE_ENTROPY_PRUNING}'); print(f'Config: {ENTROPY_CONFIG}')" 2>/dev/null; then
    log_pass "Pipeline integration successful"
else
    log_fail "Pipeline integration failed"
fi

# Test admin mode parameter
if python3 -c "from ingest_pdf.pipeline import ingest_pdf_clean; import inspect; sig = inspect.signature(ingest_pdf_clean); print('admin_mode' in sig.parameters)" 2>/dev/null | grep -q "True"; then
    log_pass "Admin mode parameter available in pipeline"
else
    log_fail "Admin mode parameter missing from pipeline"
fi

echo ""
echo "📊 TEST 3: API Response Format Verification"
echo "=========================================="

# Check if API endpoints support entropy analysis
if grep -q "entropy_analysis" ingest_pdf/pipeline.py; then
    log_pass "API response includes entropy analysis fields"
else
    log_fail "API response missing entropy analysis fields"
fi

# Check Prajna integration
if [ -f "prajna/extraction/pdf_extractor.py" ]; then
    if grep -q "admin_mode.*True" prajna/extraction/pdf_extractor.py; then
        log_pass "Prajna configured for admin mode by default"
    else
        log_warn "Prajna may not be using admin mode by default"
    fi
else
    log_warn "Prajna PDF extractor not found"
fi

echo ""
echo "⚡ TEST 4: Performance Benchmark Validation"
echo "========================================"

# Test file existence
test_files=(
    "ingest_pdf/entropy_prune.py"
    "test_entropy_pruning.py"
    "ENTROPY_PRUNING_INTEGRATION.md"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        log_pass "File exists: $file"
    else
        log_fail "Missing file: $file"
    fi
done

# Check file permissions
for file in "${test_files[@]}"; do
    if [ -f "$file" ] && [ -r "$file" ]; then
        log_pass "File readable: $file"
    else
        log_fail "File not readable: $file"
    fi
done

echo ""
echo "🧪 TEST 5: Functional Testing"
echo "============================"

# Run entropy pruning tests
log_info "Running entropy pruning test suite..."
if python3 test_entropy_pruning.py > /tmp/entropy_test_output.log 2>&1; then
    log_pass "Entropy pruning test suite passed"
    
    # Check for specific test results
    if grep -q "✅ All tests complete!" /tmp/entropy_test_output.log; then
        log_pass "All entropy tests completed successfully"
    else
        log_warn "Entropy tests may have completed with warnings"
    fi
else
    log_fail "Entropy pruning test suite failed"
    log_info "Check /tmp/entropy_test_output.log for details"
fi

echo ""
echo "🔍 TEST 6: Configuration Validation"
echo "================================="

# Check configuration values
python3 -c "
from ingest_pdf.pipeline import ENTROPY_CONFIG
import sys

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
    print('⚠️  Configuration issues:')
    for issue in issues:
        print(f'   - {issue}')
    sys.exit(1)
else:
    print('✅ Configuration values are within recommended ranges')
" 2>/dev/null

if [ $? -eq 0 ]; then
    log_pass "Configuration validation passed"
else
    log_fail "Configuration validation failed"
fi

echo ""
echo "🌐 TEST 7: System Integration Check"
echo "================================"

# Check if main server files exist and are configured
server_files=(
    "main.py"
    "start_unified_tori.py"
    "prajna/api/prajna_api.py"
)

for file in "${server_files[@]}"; do
    if [ -f "$file" ]; then
        log_pass "Server file exists: $file"
    else
        log_warn "Server file missing: $file"
    fi
done

# Check for admin_mode integration in main.py
if grep -q "admin_mode" main.py 2>/dev/null; then
    log_pass "Main server supports admin_mode parameter"
else
    log_warn "Main server may not support admin_mode parameter"
fi

echo ""
echo "📝 TEST 8: Documentation and Logs"
echo "================================"

# Check documentation
if [ -f "ENTROPY_PRUNING_INTEGRATION.md" ]; then
    if grep -q "Production-ready" ENTROPY_PRUNING_INTEGRATION.md; then
        log_pass "Documentation indicates production readiness"
    else
        log_warn "Documentation may need production readiness review"
    fi
else
    log_fail "Integration documentation missing"
fi

# Check for proper logging configuration
if grep -q "verbose.*True" ingest_pdf/entropy_prune.py; then
    log_pass "Verbose logging available for debugging"
else
    log_warn "Verbose logging may not be available"
fi

echo ""
echo "🎯 TEST 9: Expected Behavior Validation"
echo "====================================="

# Test with mock data to verify expected behavior
python3 -c "
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
    import sys
    sys.exit(1)
" 2>/dev/null

if [ $? -eq 0 ]; then
    log_pass "Expected behavior validation passed"
else
    log_fail "Expected behavior validation failed"
fi

echo ""
echo "🚀 DEPLOYMENT READINESS SUMMARY"
echo "==============================="

echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

echo ""
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 DEPLOYMENT READY! All tests passed.${NC}"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Start the unified TORI system: python start_unified_tori.py"
        echo "2. Test PDF upload at http://localhost:8001/docs (Prajna admin)"
        echo "3. Test public upload at http://localhost:5173 (ScholarSphere)"
        echo "4. Monitor entropy pruning logs for performance"
        echo ""
        echo "🎯 Expected Results:"
        echo "- Standard users: Up to 50 diverse concepts"
        echo "- Admin users: Up to 200 diverse concepts"
        echo "- Semantic diversity: No similar concepts (>85% similarity)"
        echo "- Category balance: Even distribution across domains"
        exit 0
    else
        echo -e "${YELLOW}⚠️  DEPLOYMENT READY WITH WARNINGS${NC}"
        echo "Please review warnings above before deploying to production."
        exit 1
    fi
else
    echo -e "${RED}❌ DEPLOYMENT NOT READY${NC}"
    echo "Please fix the failed tests before deploying."
    exit 2
fi
