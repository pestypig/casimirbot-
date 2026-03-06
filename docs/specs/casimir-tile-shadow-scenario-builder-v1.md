# Casimir Tile Shadow Scenario Builder v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Convert selected `EXP-*` rows from the experimental parameter registry into runnable shadow-injection scenario packs with deterministic, strict rules.

This removes manual copy/edit from:
- registry rows -> scenario JSON
- lane grouping -> override templates
- selection filters -> reproducible scenario pack

## Inputs
- Registry: `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`
- Rulebook: `configs/warp-shadow-scenario-builder-rulebook.v1.json`

## Output
- Generated scenario pack: `configs/warp-shadow-injection-scenarios.generated.v1.json`
- Casimir sign primary pack: `configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json`
- Casimir sign typed pack: `configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json`
- Casimir sign reportable prereg pack: `configs/warp-shadow-injection-scenarios.cs-primary-reportable.v1.json`
- Q-spoiling primary pack: `configs/warp-shadow-injection-scenarios.qs-primary-recovery.v1.json`
- Q-spoiling typed pack: `configs/warp-shadow-injection-scenarios.qs-primary-typed.v1.json`
- Q-spoiling reportable prereg pack: `configs/warp-shadow-injection-scenarios.qs-primary-reportable.v1.json`
- Q-spoiling reportable reference profile pack: `configs/warp-shadow-injection-scenarios.qs-primary-reportable-reference.v1.json`
- Nanogap primary pack: `configs/warp-shadow-injection-scenarios.ng-primary-recovery.v1.json`
- Nanogap typed pack: `configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json`
- Nanogap reportable prereg pack: `configs/warp-shadow-injection-scenarios.ng-primary-reportable.v1.json`
- Nanogap reportable reference profile pack: `configs/warp-shadow-injection-scenarios.ng-primary-reportable-reference.v1.json`
- Timing primary pack: `configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json`
- Timing typed pack: `configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json`
- Timing reportable prereg pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`
- Timing reportable reference profile pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`
- SEM+ellipsometry primary pack: `configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json`
- SEM+ellipsometry typed pack: `configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json`
- SEM+ellipsometry reportable prereg pack: `configs/warp-shadow-injection-scenarios.se-primary-reportable.v1.json`
- SEM+ellipsometry reportable reference profile pack: `configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`

## Command
```bash
npm run warp:shadow:build-scenarios
```

Common filtered run:
```bash
npm run warp:shadow:build-scenarios -- --lane qei_worldline,q_spoiling,timing,nanogap,casimir_sign_control,sem_ellipsometry --status extracted --max-per-lane 3 --out configs/warp-shadow-injection-scenarios.generated.v1.json
```

Strict QEI mode (fail-closed QEI lane emission):
```bash
npm run warp:shadow:build-scenarios -- --lane qei_worldline,q_spoiling,timing,nanogap,casimir_sign_control,sem_ellipsometry --status extracted --max-per-lane 3 --strict-qei --out configs/warp-shadow-injection-scenarios.generated.v1.json
```

Strict Casimir sign mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane casimir_sign_control --status extracted --source-class primary,standard --max-per-lane 6 --strict-casimir-sign --out configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json
```

Strict q-spoiling mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane q_spoiling --status extracted --source-class primary,standard --max-per-lane 6 --strict-q-spoiling --out configs/warp-shadow-injection-scenarios.qs-primary-recovery.v1.json
```

Strict nanogap mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane nanogap --status extracted --source-class primary,standard --max-per-lane 6 --strict-nanogap --out configs/warp-shadow-injection-scenarios.ng-primary-recovery.v1.json
```

Strict timing mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane timing --status extracted --source-class primary,standard --max-per-lane 6 --strict-timing --out configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json
```

Strict SEM+ellipsometry mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane sem_ellipsometry --status extracted --source-class primary,standard --max-per-lane 6 --strict-sem-ellips --out configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json
```

Two-pass casimir sign pack expansion:
```bash
npm run warp:shadow:build-cs-packs
```
This expands strict lane anchors into:
1. pass-1 existing knobs pack (`cs-primary-recovery`) with deterministic `gap_nm x branch_tag` sweep.
2. pass-2 typed pack (`cs-primary-typed`) with `experimentalContext.casimirSign` passthrough.
3. frozen reportable prereg pack (`cs-primary-reportable`) with locked refs, gap grid, branches, and uncertainty assumptions.

Two-pass q-spoiling pack expansion:
```bash
npm run warp:shadow:build-qs-packs
```
This expands strict q-spoiling anchors into:
1. pass-1 existing knobs pack (`qs-primary-recovery`) with deterministic `mechanism_lane x Q0 x F_Q_spoil` sweep.
2. pass-2 typed pack (`qs-primary-typed`) with `experimentalContext.qSpoiling` passthrough.
3. frozen reportable prereg pack (`qs-primary-reportable`) with locked refs, mechanism thresholds, and uncertainty policy state.
4. fixed reportable reference profile (`qs-primary-reportable-reference`) with one stable scenario-id set for manuscript citations across reruns.

Two-pass nanogap pack expansion:
```bash
npm run warp:shadow:build-ng-packs
```
This expands strict nanogap anchors into:
1. pass-1 existing knobs pack (`ng-primary-recovery`) with deterministic `gap_nm x profile_id` sweep.
2. pass-2 typed pack (`ng-primary-typed`) with `experimentalContext.nanogap` passthrough.
3. frozen reportable prereg pack (`ng-primary-reportable`) with locked refs, grid, profile thresholds, and uncertainty readiness state.
4. fixed reportable reference profile (`ng-primary-reportable-reference`) with one stable scenario-id set for manuscript citations across reruns.

Two-pass timing pack expansion:
```bash
npm run warp:shadow:build-ti-packs
```
This expands strict timing anchors into:
1. pass-1 existing knobs pack (`ti-primary-recovery`) with deterministic `sigma_t_ps x profile_id` sweep.
2. pass-2 typed pack (`ti-primary-typed`) with `experimentalContext.timing` passthrough.
3. frozen reportable prereg pack (`ti-primary-reportable`) with locked refs, sigma grid, profile thresholds, and uncertainty readiness state.
4. fixed reportable reference profile (`ti-primary-reportable-reference`) with one stable scenario-id set for manuscript citations across reruns.

Two-pass SEM+ellipsometry pack expansion:
```bash
npm run warp:shadow:build-se-packs
```
This expands strict SEM+ellipsometry anchors into:
1. pass-1 existing knobs pack (`se-primary-recovery`) with deterministic `profile_id x (delta_se_nm,U_fused_nm)` envelope sweep.
2. pass-2 typed pack (`se-primary-typed`) with `experimentalContext.semEllips` passthrough.
3. frozen reportable prereg pack (`se-primary-reportable`) with locked refs/profile thresholds and explicit blocked reportable readiness.
4. fixed reportable reference profile (`se-primary-reportable-reference`) with one stable scenario-id set for manuscript citations across reruns.

Reportable unlock replay (when paired-run evidence is available):
```bash
npm run warp:shadow:build-se-packs -- --paired-evidence docs/specs/templates/casimir-tile-sem-ellipsometry-paired-run-evidence-template.v1.json
```

Then run:
```bash
npm run warp:shadow:inject -- --scenarios configs/warp-shadow-injection-scenarios.generated.v1.json
```

## Strict Rules
1. Only rows with resolvable lane prefix mapping are considered.
2. Only `runnableLanes` in the rulebook are emitted.
3. Status and source-class filters are explicit and reproducible.
4. Lane templates provide deterministic baseline overrides.
5. Data-derived overrides are limited to bounded transforms (e.g., nanogap/Q medians).

### `--strict-qei` lane policy
When `--strict-qei` is enabled, lane `qei_worldline` is emitted only if the selected rows (after `max-per-lane` selection) contain all required explicit signals:
1. sampler normalization signal (`samplingKernelNormalization` / `normalize_ok` / equivalent normalization evidence),
2. `tau` signal (explicit `tau` token in parameter/value/conditions),
3. admissible worldline applicability signal (`qei_worldline_applicability` or equivalent PASS/REQUIRED/PRESENT evidence).

If any required signal is missing, `qei_worldline` is skipped and the generated JSON includes:
- `summary.strictQeiSkips`
- `strictQeiSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

### `--strict-casimir-sign` lane policy
When `--strict-casimir-sign` is enabled, lane `casimir_sign_control` is emitted only if the selected rows contain:
1. `sign_observation_or_branch_anchor`,
2. `gap_window_anchor_nm`,
3. `materials_medium_anchor`,
4. `uncertainty_fields_anchor`.

Source policy in this strict mode:
1. wave-1 packs should be filtered to `--source-class primary,standard`,
2. preprint rows belong in a separate exploratory overlay pack.

If required strict signals are missing (or selected rows violate strict source class policy), lane emission is skipped and the generated JSON includes:
- `summary.strictLaneSkips`
- `strictLaneSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

### `--strict-timing` lane policy
When `--strict-timing` is enabled, lane `timing` is emitted only if selected rows contain:
1. `timing_topology_anchor`,
2. `timing_precision_anchor`,
3. `timing_accuracy_anchor`,
4. `timing_longhaul_anchor`.

Source policy in this strict mode:
1. wave-1 packs should be filtered to `--source-class primary,standard`,
2. preprint rows belong in a separate exploratory overlay pack.

Profile split in pack expansion (post strict-lane build):
1. `WR-SHORT-PS`,
2. `WR-LONGHAUL-EXP`.
Congruence is evaluated against profile-aware sigma bounds and strict-scope evidence admissibility.

If required strict signals are missing (or selected rows violate strict source class policy), lane emission is skipped and the generated JSON includes:
- `summary.strictLaneSkips`
- `strictLaneSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

### `--strict-q-spoiling` lane policy
When `--strict-q-spoiling` is enabled, lane `q_spoiling` is emitted only if selected rows contain:
1. `q0_baseline_anchor`,
2. `q_spoil_anchor`,
3. `q_spoil_ratio_anchor`.

Mechanism split in pack expansion (post strict-lane build):
1. `hydride_q_disease`,
2. `trapped_flux`,
3. `tls_oxide`.
Each mechanism lane receives its own uncertainty anchor and threshold set; congruence is no longer evaluated against a single mixed floor/ceiling.

Source policy in this strict mode:
1. wave-1 packs should be filtered to `--source-class primary,standard`,
2. preprint rows belong in a separate exploratory overlay pack.

If required strict signals are missing (or selected rows violate strict source class policy), lane emission is skipped and the generated JSON includes:
- `summary.strictLaneSkips`
- `strictLaneSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

### `--strict-nanogap` lane policy
When `--strict-nanogap` is enabled, lane `nanogap` is emitted only if selected rows contain:
1. `nanogap_calibration_anchor`,
2. `tip_state_anchor`,
3. `fiducial_anchor`,
4. `uncertainty_anchor`.

Source policy in this strict mode:
1. wave-1 packs should be filtered to `--source-class primary,standard`,
2. preprint rows belong in a separate exploratory overlay pack.

Profile split in pack expansion (post strict-lane build):
1. `NG-STD-10`,
2. `NG-ADV-5`.
Congruence is evaluated against profile-specific uncertainty bounds with deterministic edge handling.

If required strict signals are missing (or selected rows violate strict source class policy), lane emission is skipped and the generated JSON includes:
- `summary.strictLaneSkips`
- `strictLaneSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

### `--strict-sem-ellips` lane policy
When `--strict-sem-ellips` is enabled, lane `sem_ellipsometry` is emitted only if selected rows contain:
1. `sem_calibration_anchor`,
2. `ellipsometry_anchor`,
3. `uncertainty_reporting_anchor`,
4. `traceability_anchor`.

Source policy in this strict mode:
1. wave-1 packs should be filtered to `--source-class primary,standard`,
2. preprint rows belong in a separate exploratory overlay pack.

Profile split in pack expansion (post strict-lane build):
1. `SE-STD-2`,
2. `SE-ADV-1`.
Congruence is evaluated against profile-specific `delta_se_nm` and `U_fused_nm` bounds with deterministic edge handling.

If required strict signals are missing (or selected rows violate strict source class policy), lane emission is skipped and the generated JSON includes:
- `summary.strictLaneSkips`
- `strictLaneSkips[]` entries with `reason`, `missingSignals`, and `registryRefs`

## Non-Blocking Policy
- Builder output remains `reference_only`.
- Generated scenarios cannot override canonical campaign decisions.
- Promotion still requires preregistration and replay evidence.

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- dependency_mode: `reference_only`
