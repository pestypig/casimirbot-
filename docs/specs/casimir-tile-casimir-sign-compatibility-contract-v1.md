# Casimir Tile Casimir Sign-Compatibility Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define strict, reproducible rules for building and evaluating the `casimir_sign_control` shadow lane using primary/standard evidence without modifying canonical full-solve decisions.

## Wave-1 Scope
1. Evidence classes allowed: `primary`, `standard`.
2. Lane mode: `reference_only`, `shadow_non_blocking`.
3. Outputs: compatibility envelope and evidence-congruence diagnostics.
4. Non-goal: no canonical override or physical-feasibility claim.

## Required Strict Signals
`casimir_sign_control` scenarios are emitted in strict mode only when selected rows contain:
1. `sign_observation_or_branch_anchor`
2. `gap_window_anchor_nm`
3. `materials_medium_anchor`
4. `uncertainty_fields_anchor`

Signal interpretation:
1. `sign_observation_or_branch_anchor`: explicit attractive/repulsive/sign-transition evidence.
2. `gap_window_anchor_nm`: numeric gap-window evidence in nm.
3. `materials_medium_anchor`: material pair and intervening medium evidence.
4. `uncertainty_fields_anchor`: at least one non-empty uncertainty record tied to lane anchors.

## Source Policy
1. Pass-1 and pass-2 primary lane packs must be filtered to `source_class in {primary,standard}`.
2. Preprint rows are excluded from this wave and may be used only in separate exploratory overlays.

## Scenario Contract
Each lane scenario should include:
1. `lane = casimir_sign_control`
2. `registryRefs[]` anchored to strict signals
3. `overrides.params.gap_nm`
4. Optional typed context:
   - `experimentalContext.casimirSign.branchHypothesis`
   - `experimentalContext.casimirSign.materialPair`
   - `experimentalContext.casimirSign.interveningMedium`
   - `experimentalContext.casimirSign.sourceRefs[]`
   - `experimentalContext.casimirSign.uncertainty.u_gap_nm`
   - `experimentalContext.casimirSign.uncertainty.u_window_nm`
   - `experimentalContext.casimirSign.uncertainty.method`

## Congruence Contract
Per scenario, checker output must emit:
1. `evidenceCongruence` in `{congruent,incongruent,unknown}`
2. deterministic reason codes (examples):
   - `gap_outside_primary_window`
   - `edge_uncertainty_overlap`
   - `missing_material_anchor`
   - `missing_sign_anchor`
   - `missing_branch_hypothesis`
   - `missing_uncertainty_fields`

Edge policy:
1. Branch-edge cases that overlap uncertainty bands are classified as `unknown` (never forced to `incongruent`).
2. `incongruent` is reserved for cases outside uncertainty-expanded branch windows.

## Determinism Requirements
1. Re-running the same pack on same commit must produce the same scenario IDs and winner selection outcome (or same failure envelope when no winner).
2. All outputs are commit-pinned and replayable through scripted commands.

## Artifacts
1. Pass-1 pack: `configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json`
2. Pass-2 pack: `configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json`
3. Reportable prereg pack: `configs/warp-shadow-injection-scenarios.cs-primary-reportable.v1.json`
4. Checker output: `artifacts/research/full-solve/cs-compat-check-YYYY-MM-DD.json`
5. Checker report: `docs/audits/research/warp-cs-compat-check-YYYY-MM-DD.md`

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- dependency_mode: `reference_only`
