# Warp Definitive Viability Task

Status: complete (definitive statement: INADMISSIBLE under strict metric-derived sources)  
Owner: dan  
Date: 2026-02-10  
Scope: Convert calibrated pipeline telemetry into a metric-derived, constraint-closed viability statement without changing defaults.

## Purpose
Produce a definitive viability statement that is compliant with `WARP_AGENTS.md`: HARD constraints pass and the viability oracle returns `ADMISSIBLE`. The goal is not to retune the pipeline, but to make the runtime proof path geometry-derived and constraint-closed so any viability claim is defensible.

## Non-Goals
- No retuning of calibrated defaults or Needle Hull parameters.
- No new physical feasibility claims beyond the oracle verdict.
- No substitution of pipeline proxy values for metric-derived sources in strict mode.

## Inputs
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`
- `WARP_AGENTS.md`
- `docs/warp-geometry-congruence-report.md`

## Definitions
- Metric-derived: `warp.metricT00` or `rho_constraint` derived from ADM fields in a declared chart.
- Constraint-closed: Hamiltonian/Momentum constraint residuals are in-bounds for the active chart.
- Viability: `ADMISSIBLE` oracle status with all HARD guardrails passing.

## Phase Plan

### V0: Scope Freeze
Goal: lock the exact runtime surfaces and families that must be metric-derived.

Deliverables:
- Enumerated active families/charts in runtime (per pipeline state and proof pack).
- List of surfaces where `warp.metricT00` is missing or proxy-only.

Acceptance criteria:
- List is traceable to runtime sources (proof pack + pipeline snapshot).
- Each missing surface has a concrete owner file path.

Status:
- Complete (see `docs/warp-congruence-audit.md` + `docs/warp-panel-congruence-audit.md`).

### V1: Metric-Derived Coverage
Goal: ensure metric-derived stress and divergence diagnostics exist on all active families/charts.

Deliverables:
- `warp.metricT00` present for all active families/charts in strict mode.
- `theta_geom` present when metric adapter diagnostics are available.
- `metricT00Ref` and chart contract fields are non-empty on active paths.

Acceptance criteria:
- Strict mode cannot proceed with proxy-only T00.
- Proof pack shows `stress_meta_*` and `metric_t00_*` with `source=metric` for active paths.

Status:
- Complete for active strict paths (metric-derived `warp.metricT00` present; contract fields populated).

### V2: Constraint Closure
Goal: ensure constraint-derived rho is available and used for CL3 delta.

Deliverables:
- `rho_constraint` emitted for active metric-derived paths.
- `CL3_RhoDelta` uses metric-derived `warp.metricT00` (not proxy).

Acceptance criteria:
- `gr_rho_constraint_*` present with source tags.
- CL3 delta is computed against metric-derived stress in strict mode.

Status:
- Complete for metric-derived paths; `rho_constraint` and CL3 delta recorded in viability snapshot.

### V3: Strict Guardrail Enforcement
Goal: HARD guardrails cannot pass using proxy-only sources.

Deliverables:
- Strict mode rejects proxy sources for `ThetaAudit` and `FordRomanQI`.
- VdB strict paths require derivative evidence (`B'`, `B''`) when `gammaVdB > 1`.

Acceptance criteria:
- Hard guardrails pass only when metric-derived sources are present.
- Proxy-only paths are marked `proxy` and fail in strict mode.

Status:
- Complete (strict guardrails enforce metric-derived sources; proxy-only paths are blocked).

### V4: Oracle Run and Evidence Capture
Goal: run the viability oracle and capture evidence.

Deliverables:
- Oracle run output (status, constraints, certificate hash).
- Full verification workflow run per `WARP_AGENTS.md`.

Acceptance criteria:
- Oracle status is `ADMISSIBLE` and all HARD constraints pass.
- Casimir verify PASS with integrity OK.

Status:
- Complete. Oracle run captured in `reports/warp-viability-run-final.json`.
- Result: `status=INADMISSIBLE`.
- HARD fail: `FordRomanQI` (see constraints in report).
- SOFT fail: `TS_ratio_min`.
- Certificate hash: `7217703c52b4d30b2207b569e42faa38cbbfd38839f3981e813e90aba375d246`.
- Integrity: `true`.

### V5: Definitive Viability Statement
Goal: publish a definitive statement tied to runtime evidence.

Deliverables:
- Updated `docs/warp-congruence-audit.md` with viability status.
- A short statement noting whether the system is viable under strict metric-derived constraints.

Acceptance criteria:
- Statement references exact runtime sources and oracle status.
- Any remaining proxy-only paths are listed as excluded from the viability claim.

Status:
- Complete. Definitive statement recorded below.

## Required Verification
- `npm run math:report`
- `npm run math:validate`
- Required tests listed in `WARP_AGENTS.md`
- `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Definition of Done
1. Metric-derived T00 and constraint rho are present for all active families/charts.
2. Strict mode blocks proxy-only sources for HARD guardrails.
3. Viability oracle returns `ADMISSIBLE` and HARD constraints pass.
4. Final statement is documented in the audit with runtime evidence.

## Definitive Statement (current run)
The strict metric-derived viability run is **INADMISSIBLE**. The HARD guardrail `FordRomanQI`
fails under metric-derived sources, so the system cannot be claimed viable. The SOFT guardrail
`TS_ratio_min` also fails at the current calibrated defaults. Evidence: `reports/warp-viability-run-final.json`.
