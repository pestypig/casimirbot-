# Time Crystal Subharmonic Locking

Status: exploratory
Node id: `physics-quantum-semiclassical-time-crystal-subharmonic-locking-definition`
Lane: quantum-semiclassical

This node isolates the minimal time-crystal observable.

## Exploratory claim
Subharmonic locking is the minimal observable for time-crystal diagnostics: the response period must be an integer multiple of the drive period and remain stable under perturbation.

## Math hook
A diagnostic response should satisfy `O(t + nT) = O(t)` with `n > 1` and a stable window.

## Falsifiers
- the response tracks the drive with no period multiplication
- the subharmonic ratio is unstable across repeated runs
- a period-doubling claim is made without a stable response window

## Sources
- Zhang et al., Observation of a discrete time crystal, DOI 10.1038/nature21413
- Choi et al., Observation of discrete time-crystalline order in a disordered dipolar many-body system, DOI 10.1038/nature21426
- Kessler et al., Observation of a Dissipative Time Crystal, DOI 10.1103/PhysRevLett.127.043602

## Related nodes
- `physics-quantum-semiclassical-driven-dissipative-time-crystal-definition`
- `physics-quantum-semiclassical-time-crystal-robustness-window-definition`
- `physics-quantum-semiclassical-time-crystal-no-go-boundary-definition`

Guardrail: do not infer time-crystal order from periodicity alone; periodicity is necessary but not sufficient.
