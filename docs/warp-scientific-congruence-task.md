# Warp Scientific Congruence Task

Status: planned  
Owner: dan  
Date: 2026-02-10  
Scope: Apply scientific congruence where it should apply, without changing pipeline defaults or forcing Needle Hull parameters.

## Problem Statement
We need a concrete, testable path that:
- Locks chart and observer contracts before comparing metrics.
- Uses geometry-derived quantities for guardrails when CL4 is claimed.
- Keeps pipeline-derived values as telemetry unless they are constraint-closed.
- Leaves Needle Hull papers as historical context, not runtime parameter authority.

## Goal
Deliver a strict-mode congruence path that is explicit about chart, observer, and normalization, and that uses constraint-closed quantities for hard decisions in all active warp families.

## Non-Goals
- No new feasibility claims.
- No pipeline default re-tuning.
- No retrofitting Needle Hull values into the runtime unless separately validated.

## Phase Plan

### S1: Chart and Observer Contract Lock
CL target: CL1-CL2

Deliverables:
- Each active family emits chart tag, observer tag, normalization tag.
- Hard guardrails require these tags in strict mode.

Acceptance criteria:
- Missing chart or observer tag causes strict fail for hard guardrails.
- Contract tags are visible in proof pack and diagnostics.

Primary files:
- `modules/warp/warp-metric-adapter.ts`
- `server/helix-proof-pack.ts`
- `tools/warpViability.ts`
- `docs/warp-geometry-cl1-cl2-chart-contract.md`

### S2: Geometry-Derived Canonical Signals
CL target: CL2-CL4

Deliverables:
- Canonical `theta_geom`, `K_ij`, and `rho_E` computed from `(alpha, beta, gamma)`.
- Proof pack keys for these values with source tags.

Acceptance criteria:
- `theta_geom` and `rho_E` available for every active family path.
- Strict guardrails use these values when present.

Primary files:
- `modules/warp/warp-metric-adapter.ts`
- `server/energy-pipeline.ts`
- `server/helix-proof-pack.ts`

### S3: Constraint-Closed Stress Energy
CL target: CL3

Deliverables:
- CL3 stress-energy gate uses Hamiltonian constraint where required.
- Pipeline `T00` labeled as proxy unless constraint-closed.

Acceptance criteria:
- Strict CL3 decisions never pass from proxy-only stress sources.
- Constraint residuals are emitted and source-tagged.

Primary files:
- `tools/warpViability.ts`
- `server/energy-pipeline.ts`
- `server/gr-evolve-brick.ts`
- `docs/warp-geometry-cl3-constraint-first-path.md`

### S4: VdB Functional Derivative Coverage
CL target: CL2-CL3

Deliverables:
- `B(r)` and its derivatives (`B'`, `B''`) used when `gammaVdB > 1`.
- VdB region II diagnostics drive strict guardrails.

Acceptance criteria:
- Strict runs with `gammaVdB > 1` hard-fail if derivative evidence missing.
- Guardrail output changes when `tildeDelta` changes (derivative sensitivity).

Primary files:
- `server/energy-pipeline.ts`
- `modules/warp/warp-metric-adapter.ts`
- `tools/warpViability.ts`
- `docs/warp-geometry-vdb-region-ii-method.md`

### S5: UI Authority and Telemetry
CL target: CL4

Deliverables:
- Panels show contract authority vs telemetry clearly.
- Proof pack is the canonical source for displayed telemetry.

Acceptance criteria:
- Guardrail-facing UI never implies CL4 congruence when source is proxy.
- Panels show chart/observer tags when present.

Primary files:
- `client/src/components/DriveGuardsPanel.tsx`
- `client/src/components/TimeDilationLatticePanel.tsx`
- `client/src/components/WarpProofPanel.tsx`
- `client/src/components/NeedleCavityBubblePanel.tsx`

### C6: Metric T00 Universalization
CL target: CL3-CL4

Deliverables:
- `warp.metric.T00.*` emitted for all active non-Alcubierre families and charts (Natario, VdB region II and IV).
- Metric T00 contract fields (`observer`, `normalization`, `unitSystem`, `contractStatus`, `contractReason`) present on every active path.

Acceptance criteria:
- Strict CL3 gate fails if any active path lacks metric T00 contract fields.
- Proof pack reports `metric_t00_contract_status=ok` for all active families/charts.

Primary files:
- `modules/warp/warp-metric-adapter.ts`
- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `server/helix-proof-pack.ts`

### C7: Metric-Derived Bricks
CL target: CL2-CL4

Deliverables:
- Curvature and stress-energy bricks gain metric-derived variants when adapters are available.
- Brick metadata explicitly labels `source` and `congruence` for UI and guardrails.

Acceptance criteria:
- Brick endpoints return `source=warp.metric.*` when adapters are active.
- UI panels display geometry-derived labels when those bricks are available.

Primary files:
- `server/curvature-brick.ts`
- `server/stress-energy-brick.ts`
- `server/helix-core.ts`
- `client/src/components/CurvatureSlicePanel.tsx`
- `client/src/components/EnergyFluxPanel.tsx`

### C8: Constraint-First Closure
CL target: CL3

Deliverables:
- Constraint-first rho_E path enforced for strict mode, including Natario forward mapping (X -> K_ij -> rho_E).
- Proxy-only pipeline T00 stays telemetry and is blocked for strict decisions.

Acceptance criteria:
- `cl3-rho-delta-guardrail` only passes when rho_E is constraint-derived.
- `natario-metric` emits forward rho_E when X is defined.

Primary files:
- `modules/dynamic/natario-metric.ts`
- `tools/warpViability.ts`
- `server/gr/constraint-evaluator.ts`
- `server/energy-pipeline.ts`

### C9: QI Sampling Window Coverage
CL target: CL4

Deliverables:
- QI strict mode enforces curvature-window invariants and sampling-time constraints across charts.
- Metric-derived rho sources are required for QI strict OK.

Acceptance criteria:
- `qi_strict_ok=false` if metric rho or curvature invariants are missing.
- QI guardrail exposes sampling-window diagnostics per chart.

Primary files:
- `server/energy-pipeline.ts`
- `server/gr/gr-constraint-network.ts`
- `tools/warpViability.ts`
- `client/src/components/QiWidget.tsx`

### C10: Congruence Audit Automation
CL target: CL4

Deliverables:
- Automated audit that reports coverage of metric-derived vs proxy-only signals across panels and endpoints.
- CI-visible report artifact for congruence coverage.

Acceptance criteria:
- Audit report includes per-panel and per-endpoint congruence status.
- Proxy-only signals are explicitly flagged in the report.

Primary files:
- `scripts/warp-congruence-audit.ts`
- `docs/warp-congruence-audit.md`

## Build Order
1. S1
2. S2
3. S3
4. S4
5. S5
6. C6
7. C7
8. C8
9. C9
10. C10

## Required Verification Per Patch
- `npm run math:report`
- `npm run math:validate`
- Required tests from `WARP_AGENTS.md`
- `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Definition of Done
- Strict-mode hard guardrails are geometry- and constraint-derived for all active families.
- VdB derivative path is enforced when `gammaVdB > 1`.
- UI truth is contract authoritative, and telemetry is labeled as proxy when applicable.
