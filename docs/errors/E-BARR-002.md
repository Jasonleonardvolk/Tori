# E-BARR-002: Barrier Decreasing Condition Violation

## Error Description

This error occurs when the barrier function `B(x)` does not have a negative derivative along system trajectories at the boundary of the safe set.

A barrier certificate must satisfy the following property:

```
∇B(x) · f(x) < 0 for all x on the boundary of the safe set (where B(x) = 0)
```

This property ensures that trajectories of the system cannot cross from the safe set into the unsafe set. The error indicates that this property is violated at some point on the boundary, meaning that the system could potentially transition from a safe state to an unsafe state.

## Possible Causes

1. **Insufficient dictionary size**: The function approximation may not have enough basis functions to accurately capture the gradient behavior along the boundary.

2. **Optimization issues**: The convex optimization problem for finding the barrier certificate coefficients might be prioritizing the positivity condition over the decreasing condition.

3. **Boundary complexity**: The boundary between safe and unsafe regions might be complex and difficult to represent with the chosen dictionary basis functions.

4. **Competing constraints**: The requirements for positivity in the unsafe region and decreasing on the boundary may be in tension, making it difficult to find a single function that satisfies both.

5. **Missing boundary samples**: Not enough sample points on the boundary for the optimizer to properly constrain the gradient behavior.

## Remediation Steps

1. **Include boundary samples**: Explicitly provide boundary samples when learning the barrier certificate.

   ```python
   # Generate boundary samples
   boundary_samples = verifier.get_boundary_points(
       barrier_fn=initial_barrier_fn,
       n_points=100
   )
   
   # Learn with boundary samples
   barrier_fn = agent.learn_barrier(
       system_name="my_system",
       safe_samples=safe_samples,
       unsafe_samples=unsafe_samples,
       boundary_samples=boundary_samples,
       dictionary_type="rbf",
       dictionary_size=100,
       domain=domain
   )
   ```

2. **Adjust boundary margin**: Increase the margin for the boundary decreasing condition.

   ```python
   barrier_fn = agent.learn_barrier(
       system_name="my_system",
       safe_samples=safe_samples,
       unsafe_samples=unsafe_samples,
       dictionary_type="rbf",
       dictionary_size=100,
       domain=domain,
       options={
           'boundary_margin': 0.2  # Increase from default
       }
   )
   ```

3. **Refine with counterexample**: Use the provided counterexample to refine the barrier function.

   ```python
   refined_fn = agent.refine_once(
       system_name="my_system",
       counterexample=verification_result.counterexample,
       is_unsafe=False,
       is_boundary=True
   )
   ```

4. **Use automatic refinement**: Let the system automatically refine the barrier function with multiple counterexamples.

   ```python
   verification_result = agent.refine_auto(
       system_name="my_system",
       max_iterations=10
   )
   ```

5. **Increase dictionary size**: Try using a larger dictionary with more basis functions.

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

## Programmatic Example

Here's a complete example showing how to handle this error:

```python
from alan_backend.elfin.barrier.barrier_bridge_agent import BarrierBridgeAgent

# Create agent
agent = BarrierBridgeAgent(name="my_barrier_agent")

# Learn initial barrier function
initial_barrier_fn = agent.learn_barrier(
    system_name="my_system",
    safe_samples=safe_samples,
    unsafe_samples=unsafe_samples,
    dictionary_type="rbf",
    dictionary_size=100,
    domain=domain,
    dynamics_fn=dynamics_fn
)

# Verify barrier function
verification_result = agent.verify("my_system")

# Handle E-BARR-002 error
if not verification_result.success:
    if verification_result.get_error_code() == "E-BARR-002":
        print("Handling barrier decreasing condition violation...")
        
        # Get more boundary samples
        verifier = agent.results["my_system"]["verifier"]
        boundary_samples = verifier.get_boundary_points(
            barrier_fn=initial_barrier_fn,
            n_points=100
        )
        
        # Learn with boundary samples and increased boundary margin
        barrier_fn = agent.learn_barrier(
            system_name="my_system",
            safe_samples=safe_samples,
            unsafe_samples=unsafe_samples,
            boundary_samples=boundary_samples,
            dictionary_type="rbf",
            dictionary_size=150,  # Increase size
            domain=domain,
            dynamics_fn=dynamics_fn,
            options={
                'boundary_margin': 0.2  # Increase margin
            }
        )
        
        # Verify again
        verification_result = agent.verify("my_system")
        
        # If still unsuccessful, try automatic refinement
        if not verification_result.success:
            print("Trying automatic refinement...")
            verification_result = agent.refine_auto(
                system_name="my_system",
                max_iterations=5
            )
```

## Related Errors

- [E-BARR-001](./E-BARR-001.md): Barrier positivity violation
- [E-LYAP-002](./E-LYAP-002.md): Lyapunov decreasing condition violation

## Additional Resources

- [Barrier Certificates for Safety Verification](https://www.cds.caltech.edu/~murray/preprints/pjp06-ieee.pdf) (Prajna et al.)
- [Convex Optimization of Barrier Certificates](https://ieeexplore.ieee.org/document/1430207) (Prajna and Jadbabaie)
- [Safety Verification of Hybrid Systems](https://link.springer.com/book/10.1007/978-3-642-17966-8) (Tomlin et al.)
