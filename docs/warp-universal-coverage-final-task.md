# Warp Universal Coverage Final Task

Status: in progress  
Owner: dan  
Date: 2026-02-11  
Scope: close the remaining CL3/CL4 universal coverage gaps without altering calibrated pipeline values.

## Objective
Deliver full universal coverage for warp telemetry, so every active warp family and chart either produces metric-derived signals with explicit contracts or is explicitly labeled proxy-only. The proof chain must be readable directly from runtime telemetry and panels.

Canonical contract (2026-02-11):
- Baseline family: `natario` (comoving_cartesian chart, Eulerian observer, SI stress normalization).
- Secondary family: `alcubierre` (supported for audits and alternate runs, not the baseline reference).

## Non-Goals
1. No retuning of calibrated pipeline defaults.
2. No paper-authentic overrides for Needle Hull parameters.
3. No new physical viability claims.

## Dependencies
1. `docs/warp-congruence-universal-coverage-task.md`
2. `docs/warp-geometry-cl4-guardrail-map.md`
3. `docs/warp-congruence-audit.md`
4. `docs/warp-geometry-congruence-state-of-the-art.md`

## Workstreams

### F0: Universal Coverage Inventory
Goal: freeze the active runtime paths and their congruence status.

Deliverables:
1. List of active warp families and charts (natario, natario_sdf, irrotational, vdb, alcubierre) used by runtime.
2. Per-path table of `metricT00` availability, contract status, and proxy fallback use.

Active path inventory (2026-02-11):

| Warp family/path | Chart | metricT00Ref | metricT00Source | Notes |
| --- | --- | --- | --- | --- |
| natario | comoving_cartesian | `warp.metric.T00.natario.shift` | metric | Flat-slice finite-diff K_ij in `modules/warp/natario-warp.ts`. |
| natario_sdf | comoving_cartesian | `warp.metric.T00.natario_sdf.shift` | metric | Same pipeline as Natario with SDF shift field. |
| irrotational | comoving_cartesian | `warp.metric.T00.irrotational.shift` | metric | Irrotational shift field; flat-slice approximation. |
| alcubierre | comoving_cartesian | `warp.metric.T00.alcubierre.analytic` | metric | Analytic wall-localized rho_E profile in Natario adapter. |
| vdb (fallback) | comoving_cartesian | `warp.metric.T00.vdb.regionII` | metric (conditional) | Only emitted when VdB derivative evidence is present; regionIV used when configured and derivative checks pass. |

Inventory notes:
1. Active `warpFieldType` values are `natario`, `natario_sdf`, `irrotational`, `alcubierre` (from `modules/warp/warp-module.ts`).
2. VdB is a metric fallback path gated by `gammaVdB > 1` and derivative evidence in the pipeline; it is not a `warpFieldType` value.

Acceptance criteria:
1. Every active path is listed with an explicit `metricT00` source and chart.
2. Missing paths are labeled `proxy-only` and flagged for closure.

### F1: Metric T00 Coverage Closure
Goal: ensure each active path supplies a metric-derived `warp.metric.T00.*` or is explicitly proxy-only.

Deliverables:
1. Metric adapter outputs (chart, observer, normalization, unit system) for each active path.
2. Runtime fields explicitly reporting contract status.

Acceptance criteria:
1. All active paths emit `metricT00Source=metric` or are labeled proxy-only with reason.
2. Strict congruence mode (`WARP_STRICT_CONGRUENCE=1`) fails when metric-derived data is missing.

### F2: Constraint Closure for CL3
Goal: CL3 delta uses constraint rho vs metric T00 with consistent unit normalization.

Deliverables:
1. `rho_constraint` in pipeline snapshot for all active paths where GR diagnostics exist.
2. `rho_delta_metric_mean` computed against metric-derived T00 only.
3. `rho_delta_pipeline_mean` retained as diagnostic reference, not used for gate.

Acceptance criteria:
1. CL3 delta gate is metric-only when available.
2. Gate reports `missing_*` reasons when metric or constraint rho is absent.

### F3: VdB Derivative Coverage
Goal: VdB derivative diagnostics cover all active surfaces when `gammaVdB > 1`.

Deliverables:
1. Region-II `B'(r)` and `B''(r)` diagnostics for every active surface.
2. Region-IV `f'(r)` diagnostics for every active surface.

Acceptance criteria:
1. VdB region-II diagnostics respond to changes in `tildeDelta`.
2. `warp.metric.T00.vdb.regionII` is emitted when region-II derivatives are available.

### F4: Panel Surfacing
Goal: CL3 and congruence status cannot be missed in the UI.

Deliverables:
1. CL3 telemetry visible in at least one guardrails panel (Drive Guards).
2. Optional: CL3 summary line in `WarpProofPanel` header or `PipelineProofPanel`.

Acceptance criteria:
1. CL3 status is visible without opening the proof pack.
2. UI labels clearly show `source`, `congruence`, and `proxy` for CL3-related signals.

### F5: Closure Report
Goal: produce a final audit that matches runtime.

Deliverables:
1. Updated `docs/warp-congruence-audit.md`.
2. A closure checklist showing which paths are geometry-derived, conditional, or proxy-only.

Acceptance criteria:
1. Audit references runtime fields only.
2. Remaining gaps are explicit and testable.

## Beyond-Labeling Build Plan (Universal Congruence)
These phases move from “labels only” to metric-derived brick coverage and constraint-first telemetry.

### U1: Metric-Derived Curvature Brick
Goal: use metric-derived K diagnostics to scale curvature bricks when available.

Deliverables:
1. Curvature brick uses metric `kTraceMean` or `kSquaredMean` when available.
2. Brick metadata includes `kScaleSource` for provenance.

Acceptance criteria:
1. When `warp.metricT00` is present, curvature brick `source=metric` and `kScaleSource` is non-pipeline.
2. When metric diagnostics are missing, curvature brick explicitly falls back to pipeline `kScaleSource`.

### U2: Metric-Derived Stress Brick Meta
Goal: propagate metric-derived T00 provenance into stress bricks for strict UI paths.

Deliverables:
1. Stress brick response includes `metricT00Ref` and `metricT00Source` when metric-derived.
2. Stress brick remains proxy-only when metric T00 is missing.

Acceptance criteria:
1. Stress brick reports `metricT00Ref` for Natario/Alcubierre/Irrotational paths.
2. Stress brick response clearly indicates proxy-only status when metric T00 is absent.

### U3: Constraint-First rho_E Coverage
Goal: ensure constraint-derived rho is present wherever ADM diagnostics exist.

Deliverables:
1. CL3 delta uses constraint rho vs metric T00 wherever `metricStressDiagnostics` exists.
2. Missing `rho_constraint` is always visible with `rho_delta_missing_parts`.

Acceptance criteria:
1. CL3 gate fails strict mode when constraint rho is missing on metric-derived paths.
2. `rho_delta_gate_source` always reflects `metricConstraint` or `gr.rho_constraint`.

### U4: VdB Derivative Surfacing on Brick Panels
Goal: VdB derivative evidence is visible on all brick-backed panels.

Deliverables:
1. Pipeline snapshot exposes `vdb_region_ii_derivative_support` and `vdb_region_iv_derivative_support`.
2. Brick panels use these flags to show derivative support status.

Acceptance criteria:
1. Brick panels can render derivative support without proof pack.
2. Strict mode blocks VdB claims when derivative support is false.

## Required Verification (per `WARP_AGENTS.md`)
1. `npm run math:report`
2. `npm run math:validate`
3. Required tests listed in `WARP_AGENTS.md`
4. `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Coverage Audit Script
Generate a concrete missing-parts report from the proof pack:

```
node --experimental-fetch ./node_modules/tsx/dist/cli.js scripts/warp-universal-coverage-audit.ts --url http://localhost:3000/api/helix/pipeline/proofs
```

Optional file input:

```
node --experimental-fetch ./node_modules/tsx/dist/cli.js scripts/warp-universal-coverage-audit.ts --proof-pack reports/warp-viability-run-final.json
```

## Definition of Done
1. All active paths have metric-derived T00 or explicit proxy labels.
2. CL3 delta gate is metric-only with constraint rho available where GR diagnostics exist.
3. VdB derivative diagnostics are surfaced for all VdB-active surfaces.
4. CL3 status is visible in UI without opening proof pack.
5. Audit doc reflects the exact runtime fields and sources.

## Progress (2026-02-11)
1. CL3 telemetry is surfaced in `DriveGuardsPanel` with gate status, deltas, threshold, and missing parts.
2. Pipeline emits `rho_constraint` and CL3 delta metrics in the snapshot.
3. VdB region-II and region-IV derivative diagnostics are computed in the pipeline.
4. Canonical `warp.metric.T00.*` refs are emitted when metric-derived stress is available.
5. Pipeline snapshot types now include `vdb_region_ii_derivative_support` and `vdb_region_iv_derivative_support` flags for UI surfaces.
6. U3 complete: CL3 delta uses constraint rho vs metric T00 where diagnostics exist and reports missing parts.
7. U4 complete: VdB region II/IV derivative support surfaced in brick panels (Drive Guards, Needle Cavity, Lattice debug).

## Remaining Work (for full universal convergence)
1. Enumerate all active charts/surfaces at runtime and publish a coverage summary using `congruence_missing_parts` in proof pack and pipeline snapshots.
2. Close any remaining metric-adapter gaps where `metricT00`, `theta_geom`, or chart contracts are missing on active surfaces.
3. Ensure VdB derivative diagnostics are computed wherever `gammaVdB > 1` is active, not just primary surfaces.
4. Extend curvature-window invariants for Ford-Roman QI where currently `curvatureOk` is `unknown`.
5. Update closure audit to list remaining proxy-only surfaces and confirm strict-mode blocks them.
