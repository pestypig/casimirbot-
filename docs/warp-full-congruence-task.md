# Warp Full Congruence Task

Status: in_progress  
Owner: dan  
Date: 2026-02-10  
Scope: Close remaining runtime CL3/CL4 gaps for warp bubble congruence.

## Problem Statement
The remaining blockers to full congruence are:
- Some runtime pipeline/brick paths are still proxy-backed.
- Full constraint-closed geometry coverage across all warp families/charts is not complete.
- VdB derivative-rich modeling is improved but not universal across every active path/surface.

## Goal
Reach full runtime congruence for the warp bubble solve by making guardrail and UI/runtime decisions rely on geometry-derived, constraint-closed quantities across all active families and charts.

Target ladder outcome:
- CL1/CL2: chart-explicit ADM coverage for all active families.
- CL3: constraint-closed stress-energy path used in runtime decisions.
- CL4: guardrail inputs and panel labels sourced from geometry-derived paths by default, with proxy paths explicitly non-authoritative.

## Kickoff State (Current)
- Baseline complete: P1-P7 upgrades documented in `docs/warp-congruence-build-plan.md`.
- Remaining closure tracked in `docs/warp-full-congruence-closure-task.md`.
- This task remains the umbrella record for full-congruence definition-of-done.
- Scientific congruence task plan captured in `docs/warp-scientific-congruence-task.md`.

## Non-Goals
- No new feasibility claims.
- No changes to strict traversal defaults (`allowedCL=CL4`, `allowProxies=false`).
- No silent fallback from geometry-derived to proxy for hard decisions.

## Success Criteria
- All runtime hard guardrails evaluate from geometry-derived or constraint-derived inputs.
- `warp.metric.T00` is available and chart-tagged for every active warp family path.
- VdB Region II derivatives (`B'`, `B''`) participate in every VdB runtime path where `gammaVdB > 1`.
- UI surfaces show contract status from `/api/helix/gr-constraint-contract` for guardrail truth.
- Required warp/GR tests pass and Casimir verification returns PASS with integrity OK.

## Phase Plan

## F1: Proxy Path Inventory and Classification
CL target: CL4

Deliverables:
- Inventory of proxy-backed runtime fields used by guardrails and bricks.
- Classification per field: `authoritative`, `fallback-only`, `diagnostic-only`.
- Blocking policy for proxy use in strict mode.

Acceptance criteria:
- Every guardrail input is mapped to a source class.
- Any strict-mode hard guardrail path using proxy input is flagged fail with reason.

Primary files:
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`

## F2: Constraint-Closed Runtime Core
CL target: CL3

Deliverables:
- Runtime path uses ADM-derived `K_ij` and Hamiltonian-constraint-consistent `rho_E` where required.
- CL3 delta (`rho_constraint` vs metric `T00`) enforced for decisioning.
- Residual policy thresholds logged per chart/family.

Acceptance criteria:
- No hard guardrail in strict mode passes using proxy-only stress-energy.
- CL3 residuals are emitted and policy-evaluated in every active runtime pass.

Primary files:
- `server/energy-pipeline.ts`
- `tools/warpViability.ts`
- `server/helix-proof-pack.ts`
- `docs/warp-geometry-cl3-constraint-first-path.md`

## F3: Full Family/Chart Coverage
CL target: CL1-CL3

Deliverables:
- Active families all emit chart-tagged metric adapter snapshots:
  - `alcubierre`
  - `natario`
  - `natario_sdf`
  - `irrotational`
  - `vdb`
- Family-specific canonical `metricT00Ref` guaranteed.
- Strict gating for unknown/unspecified chart contracts.

Acceptance criteria:
- Each active family path produces a non-empty chart contract.
- `metricT00Ref` is canonical and present for each family path.

Primary files:
- `modules/warp/natario-warp.ts`
- `modules/warp/warp-metric-adapter.ts`
- `server/energy-pipeline.ts`
- `docs/warp-metric-adapter.md`
- `docs/warp-geometry-cl1-cl2-chart-contract.md`

## F4: Universal VdB Derivative Path
CL target: CL2-CL3

Deliverables:
- VdB Region II derivative diagnostics always computed where VdB is active.
- Two-wall signature support propagated to guardrails, proofs, and panel diagnostics.
- Remove scalar-only acceptance paths for `gammaVdB > 1` in strict mode.

Acceptance criteria:
- For `gammaVdB > 1`, missing derivative support forces strict fail.
- VdB guardrail decisions vary with derivative evidence, not scalar band alone.

Primary files:
- `server/energy-pipeline.ts`
- `tools/warpViability.ts`
- `server/helix-core.ts`
- `docs/warp-geometry-vdb-region-ii-method.md`

## F5: UI Contract Authority
CL target: CL4 labeling and operator truth

Deliverables:
- Guardrail-facing panels consume contract endpoint status as authoritative.
- Pipeline-only statuses shown as telemetry context, not authoritative contract state.
- Explicit source text in panel UIs: `contract`, `metric-derived`, `proxy-only`.

Acceptance criteria:
- QI, guardrail, and proof panels show contract state and source.
- No panel implies CL4 congruence when contract state is `proxy` or `missing`.

Primary files:
- `client/src/hooks/useGrConstraintContract.ts`
- `client/src/components/QiWidget.tsx`
- `client/src/components/QiAutoTunerPanel.tsx`
- `client/src/components/DriveGuardsPanel.tsx`
- `client/src/components/TimeDilationLatticePanel.tsx`
- `client/src/components/FrontProofsLedger.tsx`

## F6: Certification Closure
CL target: CL3-CL4

Deliverables:
- Updated audit and guardrail map reflecting closed gaps.
- Required GR/warp tests green.
- Casimir verification PASS with certificate integrity OK.

Acceptance criteria:
- `docs/warp-congruence-audit.md` updated to reflect final status.
- `docs/warp-geometry-cl4-guardrail-map.md` and `.json` updated and consistent.
- Verification outputs captured and linked in the final report.

Primary files:
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`
- `artifacts/training-trace.jsonl`

## Build Order
1. F1
2. F2
3. F3
4. F4
5. F5
6. F6

Dependencies:
- F2 depends on F1 source classification.
- F4 depends on F3 family/chart completeness.
- F6 depends on all prior phases.

## Required Verification Per Patch
- `npm run math:report`
- `npm run math:validate`
- WARP_AGENTS required tests
- `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Definition of Done
- Runtime hard decisions are geometry/constraint-derived across active families.
- VdB derivative path is universal where applicable.
- Contract endpoint is authoritative for operator-facing guardrail status.
- Audit and guardrail map both show no unresolved hard congruence blockers.
