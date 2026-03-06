# Casimir Tile Timing Compatibility Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define strict, reproducible rules for building and evaluating the `timing` shadow lane using primary/standard evidence while preserving non-blocking canonical policy.

## Wave-1 Scope
1. Evidence classes allowed: `primary`, `standard`.
2. Lane mode: `reference_only`, `shadow_non_blocking`.
3. Outputs: compatibility envelope, uncertainty-aware congruence diagnostics, frozen reportable profile.
4. Non-goal: no canonical override, promotion, or physical-feasibility claim.

## Required Strict Signals
`timing` scenarios are emitted in strict mode only when selected rows contain:
1. `timing_topology_anchor`
2. `timing_precision_anchor`
3. `timing_accuracy_anchor`
4. `timing_longhaul_anchor`

Signal interpretation:
1. `timing_topology_anchor`: topology trace anchor (must include `EXP-T-001` class evidence).
2. `timing_precision_anchor`: measured precision anchor (must include `EXP-T-003` class evidence).
3. `timing_accuracy_anchor`: measured/declared WR accuracy anchor (must include `EXP-T-002` or `EXP-T-004` class evidence).
4. `timing_longhaul_anchor`: strict-scope long-haul admissibility anchor (must include `EXP-T-029` with admissible class/status and known uncertainty).
5. Named uncertainty anchors for reportable readiness should be present when available:
   - `EXP-T-030` for `u_sigma_t_ps`
   - `EXP-T-031` for `u_tie_pp_ps`

## Source Policy
1. Pass-1, pass-2, and reportable timing packs are filtered to `source_class in {primary,standard}`.
2. Preprint rows are excluded from this wave and remain exploratory overlay evidence only.

## Profile Policy
Profile bounds follow `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`:
1. `WR-SHORT-PS`: hard profile with sigma threshold checks.
2. `WR-LONGHAUL-EXP`: exploratory profile gated by admissible topology + uncertainty evidence.

Lane sweep is fixed to:
1. `sigma_t_ps x profile_id`
2. `profile_id in {WR-SHORT-PS, WR-LONGHAUL-EXP}`
3. `tie_pp_ps` is profile-derived from strict primary anchors and treated as a measured-envelope companion metric (not a sweep axis).

## Dual-Mode Uncertainty Policy
1. Mapping packs may emit with conservative fallback uncertainty when strict-scope numeric uncertainty anchors are absent.
2. Reportable profile is always frozen; readiness is conditional:
   - if strict-scope numeric uncertainty anchors are missing, `reportableReady=false` with explicit blocked reasons.
   - named anchors (`EXP-T-030`,`EXP-T-031`) are preferred over generic strict-row uncertainty parsing.
   - if admissible numeric anchors exist, `reportableReady=true`.
3. This wave may end with `reportableReady=false`; that is allowed and must be explicit.

## Scenario Contract
Each `timing` scenario should include:
1. `lane = timing`
2. `registryRefs[]` including strict anchors
3. `overrides.params.clocking` baseline contract payload
4. Optional typed context:
   - `experimentalContext.timing.profileId`
   - `experimentalContext.timing.sigma_t_ps`
   - `experimentalContext.timing.tie_pp_ps`
   - `experimentalContext.timing.pdv_pp_ps`
   - `experimentalContext.timing.timestamping_mode`
   - `experimentalContext.timing.synce_enabled`
   - `experimentalContext.timing.clock_mode`
   - `experimentalContext.timing.topology_class`
   - `experimentalContext.timing.sourceRefs[]`
   - `experimentalContext.timing.uncertainty.u_sigma_t_ps`
   - `experimentalContext.timing.uncertainty.u_tie_pp_ps`
   - `experimentalContext.timing.uncertainty.u_pdv_pp_ps`
   - `experimentalContext.timing.uncertainty.method`
   - `experimentalContext.timing.uncertainty.reportableReady`
   - `experimentalContext.timing.uncertainty.blockedReasons[]`
5. Pack-level `profileThresholds` block for checker replay.

## Congruence Contract
Per scenario, checker output must emit:
1. `evidenceCongruence` in `{congruent,incongruent,unknown}`
2. deterministic reason codes, including:
   - `missing_timing_topology_anchor`
   - `missing_timing_precision_anchor`
   - `missing_timing_accuracy_anchor`
   - `missing_timing_longhaul_anchor`
   - `missing_tie_pp_ps`
   - `timestamping_not_hardware`
   - `synce_not_enabled`
   - `sigma_exceeds_profile:WR-SHORT-PS`
   - `tie_exceeds_profile:WR-SHORT-PS`
   - `tie_exceeds_profile:WR-LONGHAUL-EXP`
   - `edge_uncertainty_overlap`
   - `missing_numeric_uncertainty_anchor`
   - `longhaul_evidence_not_admissible_in_strict_scope`

Edge policy:
1. Boundary-overlap cases classify as `unknown`.
2. Clear WR-SHORT sigma threshold misses classify as `incongruent`.
3. WR-LONGHAUL remains non-promotable when strict-scope long-haul evidence is missing.

## Determinism Requirements
1. Re-running identical packs on the same commit produces identical scenario IDs and equivalent summary outcomes.
2. Repeat-run evidence must include summary stability and reason-count stability.
3. `reportable-reference` profile must lock interior citation targets and emit a dedicated congruence check artifact.

## Artifacts
1. Pass-1 pack: `configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json`
2. Pass-2 pack: `configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json`
3. Reportable pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`
4. Reportable reference profile: `configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`
5. Checker output: `artifacts/research/full-solve/ti-compat-check-YYYY-MM-DD.json`
6. Checker report: `docs/audits/research/warp-ti-compat-check-YYYY-MM-DD.md`
7. Reportable-reference checker output: `artifacts/research/full-solve/ti-compat-check-reportable-reference-YYYY-MM-DD.json`
8. Reportable-reference checker report: `docs/audits/research/warp-ti-compat-check-reportable-reference-YYYY-MM-DD.md`
9. Repeat determinism: `artifacts/research/full-solve/ti-repeat-determinism-YYYY-MM-DD.json`

## Traceability
- owner: `timing-and-controls`
- status: `draft_v1`
- dependency_mode: `reference_only`
