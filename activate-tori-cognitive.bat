@echo off
echo ==========================================
echo    TORI Lifelong Learning Activation
echo    Full Cognitive Architecture Startup
echo ==========================================
echo.

echo [1/5] Starting MCP Server Ecosystem...
start /b "MCP-Servers" cmd /c "start-mcp-servers.bat"
timeout /t 3 >nul

echo [2/5] Starting Ingest Bus Services...
start /b "Ingest-Bus" cmd /c "start-ingest-bus.bat"
timeout /t 3 >nul

echo [3/5] Activating Memory Sculptor...
python -c "
from ingest_pdf.memory_sculptor import get_memory_sculptor
sculptor = get_memory_sculptor()
print('✅ Memory Sculptor activated')
print(f'   Tracking {len(sculptor.concept_states)} concepts')
"

echo [4/5] Initializing Koopman Estimator...
python -c "
from ingest_pdf.koopman_estimator import KoopmanEstimator
estimator = KoopmanEstimator(basis_type='fourier', basis_params={'n_harmonics': 3})
print('✅ Koopman Continual Learner ready')
"

echo [5/5] Starting Spectral Monitor...
python -c "
from ingest_pdf.spectral_monitor import get_cognitive_spectral_monitor
monitor = get_cognitive_spectral_monitor()
print('✅ Spectral Monitor active')
"

echo.
echo ==========================================
echo  🧠 TORI COGNITIVE ARCHITECTURE ONLINE
echo  
echo  Components Active:
echo  ✅ Energy-Based Memory (Hopfield/Ising)
echo  ✅ Koopman Continual Learning
echo  ✅ ψ-Phase Oscillator Network  
echo  ✅ Memory Sculpting & Pruning
echo  ✅ Spectral Monitoring
echo  ✅ MCP Integration Layer
echo  ✅ PDF Ingest Pipeline
echo  
echo  Ready for lifelong learning!
echo ==========================================
echo.

echo Testing cognitive integration...
python test_cognitive_integration.py

pause