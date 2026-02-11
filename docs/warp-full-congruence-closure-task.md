# Warp Full Congruence Closure Task

Status: complete (C0-C10 complete for scoped closure; long-tail universal coverage tracked separately)  
Owner: dan  
Date: 2026-02-10  
Scope: Close remaining runtime CL3/CL4 gaps after P1-P7.

## Problem Statement
Remaining blockers to full runtime congruence:
- Some runtime pipeline/brick paths are still proxy-backed.
- Full constraint-closed geometry coverage across all warp families/charts is not complete.
- VdB derivative-rich modeling is improved but not universal across every active path/surface.

## Goal
Finish the last-mile closure so strict runtime decisions are geometry/constraint-derived across active warp paths, with proxy values retained only as explicitly non-authoritative telemetry.

CL targets:
- CL2: complete derived-geometry coverage for active families/charts.
- CL3: constraint-closed stress-energy source for runtime gating.
- CL4: hard guardrails and panel truth sourced from contract/metric evidence.

## Inputs
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`
- `docs/warp-full-congruence-task.md`
- `docs/warp-congruence-build-plan.md`

## Non-Goals
- No new physical feasibility claims.
- No changes to strict traversal defaults (`allowedCL=CL4`, `allowProxies=false`).
- No hidden fallback from geometry-derived to proxy in hard-decision mode.

## Phase Plan

## C0: Baseline Lock and Gap Confirmation
CL target: CL4 audit integrity

Deliverables:
- Snapshot of unresolved gaps pulled from the audit/map.
- Explicit list of runtime surfaces still proxy-backed in hard-decision paths.
- Per-surface owner and closure criteria.

Acceptance criteria:
- Gap list is frozen and traceable to current docs and code pointers.
- Each unresolved item has a specific file-level closure target.

Status:
- Completed.

## C1: Metric-Only Runtime Source Completion
CL target: CL3

Deliverables:
- Ensure active non-Alcubierre paths expose canonical `warp.metric.T00` source/ref.
- Ensure CL3 gate path consumes metric/constraint source in strict mode.
- Guarantee chart tags are present for each active runtime metric source.

Acceptance criteria:
- In strict mode, CL3 hard decisions cannot pass with proxy-only T00 source.
- `metricT00Ref` is present and non-empty for active family paths in runtime state.

Primary files:
- `server/energy-pipeline.ts`
- `tools/warpViability.ts`
- `modules/warp/natario-warp.ts`
- `modules/warp/warp-metric-adapter.ts`

Status:
- Completed.

## C2: Universal VdB Derivative Enforcement
CL target: CL2-CL3

Deliverables:
- Enforce derivative evidence (`B'`, `B''`, region-II/IV support) for active VdB strict decisions.
- Remove remaining scalar-only acceptance branches for active VdB paths in strict mode.
- Emit explicit reason codes for derivative insufficiency.

Acceptance criteria:
- For strict runs with `gammaVdB > 1`, missing derivative support hard-fails.
- VdB outcomes vary with derivative-rich inputs (for example `tildeDelta`) rather than scalar band only.

Primary files:
- `server/energy-pipeline.ts`
- `tools/warpViability.ts`
- `server/helix-proof-pack.ts`

Status:
- Completed.

## C3: Hard-Decision Proxy Elimination
CL target: CL4

Deliverables:
- Verify each HARD guardrail decision path has geometry/constraint source.
- Downgrade proxy-backed paths to telemetry-only when strict mode is active.
- Add/expand tests that assert strict rejection of proxy-backed hard-decision inputs.

Acceptance criteria:
- No HARD guardrail returns pass in strict mode using proxy-only source.
- Test coverage exists for source gating failures and pass paths.

Primary files:
- `tools/warpViability.ts`
- `tests/warp-viability.spec.ts`
- `tests/proof-pack-strict-parity.spec.ts`
- `tests/lattice-probe-guardrails.spec.ts`

Status:
- Completed.

## C4: UI/Proof Contract Hard Authority Sweep
CL target: CL4 operator truth

Deliverables:
- Ensure remaining guardrail-facing panels and proof surfaces use contract/metric source authority labels.
- Ensure proxy telemetry is visibly labeled and never presented as authoritative guardrail truth.
- Align panel text with strict source semantics.

Acceptance criteria:
- Guardrail-facing UI consistently displays `contract`/`metric-derived`/`proxy-only` source.
- No panel wording implies CL4 congruence when source is proxy or missing.

Primary files:
- `client/src/components/DriveGuardsPanel.tsx`
- `client/src/components/TimeDilationLatticePanel.tsx`
- `client/src/components/FrontProofsLedger.tsx`
- `client/src/components/WarpProofPanel.tsx`
- `client/src/components/NeedleCavityBubblePanel.tsx`

Status:
- Completed.

## C5: Audit + Certification Closure
CL target: CL3-CL4

Deliverables:
- Update audit/map docs with post-closure status.
- Run required GR/warp verification workflow.
- Capture PASS verdict and certificate integrity details.

Acceptance criteria:
- `docs/warp-congruence-audit.md` and CL4 map show closure status consistent with runtime behavior.
- Casimir verification returns PASS with integrity OK.

Primary files:
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`

Status:
- Completed.

## C6: VdB Full ADM Adapter Coverage
CL target: CL2

Deliverables:
- Implement full VdB adapter semantics where `gamma_ij = B(r)^2 delta_ij` with chart-tagged runtime payloads.
- Compute adapter-level VdB geometry diagnostics that include `B`, `B'`, `B''` coupling in divergence/extrinsic terms.
- Ensure strict theta pathways for VdB rely on metric-derived diagnostics across active VdB surfaces.

Acceptance criteria:
- VdB strict runs expose charted metric diagnostics that change with `tildeDelta` and derivative terms.
- VdB theta guardrail inputs are metric-derived (or strict-fail) on active strict paths.

Primary files:
- `server/energy-pipeline.ts`
- `modules/warp/warp-metric-adapter.ts`
- `tools/warpViability.ts`
- `tests/pipeline-ts-qi-guard.spec.ts`
- `tests/warp-viability.spec.ts`

Status:
- Completed.

## C7: Constraint-Closed Metric T00 Unification
CL target: CL3

Deliverables:
- Unify non-proxy `warp.metric.T00` derivation contract across active warp families/charts.
- Remove remaining ambiguity between metric-derived and injected/proxy stress sources in hard-decision paths.
- Preserve explicit provenance tags (`source`, `chart`, `family`) on CL3 gate inputs and outputs.

Acceptance criteria:
- Strict CL3 decisions never pass from proxy-only stress sources.
- Runtime CL3 source tags are present and stable for each active family.

Primary files:
- `server/energy-pipeline.ts`
- `tools/warpViability.ts`
- `server/helix-proof-pack.ts`
- `tests/warp-viability.spec.ts`
- `tests/proof-pack.spec.ts`

Status:
- Completed.

## C8: Contract Enforcement (Chart/Observer/Normalization)
CL target: CL3-CL4

Deliverables:
- Enforce explicit chart contract metadata on guardrail-relevant metric inputs.
- Enforce observer/normalization metadata on stress-energy quantities feeding hard guardrails.
- Add strict rejection reasons for missing contract metadata.

Acceptance criteria:
- Missing chart/observer/normalization metadata produces strict guardrail fail (not pass/proxy) on hard paths.
- Contract metadata is visible in proof pack and guardrail snapshots.

Primary files:
- `server/energy-pipeline.ts`
- `server/helix-proof-pack.ts`
- `server/helix-core.ts`
- `tests/proof-pack-strict-parity.spec.ts`
- `tests/lattice-probe-guardrails.spec.ts`

Status:
- Completed.

## C9: UI/Proof CL4 Authority Completion
CL target: CL4

Deliverables:
- Finish authority labeling across all guardrail-facing panels and proof surfaces.
- Ensure no guardrail-facing UI wording implies geometry congruence when source is proxy or missing.
- Keep strict-mode explanations consistent with backend failure reasons.

Acceptance criteria:
- All guardrail-facing panels show authoritative source state and strict failure reason parity.
- UI tests cover strict/proxy/missing authority branches for core panels.

Primary files:
- `client/src/components/TimeDilationLatticePanel.tsx`
- `client/src/components/WarpProofPanel.tsx`
- `client/src/components/NeedleCavityBubblePanel.tsx`
- `client/src/components/DriveGuardsPanel.tsx`
- `client/src/components/__tests__/warp-proof-ts-strict.spec.tsx`

Status:
- Completed.

## C10: Final Closure Audit + Certification
CL target: CL3-CL4

Deliverables:
- Finalize audit/map docs against runtime behavior after C6-C9.
- Re-run required verification workflow and publish certification snapshot.
- Record closure statement with remaining non-goal boundaries.

Acceptance criteria:
- `docs/warp-congruence-audit.md` and CL4 maps reflect final runtime truth.
- Required test workflow and Casimir verification are PASS with integrity OK.

Primary files:
- `docs/warp-congruence-audit.md`
- `docs/warp-geometry-cl4-guardrail-map.md`
- `docs/warp-geometry-cl4-guardrail-map.json`
- `docs/warp-full-congruence-closure-task.md`

Status:
- Completed.

## Progress Notes
- 2026-02-10: strict-mode FordRoman fallback boolean path is now blocked as proxy-only in runtime viability and lattice probe fallback guardrail resolver paths.
- 2026-02-10: CL3 metric provenance now emits chart/family details in runtime viability snapshot (`rho_delta_metric_chart`, `rho_delta_metric_family`).
- 2026-02-10: contract authority badges added to `WarpProofPanel` and `NeedleCavityBubblePanel`.
- 2026-02-10: strict-proxy rejection coverage added in `tests/warp-viability.spec.ts` and `tests/lattice-probe-guardrails.spec.ts`.
- 2026-02-10: VdB region-II fallback now rebuilds a charted metric adapter with finite-diff shift diagnostics and rehydrates `theta_geom`/`theta_metric_*` from adapter evidence.
- 2026-02-10: closure plan extended with C6-C10; C6 started for full VdB ADM adapter coverage and metric-derived theta enforcement across active VdB paths.
- 2026-02-10: verification complete (`math:report`, `math:validate`, required GR/warp tests, Casimir gate PASS).
- 2026-02-10: Casimir certificate status `GREEN`, hash `199cc38d772b45d8213fc6e5f020872589c37b2c5749b7bf286b671a1de4acec`, integrity `true`, trace/run `local:8148e19f-0904-4be2-931a-9c06b8419be5`.
- 2026-02-10: C6-C9 hardening synced to runtime/proof/UI and required tests passed (18/18 files from `WARP_AGENTS.md` list).
- 2026-02-10: C10 closure verification rerun PASS (`math:report`, `math:validate`, required GR/warp tests, Casimir gate PASS).
- 2026-02-10: Casimir certificate status `GREEN`, hash `199cc38d772b45d8213fc6e5f020872589c37b2c5749b7bf286b671a1de4acec`, integrity `true`, trace/run `local:8d9b3b67-2ec8-4ba6-9a1b-3f5488de7755`.
- 2026-02-10: Final post-doc verification PASS with certificate integrity OK, trace/run `local:38f543dc-116c-4dbc-b5b9-bfd98d6abdbe`.

## Build Order
1. C0
2. C1
3. C2
4. C3
5. C4
6. C5
7. C6
8. C7
9. C8
10. C9
11. C10

Dependencies:
- C1 depends on C0.
- C2 depends on C1 chart/source readiness.
- C3 depends on C1 and C2 source enforcement.
- C4 depends on C3 source semantics.
- C5 depends on all prior phases.
- C6 depends on C2 and C3 strict source semantics.
- C7 depends on C6 adapter coverage for active VdB paths.
- C8 depends on C7 source normalization and provenance contracts.
- C9 depends on C8 backend contract semantics.
- C10 depends on C6-C9 completion.

## Verification Requirements Per Patch
- `npm run math:report`
- `npm run math:validate`
- Required warp/GR tests from `WARP_AGENTS.md`
- `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`

## Definition of Done
- Strict runtime hard decisions are geometry/constraint-derived across active warp paths.
- VdB derivative-rich support is enforced where VdB is active.
- Guardrail-facing UI truth is contract/metric authoritative, with proxy values clearly non-authoritative.
- Audit, map, tests, and Casimir verification all agree with closure status.
