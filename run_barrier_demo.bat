@echo off
echo ===== ELFIN Barrier Certificate Demo =====
echo.
echo This script demonstrates the barrier certificate system in action.
echo It will learn, verify, and refine a barrier certificate for the double integrator
echo system, showing how formal safety guarantees can be achieved.
echo.
echo Press any key to start...
pause > nul

echo.
echo ===== Step 1: Running Basic Demo =====
echo Learning and visualizing a barrier certificate for the double integrator system
echo.
python -m alan_backend.elfin.cli barrier demo --scenario double_integrator --output-dir barrier_demo_output
echo.
echo Basic demo complete! Barrier certificate visualizations saved to barrier_demo_output/
echo.
echo Press any key to continue to the refinement demo...
pause > nul

echo.
echo ===== Step 2: Refinement Demo =====
echo This will learn a barrier certificate with deliberate constraints that lead to
echo verification failures, then show how counterexample refinement fixes it
echo.

rem Create a directory for the refined demo
mkdir barrier_refined_demo

rem Create a Python script for the refinement demo
echo import os > barrier_refined_demo\refinement_demo.py
echo import sys >> barrier_refined_demo\refinement_demo.py
echo import numpy as np >> barrier_refined_demo\refinement_demo.py
echo import matplotlib.pyplot as plt >> barrier_refined_demo\refinement_demo.py
echo from pathlib import Path >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo # Add parent directory to path >> barrier_refined_demo\refinement_demo.py
echo project_root = Path(__file__).resolve().parent.parent.parent >> barrier_refined_demo\refinement_demo.py
echo if str(project_root) not in sys.path: >> barrier_refined_demo\refinement_demo.py
echo     sys.path.append(str(project_root)) >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo from alan_backend.elfin.barrier.barrier_bridge_agent import create_double_integrator_agent >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo def main(): >> barrier_refined_demo\refinement_demo.py
echo     # Step 1: Create initial barrier function with insufficient dictionary size >> barrier_refined_demo\refinement_demo.py
echo     print("\n===== Creating Initial Barrier Certificate =====") >> barrier_refined_demo\refinement_demo.py
echo     print("Using a small dictionary size that will likely fail verification...") >> barrier_refined_demo\refinement_demo.py
echo     agent, barrier_fn = create_double_integrator_agent( >> barrier_refined_demo\refinement_demo.py
echo         verify=True, >> barrier_refined_demo\refinement_demo.py
echo         dict_type="rbf", >> barrier_refined_demo\refinement_demo.py
echo         dict_size=20  # Small dictionary size to ensure verification fails >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Get verification result >> barrier_refined_demo\refinement_demo.py
echo     system_name = "double_integrator" >> barrier_refined_demo\refinement_demo.py
echo     result = agent.results[system_name] >> barrier_refined_demo\refinement_demo.py
echo     domain = result['domain'] >> barrier_refined_demo\refinement_demo.py
echo     dynamics_fn = result['dynamics_fn'] >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Check verification result >> barrier_refined_demo\refinement_demo.py
echo     verification = result.get('verification', {}) >> barrier_refined_demo\refinement_demo.py
echo     verification_result = verification.get('result') >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     if verification_result and verification_result.success: >> barrier_refined_demo\refinement_demo.py
echo         print("Surprisingly, verification succeeded on the first try!") >> barrier_refined_demo\refinement_demo.py
echo         print("Let's still demonstrate refinement...") >> barrier_refined_demo\refinement_demo.py
echo     else: >> barrier_refined_demo\refinement_demo.py
echo         print(f"Verification failed as expected: {verification_result.status}") >> barrier_refined_demo\refinement_demo.py
echo         if verification_result.violation_reason: >> barrier_refined_demo\refinement_demo.py
echo             print(f"Violation reason: {verification_result.violation_reason}") >> barrier_refined_demo\refinement_demo.py
echo             print(f"Error code: {verification_result.get_error_code()}") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Visualize initial barrier function >> barrier_refined_demo\refinement_demo.py
echo     from alan_backend.elfin.examples.demo_barrier import visualize_2d_barrier >> barrier_refined_demo\refinement_demo.py
echo     visualize_2d_barrier( >> barrier_refined_demo\refinement_demo.py
echo         barrier_fn=barrier_fn, >> barrier_refined_demo\refinement_demo.py
echo         domain=domain, >> barrier_refined_demo\refinement_demo.py
echo         title="Initial Barrier Function (Before Refinement)", >> barrier_refined_demo\refinement_demo.py
echo         fixed_velocities=(0.0, 0.0) >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo     plt.savefig("initial_barrier.png") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Step 2: Refine the barrier function >> barrier_refined_demo\refinement_demo.py
echo     print("\n===== Refining Barrier Certificate =====") >> barrier_refined_demo\refinement_demo.py
echo     print("Using automatic refinement with counterexamples...") >> barrier_refined_demo\refinement_demo.py
echo     verification_result = agent.refine_auto( >> barrier_refined_demo\refinement_demo.py
echo         system_name=system_name, >> barrier_refined_demo\refinement_demo.py
echo         max_iterations=2 >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Get refined barrier function >> barrier_refined_demo\refinement_demo.py
echo     refined_barrier_fn = agent.results[system_name]['barrier'] >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Print refinement statistics >> barrier_refined_demo\refinement_demo.py
echo     auto_refinement = agent.results[system_name].get('auto_refinement', {}) >> barrier_refined_demo\refinement_demo.py
echo     print(f"Refinement iterations: {auto_refinement.get('iterations', 0)}") >> barrier_refined_demo\refinement_demo.py
echo     print(f"Final verification result: {verification_result.success}") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Visualize refined barrier function >> barrier_refined_demo\refinement_demo.py
echo     visualize_2d_barrier( >> barrier_refined_demo\refinement_demo.py
echo         barrier_fn=refined_barrier_fn, >> barrier_refined_demo\refinement_demo.py
echo         domain=domain, >> barrier_refined_demo\refinement_demo.py
echo         title="Refined Barrier Function (After Refinement)", >> barrier_refined_demo\refinement_demo.py
echo         fixed_velocities=(0.0, 0.0) >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo     plt.savefig("refined_barrier.png") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Step 3: Simulate system trajectories with both barrier functions >> barrier_refined_demo\refinement_demo.py
echo     print("\n===== Simulating System Trajectories =====") >> barrier_refined_demo\refinement_demo.py
echo     from alan_backend.elfin.examples.demo_barrier import simulate_system, visualize_trajectories >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Generate initial states >> barrier_refined_demo\refinement_demo.py
echo     initial_states = [ >> barrier_refined_demo\refinement_demo.py
echo         np.array([-3.0, -3.0, 1.0, 1.0]),   # Bottom-left, moving toward obstacle >> barrier_refined_demo\refinement_demo.py
echo         np.array([3.0, -3.0, -1.0, 1.0]),   # Bottom-right, moving toward obstacle >> barrier_refined_demo\refinement_demo.py
echo         np.array([-3.0, 3.0, 1.0, -1.0]),   # Top-left, moving toward obstacle >> barrier_refined_demo\refinement_demo.py
echo         np.array([3.0, 3.0, -1.0, -1.0])    # Top-right, moving toward obstacle >> barrier_refined_demo\refinement_demo.py
echo     ] >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Define obstacle properties >> barrier_refined_demo\refinement_demo.py
echo     obstacle_center = np.array([0.0, 0.0]) >> barrier_refined_demo\refinement_demo.py
echo     obstacle_radius = 1.0 >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Simulate system with both barrier functions >> barrier_refined_demo\refinement_demo.py
echo     t_points, trajectories = simulate_system( >> barrier_refined_demo\refinement_demo.py
echo         barrier_fn=refined_barrier_fn, >> barrier_refined_demo\refinement_demo.py
echo         dynamics_fn=dynamics_fn, >> barrier_refined_demo\refinement_demo.py
echo         initial_states=initial_states, >> barrier_refined_demo\refinement_demo.py
echo         domain=domain, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_center=obstacle_center, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_radius=obstacle_radius >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Visualize trajectories with initial barrier >> barrier_refined_demo\refinement_demo.py
echo     plt.figure(figsize=(12, 6)) >> barrier_refined_demo\refinement_demo.py
echo     visualize_trajectories( >> barrier_refined_demo\refinement_demo.py
echo         t_points=t_points, >> barrier_refined_demo\refinement_demo.py
echo         trajectories=trajectories, >> barrier_refined_demo\refinement_demo.py
echo         barrier_fn=barrier_fn,  # Initial barrier >> barrier_refined_demo\refinement_demo.py
echo         domain=domain, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_center=obstacle_center, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_radius=obstacle_radius, >> barrier_refined_demo\refinement_demo.py
echo         title="Initial Barrier Function (Before Refinement)" >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo     plt.savefig("initial_trajectories.png") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Visualize trajectories with refined barrier >> barrier_refined_demo\refinement_demo.py
echo     plt.figure(figsize=(12, 6)) >> barrier_refined_demo\refinement_demo.py
echo     visualize_trajectories( >> barrier_refined_demo\refinement_demo.py
echo         t_points=t_points, >> barrier_refined_demo\refinement_demo.py
echo         trajectories=trajectories, >> barrier_refined_demo\refinement_demo.py
echo         barrier_fn=refined_barrier_fn,  # Refined barrier >> barrier_refined_demo\refinement_demo.py
echo         domain=domain, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_center=obstacle_center, >> barrier_refined_demo\refinement_demo.py
echo         obstacle_radius=obstacle_radius, >> barrier_refined_demo\refinement_demo.py
echo         title="Refined Barrier Function (After Refinement)" >> barrier_refined_demo\refinement_demo.py
echo     ) >> barrier_refined_demo\refinement_demo.py
echo     plt.savefig("refined_trajectories.png") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Show comparison >> barrier_refined_demo\refinement_demo.py
echo     print("\nComparison of barrier functions before and after refinement:") >> barrier_refined_demo\refinement_demo.py
echo     print("Initial barrier: may fail verification due to small dictionary size") >> barrier_refined_demo\refinement_demo.py
echo     print("Refined barrier: improved through counterexample refinement") >> barrier_refined_demo\refinement_demo.py
echo     print("\nVisualizations saved to:") >> barrier_refined_demo\refinement_demo.py
echo     print("initial_barrier.png - Initial barrier function") >> barrier_refined_demo\refinement_demo.py
echo     print("refined_barrier.png - Refined barrier function") >> barrier_refined_demo\refinement_demo.py
echo     print("initial_trajectories.png - Trajectories with initial barrier") >> barrier_refined_demo\refinement_demo.py
echo     print("refined_trajectories.png - Trajectories with refined barrier") >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo     # Display plots >> barrier_refined_demo\refinement_demo.py
echo     plt.show() >> barrier_refined_demo\refinement_demo.py
echo. >> barrier_refined_demo\refinement_demo.py
echo if __name__ == "__main__": >> barrier_refined_demo\refinement_demo.py
echo     main() >> barrier_refined_demo\refinement_demo.py

echo.
echo Running refinement demo...
cd barrier_refined_demo
python refinement_demo.py
cd ..

echo.
echo ===== Demo Complete =====
echo.
echo The demo has shown:
echo 1. Learning a barrier certificate for double integrator system
echo 2. Verifying safety properties (B(x) ^> 0 in unsafe regions, gradient condition)
echo 3. Refining the barrier certificate with counterexamples
echo 4. Visualizing the improvement in safety guarantees
echo.
echo All visualization files have been saved in the current directory
echo and barrier_demo_output/ folder.
echo.
echo Press any key to exit...
pause > nul
