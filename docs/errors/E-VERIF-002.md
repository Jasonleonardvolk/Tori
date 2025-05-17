# E-VERIF-002 – "Verification timeout"

During verification, we set a maximum time limit for the solver to reach a conclusion. This error indicates that the verification process was terminated because it exceeded the allocated time limit.

## What the warning means

The verification engine was unable to determine whether your system satisfies the Lyapunov conditions within the specified time limit. This does not mean your system is unstable or that the Lyapunov function is invalid - it simply means the solver needs more time to reach a definitive conclusion.

Time limits are essential to prevent verification from running indefinitely, particularly for complex systems or large domains. When you see this error:

```
Verification timeout after 600.0 seconds. 
Solver progress: 73% complete.
```

It indicates the solver was making progress but couldn't complete the verification within the time constraint.

## Typical reasons & quick fixes

| Cause | How to fix |
|-------|------------|
| Time limit too short | Increase the timeout parameter (e.g., `time_limit=1200`) |
| Problem size too large | Verify a smaller domain or decompose into sub-regions |
| System complexity | Use a simpler dynamics model or Lyapunov function representation |
| Solver inefficiency | Try a different solver algorithm with better performance characteristics |
| Hardware limitations | Run verification on more powerful hardware (more CPU cores, memory) |

## What to do right now

The simplest approach is to increase the time limit and try again:

```python
# Increase the time limit to 20 minutes
agent.verify(system, domain, time_limit=1200)
```

If that's not feasible, try decomposing the problem:

```python
# Verify in smaller sub-domains
domain1 = (np.array([-1.0, -1.0]), np.array([0.0, 0.0]))
domain2 = (np.array([0.0, 0.0]), np.array([1.0, 1.0]))
result1 = agent.verify(system, domain1)
result2 = agent.verify(system, domain2)
```

Alternatively, try a different verification approach:

```python
# Use sampling-based verification instead of formal methods
agent.verify_sampling(system, domain, samples=1000)
```

## Docs link

Full explanation, mathematical derivation, and debugging checklist are available at
https://elfin.dev/errors/E-VERIF-002
