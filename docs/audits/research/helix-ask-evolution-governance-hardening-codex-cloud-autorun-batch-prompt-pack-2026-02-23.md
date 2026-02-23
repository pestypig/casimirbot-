# Helix Ask Evolution Governance Hardening Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/architecture/evolution-governance-contract.md`
- `server/routes/evolution.ts`
- `server/routes/training-trace.ts`
- `server/services/observability/training-trace-store.ts`
- `server/services/evolution/congruence-gate.ts`
- `shared/evolution-schema.ts`
- `shared/schema.ts`
- `AGENTS.md`
- `WARP_AGENTS.md`

## Baseline lock

Use this exact baseline and do not reopen completed prior waves:
- `origin/main@03e6fc1e`

Execution ledger for this wave:
- `reports/helix-ask-evolution-governance-hardening-ledger-2026-02-23.md`

Ledger policy:
- update prompt table and per-prompt report block after every prompt commit
- one commit per prompt

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Casimir verify remains mandatory baseline and cannot be bypassed.
2) Evolution gate remains additive and non-breaking.
3) Preserve /api/agi/ask behavior.
4) Preserve JSONL compatibility for /api/agi/training-trace/export.
5) Deterministic envelopes only: verdict, firstFail, deltas, artifacts.
6) No "as any" on evolution constraint translation paths.
7) One commit per prompt scope.
8) If blocked, ship maximal safe additive subset and continue with deterministic blocker notes.

Mandatory verification after each prompt:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict FAIL:
- fix first failing HARD constraint
- rerun until PASS

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

## Deterministic done checklist

- [ ] Prompt path scope honored.
- [ ] Contract and schema parity preserved.
- [ ] No invalid training-trace record shape introduced.
- [ ] Read-after-write consistency tests green.
- [ ] Casimir PASS recorded with integrity true.
- [ ] Ledger updated with commit SHA and status.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. STRICT SEQUENTIAL MODE.
Run Prompt 0 through Prompt 10 in order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-evolution-governance-hardening-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/architecture/evolution-governance-contract.md
- AGENTS.md
- WARP_AGENTS.md

Baseline lock:
- origin/main@03e6fc1e
- if origin/main is ahead due to merged Prompt 0, do not reset backward; continue from current main and run remaining prompts

Global rules:
1) Keep changes additive and non-breaking.
2) Enforce schema-safe firstFail typing across evolution -> training-trace.
3) Remove unsafe casts from evolution trace paths.
4) Enforce deterministic FAIL taxonomy with complete hard-fail set.
5) Ensure read-after-write consistency for training-trace list/get/export behavior.
6) Protect /api/evolution routes for production (auth/tenant/rate bounds) while preserving dev ergonomics.
7) After each prompt: run listed tests + mandatory Casimir verify.
8) If Casimir FAIL: fix first HARD fail and rerun until PASS.
9) Update ledger after every prompt commit.
10) Do not edit files outside each prompt's allowed paths.

Stop conditions:
- stop only if repository or runtime is unrecoverably broken
- otherwise continue through Prompt 10; use partial-blocked/blocked with deterministic reason

Required checkpoint after every prompt:
- prompt_id
- commit_sha
- status
- files_changed
- tests_or_checks_run
- casimir_verdict
- casimir_certificateHash
- casimir_integrityOk
- blockers

Final output must include:
1) ordered commit table (Prompt 0..10)
2) artifact existence table
3) GO/NO-GO with blockers
4) final Casimir PASS + certificate hash + integrityOk
```

## Prompt 0: Hardening wave ledger and scope lock

```text
Objective:
Initialize hardening execution ledger and strict scope lock.

Allowed paths:
- reports/helix-ask-evolution-governance-hardening-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-evolution-governance-hardening-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add prompt table Prompt 0..10.
2) Add hardening targets and blocker policy.
3) Add deterministic done checklist.

Checks:
- casimir verify command
```

## Prompt 1: Contract parity lock

```text
Objective:
Align documented hard-fail taxonomy and runtime contract behavior.

Allowed paths:
- docs/architecture/evolution-governance-contract.md
- shared/evolution-schema.ts
- tests/evolution.gate.spec.ts

Requirements:
1) Ensure taxonomy includes only implemented IDs or implement missing IDs in subsequent prompt with explicit contract note.
2) Define strict firstFail value/limit typing that is compatible with shared training-trace constraint schema.
3) Add a contract test expectation that fails on taxonomy drift.

Checks:
- npx vitest run tests/evolution.gate.spec.ts
- casimir verify command
```

## Prompt 2: Remove unsafe firstFail casting

```text
Objective:
Eliminate schema-unsafe firstFail casts in evolution trace recording.

Allowed paths:
- server/services/observability/training-trace-store.ts
- server/services/evolution/congruence-gate.ts
- tests/evolution.training-trace.spec.ts

Requirements:
1) Replace `firstFail as any` with a typed translator that outputs schema-valid value/limit fields.
2) Ensure FAIL-path evolution traces parse under shared trainingTrace schema.
3) Add tests for PASS and FAIL evolution trace recording.

Checks:
- npx vitest run tests/evolution.training-trace.spec.ts tests/evolution.gate.spec.ts
- casimir verify command
```

## Prompt 3: Read-after-write consistency for trace list/get

```text
Objective:
Guarantee consistent visibility of newly recorded traces in list/get paths.

Allowed paths:
- server/services/observability/training-trace-store.ts
- server/routes/training-trace.ts
- tests/evolution.training-trace.spec.ts
- tests/training-trace.list.spec.ts (new or update)

Requirements:
1) Fix stale-read behavior when persistence is enabled and writes are async.
2) Ensure get/list can see newly recorded traces deterministically in test process.
3) Preserve export compatibility and ordering guarantees.

Checks:
- npx vitest run tests/evolution.training-trace.spec.ts tests/training-trace.*.ts
- casimir verify command
```

## Prompt 4: Canonical source filtering

```text
Objective:
Use typed source field for filtering instead of notes string matching.

Allowed paths:
- server/routes/training-trace.ts
- server/services/observability/training-trace-store.ts
- tests/training-trace.list.spec.ts

Requirements:
1) Filter by canonical source metadata.
2) Keep backward compatibility for existing records lacking source field.
3) Keep deterministic query behavior.

Checks:
- npx vitest run tests/training-trace.*.ts
- casimir verify command
```

## Prompt 5: Enforce-mode Casimir required semantics

```text
Objective:
Prevent enforce-mode PASS when Casimir status is missing.

Allowed paths:
- server/services/evolution/congruence-gate.ts
- server/routes/evolution.ts
- tests/evolution.gate.spec.ts

Requirements:
1) Add hard-fail for missing Casimir verdict when reportOnly=false.
2) Preserve report-only behavior defaults.
3) Keep deterministic firstFail ordering.

Checks:
- npx vitest run tests/evolution.gate.spec.ts
- casimir verify command
```

## Prompt 6: /api/evolution production boundary hardening

```text
Objective:
Add production-safe auth/tenant/rate protections for evolution routes.

Allowed paths:
- server/routes.ts
- server/routes/evolution.ts
- tests/evolution.routes.ingest.spec.ts
- tests/evolution.routes.auth.spec.ts (new)

Requirements:
1) Add optional auth gate consistent with existing AGI auth toggles.
2) Add tenant handling policy for write endpoints when tenant-required mode is enabled.
3) Add route-specific request bounds/rate guard without breaking local dev defaults.

Checks:
- npx vitest run tests/evolution.routes.ingest.spec.ts tests/evolution.routes.auth.spec.ts
- casimir verify command
```

## Prompt 7: Evolution storage durability and retention controls

```text
Objective:
Harden evolution patch/run persistence and retention behavior.

Allowed paths:
- server/services/evolution/patch-store.ts
- server/services/evolution/trajectory.ts
- docs/helix-ask-runtime-limitations.md
- tests/evolution.trajectory.spec.ts

Requirements:
1) Add bounded retention/rotation controls for evolution JSONL storage.
2) Ensure deterministic read ordering and stable parsing under partial/corrupt lines.
3) Document limits and fallback behavior.

Checks:
- npx vitest run tests/evolution.trajectory.spec.ts
- casimir verify command
```

## Prompt 8: CI contract and regression gates

```text
Objective:
Add optional CI checks for evolution contract parity and schema-safe traces.

Allowed paths:
- .github/workflows/casimir-verify.yml
- tests/evolution.gate.spec.ts
- tests/evolution.training-trace.spec.ts
- docs/runbooks/evolution-governance-operations-2026-02-23.md

Requirements:
1) Add report-only evolution hardening checks as optional workflow dispatch step.
2) Ensure FAIL-path schema-valid trace assertion is included.
3) Keep mandatory Casimir behavior unchanged.

Checks:
- npx vitest run tests/evolution.gate.spec.ts tests/evolution.training-trace.spec.ts
- casimir verify command
```

## Prompt 9: Docs and runbook closure

```text
Objective:
Align docs with implemented hardening behavior.

Allowed paths:
- docs/architecture/evolution-governance-contract.md
- docs/helix-ask-agent-policy.md
- docs/helix-ask-flow.md
- docs/helix-ask-runtime-limitations.md
- docs/runbooks/evolution-governance-operations-2026-02-23.md

Requirements:
1) Document enforce/report-only mode semantics.
2) Document firstFail typing and compatibility contract with training-trace schema.
3) Document retention and production boundary controls.

Checks:
- casimir verify command
```

## Prompt 10: Final hardening readiness report

```text
Objective:
Publish hardening readiness closeout with deterministic evidence.

Allowed paths:
- reports/helix-ask-evolution-governance-hardening-readiness-2026-02-23.md (new)
- reports/helix-ask-evolution-governance-hardening-ledger-2026-02-23.md

Requirements:
1) Ordered commit table Prompt 0..10.
2) Artifact existence table.
3) GO/NO-GO with explicit blockers.
4) Final Casimir PASS block with certificate hash and integrity status.

Checks:
- casimir verify command
```
