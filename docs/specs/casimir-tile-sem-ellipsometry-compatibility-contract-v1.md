# Casimir Tile SEM+Ellipsometry Compatibility Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define strict, reproducible rules for building and evaluating the `sem_ellipsometry` shadow lane using primary/standard evidence while preserving non-blocking canonical policy.

## Wave-1 Scope
1. Evidence classes allowed: `primary`, `standard`.
2. Lane mode: `reference_only`, `shadow_non_blocking`.
3. Outputs: compatibility envelope, uncertainty-aware congruence diagnostics, frozen reportable profile.
4. Non-goal: no canonical override, promotion, or physical-feasibility claim.

## Required Strict Signals
`sem_ellipsometry` scenarios are emitted in strict mode only when selected rows contain:
1. `sem_calibration_anchor`
2. `ellipsometry_anchor`
3. `uncertainty_reporting_anchor`
4. `traceability_anchor`

Signal interpretation:
1. `sem_calibration_anchor`: SEM calibration evidence (must include `EXP-SE-003` class anchors).
2. `ellipsometry_anchor`: ellipsometry thickness/uncertainty anchors (must include `EXP-SE-012` and/or `EXP-SE-013`, and should include NIST SRM transfer anchors `EXP-SE-021..EXP-SE-031` when available).
3. `uncertainty_reporting_anchor`: explicit uncertainty reporting contract anchors (must include `EXP-SE-009` and/or `EXP-SE-013` class anchors).
4. `traceability_anchor`: standards traceability anchors (must include `EXP-SE-001` and `EXP-SE-002`; NIST SRM certification anchors `EXP-SE-021..EXP-SE-024` are preferred for reportable closure).

## Source Policy
1. Pass-1, pass-2, and reportable packs are filtered to `source_class in {primary,standard}`.
2. Preprint rows are excluded from this wave and remain exploratory overlay evidence only.

## Profile Policy
Profile bounds follow `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md`:
1. `SE-STD-2`: `abs(delta_se_nm) <= 2.0` and `U_fused_nm <= 2.0`
2. `SE-ADV-1`: `abs(delta_se_nm) <= 1.0` and `U_fused_nm <= 1.0`

Lane sweep is fixed to:
1. `profile_id x (delta_se_nm, U_fused_nm)` as paired deterministic envelope points
2. multipliers `{0.5, 1.0, 1.2}` of each profile bound for each axis

## Reportable Fail-Closed Policy
1. Reportable profiles are always emitted in frozen form.
2. For this wave, reportable profiles are fail-closed blocked:
   - `reportableReady=false`
   - `blockedReasons` must include:
     - `missing_paired_dual_instrument_run`
     - `missing_covariance_uncertainty_anchor`
     - `measurement_provenance_not_instrument_export`
     - `missing_measurement_provenance_run_ids`
     - `missing_measurement_provenance_raw_refs`
     - `missing_measurement_provenance_raw_hashes`
     - `missing_measurement_provenance_raw_hash_for_ref`
     - `invalid_measurement_provenance_raw_hash_format`
3. Reportable readiness can only move to true when paired SEM+ellipsometry run evidence, covariance uncertainty anchors, and measurement provenance anchors are present under strict source policy.
4. Artifact-set contract for unlock is defined in:
   - `docs/specs/casimir-tile-sem-ellipsometry-paired-run-artifact-set-v1.md`
   - `docs/specs/casimir-tile-sem-ellipsometry-covariance-budget-template-v1.md`
   - `docs/specs/templates/casimir-tile-sem-ellipsometry-paired-run-evidence-template.v1.json`

### Reportable Unlock Build Command
When paired-run evidence is available, rebuild reportable packs with:
```bash
npm run warp:shadow:build-se-packs -- --paired-evidence docs/specs/templates/casimir-tile-sem-ellipsometry-paired-run-evidence-template.v1.json
```
Or use the starter bundle path:
```bash
npm run warp:shadow:build-se-packs -- --paired-evidence docs/specs/data/se-paired-runs-template-2026-03-08/se-paired-run-evidence.v1.json
```
Builder behavior:
1. Default (no `--paired-evidence`): reportable remains fail-closed blocked.
2. With evidence file: reportable readiness is computed from evidence fields and strict source policy.

## Scenario Contract
Each `sem_ellipsometry` scenario should include:
1. `lane = sem_ellipsometry`
2. `registryRefs[]` including strict anchors
3. typed context:
   - `experimentalContext.semEllips.profileId`
   - `experimentalContext.semEllips.d_sem_corr_nm`
   - `experimentalContext.semEllips.u_sem_nm`
   - `experimentalContext.semEllips.d_ellip_nm`
   - `experimentalContext.semEllips.u_ellip_nm`
   - `experimentalContext.semEllips.delta_se_nm`
   - `experimentalContext.semEllips.d_fused_nm`
   - `experimentalContext.semEllips.u_fused_nm`
   - `experimentalContext.semEllips.U_fused_nm`
   - `experimentalContext.semEllips.sourceRefs[]`
   - `experimentalContext.semEllips.uncertainty.method`
   - `experimentalContext.semEllips.uncertainty.reportableReady`
   - `experimentalContext.semEllips.uncertainty.blockedReasons[]`
4. pack-level `profileThresholds` block for checker replay.

## Congruence Contract
Per scenario, checker output must emit:
1. `evidenceCongruence` in `{congruent,incongruent,unknown}`
2. `reportableReady` and `blockedReasons[]`
3. `reducedReasonCodes[]` per scenario and `summary.reducedReasonCounts`
4. deterministic reason codes, including:
   - `missing_sem_calibration_anchor`
   - `missing_ellipsometry_anchor`
   - `missing_uncertainty_reporting_anchor`
   - `missing_traceability_anchor`
   - `missing_semellips_context_fields`
   - `delta_exceeds_profile:<profile>`
   - `U_fused_exceeds_profile:<profile>`
   - `edge_uncertainty_overlap`
   - `reportable_not_ready`
   - `missing_reportable_blocked_reasons`
   - `missing_paired_dual_instrument_run`
   - `missing_covariance_uncertainty_anchor`
   - `measurement_provenance_not_instrument_export`
   - `missing_measurement_provenance_run_ids`
   - `missing_measurement_provenance_raw_refs`
   - `missing_measurement_provenance_raw_hashes`
   - `missing_measurement_provenance_raw_hash_for_ref`
   - `invalid_measurement_provenance_raw_hash_format`

Edge policy:
1. Boundary-overlap cases classify as `unknown`.
2. Clear profile exceedance classifies as `incongruent`.
3. Reportable packs remain `unknown` until fail-closed blocked reasons are cleared.

## Determinism Requirements
1. Re-running identical packs on the same commit produces identical scenario IDs and equivalent summary outcomes.
2. Repeat-run evidence must include summary stability and reason-count stability for typed, reportable, and reportable-reference lanes.

## Artifacts
1. Pass-1 pack: `configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json`
2. Pass-2 pack: `configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json`
3. Reportable pack: `configs/warp-shadow-injection-scenarios.se-primary-reportable.v1.json`
4. Reportable reference profile: `configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`
5. Checker output: `artifacts/research/full-solve/se-compat-check-YYYY-MM-DD.json`
6. Checker report: `docs/audits/research/warp-se-compat-check-YYYY-MM-DD.md`
7. Repeat determinism: `artifacts/research/full-solve/se-repeat-determinism-YYYY-MM-DD.json`

## Traceability
- owner: `nanometrology-and-calibration`
- status: `draft_v1`
- dependency_mode: `reference_only`
