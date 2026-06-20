# NHM2 Lean formalization lane

This directory is a lightweight Lean 4 project for machine-checking the NHM2
claim-boundary logic. It is intentionally separate from the runtime numerical
GR/tensor artifacts.

The first module, `NHM2Formal.ClaimBoundary`, formalizes policy facts such as:

- a diagnostic campaign pass does not open physical, transport, route ETA,
  propulsion, or certified speed claims;
- `tau = alpha_centerline * T_coordinate` is a clocking law, not a route-speed
  certificate;
- scalar `T00` closure does not imply full tensor closure;
- Eulerian-only observer evidence does not imply observer-robust evidence;
- source component authority does not imply physical material credibility.

## Validate

Install Lean through `elan`, then run:

```powershell
cd formal/lean
lake build
```

The project is pinned to Lean `v4.31.0`, the current stable release referenced
by the Lean release notes on 2026-06-20.
