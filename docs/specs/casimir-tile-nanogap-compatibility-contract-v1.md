# Casimir Tile Nanogap Compatibility Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define strict, reproducible rules for building and evaluating the `nanogap` shadow lane using primary/standard evidence while preserving non-blocking canonical policy.

## Wave-1 Scope
1. Evidence classes allowed: `primary`, `standard`.
2. Lane mode: `reference_only`, `shadow_non_blocking`.
3. Outputs: compatibility envelope, uncertainty-aware congruence diagnostics, frozen reportable profile.
4. Non-goal: no canonical override, promotion, or physical-feasibility claim.

## Required Strict Signals
`nanogap` scenarios are emitted in strict mode only when selected rows contain:
1. `nanogap_calibration_anchor`
2. `tip_state_anchor`
3. `fiducial_anchor`
4. `uncertainty_anchor`

Signal interpretation:
1. `nanogap_calibration_anchor`: calibrated uncertainty/traceability anchor (must include `EXP-NG-002` or equivalent).
2. `tip_state_anchor`: BTR/tip-state control anchor (must include `EXP-NG-019` or `EXP-NG-020` class evidence).
3. `fiducial_anchor`: fiducial stability anchor (must include `EXP-NG-011` and `EXP-NG-012` class evidence).
4. `uncertainty_anchor`: explicit non-UNKNOWN uncertainty-bearing row.

## Source Policy
1. Pass-1, pass-2, and reportable nanogap packs are filtered to `source_class in {primary,standard}`.
2. Preprint rows are excluded from this wave and remain exploratory overlay evidence only.

## Profile Policy
Profile bounds follow `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md`:
1. `NG-STD-10`: `u_g_mean_nm <= 2.0` and `u_g_sigma_nm <= 2.0`
2. `NG-ADV-5`: `u_g_mean_nm <= 1.0` and `u_g_sigma_nm <= 1.0`

Lane sweep is fixed to:
1. `gap_nm x profile_id`
2. `profile_id in {NG-STD-10, NG-ADV-5}`

## Scenario Contract
Each `nanogap` scenario should include:
1. `lane = nanogap`
2. `registryRefs[]` including strict anchors
3. `overrides.params.gap_nm`
4. Optional typed context:
   - `experimentalContext.nanogap.profileId`
   - `experimentalContext.nanogap.u_g_mean_nm`
   - `experimentalContext.nanogap.u_g_sigma_nm`
   - `experimentalContext.nanogap.tip_method`
   - `experimentalContext.nanogap.fiducial_present`
   - `experimentalContext.nanogap.sourceRefs[]`
   - `experimentalContext.nanogap.uncertainty.method`
   - `experimentalContext.nanogap.uncertainty.reportableReady`
   - `experimentalContext.nanogap.uncertainty.blockedReasons[]`
5. Pack-level `profileThresholds` block for checker replay.

## Congruence Contract
Per scenario, checker output must emit:
1. `evidenceCongruence` in `{congruent,incongruent,unknown}`
2. deterministic reason codes, including:
   - `missing_nanogap_calibration_anchor`
   - `missing_tip_state_anchor`
   - `missing_fiducial_anchor`
   - `missing_uncertainty_anchor`
   - `missing_profile_id`
   - `missing_uncertainty_fields`
   - `invalid_uncertainty_values`
   - `reportable_not_ready`
   - `gap_outside_protocol_bounds`
   - `u_g_mean_exceeds_profile:<profile>`
   - `u_g_sigma_exceeds_profile:<profile>`
   - `edge_uncertainty_overlap`

Edge policy:
1. Boundary-overlap cases classify as `unknown`.
2. Clear profile/gap threshold misses classify as `incongruent`.

## Determinism Requirements
1. Re-running identical packs on the same commit produces identical scenario IDs and equivalent summary outcomes.
2. Repeat-run evidence must include summary stability and reason-count stability.

## Artifacts
1. Pass-1 pack: `configs/warp-shadow-injection-scenarios.ng-primary-recovery.v1.json`
2. Pass-2 pack: `configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json`
3. Reportable pack: `configs/warp-shadow-injection-scenarios.ng-primary-reportable.v1.json`
4. Reportable reference profile: `configs/warp-shadow-injection-scenarios.ng-primary-reportable-reference.v1.json`
5. Checker output: `artifacts/research/full-solve/ng-compat-check-YYYY-MM-DD.json`
6. Checker report: `docs/audits/research/warp-ng-compat-check-YYYY-MM-DD.md`
7. Repeat determinism: `artifacts/research/full-solve/ng-repeat-determinism-YYYY-MM-DD.json`

## Traceability
- owner: `nanometrology-and-calibration`
- status: `draft_v1`
- dependency_mode: `reference_only`
