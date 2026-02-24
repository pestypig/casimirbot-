# CasimirBot Full Solve Campaign (As-of February 24, 2026, America/New_York)

**Document ID:** FS-CAMPAIGN-2026-02-24  
**Purpose:** Run a full constrained solve program with falsifier-first gates and reproducible remote compute (Google Colab compatible)  
**Claim ceiling:** diagnostic / reduced-order only  
**Explicit non-goal:** This campaign does not claim physical warp feasibility or propulsion readiness.

## Executive Position

Run the full solve. Use it to:
1. Stress-test mathematical/numerical consistency.
2. Map no-go regions and sensitivity cliffs.
3. Produce falsifiable evidence packs.

Do not use it to claim:
1. Proven physical source realizability.
2. Semiclassical/QFT closure for propulsion.
3. Near-term mission capability.

## Solve Definition

A run is a **full solve** only if it includes all layers:
1. Metric solve and state evolution.
2. ADM residual evaluation.
3. Guardrail evaluation (`FordRomanQI`, `ThetaAudit`, `CL3_RhoDelta`, `TS_ratio_min`, `VdB_band`).
4. Strict provenance/contract checks.
5. Evidence-pack and certificate capture.

## Gate Stack With Exact Pass/Fail Criteria

## G0: Reproducibility and Provenance Gate

Pass criteria:
- Deterministic evidence pack generated for each run.
- Commit SHA, run id, trace id, and checksum captured.
- Replay reproduces derived outputs within declared tolerance.

Fail criteria:
- Missing manifest fields, checksum mismatch, or replay mismatch.

Action on fail:
- Stop promotion. Patch provenance path first.

## G1: Numerical Stability and Convergence Gate

Pass criteria:
- At least two resolution levels show monotone improvement for primary residual metrics.
- No unstable divergence under fixed seed/params.

Fail criteria:
- Residuals worsen with refinement, or solver instability appears under nominal settings.

Action on fail:
- Keep diagnostic-only status and open numerics remediation lane.

## G2: ADM Constraint Gate (Hard)

Use WARP_AGENTS thresholds:
- `H_rms_max <= 0.01`
- `M_rms_max <= 0.001`
- `H_maxAbs_max <= 0.1`
- `M_maxAbs_max <= 0.01`
- `unknownAsFail = true`

Pass criteria:
- All thresholds pass on active chart/family path.

Fail criteria:
- Any threshold fail or unknown value.

Action on fail:
- Mark run inadmissible for hard-claim promotion.

## G3: Strict Contract Completeness Gate

Required metadata:
- chart
- chart contract status
- observer
- normalization/sign convention
- unit system

Pass criteria:
- All required metadata present and valid on all surfaced metric-derived channels.

Fail criteria:
- Any missing/invalid field or proxy fallback in strict mode.

Action on fail:
- Fail-close labels and block promotion.

## G4: Guardrail Logic Gate

Hard/soft set from WARP_AGENTS:
- HARD: `FordRomanQI`, `ThetaAudit`
- SOFT: `CL3_RhoDelta`, `TS_ratio_min`, `VdB_band`

Hard pass criteria:
- Both HARD constraints pass.

Soft pass criteria:
- All SOFT pass, or explicit reduced-order exception logged with reason.

Fail criteria:
- Any HARD fail -> inadmissible.

Action on fail:
- Stop at diagnostic/reduced-order with first-fail captured.

## G5: QI Applicability Gate

Pass criteria:
- `qiApplicabilityStatus == PASS` for any attempt at certified-governance promotion.

Fail criteria:
- `UNKNOWN` or `NOT_APPLICABLE` for promotion attempts.

Action on fail:
- Cap at reduced-order; publish applicability basis and limitation.

## G6: TS Semantics Gate

Pass criteria:
- Canonical TS gate minimum (`TS_ratio >= 1.5`) and regime labels are consistent and explicitly separated.
- Public surfaces cannot interpret regime proxy as stability proof.

Fail criteria:
- Gate/regime semantic drift or ambiguous labeling.

Action on fail:
- Block external release until naming/threshold canon is restored.

## G7: Counterexample Robustness Gate

Pass criteria:
- Perturbation runs (seed, duty profile, parameter jitter) preserve first-fail ordering and core verdict.

Fail criteria:
- Small perturbations invert conclusions without explained mechanism.

Action on fail:
- Mark model fragile; no tier promotion.

## G8: Independent Replication Gate

Pass criteria:
- Same campaign on independent environment reproduces gate outcomes within tolerance.

Fail criteria:
- Replication mismatch for key gate outcomes.

Action on fail:
- Freeze claims to diagnostic and open replication investigation.

## Decision Policy

A run can only be called **reduced-order admissible** when:
1. G0-G4 pass (with HARD fully passing),
2. G5 applicability is explicitly declared,
3. G6 semantic integrity is intact.

A run can only be considered for **certified-as-governance-only** when:
1. All above pass,
2. G7 robustness and G8 replication pass,
3. Casimir verification returns PASS with integrity OK.

Any HARD failure yields:
- `INADMISSIBLE` for promotion purposes.

## Colab Remote Compute Plan

## Wave A (setup and parity)
- Build deterministic runtime image (dependencies pinned).
- Validate same solver/config locally and in Colab.
- Emit baseline evidence pack.

## Wave B (coarse sweep)
- Parameter grid over duty/scheduling, theta bounds, VdB bands, TS windows.
- Capture first-fail map and inadmissible frontier.

## Wave C (refinement)
- Refine around admissible pockets only.
- Run convergence checks and counterexample probes.

## Wave D (replication)
- Re-run winning pockets in independent Colab session/environment.
- Compare gate verdict parity and evidence checksums.

## Required Artifacts Per Wave

1. `artifacts/research/full-solve/<wave>/evidence-pack.json`
2. `artifacts/research/full-solve/<wave>/first-fail-map.json`
3. `artifacts/research/full-solve/<wave>/convergence-summary.md`
4. `artifacts/research/full-solve/<wave>/replication-delta.json` (Wave D)

## Pass/Fail Output Contract (per run)

Must record:
- `verdict`
- `firstFail`
- hard guard statuses
- soft guard statuses
- applicability status (`PASS` / `NOT_APPLICABLE` / `UNKNOWN`)
- certificate hash
- integrity status
- trace id
- run id
- commit sha

## Communication Rules

Allowed:
- "We are running full constrained solves to falsify assumptions and map admissible reduced-order regions."

Not allowed:
- "We are proving warp feasibility."
- "This establishes propulsion capability."
- "FTL path is demonstrated."

## Boundary Statement

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
