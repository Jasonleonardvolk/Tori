# E-PARAM-001 – "Invalid parameter values"

During system configuration or verification, certain parameters must satisfy specific constraints to ensure proper functioning. This error indicates that one or more parameters have invalid values that violate these constraints.

## What the warning means

A parameter in your system, Lyapunov function, or verification setup has a value outside its valid range. Parameter constraints exist for mathematical or numerical reasons, and violating them can lead to invalid results or computational issues.

For example, you might see:

```
Parameter 'alpha' has value -0.2, but must be positive.
Parameter dimensions mismatch: expected 4, got 3.
```

These indicate specific parameter validation failures that need to be corrected.

## Typical reasons & quick fixes

| Cause | How to fix |
|-------|------------|
| Negative value for strictly positive parameter | Ensure the parameter has a positive value (e.g., `alpha=0.01`) |
| Parameter out of range | Check documentation for valid parameter ranges and adjust accordingly |
| Dimension mismatch | Ensure vectors/matrices have correct dimensions for the system |
| Type mismatch | Ensure parameters have the correct type (e.g., float vs. int) |
| Missing required parameter | Provide all required parameters in function calls |

## What to do right now

1. Check the error message for details about which parameter is invalid and why.
2. Adjust the parameter to a valid value:

```python
# For example, if alpha must be positive:
agent.verify(system, domain, alpha=0.01)  # Instead of alpha=-0.2

# If dimensions are mismatched:
domain = (np.array([-1.0, -1.0, -1.0, -1.0]), np.array([1.0, 1.0, 1.0, 1.0]))  # 4D domain for 4D system
```

3. Refer to the API documentation for detailed parameter specifications:

```python
# Print parameter documentation
help(agent.verify)
```

## Docs link

Full explanation, parameter specifications, and debugging checklist are available at
https://elfin.dev/errors/E-PARAM-001
