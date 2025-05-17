# E-VERIF-001 – "Verification failed due to solver error"

During verification, we rely on numerical solvers to check Lyapunov conditions. This error indicates that the solver encountered an internal error while attempting to verify your system.

## What the warning means

The verification engine failed due to a technical issue with the underlying solver, not necessarily due to a problem with your system or Lyapunov function. This typically happens when:

1. The solver encounters numerical instability
2. The solver times out before reaching a conclusion
3. The problem formulation is incompatible with the selected solver
4. Resource constraints (memory, CPU) led to solver failure

The solver error message may provide specific details:
```
Error: SOLVER_NUMERIC_ISSUE at x=[0.7, 0.5]
Internal error: Matrix condition number exceeds threshold.
```

## Typical reasons & quick fixes

| Cause | How to fix |
|-------|------------|
| Numerical precision issues | Try a different solver by setting `solver="alternate"` or reduce domain size |
| System complexity too high | Simplify the problem, e.g., verify in smaller subdomains or use a simpler dynamics model |
| Solver incompatibility | Switch verification method, e.g., from MILP to SOS or sampling-based |  
| Resource constraints | Increase solver timeouts, adjust memory settings, or verify on more powerful hardware |
| Constraint formulation issues | Adjust parameters like tolerances or slack variables in the verification setup |

## What to do right now

First, try using a different solver or verification approach:

```python
# Option 1: Try an alternate solver
agent.verify(system, domain, solver="alternate", precision="high")

# Option 2: Use a sampling-based approach instead 
agent.verify_sampling(system, domain, samples=1000)

# Option 3: Verify a smaller domain where the solver is likely to succeed
domain_small = (np.array([-0.5, -0.5]), np.array([0.5, 0.5]))
agent.verify(system, domain_small)
```

If the problem persists, check the solver logs for specific error messages that might provide more insight.

## Docs link

Full explanation, mathematical derivation, and debugging checklist are available at
https://elfin.dev/errors/E-VERIF-001
