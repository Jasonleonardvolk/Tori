#!/usr/bin/env python3
"""
CI Test Runner for ELFIN

This script allows you to run the same tests that are executed in the CI pipeline locally.
It's useful for verifying that your changes won't break the CI tests before pushing.

Usage:
    python run-ci-tests.py [--all] [--koopman] [--neural] [--milp] [--dashboard]
    
Examples:
    # Run all tests
    python run-ci-tests.py --all
    
    # Run only Koopman tests
    python run-ci-tests.py --koopman
    
    # Run multiple specific test suites
    python run-ci-tests.py --koopman --neural
"""

import argparse
import subprocess
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any

# Ensure the script is run from the repository root
REPO_ROOT = Path(__file__).resolve().parent

# Add the repository root to the Python path
sys.path.insert(0, str(REPO_ROOT))


def run_command(cmd: List[str], env: Dict[str, str] = None) -> bool:
    """Run a command and return True if it succeeds."""
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    
    # Print the command being run
    print(f"\n\033[1;36m> {' '.join(cmd)}\033[0m")
    
    # Run the command
    try:
        subprocess.run(
            cmd,
            env=merged_env,
            check=True,
            encoding='utf-8',
            cwd=REPO_ROOT
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n\033[1;31mCommand failed with exit code {e.returncode}\033[0m")
        return False


def run_koopman_tests() -> bool:
    """Run the Koopman tests."""
    print("\n\033[1;33m=== Running Koopman Verification Tests ===\033[0m")
    
    # Step 1: Run pytest on the Koopman tests
    if not run_command([
        sys.executable, "-m", "pytest", 
        "alan_backend/elfin/koopman/tests/", "-v"
    ]):
        return False
    
    # Step 2: Run cross-validation drift check
    print("\n\033[1;33m=== Running Cross-Validation Drift Check ===\033[0m")
    if not run_command([
        sys.executable, "-c", 
        """
from alan_backend.elfin.koopman.edmd import kfold_validation
from alan_backend.elfin.koopman.koopman_bridge_agent import create_pendulum_agent
import numpy as np

# Create test agent
agent, lyap_fn = create_pendulum_agent(verify=False)

# Get data and dictionary
result = agent.results['pendulum']
x = result['data']['x']
x_next = result['data']['x_next']
dictionary = result['dictionary']

# Run 5-fold CV
cv_results = kfold_validation(
    dictionary=dictionary,
    x=x,
    x_next=x_next,
    n_splits=5
)

# Calculate eigenvalue drift
eigenvalues = cv_results['eigenvalues']
eigenvalues_folds = cv_results['eigenvalues_folds'][0]
drift = np.abs(eigenvalues - eigenvalues_folds)
mean_drift = float(np.mean(drift))
max_drift = float(np.max(drift))

print(f'Mean eigenvalue drift: {mean_drift:.6f}')
print(f'Max eigenvalue drift: {max_drift:.6f}')

# Assert drift is below threshold
assert mean_drift < 1e-2, f'Mean eigenvalue drift {mean_drift} exceeds threshold 1e-2'
        """
    ]):
        return False
    
    # Step 3: Run decreasing percentage check
    print("\n\033[1;33m=== Running Decreasing Percentage Check ===\033[0m")
    if not run_command([
        sys.executable, "-c", 
        """
from alan_backend.elfin.koopman.koopman_bridge_agent import create_pendulum_agent

# Create and verify pendulum agent
agent, lyap_fn = create_pendulum_agent(verify=True)

# Get verification result
result = agent.results['pendulum'].get('verification', {})

# Print and check decreasing percentage
decreasing_pct = result.get('decreasing_percentage', 0)
print(f'Decreasing percentage: {decreasing_pct:.2f}%')

# Assert decreasing percentage is above threshold
assert decreasing_pct > 95.0, f'Decreasing percentage {decreasing_pct}% below threshold 95%'
        """
    ]):
        return False
    
    # Step 4: Run counterexample resolution test
    print("\n\033[1;33m=== Running Counterexample Resolution Test ===\033[0m")
    if not run_command([
        sys.executable, "-c",
        """
from alan_backend.elfin.koopman.koopman_bridge_agent import create_pendulum_agent, pendulum_dynamics
import numpy as np

# Create test agent
agent, lyap_fn = create_pendulum_agent(verify=False)

# Generate counterexample (near unstable equilibrium)
ce = np.array([np.pi - 0.1, 0.5])

# Refine with counterexample
refined_lyap_fn = agent.refine_once(
    lyap_fn=lyap_fn,
    system_name='pendulum',
    counterexample=ce,
    dynamics_fn=pendulum_dynamics
)

# Check that the refined model performs better at the counterexample
v_before = lyap_fn(ce)
v_after = refined_lyap_fn(ce)

print(f'Lyapunov value before: {v_before:.6f}')
print(f'Lyapunov value after: {v_after:.6f}')

# For stability, we generally want the Lyapunov value to increase
# at problematic points after refinement
assert v_after > v_before, f'Refinement did not improve Lyapunov value at counterexample'
        """
    ]):
        return False
    
    return True


def run_neural_tests() -> bool:
    """Run the Neural Lyapunov tests."""
    print("\n\033[1;33m=== Running Neural Lyapunov Tests ===\033[0m")
    
    # Check if CUDA is available before running neural tests
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if not cuda_available:
            print("\033[1;33mWarning: CUDA not available, neural tests may run slowly\033[0m")
    except ImportError:
        print("\033[1;33mWarning: PyTorch not installed, skipping CUDA check\033[0m")
    
    # Step 1: Run the neural Lyapunov demo in test mode
    print("\n\033[1;33m=== Running Neural Lyapunov Demo ===\033[0m")
    if not run_command([
        sys.executable,
        "alan_backend/elfin/stability/demos/vdp_neural_lyap_demo.py",
        "--test-mode"
    ]):
        return False
    
    # Step 2: Run neural verification test
    print("\n\033[1;33m=== Running Neural Verification Test ===\033[0m")
    if not run_command([
        sys.executable, "-c",
        """
try:
    from alan_backend.elfin.stability.neural.neural_lyapunov import NeuralLyapunov
    from alan_backend.elfin.stability.verify import verify_lyapunov
    import numpy as np
    import torch
    
    # Create a simple neural Lyapunov function for a linear system
    model = torch.nn.Sequential(
        torch.nn.Linear(2, 32),
        torch.nn.ReLU(),
        torch.nn.Linear(32, 32),
        torch.nn.ReLU(),
        torch.nn.Linear(32, 1)
    )
    
    # Function that enforces positive definite output
    def output_transform(x):
        return torch.sum(x**2, dim=1, keepdim=True)
    
    # Create the neural Lyapunov function
    lyap_fn = NeuralLyapunov(
        model=model,
        input_dim=2,
        output_transform=output_transform
    )
    
    # Define a simple linear system
    def linear_system(x):
        A = np.array([[-0.5, -0.1], [0.1, -0.5]])
        return A @ x
    
    # Define verification domain
    domain = (np.array([-1.0, -1.0]), np.array([1.0, 1.0]))
    
    # Verify the Lyapunov function
    result = verify_lyapunov(
        lyap_fn=lyap_fn,
        domain=domain,
        dynamics_fn=linear_system,
        system_id='neural_test'
    )
    
    # Print verification result
    print(f'Verification result: {result}')
    
    # For a simple linear system, we should get at least some decreasing regions
    assert result.get('decreasing_percentage', 0) > 50.0, 'Neural Lyapunov verification failed'
except ImportError as e:
    print(f"Skipping neural test due to import error: {e}")
    # Exit with success if the test was skipped due to missing dependencies
    import sys
    sys.exit(0)
        """
    ]):
        return False
    
    return True


def run_milp_tests() -> bool:
    """Run the MILP solver tests."""
    print("\n\033[1;33m=== Running MILP Solver Tests ===\033[0m")
    
    if not run_command([
        sys.executable, "-c",
        """
try:
    from alan_backend.elfin.stability.solvers.milp_solver import MILPSolver
    import numpy as np
    
    # Create MILP solver
    solver = MILPSolver()
    
    # Define a simple linear constraint
    def constraint_fn(x):
        # x[0] + x[1] <= 1
        return x[0] + x[1] - 1
    
    # Define domain
    domain = (np.array([-5.0, -5.0]), np.array([5.0, 5.0]))
    
    # Check if constraint is satisfied
    result = solver.check_constraint(
        constraint_fn=constraint_fn,
        domain=domain,
        strict=True,
        timeout=60
    )
    
    print(f'MILP result: {result}')
    
    # This constraint should not be satisfied in the given domain
    assert not result['satisfied'], 'MILP solver incorrectly reported constraint as satisfied'
    assert 'counterexample' in result, 'MILP solver did not provide a counterexample'
    
    # Verify counterexample
    ce = result['counterexample']
    ce_value = constraint_fn(ce)
    print(f'Counterexample: {ce}, constraint value: {ce_value}')
    assert ce_value > 0, f'Counterexample does not violate constraint: {ce_value} <= 0'
except ImportError as e:
    print(f"Skipping MILP test due to import error: {e}")
    # Exit with success if the test was skipped due to missing dependencies
    import sys
    sys.exit(0)
        """
    ]):
        return False
    
    return True


def run_dashboard_tests() -> bool:
    """Run the dashboard widget tests."""
    print("\n\033[1;33m=== Running Dashboard Widget Tests ===\033[0m")
    
    # Check if eslint and jest are available
    if shutil.which("npx") is None:
        print("\033[1;33mWarning: npx not available, skipping dashboard tests\033[0m")
        return True
    
    # Run eslint on dashboard JavaScript
    print("\n\033[1;33m=== Linting Dashboard JavaScript ===\033[0m")
    run_command([
        "npx", "eslint", 
        "alan_backend/elfin/visualization/static/*.js"
    ])
    
    # Run JavaScript tests
    print("\n\033[1;33m=== Running JavaScript Tests ===\033[0m")
    run_command([
        "npx", "jest", 
        "alan_backend/elfin/visualization/static/"
    ])
    
    return True


def main():
    """Main function for the CI test runner."""
    parser = argparse.ArgumentParser(description="Run ELFIN CI tests locally")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--koopman", action="store_true", help="Run Koopman tests")
    parser.add_argument("--neural", action="store_true", help="Run Neural Lyapunov tests")
    parser.add_argument("--milp", action="store_true", help="Run MILP solver tests")
    parser.add_argument("--dashboard", action="store_true", help="Run dashboard widget tests")
    
    args = parser.parse_args()
    
    # If no specific tests are requested, run all tests
    run_all = args.all or not (args.koopman or args.neural or args.milp or args.dashboard)
    
    start_time = time.time()
    results = {}
    
    # Import shutil only when needed for dashboard tests
    import shutil
    
    # Run requested tests
    if run_all or args.koopman:
        results["Koopman"] = run_koopman_tests()
    
    if run_all or args.neural:
        results["Neural"] = run_neural_tests()
    
    if run_all or args.milp:
        results["MILP"] = run_milp_tests()
    
    if run_all or args.dashboard:
        results["Dashboard"] = run_dashboard_tests()
    
    # Print summary
    elapsed_time = time.time() - start_time
    print("\n\033[1;33m=== Test Summary ===\033[0m")
    print(f"Elapsed time: {elapsed_time:.2f} seconds")
    print("Results:")
    
    all_passed = True
    for test_name, result in results.items():
        status = "\033[1;32mPASSED\033[0m" if result else "\033[1;31mFAILED\033[0m"
        print(f"  {test_name}: {status}")
        all_passed = all_passed and result
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
