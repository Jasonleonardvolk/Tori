@echo off
echo ===== Barrier-Aware Planning Demo =====
echo.
echo This script demonstrates the integration of barrier certificates with the ALAN planner
echo to create safe, obstacle-avoiding navigation plans.
echo.
echo Press any key to start...
pause > nul

echo.
echo ===== Running 2D Navigation Demo =====
echo.
echo This will demonstrate:
echo 1. Learning a barrier certificate for obstacle avoidance
echo 2. Using the barrier certificate to create a safety-aware planner
echo 3. Planning a path from start to goal while avoiding obstacles
echo 4. Visualizing the plan and barrier functions
echo.

python -m alan_backend.planner.demo_barrier_planner

echo.
echo ===== Demonstration Complete =====
echo.
echo This demo showed how barrier certificates can be used with the planner
echo to ensure safety constraints (obstacle avoidance) during planning.
echo.
echo The visualization image was saved as "barrier_navigation_plan.png"
echo.
echo Press any key to exit...
pause > nul
