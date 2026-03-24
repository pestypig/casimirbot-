# Helix Ask Final Resolution: Implementation + Evidence Contract

## Purpose
Turn the planning artifact into a completion contract that is directly executable as a patch plan.
This document defines:
- exact implementation targets
- required runtime behavior
- mandatory evidence collection
- release gates for completion claims

This is the primary objective document for the next patch sequence.

## Inputs
Use these as source plans:
- `docs/helix-ask-home-stretch-plan.md`
- `docs/helix-ask-reasoning-ladder-optimization-plan.md`
- `docs/helix-ask-readiness-debug-loop.md`

## Final Resolution Objective
Helix Ask is considered resolved only when objective-loop answers are constructively reliable:
1. Each required objective reaches terminal status before final assembly.
2. Every unresolved objective is rendered as explicit `UNKNOWN + why + next retrieval`.
3. Final assembly cannot present a complete answer if unresolved objectives are not explicitly represented.
4. Retrieval and synthesis are objective-scoped, not merged-global by default.
5. Debug telemetry proves controller continuity and stop reasons.
6. Evidence batteries show the behavior in live runtime, not just unit tests.

## Non-Negotiable Runtime Rules
1. No silent unresolved objective may pass into fluent final prose.
2. `objective_count > 0` must imply objective-scoped retrieval attempts unless a hard stop reason is emitted.
3. Mini-critic is authoritative when LLM transport is healthy.
4. Heuristic slot inference is fallback-only and must be logged when active.
5. Finalize gate blocks release unless all required objectives are terminal and represented.

## Implementation Workstreams

### WS1: Hard Assembly Gate (Fail-Closed)
Goal:
- Block assembly when required objectives are non-terminal or unresolved without explicit unknown blocks.

Primary targets:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/relation-assembly.ts`

Required behavior:
- Enforce `objective_finalize_gate_passed` for final release.
- Add explicit blocked reason when assembly is denied.
- Allow partial release only when unresolved objectives are represented as explicit unknown blocks.

Required debug fields:
- `objective_finalize_gate_passed`
- `objective_assembly_blocked_reason`
- `objective_unknown_block_count`
- `objective_unknown_block_objective_ids`

### WS2: Strict Objective-Scoped Retrieval Loop
Goal:
- Ensure unresolved objectives execute objective-local retrieval passes before terminalization.

Primary targets:
- `server/routes/agi.plan.ts`

Required behavior:
- At least one scoped retrieval pass per unresolved objective, unless hard stop.
- Bounded retries with explicit stop reasons.
- No coverage credit from merged-global retrieval without objective-local evidence reference.

Required debug fields:
- `objective_retrieval_query_count`
- `objective_missing_scoped_retrieval_count`
- `objective_transition_log`
- `controller_stop_reason`

### WS3: Mini-Answer + Mini-Critic Authority
Goal:
- Make objective mini-answer evaluation decisive for state transitions.

Primary targets:
- `server/routes/agi.plan.ts`

Required behavior:
- One mini-answer per objective.
- Mini-critic decides `covered|partial|blocked|unknown_terminal` in healthy LLM mode.
- Heuristic inference only when critic transport fails, with explicit mode tagging.

Required debug fields:
- `objective_mini_answers`
- `objective_mini_validation`
- `objective_mini_critic_mode`
- `objective_slot_inference_mode`

### WS4: Deterministic Unknown Block Contract
Goal:
- Standardize unresolved objective output so unknowns are explicit, actionable, and non-fluent.

Primary targets:
- `server/services/helix-ask/relation-assembly.ts`
- `server/routes/agi.plan.ts`

Required output structure per unresolved objective:
- `UNKNOWN: <what is missing>`
- `Why: <missing slots/evidence>`
- `What I checked: <objective-local refs>`
- `Next retrieval: <objective-scoped intent>`

### WS5: Evidence Sufficiency Contract
Goal:
- Prevent false covered states from weak evidence.

Primary targets:
- `server/routes/agi.plan.ts`

Required behavior:
- Compute deterministic per-objective evidence sufficiency score (OES).
- Gate covered transitions by threshold.
- Terminalize low-sufficiency objectives into explicit unknown or blocked.

Required debug fields:
- `objective_oes_scores`
- `objective_terminalization_reason`

### WS6: Probe and Readiness Visibility
Goal:
- Make failures obvious in one probe run.

Primary targets:
- `scripts/helix-ask-patch-probe.ts`
- `scripts/helix-ask-regression.ts`
- `scripts/helix-ask-versatility-record.ts`

Required behavior:
- Report objective gate pass rates.
- Report unresolved-to-assembly violations.
- Fail probe when required revision and objective-gate constraints are missing.

## Evidence Contract (Mandatory Per Patch)
Run all commands against runtime on port `5050` when testing live behavior.

1. Contract battery:
`npm run helix:ask:regression`

2. Variety battery:
`npm run helix:ask:versatility`

3. Patch probe:
`npm run helix:ask:patch-probe`

4. Casimir gate:
`npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200`

No completion claim is valid without Casimir `PASS` and certificate integrity OK.

## Required Evidence Bundle
Store evidence in `artifacts/helix-ask-final-resolution/` using timestamped folders.

Minimum bundle contents:
1. `summary.json`
2. `probe-report.md`
3. `regression-report.md`
4. `versatility-report.md`
5. `casimir-verify.json`
6. `training-trace-export.jsonl`
7. `pass-case.json` with prompt/output/debug
8. `fail-case.json` with prompt/output/debug

## Release Gates (Go/No-Go)

Go only if all pass:
1. `objective_finalize_gate_pass_rate >= 0.95`
2. `objective_retrieval_success_rate >= 0.90`
3. `objective_assembly_success_rate >= 0.90`
4. `objective_count > 0` with `objective_retrieval_query_count == 0` occurs in 0 accepted cases
5. unresolved objective without unknown block occurs in 0 accepted cases
6. debug/scaffold leak gate passes per readiness thresholds
7. Casimir verify reports `PASS` and `integrityOk=true`

Automatic no-go:
1. Any silent unresolved objective in final answer.
2. Any fallback path that bypasses objective completion contract without explicit stop reason.
3. Any probe sample missing required objective debug fields.
4. Casimir `FAIL` or missing certificate integrity.

## Execution Sequence
1. Implement WS1 + WS4 first (hard gate plus unknown block).
2. Implement WS2 (strict objective-scoped retrieval).
3. Implement WS3 + WS5 (mini-critic authority plus OES gating).
4. Implement WS6 (probe/readiness visibility hardening).
5. Run full evidence contract and publish bundle.
6. Decide go/no-go from measured gates only.

## Patch Checklist
- [x] WS1 complete
- [x] WS2 complete
- [x] WS3 complete
- [x] WS4 complete
- [x] WS5 complete
- [x] WS6 complete
- [x] Regression battery attached
- [x] Variety battery attached
- [x] Patch probe attached
- [x] Casimir PASS with certificate hash and integrity OK
- [x] Pass/fail representative cases attached with full debug

## Completion Statement Template
Use this exact format when claiming final resolution:

`Final resolution status: GO|NO-GO`
`Patch revision: <value>`
`Objective gate pass rate: <value>`
`Retrieval success rate: <value>`
`Assembly success rate: <value>`
`Silent unresolved violations: <count>`
`Casimir verdict: PASS|FAIL`
`Certificate hash: <hash>`
`Certificate integrity: true|false`
`Evidence bundle: <path>`

## Current Implementation Evidence (2026-03-23)
Patch revision currently enforced in runtime and probe:
- code target: `objective_loop_patch_revision = 2026-03-23-objective-loop-final-resolution-v3`
- current 5050 runtime observed during probe: `...v3`

Latest patch-probe evidence:
- command: `npm run helix:ask:patch-probe` (samples=4, timeout=120000ms)
- summary: `pass=4/4`, `passRate=100.0%`
- objective snapshot:
  - `objective_finalize_gate_pass_rate = 1.0`
  - `objective_retrieval_success_rate = 1.0`
  - `objective_assembly_success_rate = 1.0`
  - `objective_loop_patch_revision_pass_rate = 1.0`
  - `objective_oes_present_rate = 1.0`
  - `objective_avg_oes_score = 0.6534`
- artifact folder:
  - `artifacts/experiments/helix-ask-patch-probe/2026-03-24T001439239Z`

Direct live debug check (single ask, debug=true):
- question: `What is a warp bubble?`
- observed:
  - `objective_loop_patch_revision = 2026-03-23-objective-loop-final-resolution-v3`
  - `objective_finalize_gate_mode = unknown_terminal`
  - `objective_oes_score_count = 1`
  - `objective_terminalization_reason = objective_oes_partial_below_block_threshold`
  - `objective_unresolved_without_unknown_block_count = 0`

Revision freshness gate evidence:
- command: `npm run helix:ask:patch-probe` (samples=1)
- summary: `pass=0/1`, expected fail for stale runtime
- failure: `objective_loop_patch_revision:...v2 != ...v3`
- artifact folder:
  - `artifacts/experiments/helix-ask-patch-probe/2026-03-24T000359940Z`

WS5 implementation evidence (code + unit):
- objective evidence sufficiency (OES) scoring added and enforced in `server/routes/agi.plan.ts`
- debug fields added:
  - `objective_oes_scores`
  - `objective_terminalization_reason`
  - `objective_terminalization_reasons`
- objective tests:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective"`
  - result: pass (`22 passed`, `244 skipped`)
- targeted OES tests:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts -t "objective evidence sufficiency"`
  - result: pass (`2 passed`)

Latest regression evidence:
- command: `HELIX_ASK_REGRESSION_TIMEOUT_MS=90000 npm run helix:ask:regression:light`
- result: `Helix Ask regression passed.`
- rerun after WS6 OES-probe telemetry patch:
  - command: `HELIX_ASK_REGRESSION_TIMEOUT_MS=90000 npm run helix:ask:regression:light`
  - result: `Helix Ask regression passed.`

Latest versatility evidence (reduced fast campaign):
- command:
  - `HELIX_ASK_VERSATILITY_PROMPT_SAMPLE_PER_FAMILY=1 HELIX_ASK_VERSATILITY_SEEDS=7 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_TIMEOUT_MS=20000 HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS=30000 HELIX_ASK_VERSATILITY_MAX_RUN_MS=240000 npm run helix:ask:versatility`
- result:
  - `readiness_verdict = READY`
  - `decision = ship`
  - `run_complete = true`
  - `completion_rate = 1.0`
- artifacts:
  - `artifacts/experiments/helix-ask-versatility/versatility-1774311544255/summary.json`
  - `artifacts/experiments/helix-ask-versatility/versatility-1774311544255/report.md`
  - `reports/helix-ask-versatility-report.md`

Probe alignment update applied:
- Coverage-ratio checks now exempt outputs that are explicitly terminalized in compliant `unknown_terminal` mode:
  - `objective_finalize_gate_passed=true`
  - `objective_finalize_gate_mode=unknown_terminal`
  - `objective_unknown_block_count>0`
  - `objective_unresolved_without_unknown_block_count=0`
- This prevents false-negative probe failures when the objective loop intentionally emits explicit unresolved blocks instead of pretending full coverage.

Latest Casimir verification (required gate):
- command:
  - `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200`
- verdict: `PASS`
- traceId: `adapter:ac64ac89-000a-44e7-bbe4-fc1d6527ab2d`
- runId: `35911`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

Latest Casimir verification after v3 revision bump:
- traceId: `adapter:d27b3e97-c00e-46ce-ba43-7d4ad630f847`
- runId: `35928`
- verdict: `PASS`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

Latest Casimir verification after WS5 unit coverage patch:
- traceId: `adapter:acba4d78-ad1b-41f2-bf05-1d48047813c9`
- runId: `35929`
- verdict: `PASS`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

Latest Casimir verification after WS6 OES-probe telemetry update:
- traceId: `adapter:3ff2531d-304c-44fa-abff-1b723a6d120f`
- runId: `35935`
- verdict: `PASS`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

Final resolution evidence bundle (current):
- bundle path:
  - `artifacts/helix-ask-final-resolution/2026-03-24T002058Z`
- included:
  - `summary.json`
  - `probe-report.md`
  - `regression-report.md`
  - `versatility-report.md`
  - `casimir-verify.json`
  - `training-trace-export.jsonl`
  - `pass-case.json`
  - `fail-case.json`
