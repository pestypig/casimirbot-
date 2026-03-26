# Helix Ask: Codex-Aligned Checklist Status

Date: 2026-03-25  
Owner: Helix Ask loop/runtime team  
Scope: objective loop, assembly/finalization, event semantics, fallback behavior, plan-vs-answer boundaries

## Purpose

This document is the working source of truth for:

1. What we mean by each Codex-aligned checklist item.
2. What code paths and tests are the canonical references.
3. Current implementation status in Helix Ask.
4. Remaining divergence, prioritized next steps, and acceptance criteria.

This prevents drift between prompt-level intent and runtime behavior.

## Canonical References

### Codex clone references (behavior target)

Use these as the technical baseline for semantics:

- `external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs`
- `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs`
- `external/openai-codex/codex-rs/app-server/src/codex_message_processor.rs`
- `external/openai-codex/codex-rs/app-server/src/server_request_error.rs`
- `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs`
- `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs`

### Helix Ask implementation references (current system)

- `server/routes/agi.plan.ts`
- `docs/helix-ask-reasoning-ladder-optimization-plan.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `scripts/helix-ask-regression.ts`
- `scripts/helix-ask-versatility-record.ts`
- `scripts/helix-ask-patch-probe.ts`

## Repo Governance Gates (From AGENTS/WARP_AGENTS/AGENT_PLAYBOOK)

- Casimir verification is a completion gate for code/config patches:
  - Adapter path: `POST /api/agi/adapter/run`
  - CLI path: `npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export`
  - Completion claims require `PASS` plus certificate hash/integrity status when emitted.
- Helix Ask routing/scaffold/fallback/output-cleaning changes must run the readiness loop:
  - `docs/helix-ask-readiness-debug-loop.md`
  - include contract battery + variety battery + probability scorecard + representative pass/fail artifacts.
- Warp/GR patches must satisfy `WARP_AGENTS.md` constraints and required tests, and must not claim physical viability without HARD-constraint pass and viability `ADMISSIBLE`.
- Deterministic G4 debugging should follow `AGENT_PLAYBOOK.md` investigation flow (Atlas retrieval, first-divergence, one-stage patch discipline).

## Definitions (Must Stay Stable)

- **Terminal validator**: a hard post-processing gate that blocks finalization if output is weak, scaffold-leaky, or fails objective integrity.
- **Plan stream**: planner/objective scaffolding deltas and metadata (not user-facing answer text).
- **Answer stream**: final user-facing content only.
- **Schema-repair retry**: one or more constrained repair attempts when stage output fails expected structured contract.
- **Retryable recovery**: transient or recoverable objective-recovery failure; loop should continue within budget.
- **Terminal recovery**: objective-recovery failure that should end further attempts for that objective.
- **Strict covered**: no unresolved required objective coverage at finalize gate.

## Execution Owners + ETA

| Item | Status | Owner | ETA | Exit check |
|---|---|---|---|---|
| 1) Strict turn contract + hard terminal validator + forced rescue | Implemented | Helix runtime | Complete (2026-03-25) | Placeholder/objective scaffolds cannot finalize. |
| 2) Separate plan stream from answer stream | Implemented (guard + scrub model) | Helix runtime | Complete (2026-03-25) | Plan artifacts scrubbed pre and post envelope. |
| 3) Schema-first + mandatory repair retries | Implemented | Objective loop + prompt contract | Complete (2026-03-25) | `retrieve_proposal`/`mini_synth`/`mini_critic`/`assembly` all have repair path. |
| 4) Retryable vs terminal recovery semantics | Implemented | Objective retrieval | Complete (2026-03-25) | `no_context_with_files` is retryable early and terminal only after repeated no-gain/no-context streaks. |
| 5) Mode/gate consistency | Partial (implemented + locally validated; keyed-runtime validation pending) | Finalize + quality gates | 2026-03-30 | Objective consistency block must remain aligned with section/obligation coverage across families. |
| 6) Safe parallelization model | Partial (improved) | Retrieval/runtime infra | 2026-04-05 | Bounded objective-recovery query fan-out in parallel, with serialized state mutation + assembly. |
| 7) Deterministic UI-facing event mapping | Implemented | Runtime + ops | Complete (2026-03-25) | Active process emits retry-classified objective-recovery details and objective gate-consistency events. |

## Checklist Status (Codex-Aligned)

## 1) Strict turn contract + hard terminal validator + forced rescue

Target meaning:
- No placeholder output (for example `Objective: ...`) can finalize.
- If output fails objective/quality rules, force rescue or deterministic rewrite before finalization.

Status: **Implemented**

Helix evidence:
- Final and post-envelope terminal guards:
  - `server/routes/agi.plan.ts` (objective terminal guards around finalize)
- Weak/scaffold leak rejection and deterministic rewrite path.
- Assembly rescue + repair path in objective assembly flow.

Remaining risk:
- None blocking at architecture level.
- Continue regression monitoring for corner-case leaks.

## 2) Separate plan stream from answer stream

Target meaning:
- Planning artifacts are isolated from user answer rendering.
- Plan/objective scaffolding must never leak into final answer text.

Status: **Implemented (guard + scrub model, not full stream engine refactor)**

Helix evidence:
- Plan/objective leakage detection and scrub helpers in `server/routes/agi.plan.ts`.
- Final and envelope answer post-scrub passes.

Remaining risk:
- Rare downstream formatting paths can still reintroduce residue; keep final guard strict.

## 3) Schema-first tools + strict handlers + mandatory repair retries

Target meaning:
- `retrieve_proposal`, `mini_synth`, `mini_critic`, `assembly` must not silently pass malformed output.
- Repair retries must execute before terminalization.

Status: **Implemented**

Helix evidence:
- Retrieve proposal repair and fallback logic.
- Mini synth/critic repair paths and telemetry.
- Assembly and rescue schema repair paths.

Remaining risk:
- Quality of repaired content can still be weak even if schema-valid; terminal validator remains required.

## 4) Clear retryable vs terminal recovery semantics

Target meaning:
- Objective recovery errors/no-context outcomes are explicitly classified.
- Classification is visible in UI-facing events and transcripts.
- `no_context_with_files` policy should avoid premature terminalization when budget remains.

Status: **Implemented**

Helix evidence:
- Recovery policy now treats `no_context_with_files` as retryable on early attempts and terminalizes only after repeated no-context/no-gain streaks.
- Retryable/terminal counters and transcript decision reasons remain explicit.
- Event detail labels include retry classification in objective-recovery events.

## 5) Mode/gate consistency

Target meaning:
- Coverage/belief/rattling "pass" should not coexist with underfilled obligations and blocked assembly in final result claims.

Status: **Partial (implemented + locally validated; keyed-runtime validation pending)**

Helix evidence:
- Stronger objective finalize guard and blocked/unknown handling.
- Objective gate consistency block now emits deterministic blocked/ok state and reasons.
- Finalize gate pass is strict-covered only; unknown-terminal is descriptive, not pass.

Current divergence:
- Runtime patch now enforces a final mode/gate consistency pass (required sections + roadmap headings + `Sources`) and downgrades objective finalize gate from `strict_covered` to `blocked` when obligations remain missing.
- Pending: verify the same behavior on the operator keyed runtime (`:5050`) and re-run regression/versatility batteries there.

## 6) Safe parallelization model

Target meaning:
- Retrieval diversification can be parallelized.
- Objective state mutation and final assembly remain serialized.

Status: **Partial**

Current behavior:
- Objective recovery now starts `primary + variant` retrieval promises concurrently and picks the stronger retrieval result.
- Objective state mutation and final assembly remain serialized.

## 7) Deterministic UI-facing event mapping

Target meaning:
- Deterministic event stream with explicit retry semantics and clear turn state transitions.

Status: **Implemented**

Helix evidence:
- Live event wiring and objective transcript coverage are strong.
- New retry labels added to objective recovery event details.

Current divergence:
- None observed in current runtime after reload; event stream includes retry-classified objective recovery and consistency markers.

## Evidence Matrix (Line Anchors)

| Checklist item | Codex clone evidence | Helix evidence | Current divergence |
|---|---|---|---|
| 1) Strict contract + hard terminal validator | `external/openai-codex/codex-rs/app-server/src/codex_message_processor.rs:6142`, `external/openai-codex/codex-rs/app-server/src/codex_message_processor.rs:6237`, `external/openai-codex/codex-rs/app-server/src/server_request_error.rs:3` | `server/routes/agi.plan.ts:63823`, `server/routes/agi.plan.ts:63888`, `server/routes/agi.plan.ts:64042`, `server/routes/agi.plan.ts:64141` | Core behavior aligned; monitor residual weak-output rewrites. |
| 2) Plan stream vs answer stream separation | `external/openai-codex/codex-rs/app-server/tests/suite/v2/plan_item.rs:39`, `external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs:4888`, `external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs:5008` | `server/routes/agi.plan.ts:63783`, `server/routes/agi.plan.ts:63786`, `server/routes/agi.plan.ts:64022`, `server/routes/agi.plan.ts:64035` | Guard/scrub architecture in place; no separate stream engine refactor yet. |
| 3) Schema-first handlers + repair retries | `external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs:5875`, `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:26` | `server/routes/agi.plan.ts:61481`, `server/routes/agi.plan.ts:62125`, `server/routes/agi.plan.ts:62350`, `server/routes/agi.plan.ts:62836`, `server/routes/agi.plan.ts:63136` | Implemented; remaining risk is semantic weakness after schema-valid repair. |
| 4) Retryable vs terminal recovery semantics | `external/openai-codex/codex-rs/app-server/src/server_request_error.rs:5`, `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:3032` | `server/routes/agi.plan.ts:61753`, `server/routes/agi.plan.ts:61773`, `server/routes/agi.plan.ts:61792`, `server/routes/agi.plan.ts:61877`, `server/routes/agi.plan.ts:61955` | Implemented: early no-context-with-files is retryable; terminalization requires repeated no-context/no-gain streaks. |
| 5) Mode/gate consistency | `external/openai-codex/codex-rs/app-server/tests/suite/v2/request_user_input.rs:60`, `external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs:3942` | `server/routes/agi.plan.ts:45571`, `server/routes/agi.plan.ts:64361`, `server/routes/agi.plan.ts:64463`, `server/routes/agi.plan.ts:64517` | Patched to include final section/obligation consistency gating and strict-covered override to blocked when unresolved headings/sources persist; awaiting live reload validation. |
| 6) Safe parallelization model | `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:281`, `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:540`, `external/openai-codex/codex-rs/app-server/src/codex_message_processor.rs:2945` | `server/routes/agi.plan.ts:61727`, `server/routes/agi.plan.ts:61754`, `server/routes/agi.plan.ts:61805` | Improved: `primary + variant` retrieval launches concurrently while state mutation/final assembly remain serialized; broader scheduler still sequential. |
| 7) Deterministic UI event mapping | `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:256`, `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:289`, `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:1289`, `external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs:1956` | `server/routes/agi.plan.ts:61792`, `server/routes/agi.plan.ts:61876`, `server/routes/agi.plan.ts:61885`, `server/routes/agi.plan.ts:62580` | Implemented in live runtime: retry classifications and objective gate-consistency events are emitted deterministically. |

## Current Metrics Snapshot (2026-03-25)

- Patch probe strict: `10/10` pass (`100.0%`) on `artifacts/experiments/helix-ask-patch-probe/2026-03-25T164300167Z`.
- Contract battery (light regression on rebuilt local runtime): fails only frontier continuity required headings (`Baseline/Hypothesis/Anti-hypothesis/Falsifiers/Uncertainty band/Claim tier`); prior strict-covered + missing-obligations failures no longer reproduce on local rebuilt runtime.
- Variety battery (reduced versatility): completed with probability scorecard at `artifacts/experiments/helix-ask-versatility/versatility-1774457478766` (`PARTIAL_READY`, primary remaining issue: citation persistence).
- Post-patch unit verification: `tests/helix-ask-runtime-errors.spec.ts` `303/303` pass (2026-03-25).
- Keyed-runtime (`:5050`) still appears to be serving older process/build in operator runs (runtime fallback strings from stale scope leaks persist); restart validation on keyed runtime remains required.
- Casimir verify gate: `PASS`
  - `traceId=adapter:a9ee5a6f-67c1-4228-9fab-3190b1fcce5c`
  - `runId=36797`
  - `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - `integrityOk=true`

## Embedded Raw Log / Debug Examples

### A) Divergence Signature (operator-captured runtime, 2026-03-24)

```text
Answer raw preview: Objective: what is a casimir tile in the full solve congruence
Retrieval objective-recovery - error
no_context
objective_finalize_gate_mode: unknown_terminal
objective_assembly_blocked_reason: objective_assembly_fail_closed_required_objective_unresolved
```

Why this matters:
- Shows the exact failure shape we are tuning: objective unresolved, assembly blocked, unknown-terminal finalize path.

### B) Current Patch-Probe Snapshot (2026-03-25T06:30:00.030Z)

Source: `artifacts/experiments/helix-ask-patch-probe/2026-03-25T063000028Z/report.md`

```text
pass_rate: 90.0%
objective_finalize_gate_pass_rate: 88.9%
objective_retrieval_success_rate: 88.9%
objective_assembly_success_rate: 100.0%
failed case: Composite system synthesis (hybrid_composite_1)
failures: This operation was aborted
```

### C) Raw Objective Telemetry Example From Same Probe

Source: `artifacts/experiments/helix-ask-patch-probe/2026-03-25T063000028Z/results.json`

```text
"objective_assembly_blocked_reason": "objective_assembly_fail_closed_required_objective_unresolved"
"objective_finalize_gate_passed": true
"objective_finalize_gate_mode": "unknown_terminal"
"objective_unknown_block_count": 1
```

and a blocked example in the same run:

```text
"objective_assembly_blocked_reason": "objective_assembly_fail_closed_missing_scoped_retrieval"
"objective_finalize_gate_passed": false
"objective_finalize_gate_mode": "blocked"
```

### D) Post-Patch Expected Event Detail Shape (from code)

Source: `server/routes/agi.plan.ts`

```text
Retrieval objective-recovery detail:
- no_context:retryable|terminal
- error:retryable|terminal
classification attached in event meta and objective transcript decision_reason
```

## Priority Backlog (Execution Order)

## P0: Complete retry semantics policy

Goal:
- Make `no_context_with_files` retryable for early attempts; only terminal after configured attempt/quality thresholds.

Acceptance:
- Objective recovery traces show delayed terminalization where appropriate.
- No increase in scaffold leakage.
- Patch probe strict at least matches current pass rate.

## P1: Close mode/gate consistency gaps

Goal:
- Remove known cases where final output shape misses required sections despite "pass" signals.

Acceptance:
- Contract battery clears current known failures for:
  - missing `Sources` line in target families,
  - roadmap required blocks in roadmap planning prompts.

## P2: Optional explicit parallel retrieval diversification

Goal:
- Introduce bounded parallel objective retrieval query fan-out.
- Keep objective state updates and assembly strictly serialized.

Acceptance:
- Latency improves in multi-objective prompts.
- Determinism and gate outcomes unchanged.

## Operating Rules

For each patch that touches this area:

1. Update this status document.
2. Run readiness loops per `docs/helix-ask-readiness-debug-loop.md`.
3. Record representative pass/fail artifact paths.
4. Run Casimir verify gate and record verdict/hash/integrity.

Do not mark checklist items complete without artifact-backed evidence.
