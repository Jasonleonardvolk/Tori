# Model Diagnostics in ELFIN

This page documents the diagnostic tools available for assessing the quality of Koopman models in ELFIN.

## Cross-Validation for Koopman Models

Cross-validation is a crucial technique for assessing model generalization. ELFIN now provides built-in k-fold cross-validation for Koopman models, which helps answer critical questions:

1. How well does the model generalize to unseen data?
2. How stable are the Koopman eigenvalues across different training subsets?
3. Is the model overfitting to the training data?

### Running Cross-Validation

```bash
# From CLI
elfin koopman learn trajectory_data.csv --cv 5

# From Python API
from alan_backend.elfin.koopman.edmd import kfold_validation

cv_results = kfold_validation(
    dictionary=dictionary,
    x=training_data,
    x_next=next_states,
    n_splits=5
)
```

### Interpreting Cross-Validation Results

The CV results provide several key metrics:

1. **Training MSE**: Mean squared error on the training folds
2. **Validation MSE**: Mean squared error on the validation folds
3. **Eigenvalue Drift**: How much the eigenvalues change across folds

![CV Results Example](images/cv_results_example.png)

**Key Indicators of a Healthy Model**:
- Validation MSE close to Training MSE (low overfitting)
- Mean eigenvalue drift < 0.01 (stable spectral properties)
- Consistent number of stable modes across folds

### Model Tuning Based on CV

If cross-validation reveals issues:

1. **High Validation MSE**: Consider reducing dictionary size or adding regularization
2. **High Eigenvalue Drift**: Consider adding noise to training data or using a simpler dictionary
3. **Inconsistent Stable Modes**: Try a different λ-cut threshold or weighting strategy

## MILP Counterexample Refinement

ELFIN v1.0.0-alpha.2 introduces a powerful feedback loop between MILP verification and EDMD fitting:

1. MILP verification finds counterexamples where the Lyapunov conditions fail
2. The `refine_once()` method simulates trajectories from these counterexamples
3. Training data is augmented with these counterexample trajectories (with upweighting)
4. A new Koopman model is fit, focusing more on previously problematic regions

### Usage

```python
# After verification produces a counterexample
refined_lyap_fn = agent.refine_once(
    lyap_fn=original_lyap_fn,
    system_name="my_system",
    counterexample=counterexample,
    dynamics_fn=my_system_dynamics
)

# Verify again
result = agent.verify(refined_lyap_fn, "my_system", domain)
```

### Effectiveness Metrics

- Most counterexamples should be resolved in ≤ 2 refinement iterations
- The Lyapunov value at the counterexample should increase after refinement
- The level sets should adjust to accommodate the counterexample

![CE Refinement Example](images/ce_refinement_example.png)

## λ-Cut and Weighting Parameter Tuning

The stability and quality of Koopman Lyapunov functions can be affected by two key parameters:

1. **λ-cut**: The threshold for selecting stable modes (defaults to 0.98)
2. **Weighting Strategy**: How eigenfunction contributions are weighted:
   - `uniform`: All eigenfunctions contribute equally
   - `lambda`: Eigenfunctions with more negative real parts get higher weights

ELFIN provides an API for dynamically adjusting these parameters:

```bash
# From the dashboard
/api/koopman/weighting?system=pendulum&cut=0.95&weighting=lambda

# From Python
from alan_backend.elfin.koopman.koopman_lyap import create_koopman_lyapunov

new_lyap_fn = create_koopman_lyapunov(
    name="system_adjusted",
    k_matrix=k_matrix,
    dictionary=dictionary,
    lambda_cut=0.95,
    weighting="lambda"
)
```

### Tuning Guidelines

- **Lower λ-cut** (e.g., 0.9): Includes more modes, smoother functions, but less conservative stability guarantees
- **Higher λ-cut** (e.g., 0.99): Fewer modes, potentially better stability guarantees, but coarser functions
- **Lambda weighting**: Usually produces better decreasing percentages and verification success rates

![Lambda-Cut Comparison](images/lambda_cut_comparison.png)

## Dashboard Integration

The ELFIN dashboard now includes a "Model Health" widget that displays:

1. Cross-validation metrics
2. Eigenvalue drift over time
3. Interactive sliders for λ-cut and weighting adjustments
4. Real-time visualization of the effects on Lyapunov functions

## Advanced Diagnostics

### Eigenvalue Sensitivity Analysis

For deeper analysis of Koopman models, ELFIN provides tools to assess eigenvalue sensitivity:

```python
from alan_backend.elfin.koopman.diagnostics import eigenvalue_sensitivity

sensitivity = eigenvalue_sensitivity(
    dictionary=dictionary,
    k_matrix=k_matrix,
    perturbation=0.01
)
```

This helps identify which eigenvalues are most sensitive to data perturbations, potentially highlighting unstable spectral components.

### Data Coverage Analysis

```python
from alan_backend.elfin.koopman.diagnostics import data_coverage

coverage = data_coverage(
    dictionary=dictionary,
    x=data,
    domain=domain
)
```

This analysis reveals regions where more training data might be needed for better model performance.

## Best Practices

1. **Always run cross-validation** before verification
2. **Analyze eigenvalue drift** to assess model stability
3. **Use MILP-CE refinement** when verification fails
4. **Experiment with λ-cut values** between 0.9 and 0.99
5. **Try both weighting strategies** to see which works better for your system
6. **Augment training data** in regions where verification struggles
