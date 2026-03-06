# Casimir Tile SEM+Ellipsometry Paired-Run Artifact Set v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define the minimum commit-tracked evidence package needed to move the `sem_ellipsometry` reportable lane from fail-closed blocked to reportable-ready.

## Scope
In scope:
1. Paired SEM+ellipsometry runs on the same physical sample IDs.
2. Numeric covariance-aware uncertainty anchors.
3. Deterministic replay inputs for `scripts/warp-shadow-sem-ellips-pack-builder.ts`.

Out of scope:
1. Canonical override/promotion decisions.
2. Runtime solver threshold changes.

## Required Artifact Bundle
All files are commit-tracked under a dated folder:
1. `artifacts/research/full-solve/se-paired-runs/<date>/sem-measurements.csv`
2. `artifacts/research/full-solve/se-paired-runs/<date>/ellips-measurements.csv`
3. `artifacts/research/full-solve/se-paired-runs/<date>/pairing-manifest.json`
4. `artifacts/research/full-solve/se-paired-runs/<date>/covariance-budget.json`
5. `artifacts/research/full-solve/se-paired-runs/<date>/se-paired-run-summary.md`
6. `artifacts/research/full-solve/se-paired-runs/<date>/se-paired-run-evidence.v1.json`

## Minimum Required Fields
`se-paired-run-evidence.v1.json` must include:
1. `pairedRunPresent=true`
2. `covarianceAnchorPresent=true`
3. `pairedRunId`
4. `sourceClass` in `{primary,standard}`
5. `uncertainty.method`
6. `uncertainty.u_sem_nm` (numeric, >0)
7. `uncertainty.u_ellip_nm` (numeric, >0)
8. At least one covariance anchor:
   - `uncertainty.rho_sem_ellip` (numeric, `-1 < rho < 1`), or
   - `uncertainty.covariance_sem_ellip_nm2` (numeric)

## Reportable Unlock Criteria
`reportableReady=true` is admissible only when:
1. Required bundle files are present.
2. Evidence JSON contains all required fields above.
3. Builder replay is executed with:
   - `npm run warp:shadow:build-se-packs -- --paired-evidence <path-to-evidence-json>`
4. Reportable congruence replay no longer emits fail-closed blocker reasons:
   - `missing_paired_dual_instrument_run`
   - `missing_covariance_uncertainty_anchor`

## Deterministic Falsifiers
1. Missing paired sample IDs across SEM and ellipsometry runs.
2. Missing numeric covariance anchors.
3. `sourceClass` not in `{primary,standard}` for strict reportable lane.
4. `reportableReady=true` while blocked reasons are still present.

## Operator Notes
1. Keep current boundary posture: lane remains `reference_only` until explicit promotion policy changes.
2. This artifact set enables reportable-ready metadata only; it does not assert physical feasibility.

## Traceability
- owner: `nanometrology-and-calibration`
- status: `draft_v1`
- dependency_mode: `reference_only`
