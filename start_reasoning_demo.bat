@echo off
echo Starting ALAN Phase-Coherent Reasoning Demonstration...
echo.
echo This demonstration will show how ALAN performs logical inference using oscillator dynamics
echo and phase synchronization instead of traditional truth values or probability theory.
echo.
echo The demo will:
echo  1. Generate demo concepts with logical relationships
echo  2. Demonstrate basic phase-coherent inference
echo  3. Show modal reasoning capabilities (necessary vs. possible truths)
echo  4. Demonstrate context-sensitive inference
echo.
echo Press any key to begin...
pause > nul

python demo_phase_reasoning.py

echo.
echo Demonstration completed.
echo To save the demonstration output to a JSON file, run:
echo   python demo_phase_reasoning.py --save-output
echo.
pause
