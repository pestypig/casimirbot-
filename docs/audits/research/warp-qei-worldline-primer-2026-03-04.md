# Fewster-Eveson Worldline QEI Primer (2026-03-04)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Drop-in canonical primer for Helix QI/QEI gate semantics, sampler admissibility, and fail-closed verification checks.

## Canonical Setting
- `field_model`: free real scalar field (`m >= 0`) in Minkowski spacetime.
- `worldline_class`: timelike observer worldline (not null averaging).
- `target_quantity`: sampled renormalized energy density along the worldline.

Primary anchors:
- Fewster and Eveson (1998): https://doi.org/10.1103/PhysRevD.58.084010
- Ford and Roman (1995): https://doi.org/10.1103/PhysRevD.51.4277
- Flanagan (1997) for explicit 2D normalization and optimal bound form: https://doi.org/10.1103/PhysRevD.56.4922
- Decanini and Folacci (2008) for point-splitting renormalized stress-tensor semantics: https://doi.org/10.1103/PhysRevD.78.044025

## Inequality Form (Repo-Mappable)
For a normalized sampling function `g(t)`:

`integral dt g(t) <T00(t)>_ren >= -C_g / t0^d`

In `d = 4`, the scaling check is `~ t0^-4`.

Inertial Lorentzian canonical lane:
- `rho_hat >= -3/(32*pi^2*t0^4)` (Ford-Roman 4D timelike worldline form).

Notes:
- `C_g` depends on the sampler family and normalization convention.
- `K` is not universal across samplers/fields.

## Sampler Convention Lock (Required)
Use one convention end-to-end and record it per run:
- `samplingKernelConvention = rho_weight` where `integral rho(t) dt = 1`.
- If FE derivation helpers are used, keep the bridge explicit: `g_hat(omega) = sqrt(f_hat(omega)/(2*pi))` and `g*g = f_hat`.

This prevents mixing `f`-weight and helper-`g` notation when mapping theorem constants to runtime checks.

## Sampler Contract (Required)
A sampler used for worldline QEI gating must be:
- smooth,
- even,
- nonnegative,
- normalized under the declared convention.

Supported canonical families:
1. Lorentzian
   - `g_L(t) = (t0 / pi) / (t^2 + t0^2)`
2. Gaussian
   - `g_G(t) = (1 / (sqrt(2*pi)*tau)) * exp(-t^2 / (2*tau^2))`
3. Compact smooth bump (`C^infinity`)
   - `g_bump(t; tau) = N * exp(-tau^2/(tau^2 - t^2))` for `|t| < tau`, else `0`

## Fail-Closed Acceptance Checks
These checks are required before any FordRomanQI-style pass/fail claim is accepted.

1. `normalize_ok`
   - check: sampler normalization holds under the declared convention.
   - numeric method: adaptive Gauss-Kronrod integration with explicit tolerance target and reported integration error estimate.
   - fail condition: normalization mismatch or missing normalization metadata.

2. `smoothness_ok`
   - check: compact-support sampler is `C^infinity`; no hard top-hat substitutions.
   - fail condition: non-smooth compact sampler used for FE-style bound claims.

3. `scaling_ok`
   - check: sweep `t0` (or `tau`) and verify empirical lower-bound scaling in `d=4` tracks `t0^-4` within tolerance.
   - fail condition: scaling drift beyond tolerance with unchanged field/sampler semantics.

If any check fails: `FordRomanQI = FAIL_CLOSED`.

## Domain Caveats (Must Be Explicit)
- Flat-space worldline QEIs do not auto-transfer to curved/bounded settings without applicability conditions.
- Null/spatial averaging semantics are not interchangeable with timelike worldline bounds.
- Curvature-domain use requires explicit short-sampling assumptions and auditable applicability evidence.
- Operator-semantic parity claims require an explicit renormalized stress-tensor mapping (point-splitting/Hadamard lane), not only a classical proxy label.

Anchors:
- Static-space-time extension context: https://arxiv.org/abs/gr-qc/9812032
- Stationary worldline QEI context: https://arxiv.org/abs/2301.01698
- Review anchor: https://arxiv.org/abs/math-ph/0501073
- Spatially averaged no-go in 4D: https://arxiv.org/abs/gr-qc/0208045

## Evidence Hooks for Governance
- Add/maintain per-run sampler evidence fields:
  - `samplingKernelIdentity`
  - `samplingKernelNormalization`
  - `KUnits`
  - `KDerivation`
  - `KProvenanceCommit`
  - `samplingKernelConvention`
  - `integrationErrorEstimate`
  - `normalize_ok`
  - `smoothness_ok`
  - `scaling_ok`

## Traceability
- owner: `research-governance`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`
- status: `draft_v1`
