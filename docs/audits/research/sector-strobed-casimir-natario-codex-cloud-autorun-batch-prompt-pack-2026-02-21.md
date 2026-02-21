# Sector-Strobed Casimir Natario Codex Cloud Autorun Batch Prompt Pack (2026-02-21)

Derived from:
- `docs/audits/research/sector-strobed-casimir-natario-research-ledger-2026-02-21.md`
- User research draft: "Sector-Strobed Casimir Tile Control Model for Natario Canonical Warp in CasimirBot"

Use this pack to implement proposal structures in bounded, replay-safe patches.

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Do not claim physical viability/admissibility from planning features.
2) Keep maturity honest: exploratory/reduced-order/diagnostic unless certificate evidence supports stronger claims.
3) Enforce fail-closed behavior on first failing HARD constraint.
4) Keep patch scope path-bounded to each prompt's allowed paths.
5) Maintain deterministic fail reasons and traceability metadata.

Mandatory verification gate after each patch:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix the first failing HARD constraint
- rerun verification until PASS

Always report:
- files changed
- behavior delta
- tests/checks run
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId
```

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Execute this full batch end-to-end without pause unless a hard blocker prevents continuation.

Primary source of truth:
- docs/audits/research/sector-strobed-casimir-natario-codex-cloud-autorun-batch-prompt-pack-2026-02-21.md
- docs/audits/research/sector-strobed-casimir-natario-research-ledger-2026-02-21.md

Objective:
Run Prompt 0 through Prompt 9 in strict order, one prompt scope per commit, including required checks and Casimir verification after each prompt.

Global rules:
1) Execute exactly in order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9.
2) Respect allowed paths; do not broaden scope.
3) If blocked, ship maximum safe additive subset, record deterministic TODOs, continue.
4) After each prompt, run prompt-specific checks and:
   npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
5) On FAIL, fix first failing HARD constraint and rerun until PASS.
6) Do not claim completion without final PASS and certificate integrity OK.

Per-prompt report block:
- prompt_id
- files_changed
- behavior_delta
- tests_or_checks_run
- casimir_verdict
- casimir_firstFail
- casimir_certificateHash
- casimir_integrityOk
- casimir_traceId
- casimir_runId
- commit_sha
- status (done|partial-blocked|blocked)
```

## Prompt 0: Coordinator and execution ledger

```text
Objective:
Create deterministic execution tracking for this prompt batch.

Allowed paths:
- reports/sector-strobed-casimir-natario-execution-ledger-2026-02-21.md (new)
- docs/audits/research/sector-strobed-casimir-natario-codex-cloud-autorun-batch-prompt-pack-2026-02-21.md

Requirements:
1) Add rows for Prompt 0..9 with status, commit hash, checks, and Casimir verify metadata.
2) Define lanes:
   - lane_schema_contract
   - lane_control_planner
   - lane_scheduler_guardrails
   - lane_helix_tooling
   - lane_proof_contract
   - lane_validation
3) Add deterministic done checklist per prompt.

Checks:
- casimir verify command

Done criteria:
- Execution ledger is ready for replay-auditable batch tracking.
```

## Prompt 1: Shared schema contract for sector control plans

```text
Objective:
Add a typed shared contract for sector strobing control plans and rationale payloads.

Allowed paths:
- shared/schema.ts
- shared/helix-ask-envelope.ts
- tests (new or existing schema tests)

Requirements:
1) Add `sectorControlPlanSchema` and exported type.
2) Required fields:
   - mode
   - timing (strobeHz, sectorPeriod_ms, TS_ratio, tauLC_ms, tauPulse_ms)
   - allocation (sectorCount, concurrentSectors, negativeFraction, negSectors, posSectors)
   - duty (dutyCycle, dutyBurst, dutyEffective_FR, dutyShip)
   - constraints (FordRomanQI, ThetaAudit, TS_ratio_min, VdB_band, grConstraintGate)
   - objective, maturity, notes
3) Add `sectorControlRationaleSchema` for equation/risk text and citations.
4) Preserve backward compatibility for existing ask envelope fields.

Checks:
- npm run check
- targeted schema tests
- casimir verify command

Done criteria:
- Sector-control outputs validate under shared schema and compile cleanly.
```

## Prompt 2: Sector control planner module

```text
Objective:
Implement first planner slice for sector allocation under guardrail-aware constraints.

Allowed paths:
- server/control/sectorControlPlanner.ts (new)
- server/control/index.ts (if needed)
- tests/sector-control-planner.spec.ts (new)

Requirements:
1) Implement planner entrypoint:
   - build target descriptor
   - assign negative/payback sectors
   - compute dutyEffective_FR from burst and concurrency
2) Enforce hard fail-closed on first failing hard guardrail.
3) Emit deterministic `firstFail` reason and stable plan ordering.
4) Keep planner maturity at diagnostic unless certifying evidence is present.

Checks:
- npx vitest run tests/sector-control-planner.spec.ts
- casimir verify command

Done criteria:
- Planner returns deterministic, schema-valid plans and blocks on hard failures.
```

## Prompt 3: Scheduler and guardrail adapters

```text
Objective:
Wire planner decisions to phase scheduling, QI monitor, and clocking metrics.

Allowed paths:
- server/energy/phase-scheduler.ts
- server/qi/qi-monitor.ts
- server/qi/qi-bounds.ts
- shared/clocking.ts
- server/control/sectorControlPlanner.ts
- tests/pipeline-ts-qi-guard.spec.ts

Requirements:
1) Add adapter hooks for:
   - phase offsets / role assignment
   - QI bound checks by configured sampler/tau
   - TS ratio calculation and threshold gating
2) Ensure monotonic QI behavior w.r.t tau in tests.
3) Ensure planner consumes canonical timing fields and not UI-only aliases.

Checks:
- npx vitest run tests/pipeline-ts-qi-guard.spec.ts
- targeted new adapter tests
- casimir verify command

Done criteria:
- Planner decisions are computed from live scheduler/QI/clocking inputs with test coverage.
```

## Prompt 4: Helix tool registration and routing

```text
Objective:
Expose sector planning through Helix Ask with explicit tool routing.

Allowed paths:
- server/skills/physics.warp.sector-control.plan.ts (new)
- server/routes/agi.plan.ts
- server/helix-core.ts
- tests/helix-ask-routing.spec.ts
- tests/helix-ask-modes.spec.ts

Requirements:
1) Add tool spec/handler:
   - name: physics.warp.sector_control.plan
   - input: mode + optional overrides
   - output: sectorControlPlanSchema
2) Register tool in default tool registry.
3) Add routing intent for sector/strobing/control-plan queries.
4) Enforce allowTools behavior and deterministic tool_not_allowed errors.

Checks:
- npx vitest run tests/helix-ask-routing.spec.ts tests/helix-ask-modes.spec.ts
- casimir verify command

Done criteria:
- Helix Ask can call sector-control planning with bounded routing and stable contracts.
```

## Prompt 5: Proof and supplement contract wiring

```text
Objective:
Make sector-control outputs visible in proof/supplement lanes with maturity-safe language.

Allowed paths:
- server/helix-proof-pack.ts
- server/services/planner/supplements.ts
- shared/helix-ask-envelope.ts
- tests/helix-ask-answer-artifacts.spec.ts

Requirements:
1) Add sector-control evidence block:
   - TS_ratio
   - QI margin ratio
   - guardrail pass/fail map
   - firstFail (if any)
2) Add supplement handling for sector-control packet without replacing warp viability authority.
3) Keep explicit certifying=false language unless certificate status is admissible and integrity true.

Checks:
- npx vitest run tests/helix-ask-answer-artifacts.spec.ts
- casimir verify command

Done criteria:
- Helix responses include structured sector-control evidence with deterministic guardrail status.
```

## Prompt 6: Unit and integration validation sweep

```text
Objective:
Add regression tests for scheduler math, planner determinism, and ask integration.

Allowed paths:
- tests/sector-control-planner.spec.ts
- tests/warp-sector-control.spec.ts (new)
- tests/helix-ask-routing.spec.ts
- tests/helix-ask-modes.spec.ts
- tests/pipeline-ts-qi-guard.spec.ts

Requirements:
1) Add property checks:
   - concurrency cap respected
   - dutyEffective_FR mapping correctness
   - deterministic firstFail on hard violations
2) Add integration test:
   - ask query routes to sector-control tool path
3) Add negative test:
   - QI violation forces fail-closed downgrade.

Checks:
- npx vitest run <all touched test files>
- casimir verify command

Done criteria:
- Touched behavior has deterministic regression coverage.
```

## Prompt 7: Docs and runbook closure for operators

```text
Objective:
Publish operator-facing docs for the new sector-control planning lane.

Allowed paths:
- docs/warp-console-architecture.md
- docs/warp-llm-contracts.md
- docs/runbooks/helix-ask-debugging.md
- docs/audits/research/sector-strobed-casimir-natario-research-ledger-2026-02-21.md

Requirements:
1) Document the new tool contract and intended diagnostic maturity.
2) Add troubleshooting for firstFail categories (QI, TS_ratio, ThetaAudit, GR gate).
3) Add explicit "not a viability certificate" language for planning outputs.

Checks:
- casimir verify command

Done criteria:
- Operator docs are consistent with runtime behavior and maturity policy.
```

## Prompt 8: Proposal integration structure

```text
Objective:
Integrate sector-control workstream into proposal execution structures and prompt presets.

Allowed paths:
- shared/proposals.ts
- server/services/proposals/prompt-presets.ts
- server/routes/proposals.ts
- client/src/lib/agi/proposals.ts
- tests/proposal-job-runner.spec.ts

Requirements:
1) Add proposal kind/preset for sector-strobed control implementation.
2) Include required evidence fields (guardrail status, maturity, trace refs).
3) Preserve backward compatibility for existing proposal records.

Checks:
- npx vitest run tests/proposal-job-runner.spec.ts
- casimir verify command

Done criteria:
- Proposal pipeline can generate and track this implementation lane deterministically.
```

## Prompt 9: Final readiness report

```text
Objective:
Publish decision-grade readiness status for this implementation wave.

Allowed paths:
- reports/sector-strobed-casimir-natario-readiness-report-2026-02-21.md (new)
- reports/sector-strobed-casimir-natario-execution-ledger-2026-02-21.md
- docs/audits/research/sector-strobed-casimir-natario-research-ledger-2026-02-21.md

Requirements:
1) Summarize Prompt 0..9 completion with commit hashes and artifacts.
2) Separate:
   - runtime-enforced guarantees
   - doc/planning guarantees
   - remaining blockers
3) Include final Casimir verification block:
   - verdict
   - firstFail
   - certificateHash
   - integrityOk
   - traceId
   - runId
4) State GO/NO-GO for next wave with maturity rationale.

Checks:
- casimir verify command

Done criteria:
- Report is replay-auditable and ready for execution handoff.
```

## Suggested run order

1. `Prompt 0`
2. `Prompt 1`
3. `Prompt 2`
4. `Prompt 3`
5. `Prompt 4`
6. `Prompt 5`
7. `Prompt 6`
8. `Prompt 7`
9. `Prompt 8`
10. `Prompt 9`
