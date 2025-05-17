# E-BARR-001: Barrier Positivity Violation

## Error Description

This error occurs when the barrier function `B(x)` is not positive in a region that should be classified as unsafe. 

A barrier certificate must satisfy the following property:

```
B(x) > 0 for all x in the unsafe set
```

The error indicates that this property is violated at some point in the state space, meaning that the barrier function incorrectly classifies an unsafe state as safe.

## Possible Causes

1. **Insufficient dictionary size**: The function approximation may not have enough basis functions to accurately represent the boundary between safe and unsafe regions.

2. **Optimization failure**: The convex optimization problem for finding the barrier certificate coefficients may not have converged to a sufficiently accurate solution.

3. **Conflicting or insufficient samples**: The training data may contain conflicting labels or insufficient samples near the boundary between safe and unsafe regions.

4. **Irregular unsafe region**: The shape of the unsafe region might be complex and difficult to represent with the chosen dictionary basis functions.

5. **Numerical precision issues**: Floating point errors or numerical instability in the optimization process.

## Remediation Steps

1. **Increase dictionary size**: Try using a larger dictionary with more basis functions to better approximate the barrier function.

   ```python
   barrier_fn = agent.learn_barrier(
       system_name="my_system",
       safe_samples=safe_samples,
       unsafe_samples=unsafe_samples,
       dictionary_type="rbf",
       dictionary_size=200,  # Increase from default
       domain=domain
   )
   ```

2. **Refine with counterexample**: Use the provided counterexample to refine the barrier function.

   ```python
   refined_fn = agent.refine_once(
       system_name="my_system",
       counterexample=verification_result.counterexample,
       is_unsafe=True
   )
   ```

3. **Use automatic refinement**: Let the system automatically refine the barrier function with multiple counterexamples.

   ```python
   verification_result = agent.refine_auto(
       system_name="my_system",
       max_iterations=10
   )
   ```

4. **Try a different dictionary type**: Change the dictionary type to better match the geometry of the problem.

   ```python
   barrier_fn = agent.learn_barrier(
       system_name="my_system",
       safe_samples=safe_samples,
       unsafe_samples=unsafe_samples,
       dictionary_type="fourier",  # Try fourier instead of rbf
       dictionary_size=100,
       domain=domain
   )
   ```

5. **Increase training samples**: Generate more training samples, especially near the boundary between safe and unsafe regions.

## Programmatic Example

Here's a simple example showing how to handle this error:

```python
from alan_backend.elfin.barrier.barrier_bridge_agent import BarrierBridgeAgent

# Create agent
agent = BarrierBridgeAgent(name="my_barrier_agent")

# Learn initial barrier function
barrier_fn = agent.learn_barrier(
    system_name="my_system",
    safe_samples=safe_samples,
    unsafe_samples=unsafe_samples,
    dictionary_type="rbf",
    dictionary_size=100,
    domain=domain
)

# Verify barrier function
verification_result = agent.verify("my_system")

# Handle E-BARR-001 error
if not verification_result.success:
    if verification_result.get_error_code() == "E-BARR-001":
        print("Handling barrier positivity violation...")
        # Option 1: Automatic refinement
        refined_result = agent.refine_auto(
            system_name="my_system",
            max_iterations=5
        )
        
        # If still unsuccessful, try increasing dictionary size
        if not refined_result.success:
            print("Trying larger dictionary...")
            barrier_fn = agent.learn_barrier(
                system_name="my_system",
                safe_samples=safe_samples,
                unsafe_samples=unsafe_samples,
                dictionary_type="rbf",
                dictionary_size=200,
                domain=domain
            )
```

## Related Errors

- [E-BARR-002](./E-BARR-002.md): Barrier decreasing condition violation
- [E-LYAP-001](./E-LYAP-001.md): Lyapunov positivity violation

## Additional Resources

- [Barrier Certificates for Safety Verification](https://www.cds.caltech.edu/~murray/preprints/pjp06-ieee.pdf) (Prajna et al.)
- [Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/) (Boyd and Vandenberghe)
