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

## Generic Casimir Spec replay

The provider-neutral Casimir Spec lane is separate from the NHM2 theorem set:

- `casimir_formal_verification_request/v1` binds the canonical scientific IR,
  proposition, emitted Lean module, imports, graph/catalog snapshots, derivation
  artifacts, and replay policy.
- `casimir_formal_lean_replay_policy/v1` binds the exact Lean binary, allowed
  imports, fixed direct invocation, source exclusions, and resource ceilings.
- `server/services/theory/casimir-formal-lean-replay.ts` performs two fresh
  outer-observed runs with `--trust=0`, one thread, a Lean memory ceiling, a
  wall timeout, no shell, and no inherited process environment. A backend-owned
  wrapper issues the exact `#check` and `#print axioms` commands after the sealed
  source.
- `casimir_formal_verification_certificate/v1` records transcript hashes and
  axiom usage while keeping semantic, numerical, empirical, implementation, and
  physical authority false.

This backend does not generate proofs. The developer-only workstation tool rail
exposes it as `theory-formal-verifier.plan`, `.start`, and `.read_result`; see
`docs/helix-ask/workstation-tool-contracts/theory-formal-verifier.md`. Its
policy explicitly does not assert operating-system network or filesystem
hermeticity, and the tool rail preserves that boundary rather than implying a
separate sandbox receipt.
