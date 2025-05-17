@echo off
echo Running ALAN Core Components Tests
echo This will verify both the Phase Engine and Spectral Analysis components.

echo.
echo ===== PHASE ENGINE TESTS =====
echo Testing oscillator update loop, phase synchronization, and spectral feedback...
python -m unittest alan_backend/elfin/stability/tests/test_phase_engine.py

echo.
echo ===== SPECTRAL ANALYSIS TESTS =====
echo Testing snapshot buffer, EDMD decomposition, and stability detection...
python -m unittest alan_backend/elfin/koopman/tests/test_spectral_analysis.py

echo.
echo ===== INTEGRATION DEMO =====
echo If the tests passed, you can run the integration demo with:
echo run_phase_spectral_demo.bat

echo.
echo Press any key to exit...
pause > nul
