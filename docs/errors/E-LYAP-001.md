# E-LYAP-001 – "Function not positive definite"

During verification, we check if the Lyapunov function $V(x)$ satisfies the positive definiteness condition:

$$V(x) > 0 \quad \forall x \neq 0$$
$$V(0) = 0$$

A valid Lyapunov function must be positive everywhere except at the origin, where it should be zero. When this error occurs, the verifier found a point where $V(x) \leq 0$ despite $x \neq 0$.

## What the warning means

The verifier has found a counterexample point where your Lyapunov function is not positive. At this point, your function violates the basic requirement that a Lyapunov function should be "bowl-shaped" with a unique minimum at the origin.

```
V(x) = -0.03   # negative (should be positive)
```

This violates the "positive definiteness" condition, which is essential for stability verification.

## Typical reasons & quick fixes

| Cause | How to fix |
|-------|------------|
| $\alpha$ (PD offset) too small | Increase the $\alpha$ parameter in LyapunovNet initialization or enable the adaptive-$\alpha$ scheduler |
| Network initialization issue | Try re-initializing with a different random seed or with a specific initialization scheme |
| Insufficient network capacity | Increase the hidden dimensions or network depth to capture the required function shape |
| Training domain too small | Expand the training domain to ensure the network learns the correct behavior in the problem region |
| Too few training iterations | Increase the number of training steps, especially if the loss hasn't converged |

## What to do right now

Feed the counterexample back into the training process:

```python
sampler.add_counterexamples([np.array(counterexample)])
trainer.fit(steps=500)  # or however many steps needed
```

Then re-run `agent.verify()` to check if the issue is resolved. In most cases, this feedback loop will quickly converge to a valid Lyapunov function.

If the issue persists:
1. Increase $\alpha$ to enforce a steeper bowl shape
2. Expand the network architecture for more expressivity
3. Check that your system actually has a stable equilibrium at the origin

## Docs link

Full explanation, mathematical derivation, and debugging checklist are available at
https://elfin.dev/errors/E-LYAP-001
