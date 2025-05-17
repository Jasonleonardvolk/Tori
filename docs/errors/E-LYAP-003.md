# E-LYAP-003: Koopman Decrease Violation

## Error

A Koopman-based Lyapunov function fails the decrease condition at specific state points. The decrease condition requires that the derivative of the Lyapunov function is negative along system trajectories.

## Cause

The Koopman-derived Lyapunov function V(x) does not satisfy:
- For continuous-time systems: V̇(x) = ∇V(x)·f(x) < 0
- For discrete-time systems: V(x_next) - V(x) < 0

This typically happens when:
1. The EDMD approximation of the Koopman operator is not accurate enough.
2. The dictionary size or type is not suitable for capturing the system's dynamics.
3. The eigenfunction selection (lambda cutoff) is not capturing all the stable behavior.
4. The system itself has regions where a global Lyapunov function cannot properly capture stability properties (e.g., systems with limit cycles).

## Solution

### Improve Dictionary

```python
# Try a larger dictionary
koopman_bridge.learn_from_data(
    x=data,
    x_next=next_data,
    dict_type="rbf",  
    dict_size=400,     # Increase from default 100
    system_name="my_system"
)

# Or try a different dictionary type
koopman_bridge.learn_from_data(
    x=data,
    x_next=next_data,
    dict_type="fourier",  # Alternative to RBF
    dict_size=200,
    system_name="my_system"
)
```

### Adjust Eigenvalue Selection

```python
# Use more aggressive eigenvalue cutoff
create_koopman_lyapunov(
    name="system_lyap",
    k_matrix=k_matrix,
    dictionary=dictionary,
    lambda_cut=0.8,   # Default is 0.99, lower keeps only more stable modes
    continuous_time=True
)
```

### Use Lambda-Weighted Lyapunov Function

```python
# Apply eigenvalue-based weighting
create_koopman_lyapunov(
    name="system_lyap",
    k_matrix=k_matrix,
    dictionary=dictionary,
    weighting="lambda"  # Give larger weight to modes with more negative real parts
)
```

### Improve Data Quality

- Collect more training data, especially in the problematic regions
- Ensure multiple trajectories cover the entire domain of interest
- Reduce noise in measurements if possible
- Try different sampling rates (dt values)

### Modify Verification Domain

If the decreasing condition fails only near unstable regions (like a limit cycle), you can adjust the verification domain to exclude those regions.

```python
# For a system with a limit cycle of radius ~1.5
domain = (np.array([-3.0, -3.0]), np.array([3.0, 3.0]))
koopman_bridge.verify(
    lyap_fn=lyap_fn,
    system_name="my_system",
    domain=domain,
    exclude_region={"type": "circle", "center": [0, 0], "radius": 1.7}
)
```

## Advanced Techniques

### Cross-Validation

Validate your Koopman model on held-out trajectories to ensure it generalizes well.

```python
# Hold out 20% of your data for validation
train_idx = np.random.choice(len(data), int(0.8*len(data)), replace=False)
val_idx = np.setdiff1d(np.arange(len(data)), train_idx)

train_data = data[train_idx]
val_data = data[val_idx]

# Train on training data
# ...

# Validate on validation data
mse = koopman_bridge.evaluate(val_data, val_next_data)
```

### Guided EDMD with Counterexamples

Update your EDMD fitting to place more weight on regions where verification fails.

```python
# After receiving a counterexample from verification
counterexample = result["counterexample"]

# Regenerate trajectories starting from the counterexample
x_new, x_next_new = generate_trajectories_from_point(counterexample)

# Combine with original data, but upweight the new data
x_combined = np.vstack([x, x_new])
x_next_combined = np.vstack([x_next, x_next_new])
weights = np.ones(len(x_combined))
weights[-len(x_new):] = 5.0  # 5x weight on new data

# Refit with weighted data
k_matrix, meta = weighted_edmd_fit(
    dictionary=dictionary,
    x=x_combined,
    x_next=x_next_combined,
    weights=weights
)
```

### Hybrid Approaches

For challenging systems, consider hybrid approaches:
- Use Koopman + SOS (sum-of-squares) optimization
- Combine Koopman models with neural Lyapunov functions
- Use piecewise Koopman models for different regions
