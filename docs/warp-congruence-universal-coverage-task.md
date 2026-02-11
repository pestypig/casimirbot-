# Warp Congruence Universal Coverage Task

Superseded by: `docs/warp-universal-coverage-final-task.md`  
Use the final task as the active closure plan.

Status: planned  
Owner: dan  
Date: 2026-02-10  
Scope: expand CL3 and CL4 coverage across all active warp families and surfaces, then publish a consolidated congruence report.

## Objective
Define and execute a build plan that brings runtime telemetry and guardrails into universal, chart-aware CL3 and CL4 congruence without changing the calibrated pipeline solution. The outcome is a spec-grade report that shows what is geometry-derived, what is conditional, and what remains proxy-only.

## Non-Goals
- No retuning of pipeline defaults or Needle Hull parameters.
- No new physical viability claims.
- No replacement of calibrated telemetry with paper values.

## Inputs
- `docs/warp-geometry-comparison.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-congruence-audit.md`
- `docs/warp-full-congruence-closure-task.md`

## Needle Hull Note
Needle Hull remains a provenance reference. It must not override calibrated pipeline values. Any alignment is documented as a trace or audit, not as a runtime parameter change.

## Phase Plan

### U0: Baseline Freeze
Goal: establish the baseline for universal coverage.

Deliverables:
1. Current congruence audit snapshot reference.
2. Summary of remaining proxy-only paths.

Acceptance criteria:
1. Baseline list of proxy-only signals is recorded.
2. All active families/charts are enumerated in the audit.

### U1: CL3 Audit Channel
Goal: produce a constraint-derived rho channel without changing the pipeline result.

Deliverables:
1. `rho_constraint` and `rho_delta_metric` in pipeline snapshot.
2. Proof pack entries for constraint-derived rho and delta.
3. Guardrail labels that distinguish pipeline T00 vs constraint rho.

Acceptance criteria:
1. Constraint rho is emitted for at least one metric adapter path.
2. CL3 delta is visible and labeled as geometry-derived when available.

### U2: Universal Congruence Meta
Goal: ensure congruence metadata is consistent across pipeline, bricks, and panels.

Deliverables:
1. `curvatureMeta` and `stressMeta` present in pipeline snapshot.
2. Brick endpoints return congruence metadata.
3. Panels and proof views display congruence status consistently.

Acceptance criteria:
1. All panel views show `source`, `congruence`, and `proxy` labels.
2. Metric-derived data is labeled `conditional` or `geometry-derived` where valid.

### U3: Derivative Coverage for VdB and Non-Alcubierre Surfaces
Goal: ensure derivative-rich paths exist across all active surfaces.

Deliverables:
1. VdB `B(r)` derivatives on every active surface when `gammaVdB > 1`.
2. Non-Alcubierre paths expose metric-derived `warp.metric.T00.*` consistently.

Acceptance criteria:
1. VdB region-II diagnostics change with `tildeDelta`.
2. Metric T00 refs are emitted for all active families/charts.

### U4: Consolidated Congruence Report
Goal: publish a spec-grade report aligned to the runtime.

Deliverables:
1. Updated `docs/warp-congruence-audit.md`.
2. A unified report that lists proxy-only, conditional, and geometry-derived signals.
3. A closure checklist for remaining CL4 gaps.

Acceptance criteria:
1. Report references the exact runtime signals and their sources.
2. Remaining gaps are explicit and testable.

## Required Verification (per `WARP_AGENTS.md`)
- `npm run math:report`
- `npm run math:validate`
- Required tests listed in `WARP_AGENTS.md`
- `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Definition of Done
1. CL3 delta is constraint-derived and visible in telemetry.
2. Congruence metadata is universal across panels and brick endpoints.
3. VdB derivative evidence exists for all active surfaces.
4. The consolidated report is complete and references runtime fields only.
