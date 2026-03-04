# Helix Ask Agent Development Routine (Tree/DAG Convergence)

Date: March 4, 2026  
Scope: Retrieval attribution and tree/DAG convergence for Helix Ask

## Purpose

This runbook is the canonical execution routine for agents continuing Helix Ask retrieval development.
It encodes the workflow that produced a strict-gate retrieval pass on keyed local validation.

## Locked Goal

Ship retrieval improvements only when the locked gate passes on keyed local runtime:

- `HELIX_ASK_RETRIEVAL_MAX_TASKS=40`
- `HELIX_ASK_RETRIEVAL_SEEDS=7,11,13`
- `HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2`
- `run_complete=true`
- `gold_file_recall_at_10 >= 0.85`
- `consequential_file_retention_rate >= 0.85`
- `unmatched_expected_file_rate <= 0.15`

Do not claim retrieval lift if this gate is not met.

## Reference Result (Current Best)

Run: `artifacts/experiments/helix-ask-retrieval-ablation/retrieval-ablation-1772650877554`

- `gold_file_recall_at_10 = 1.0`
- `consequential_file_retention_rate = 1.0`
- `unmatched_expected_file_rate = 0.0`
- `retrieval_lift_proven = yes`
- `run_complete = true`

Treat this as the current baseline to protect.

## Required Pre-Read

- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`
- `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`

## Source-of-Truth Files for This Lane

- Retrieval runtime: `server/routes/agi.plan.ts`
- Ablation harness: `scripts/helix-ask-retrieval-ablation.ts`
- Atlas build/query:
  - `scripts/repo-atlas-build.ts`
  - `scripts/repo-atlas-query.ts`
- Corpus:
  - `configs/repo-atlas-bench-corpus.v2.json`

## Execution Model

- Hybrid lane is required.
- Codex Cloud can do patch work and non-key checks.
- Keyed local runtime must run locked 40-task sweep, readiness batteries, and Casimir before merge.

## Branching and Commit Discipline

- Start from latest `main`.
- Create a branch for the wave.
- Keep one prompt scope per commit.
- Never revert unrelated dirty files.
- Never use destructive git resets.

## Canonical Command Order

1) Atlas prep

```powershell
npm run atlas:build
npm run atlas:why -- helix-ask-retrieval-ablation
npm run atlas:trace -- helix-ask-retrieval-ablation --upstream
```

2) Build + fast smoke

```powershell
npm run build
HELIX_ASK_RETRIEVAL_MAX_TASKS=2 HELIX_ASK_RETRIEVAL_SEEDS=7 HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2 npm run helix:ask:retrieval:ablation
```

3) Locked attribution gate

```powershell
HELIX_ASK_RETRIEVAL_MAX_TASKS=40 HELIX_ASK_RETRIEVAL_SEEDS=7,11,13 HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2 npm run helix:ask:retrieval:ablation
```

4) Readiness guard

```powershell
HELIX_ASK_BASE_URL=http://127.0.0.1:5050 npx tsx scripts/helix-ask-regression.ts
HELIX_ASK_BASE_URL=http://127.0.0.1:5050 HELIX_ASK_VERSATILITY_TIMEOUT_MS=45000 HELIX_ASK_VERSATILITY_PRECHECK_TIMEOUT_MS=30000 npx tsx scripts/helix-ask-versatility-record.ts
HELIX_ASK_BASE_URL=http://127.0.0.1:5050 HELIX_ASK_PATCH_PROBE_TIMEOUT_MS=90000 npx tsx scripts/helix-ask-patch-probe.ts
```

5) Required Casimir gate for every patch scope

```powershell
npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export
```

Capture and report:

- `verdict`
- `runId`
- `traceId`
- `certificateHash`
- `integrityOk`

## Strict Decision Fork (Mandatory)

1) If `run_complete=false`:
- Do not interpret attribution.
- Fix runtime stability/watchdog behavior first.

2) If corpus fidelity fails:
- Do not pursue retrieval architecture changes.
- Fix evaluation fidelity first.

3) If strict gate fails but corpus fidelity passes:
- Stay on tree/DAG convergence work.
- Do not shift to post-processing as primary plan.

4) If strict gate passes:
- Run readiness guard immediately.
- Freeze retrieval baseline.
- Shift focus to post-retrieval quality debt (intent routing, citation persistence) without regressing retrieval metrics.

## High-Impact Retrieval Patterns to Keep

- Deterministic path safety and normalization across candidate lanes.
- Explicit filename/path hint expansion from query/question into path candidates.
- Bare filename resolution to unique corpus paths.
- Graph expansion as additive to static hits, with typed-edge diagnostics.
- No silent behavior changes: emit debug attribution fields and ablation diagnostics for every retrieval change.

## Required Reporting Contract Per Agent Run

Every run handoff must include:

1) Prompt-by-prompt status with commit SHAs  
2) Artifact paths  
3) Retrieval attribution verdict (`retrieval_lift_proven`, `dominant_channel`, `run_complete`)  
4) Stage-fault ownership summary  
5) Casimir summary block per patch scope  
6) Blockers and next action list

## Promotion Rule

No merge claim is complete without:

- Locked gate pass on keyed local runtime
- Readiness guard run results attached
- Casimir PASS with integrity OK
- Artifact paths present and reproducible
