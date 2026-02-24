# Warp Readiness Adjudication R05 (2026-02-24)

## Scope
Post-patch readiness adjudication run **R05** for full-solve campaign status using only post-patch artifacts and command outputs.

Boundary statement:
"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs reviewed
- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json`
- `artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json`
- `artifacts/research/full-solve/campaign-action-plan-30-60-90-2026-02-24.json`
- `scripts/warp-full-solve-campaign.ts`
- `scripts/warp-publication-bundle.ts`
- `tests/warp-full-solve-campaign.spec.ts`
- `tests/warp-publication-bundle.spec.ts`

## Gate counts and adjudication
From `campaign-gate-scoreboard-2026-02-24.json`:
- PASS: 0
- FAIL: 0
- UNKNOWN: 0
- NOT_READY: 8
- NOT_APPLICABLE: 1 (G5)
- Decision label: `NOT_READY`

Readiness rule check:
- READY requires decision `REDUCED_ORDER_ADMISSIBLE`: **not satisfied**
- READY requires FAIL=0: satisfied
- READY requires UNKNOWN=0: satisfied
- READY requires NOT_READY=0: **not satisfied**

**R05 Verdict: NOT_READY**

## G5 NOT_APPLICABLE policy citation
`G5` remains `NOT_APPLICABLE` under reduced-order campaign policy:
- Executive translation states G5 is out of scope for reduced-order campaign policy.
- Campaign gate-map logic sets G5 to `NOT_APPLICABLE` with source `campaign.policy.reduced-order`.

## Blocking gates (exact producers and consumers)
Global first fail is `G0`; blocking set is `G0,G1,G2,G3,G4,G6,G7,G8`.

| Gate | Blocking reason (from artifacts) | Producer (file/function) | Consumer (file/function) | Minimal patch set to close blocker |
|---|---|---|---|---|
| G0 | No GR loop run artifacts found. | `scripts/warp-full-solve-campaign.ts::runWave` and `buildGateMap` emit/assess run artifacts. | `scripts/warp-publication-bundle.ts::buildPublicationBundle` requires wave raw outputs and evidence packs. | Ensure each wave emits valid `run-*-raw-output.json` with non-empty `result.attempts` and rerun campaign. |
| G1 | `initial_solver_status` missing. | `scripts/warp-full-solve-campaign.ts::buildGateMap` reads `attempt.initial.status`. | `scripts/warp-full-solve-campaign.ts::collectRequiredSignals` + gate missing-signal reconciliation consumes for G1/G6. | Populate `attempt.initial.status` (CERTIFIED/other explicit) in GR loop evaluator payload. |
| G2 | `evaluation_gate_status` missing. | `scripts/warp-full-solve-campaign.ts::buildGateMap` reads `attempt.evaluation.gate.status`. | `buildGateMissingSignalMap`/`collectRequiredSignals` and G7 stability checks consume it. | Emit deterministic evaluator gate status (`pass`/`fail`) for every usable attempt. |
| G3 | `certificate_hash` and `certificate_integrity` missing. | `scripts/warp-full-solve-campaign.ts::buildGateMap` reads `attempt.evaluation.certificate`. | G6 evidence completeness and publication/report consumers require certificate metadata. | Attach evaluator certificate object with hash + `integrityOk` in attempt payloads. |
| G4 | Hard constraints `FordRomanQI`, `ThetaAudit` missing. | `scripts/warp-full-solve-campaign.ts::buildGateMap` resolves constraints map from evaluator constraints array. | Campaign decisioning and first-fail derivation consume G4 status. | Emit required hard-constraint entries with explicit statuses in evaluator constraints payload. |
| G6 | Persisted raw output exists but evaluator signals missing (fail-closed). | `scripts/warp-full-solve-campaign.ts::buildGateMap` + raw artifact existence check. | `scripts/warp-publication-bundle.ts::buildPublicationBundle` and campaign reports consume persisted artifacts/signals relation. | Backfill evaluator payload completeness (`initial`, `gate`, `certificate`, hard constraints, provenance fields) for persisted runs. |
| G7 | Stability signal not available/insufficient repeated runs with gate status. | `scripts/warp-full-solve-campaign.ts::buildGateMap` G7 branch compares repeated run gate statuses. | `deriveCampaignDecision` consumes aggregate gate statuses across waves. | For C/D, persist >=2 runs each with complete `evaluation.gate.status`; rerun wave all. |
| G8 | Replication parity inputs unavailable (constraints payload missing for wave D parity checks). | `scripts/warp-full-solve-campaign.ts::buildGateMap` G8 branch compares repeated constraint payloads. | Aggregate gate status and first-fail/action-plan consumers use G8. | For wave D, produce replicated runs with complete hard-constraint payloads and matching schema. |

## Command-backed evidence summary
- Campaign command outputs show decision `NOT_READY` and counts with `NOT_READY=8`.
- Vitest required suites passed.
- Ultimate readiness check, evidence pack, and publication bundle all returned `ok: true`.
- Casimir verification returned `PASS` with certificate hash and integrity OK.
- Training trace export succeeded.

## Final adjudication for R05
Within this reduced-order framework, the full-solve campaign is **NOT_READY** at R05 due to unresolved `NOT_READY` gates and missing evaluator-signal completeness across waves.
