# Natario-Congruent Time-Dilation for CasimirBot Helix Panel

- Date: 2026-02-19
- Author: Codex + Dan working draft
- Maturity: Diagnostic (not certified)

## Assumptions and Limits

- This document is a diagnostics and governance audit, not a viability certificate.
- Physical viability claims are prohibited unless all `HARD` constraints pass and status is `ADMISSIBLE` with certificate integrity OK.
- Congruence must be explicit for every time-dilation quantity.

## Section A: Executive Summary

This audit defines three mathematically coherent observer-congruence frameworks for Natario-class, shift-driven spacetime visualization in the Helix Time-Dilation panel:

1. ADM/Eulerian (normal observers)
2. Ship-comoving observers
3. Geodesic-bundle observers

Primary risk: congruence ambiguity. A displayed time-dilation scalar is not physically interpretable unless the panel declares which observer family is used and computes consistently against that family.

Natario construction is naturally expressed in 3+1 form with Euclidean spatial slices and shift-vector dynamics. The common "zero expansion" statement applies to the Eulerian congruence and requires divergence-free shift behavior.

Near-term production recommendation: use Eulerian/ADM timing as the default diagnostic mode only when metric-derived fields and constraint/certificate checks are present and valid. Otherwise block certified interpretation and label results as diagnostic approximation only.

## Section B: Mathematical Derivations

### Policy Anchors

From repo policy (`WARP_AGENTS.md`):

- No physical viability claim unless all `HARD` constraints pass and viability is `ADMISSIBLE` with certificate integrity OK.
- GR constraint gate thresholds are enforced (`H_rms`, `M_rms`, max-abs bounds).
- `unknownAsFail: true` means missing evidence must fail closed.
- Adapter verification must expose `verdict`, `firstFail`, `deltas`, artifacts.

### ADM 3+1 Split

Line element:

\[
 g_{\mu\nu}dx^\mu dx^\nu = -N^2 dt^2 + \gamma_{ij}(dx^i + \beta^i dt)(dx^j + \beta^j dt)
\]

Time vector decomposition:

\[
 \partial_t = N n + \beta
\]

Any `d\tau/dt` claim is gauge and observer dependent unless congruence is declared.

### Congruence Candidate 1: Eulerian / ADM Normal

Definition: observer 4-velocity is unit normal `n^mu` to slices.

\[
 d\tau_{Euler} = N dt, \quad (d\tau/dt)_{Euler} = N
\]

Pros: low implementation complexity, directly tied to ADM fields.

Risks: gauge dependence under refoliation; easily misreported as ship time if observer semantics are not explicit.

### Congruence Candidate 2: Ship-Comoving

Define ship worldline/tube and a ship-frame 4-velocity field:

\[
 u^\mu_{ship} = \Gamma (n^\mu + v^\mu), \quad v^\mu n_\mu = 0
\]

Proper-time ratio from 3+1 metric:

\[
 (d\tau/dt)^2 = N^2 - \gamma_{ij}(\dot{x}^i + \beta^i)(\dot{x}^j + \beta^j)
\]

Pros: matches "ship time" semantics.

Risks: undefined without hull kinematics and observer-extension rules.

### Congruence Candidate 3: Geodesic Bundle

Observer family defined by timelike geodesics:

\[
 u^\nu \nabla_\nu u^\mu = 0
\]

Proper-time accumulation:

\[
 \tau = \int \sqrt{-g_{\mu\nu} \frac{dx^\mu}{d\lambda} \frac{dx^\nu}{d\lambda}}\, d\lambda
\]

Two-observer redshift:

\[
 1 + z = \frac{(k_\mu u^\mu)_{emit}}{(k_\mu u^\mu)_{recv}}
\]

Pros: strongest physical interpretability.

Risks: high compute cost; requires geodesic/null transport and numerical error controls.

### Kinematic Decomposition

For congruence `u^mu` with projector `h_{mu nu} = g_{mu nu} + u_mu u_nu`:

\[
\nabla_\nu u_\mu = \frac{1}{3}\theta h_{\mu\nu} + \sigma_{\mu\nu} + \omega_{\mu\nu} - a_\mu u_\nu
\]

Eulerian relation:

\[
\theta_{Euler} = -K = -\gamma^{ij}K_{ij}
\]

Tidal tensor for selected congruence:

\[
E_{\mu\nu} = R_{\mu\alpha\nu\beta}u^\alpha u^\beta
\]

## Section C: Congruence Comparison

| Framework | Physical Meaning | Core Outputs | Compute | Complexity | Main Failure Mode |
|---|---|---|---|---|---|
| Eulerian/ADM | normals to slices | `N`, `theta=-K`, shear | Low-Med | Low | gauge or semantic mismatch |
| Ship-comoving | material ship clocks | `d tau/dt` on hull/worldtube | Med | Med-High | undefined without hull kinematics |
| Geodesic bundle | free-fall observer family | geodesic `tau`, redshift, tidal | High | High | integration instability / missing null transport |
| Natario-canonical Eulerian subset | divergence-controlled shift regime | `div beta`, `K`, `theta` checks | Med | Med | assumes divergence-free without enforcing |

## Section D: Gap Audit

| Gap | Required for Physical Claim | Severity | Priority |
|---|---|---|---|
| Explicit congruence declaration in payload/UI | yes | HARD | P0 |
| Ship worldline/hull kinematics for ship-time claims | yes | HARD | P0 |
| Redshift via emitter/receiver + null transport | yes | HARD | P0 |
| Enforced Natario divergence-free checks (`div beta`) | yes | HARD | P0 |
| Rendering bound to gate + certificate integrity | yes | HARD | P0 |
| Units and normalization contract | yes | SOFT | P1 |
| Tidal eigenvalue outputs for chosen congruence | yes | SOFT | P1 |
| Numerical uncertainty envelope per observable | yes | SOFT | P1 |

## Section E: Concrete Repo Action Plan

### Diagnostics Layer

1. Add congruence registry (`eulerian_adm`, `grid_static`, `ship_comoving`, `geodesic_bundle`) with required fields.
2. Add Natario checks: `div(beta)` RMS/maxAbs, `K`, `theta` and explicit pass/fail labels.
3. Stage redshift path:
   - Diagnostic: label static-clock proxy as non-redshift
   - Reduced-order: bounded null-ray transport for canonical emitter/receiver pairs
   - Certified: convergence/error tracking
4. Add tidal indicators (`E_ij` or explicit unavailable flag).

### API Payload

Add:

- `congruence: { kind, requiredFieldsOk, missingFields, gaugeNote }`
- `observables: { tauRate, theta, sigma2, omega2, tidal, redshift }`
- `validity: { grCertified, constraints, certificate: { id, hash, integrityOk }, unknownAsFailApplied }`
- `provenance` per observable (`metricDerived`, `source`, chart/normalization)

### Panel UX

Always show:

- Congruence banner
- Constraint gate state
- Certificate integrity state
- Proxy vs metric-derived status per plotted field

Strict mode:

- Block layers when required fields are missing.
- Block viability/certified labels when constraints/certificate are missing or failed.

### Validation Plan

1. Policy-as-code tests for strict blocking on missing fields/certificates/constraints.
2. Natario tests for divergence-free and non-divergence-free shift cases.
3. Adapter verification assertions: deterministic `verdict`, `firstFail`, `deltas`, artifact/certificate references.

## Section F: Claim Discipline

Permitted now (diagnostic):

- "Visualization of congruence-specific clock-rate diagnostics" when congruence and provenance are explicit and strict gating is active.

Not permitted without full gate evidence:

- "Physically viable warp"
- "Certified/admissible" labeling without `HARD` pass + `ADMISSIBLE` + certificate integrity OK
- "Redshift map" without two-observer definition and null transport
- "Natario zero expansion satisfied" unless computed and shown (`div beta ~ 0`, `K ~ 0`, `theta ~ 0`)

## References

### Repository References

- `WARP_AGENTS.md`
- `docs/ADAPTER-CONTRACT.md`
- `server/routes/helix/time-dilation.ts`
- `shared/time-dilation-diagnostics`
- `.github/workflows/casimir-verify.yml`

### Theory References

- Richard L. Arnowitt, Stanley Deser, Charles W. Misner, "The Dynamics of General Relativity" (ADM 3+1 formulation).
- Alcubierre warp metric literature for baseline contrast.
- Jose Natario, "Warp Drive with Zero Expansion" (2002, arXiv:gr-qc/0110086).
- Standard congruence kinematics and Raychaudhuri-equation sources (GR textbooks/notes).
