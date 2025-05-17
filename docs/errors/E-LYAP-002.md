# E-LYAP-002 – "Function not decreasing"

During verification we compute the Lie-derivative:

$$\dot{V}(x) = \nabla V(x) \cdot f(x)$$

(or $V(x_{k+1}) - V(x_k)$ in the discrete case).

For a valid Lyapunov function we need $\dot{V}(x) < 0$ for every $x \neq 0$ inside the certified domain.

## What the warning means

At the specified point, the verifier found that the Lyapunov function is increasing along the system trajectory, violating the "decrease" condition. This means that the system's energy (as measured by the Lyapunov function) is not consistently decreasing as the system evolves.

For example, at point:
```
x = [1.0, 0.0]
```

The verifier found:
```
dot_V = +0.12   # positive (should be negative)
```

This indicates that the system's trajectory at this point is moving away from the equilibrium rather than toward it, contradicting the stability requirement.

## Typical reasons & quick fixes

| Cause | How to fix |
|-------|------------|
| $\alpha$ (PD offset) too small | Try a larger $\alpha$ in LyapunovNet or enable the adaptive-$\alpha$ scheduler to keep the function "steep" farther from the origin |
| Sampling domain too wide | If you only care about a smaller region (e.g. $\|x\| \leq 0.8$), shrink the verification box; outside that region the system may be unstable |
| Too-few training iterations / counter-examples not injected | Run a few more trainer steps after feeding this counter-example back into TrajectorySampler.add_counterexamples([...]) |
| Dynamics changed but net not re-trained | Re-train or fine-tune with the new parameters (e.g., if damping was reduced, making the system harder to stabilize) |
| Network capacity | Increase hidden size or depth so the net can bend $V$ to satisfy the gradient condition everywhere |

## What to do right now

Feed the counter-example back into training:

```python
sampler.add_counterexamples([np.array([1.0, 0.0])])  # or whatever your counterexample is
trainer.fit(steps=500)  # or however many needed
```

Then re-run verification. In most demos, this resolves the violation in one or two refinement rounds.

If it still fails:
1. Check if system is actually unstable at the counterexample point (e.g., compute trajectory)
2. Increase $\alpha$ or widen the network 
3. Use a smaller verification domain if appropriate

## Docs link

Full explanation, mathematical derivation, and debugging checklist are available at
https://elfin.dev/errors/E-LYAP-002
