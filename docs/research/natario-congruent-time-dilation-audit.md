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

## Section E1: Shipped Observable Traceability Matrix (implementation-synced)

The current diagnostics payload emits observables under `diagnostics.payload.observables` (or `diagnostics.observables` when the raw payload is returned directly), with per-channel provenance in `provenance`/`fieldProvenance` and strict-gate state in `strict`, `gate`, and verification-derived reasons.

| Payload key | Equation / definition | Congruence | Provenance source in code | Validity / certification gate requirement |
|---|---|---|---|---|
| `observables.alpha` | Eulerian clock-rate primitive: `(dτ/dt)_Euler = alpha` | `eulerian_adm` (or payload `congruence.kind`) | `render_plan.sourceForAlpha`, `warp.metricAdapter.alpha`, `provenance.alpha` | Certified interpretation only when `strict.strictCongruence=true`, `strict.anyProxy=false`, `strict.grCertified=true`, verification reasons do not include hard fail; otherwise diagnostic-only. |
| `observables.beta` | ADM shift vector `beta^i` (kinematic input to clocking/transport formulas) | payload `congruence.kind` | `render_plan.sourceForBeta`, `warp.metricAdapter.beta`, `provenance.beta` | Same strict gate as above; proxy/missing source forces non-certified usage. |
| `observables.gamma` | Spatial metric term `gamma_ij` used in ADM contractions | payload `congruence.kind` | fixed `gr-brick`, `warp.metricAdapter.gammaDiag`, `provenance.gamma` | Must remain metric-derived (`gr-brick`) for strict Natario claims. |
| `observables.theta` | Expansion scalar, Eulerian relation `theta = -Ktrace` under declared sign convention | payload `congruence.kind` | `render_plan.sourceForTheta`, `warp.metricAdapter.theta`, plus `definitions.theta_definition` and `definitions.kij_sign_convention` | Natario canonical claim requires theta/K consistency pass in `natarioCanonical.checks.thetaKConsistency`. |
| `observables.kTrace` | Trace of extrinsic curvature `K = gamma^{ij}K_ij` | payload `congruence.kind` | fixed `gr-brick`, `warp.metricAdapter.Ktrace`, `provenance.kTrace` | Required for strict metric completeness (`strict.strictMetricMissing=false`) and Natario theta/K consistency. |
| `observables.ship_comoving_dtau_dt` | `dτ/dt = sqrt(alpha^2 - gamma_ij (dx^i/dt + beta^i)(dx^j/dt + beta^j))` | `ship_comoving` | `resolveShipComovingDtauDt` details in diagnostics builder; emits `valid`, `missingFields`, `details` | Never certified when `valid=false` or missing required worldline/metric fields; route must keep it as diagnostic or blocked. |
| `observables.tidal_indicator` | `||E_ij||_F = sqrt(sum_ij E_ij E^ij)` | payload `congruence.kind` | `resolveTidalIndicator` from `warp.metricAdapter.tidalTensorEij`/`electricWeylEij`/`E_ij` or proof fallback, with deterministic missing block id | Certified usage requires available tensor (no `TIDAL_E_IJ_MISSING`) and strict no-proxy gate. |
| `observables.redshift` | `1+z = (k.u)_emit / (k.u)_recv` (reduced-order transport path) | payload `congruence.kind` | `resolveRedshiftDiagnostics` from pipeline redshift transport/worldline fields; emits computed/proxy/unavailable status and deterministic block ids | Redshift can only be claimed as physical when `status="computed"`; proxy/unavailable must be labeled non-certifying diagnostic fallback. |

Natario-specific gate observables are additionally shipped in `natarioCanonical.checks.divBeta` and `natarioCanonical.checks.thetaKConsistency`, and must both pass (with required fields present) for `natarioCanonical.canonicalSatisfied=true`.

### Diagnostics Layer

1. Add congruence registry (`eulerian_adm`, `grid_static`, `ship_comoving`, `geodesic_bundle`) with required fields.
2. Add Natario checks: `div(beta)` RMS/maxAbs, `K`, `theta` and explicit pass/fail labels.
3. Stage redshift path:
   - Diagnostic: label static-clock proxy as non-redshift
   - Reduced-order: bounded null-ray transport for canonical emitter/receiver pairs using
     `1+z = (k.u)_emit / (k.u)_recv` with explicit emitter/receiver worldline contract
     and confidence limits.
   - Certified: convergence/error tracking
   - If transport inputs are missing, the payload must mark redshift as either
     `proxy` (explicit fallback source) or `unavailable` (deterministic block id).
4. Add tidal indicators (`E_ij` or explicit unavailable flag).

### API Payload (current route behavior)

Implemented route behavior for `GET /api/helix/time-dilation/diagnostics` returns an envelope:

- `ok`, `status`, `updatedAt`, `source`, `renderingSeed`, `seedStatus`, `reason`, `payload`
- The diagnostics contract lives under `payload` (same data is returned for `?raw=1` currently).
- `POST /api/helix/time-dilation/diagnostics` stores arbitrary payload and updates `latestDiagnostics` as status `ready`.

Within `payload`, the implementation-backed keys for claim-bearing diagnostics are:

- `congruence`, `observables`, `provenance`, `fieldProvenance`
- `strict`, `gate`, `canonical`, `natarioCanonical`, `redshift`, `tidal`
- `metric_contract`, `render_plan`, `sources`, `wall`, `gr`

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

## Section F: Claim Discipline (explicit)

### What we can claim

- We can claim **diagnostic visualization** of congruence-tagged observables when payload keys are present and provenance is explicit (`congruence`, `observables`, `provenance`, `fieldProvenance`).
- We can claim **strict-gate status** only as reported by payload booleans/reasons (`strict.*`, `gate.banner`, `gate.reasons`, `natarioCanonical.*`).
- We can claim **computed reduced-order redshift diagnostics** only when `observables.redshift.details.status="computed"`, with limitations/confidence attached.
- We can claim **Natario canonical check outcome** only as the explicit check outputs (`natarioCanonical.checks.divBeta`, `natarioCanonical.checks.thetaKConsistency`, `natarioCanonical.canonicalSatisfied`).

### What we cannot claim

- We cannot claim **physical viability** or mission readiness from time-dilation diagnostics alone.
- We cannot claim **certified/admissible warp** unless all `HARD` constraints pass, viability status is `ADMISSIBLE`, and certificate hash/integrity are present and OK.
- We cannot claim **physical redshift** when payload reports `proxy`/`unavailable` or missing two-observer/null-transport contract fields.
- We cannot claim **Natario zero expansion satisfied** unless required fields are present and both Natario checks pass.
- We cannot upgrade a run above diagnostic maturity when strict fail-closed signals are present (`strict.anyProxy=true`, missing required fields, verification fail reasons).

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
