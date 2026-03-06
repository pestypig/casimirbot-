# Casimir Tile Q-Spoiling Compatibility Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define strict, reproducible rules for building and evaluating the `q_spoiling` shadow lane using primary/standard evidence while preserving non-blocking canonical policy.

## Wave-1 Scope
1. Evidence classes allowed: `primary`, `standard`.
2. Lane mode: `reference_only`, `shadow_non_blocking`.
3. Outputs: compatibility envelope, uncertainty-aware congruence diagnostics, frozen reportable profile.
4. Non-goal: no canonical override, promotion, or physical-feasibility claim.

## Required Strict Signals
`q_spoiling` scenarios are emitted in strict mode only when selected rows contain:
1. `q0_baseline_anchor`
2. `q_spoil_anchor`
3. `q_spoil_ratio_anchor`

Signal interpretation:
1. `q0_baseline_anchor`: baseline high-Q evidence (must include `EXP-Q-001` or equivalent).
2. `q_spoil_anchor`: spoiled/degraded Q evidence (must include `EXP-Q-002` or equivalent).
3. `q_spoil_ratio_anchor`: ratio `F_Q_spoil = Q0_clean / Q0_spoiled` is derivable from selected anchors.

## Source Policy
1. Pass-1, pass-2, and reportable q-spoiling packs are filtered to `source_class in {primary,standard}`.
2. Preprint rows are excluded from this wave and remain exploratory overlay evidence only.

## Mechanism Split (Required)
Thresholds and congruence are evaluated per mechanism lane, not as a mixed global floor/ceiling:
1. `hydride_q_disease`
2. `trapped_flux`
3. `tls_oxide`

Mechanism-specific threshold objects must include:
1. `q0_clean_floor`
2. `q0_spoiled_ceiling`
3. `f_q_spoil_floor`
4. `thresholdDerivation`
5. `sourceRefs[]`

## Dual-Mode Uncertainty Policy
1. Mapping packs may emit with conservative fallback uncertainty when numeric uncertainty anchors are absent.
2. Policy uncertainty anchor usage is deprecated for this lane; use mechanism-measured uncertainty anchors:
   - `EXP-Q-020` (hydride/Q-disease)
   - `EXP-Q-021` (trapped flux)
   - `EXP-Q-022` (TLS/oxide)
3. Reportable profile is always frozen; readiness is conditional:
   - if any mechanism lacks numeric uncertainty anchors, `reportableReady=false` and mechanism-specific blocked reasons are required.
   - if all mechanisms have admissible uncertainty anchors, `reportableReady=true`.
4. Numeric uncertainty anchors must remain traceable in the parameter registry.

## Scenario Contract
Each `q_spoiling` scenario should include:
1. `lane = q_spoiling`
2. `registryRefs[]` including baseline and spoil anchors
3. `overrides.params.qCavity` (baseline Q)
4. `overrides.params.qSpoilingFactor` (`F_Q_spoil`)
5. `overrides.qi.fieldType = em`
6. Optional typed context:
   - `experimentalContext.qSpoiling.mechanismLane`
   - `experimentalContext.qSpoiling.q0Baseline`
   - `experimentalContext.qSpoiling.f_q_spoil`
   - `experimentalContext.qSpoiling.q0Spoiled`
   - `experimentalContext.qSpoiling.q_spoil_ratio`
   - `experimentalContext.qSpoiling.q_spoil_ratio_anchor`
   - `experimentalContext.qSpoiling.sourceRefs[]`
   - `experimentalContext.qSpoiling.uncertainty.u_q0_rel`
   - `experimentalContext.qSpoiling.uncertainty.u_f_rel`
   - `experimentalContext.qSpoiling.uncertainty.method`
   - `experimentalContext.qSpoiling.uncertainty.reportableReady`
   - `experimentalContext.qSpoiling.uncertainty.blockedReasons[]`
   - `experimentalContext.qSpoiling.thresholds`

## Congruence Contract
Per scenario, checker output must emit:
1. `evidenceCongruence` in `{congruent,incongruent,unknown}`
2. deterministic reason codes, including:
   - `missing_q0_baseline_anchor`
   - `missing_q_spoil_anchor`
   - `missing_q_spoil_ratio_anchor`
   - `q_spoil_ratio_anchor_mismatch`
   - `missing_q_context_fields`
   - `q0_baseline_below_floor:<mechanism>`
   - `q0_spoiled_above_ceiling:<mechanism>`
   - `f_q_spoil_below_floor:<mechanism>`
   - `edge_uncertainty_overlap:<mechanism>`

Edge policy:
1. Threshold-overlap cases under uncertainty classify as `unknown`.
2. `incongruent` is reserved for clear threshold violations outside uncertainty-expanded bands.

## Determinism Requirements
1. Re-running identical packs on the same commit produces identical scenario IDs and equivalent summary outcomes.
2. Repeat-run evidence must include summary stability and congruence reason-count stability.

## Artifacts
1. Pass-1 pack: `configs/warp-shadow-injection-scenarios.qs-primary-recovery.v1.json`
2. Pass-2 pack: `configs/warp-shadow-injection-scenarios.qs-primary-typed.v1.json`
3. Reportable pack: `configs/warp-shadow-injection-scenarios.qs-primary-reportable.v1.json`
4. Reportable reference profile: `configs/warp-shadow-injection-scenarios.qs-primary-reportable-reference.v1.json`
5. Checker output: `artifacts/research/full-solve/qs-compat-check-YYYY-MM-DD.json`
6. Checker report: `docs/audits/research/warp-qs-compat-check-YYYY-MM-DD.md`
7. Repeat determinism: `artifacts/research/full-solve/qs-repeat-determinism-YYYY-MM-DD.json`

## Traceability
- owner: `RF-and-surface-physics`
- status: `draft_v1`
- dependency_mode: `reference_only`
