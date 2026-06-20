# NHM2 Lean formalization lane

This directory is a lightweight Lean 4 project for machine-checking the NHM2
claim-boundary logic and certificate-backed reduced-order campaign admission.
It is intentionally separate from the runtime floating-point GR/tensor solver:
the runtime emits bounded rational/Boolean certificate facts, and Lean checks
what those facts imply.

Core modules:

- `NHM2Formal.ClaimBoundary` formalizes policy facts such as:
  - a diagnostic campaign pass does not open physical, transport, route ETA,
    propulsion, or certified speed claims;
  - `tau = alpha_centerline * T_coordinate` is a clocking law, not a route-speed
    certificate;
  - scalar `T00` closure does not imply full tensor closure;
  - Eulerian-only observer evidence does not imply observer-robust evidence;
  - source component authority does not imply physical material credibility.
- `NHM2Formal.Certificate` defines the Lean-facing campaign certificate shape,
  rational bound checks, diagnostic-admissibility theorem, and negative fixtures
  for missing `T0i`, stale hash congruence, Eulerian-only observers, scalar-only
  QEI, and open physical claim locks.
- `NHM2Formal.Generated.CurrentCampaignCertificate` is generated from the current
  `0p7000_observer_compatible_source` campaign artifacts by
  `tools/nhm2/emit-lean-campaign-certificate.ts`.

The Lean build verifies diagnostic campaign admissibility for the generated
certificate only. It does not prove physical viability, transport, route ETA,
propulsion, material realization, certified speed, or the correctness of the
underlying floating-point numerical solver.

## Validate

Install Lean through `elan`, then run:

```powershell
npm run formal:nhm2:certificate:emit
npm run formal:lean:check
```

The project is pinned to Lean `v4.31.0`, the current stable release referenced
by the Lean release notes on 2026-06-20.
