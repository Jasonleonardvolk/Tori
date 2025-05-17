# ELFIN Error Codes Index

This document lists all error codes used in the ELFIN framework and links to their detailed documentation.

## Stability Errors (E-LYAP)

Errors related to Lyapunov stability verification:

| Code | Description | Documentation |
|------|-------------|---------------|
| E-LYAP-001 | Lyapunov Positivity Violation | [Details](E-LYAP-001.md) |
| E-LYAP-002 | Lyapunov Decreasing Violation | [Details](E-LYAP-002.md) |
| E-LYAP-003 | Koopman Eigenvalue Violation | [Details](E-LYAP-003.md) |

## Safety Errors (E-BARR)

Errors related to barrier certificate safety verification:

| Code | Description | Documentation |
|------|-------------|---------------|
| E-BARR-001 | Barrier Positivity Violation | [Details](E-BARR-001.md) |
| E-BARR-002 | Barrier Decreasing Violation | [Details](E-BARR-002.md) |

## Parameter Errors (E-PARAM)

Errors related to invalid parameters or configurations:

| Code | Description | Documentation |
|------|-------------|---------------|
| E-PARAM-001 | Invalid Parameter Value | [Details](E-PARAM-001.md) |

## Verification Errors (E-VERIF)

General verification errors:

| Code | Description | Documentation |
|------|-------------|---------------|
| E-VERIF-001 | Verification Timeout | [Details](E-VERIF-001.md) |
| E-VERIF-002 | Verification Solver Error | [Details](E-VERIF-002.md) |

## Handling Errors

Each error includes:

1. **Description**: A detailed explanation of the error cause
2. **Example**: Sample code that would trigger the error
3. **Diagnosis**: How to diagnose the issue, including visualizations
4. **Resolution**: Steps to resolve the error

When errors occur during verification, the system provides:

- Error code for quick reference
- Counterexample point where the violation occurs
- Suggestions for refinement or parameter adjustments

## Programmatic Error Handling

```python
from alan_backend.elfin.errors import handle_error

try:
    result = agent.verify("system_name")
    if not result.success:
        error_code = result.get_error_code()
        handle_error(error_code, result)
except Exception as e:
    # Handle runtime errors
    pass
```

See the [Error Handler Documentation](../elfin/errors/error_handler.py) for more details on programmatic error handling.
