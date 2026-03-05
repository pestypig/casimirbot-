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

## Command
```bash
npm run warp:shadow:build-scenarios
```

Common filtered run:
```bash
npm run warp:shadow:build-scenarios -- --lane qei_worldline,q_spoiling,timing,nanogap,casimir_sign_control --status extracted --max-per-lane 3 --out configs/warp-shadow-injection-scenarios.generated.v1.json
```

Strict QEI mode (fail-closed QEI lane emission):
```bash
npm run warp:shadow:build-scenarios -- --lane qei_worldline,q_spoiling,timing,nanogap,casimir_sign_control --status extracted --max-per-lane 3 --strict-qei --out configs/warp-shadow-injection-scenarios.generated.v1.json
```

Strict Casimir sign mode (primary/standard first):
```bash
npm run warp:shadow:build-scenarios -- --lane casimir_sign_control --status extracted --source-class primary,standard --max-per-lane 6 --strict-casimir-sign --out configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json
```

Two-pass casimir sign pack expansion:
```bash
npm run warp:shadow:build-cs-packs
```
This expands strict lane anchors into:
1. pass-1 existing knobs pack (`cs-primary-recovery`) with deterministic `gap_nm x branch_tag` sweep.
2. pass-2 typed pack (`cs-primary-typed`) with `experimentalContext.casimirSign` passthrough.
3. frozen reportable prereg pack (`cs-primary-reportable`) with locked refs, gap grid, branches, and uncertainty assumptions.

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

## Non-Blocking Policy
- Builder output remains `reference_only`.
- Generated scenarios cannot override canonical campaign decisions.
- Promotion still requires preregistration and replay evidence.

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- dependency_mode: `reference_only`
