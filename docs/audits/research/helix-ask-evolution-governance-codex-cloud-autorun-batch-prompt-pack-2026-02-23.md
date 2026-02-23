# Helix Ask Evolution Governance Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md`
- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/mission-go-board-spec.md`
- `server/routes/training-trace.ts`
- `server/services/observability/training-trace-store.ts`
- `shared/essence-schema.ts`

## Baseline lock

Use this exact baseline and do not reopen completed slices:
- `origin/main@0fbdf05a`

Execution ledger for this wave:
- `reports/helix-ask-evolution-governance-ledger-2026-02-23.md`

Ledger policy: update prompt table and per-prompt report block after every prompt commit.

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Casimir verify remains required baseline. Do not replace or bypass it.
2) Congruence gate is additive and non-breaking.
3) Preserve /api/agi/ask behavior and all existing mission/voice contracts.
4) Keep deterministic envelopes: verdict, firstFail, deltas, artifacts.
5) Keep training-trace export JSONL compatible.
6) Keep path-bounded scope per prompt and one commit per prompt.
7) If blocked, ship maximal safe additive subset and continue.

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

- [ ] Prompt path scope honored for each slice.
- [ ] Casimir baseline preserved and still required.
- [ ] All new evolution endpoints are additive and deterministic.
- [ ] Training-trace export remains valid JSONL.
- [ ] Casimir verify PASS recorded after each prompt with `integrityOk: true`.
- [ ] Ledger updated after every prompt commit with status and commit SHA.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Run Prompt 0 through Prompt 10 in strict order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md
- AGENTS.md
- WARP_AGENTS.md

Baseline lock:
- origin/main@0fbdf05a

Global rules:
1) Keep changes additive and non-breaking.
2) Keep congruence gate complementary to Casimir verify.
3) Deterministic outputs only for gate/checklist/momentum artifacts.
4) If blocked, ship max safe additive subset and continue.
5) After each prompt, run prompt checks and mandatory Casimir verify.
6) On Casimir FAIL, repair first failing HARD constraint and rerun.
7) Do not claim completion without final PASS + integrityOk true.
8) Update evolution ledger after each prompt commit.

Final deliverables:
- ordered commit table
- artifact existence table
- final GO/NO-GO + blockers
- final Casimir PASS block
```

## Prompt 0: Wave ledger and scope lock

```text
Objective:
Initialize execution tracking for evolution governance wave and lock scope.

Allowed paths:
- reports/helix-ask-evolution-governance-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add prompt table for Prompt 0..10.
2) Add wave targets and hard constraints summary.
3) Add deterministic done checklist and blocker policy.

Checks:
- casimir verify command
```

## Prompt 1: Evolution contracts and schema docs

```text
Objective:
Define additive architecture contracts for evolution ingest/gate/checklist/trajectory.

Allowed paths:
- docs/architecture/evolution-governance-contract.md (new)
- docs/helix-ask-agent-policy.md
- docs/helix-ask-flow.md

Requirements:
1) Define deterministic envelope shape and error taxonomy.
2) Define additive endpoint contracts under /api/evolution.
3) Define hard-fail and soft-fail taxonomy IDs.
4) Define compatibility rules with Casimir and training-trace.

Checks:
- casimir verify command
```

## Prompt 2: Evolution domain types and config surface

```text
Objective:
Add typed domain models and deterministic config loaders for intent/weights/thresholds.

Allowed paths:
- shared/evolution-schema.ts (new)
- server/services/evolution/config.ts (new)
- tests/evolution.config.spec.ts (new)

Requirements:
1) Add versioned schema types for patch/momentum/congruence/checklist.
2) Add deterministic config loading with explicit defaults.
3) Reject malformed config with stable error codes.

Checks:
- npx vitest run tests/evolution.config.spec.ts
- casimir verify command
```

## Prompt 3: Patch ingest route + storage

```text
Objective:
Implement patch ingest endpoint and local-first JSONL persistence.

Allowed paths:
- server/routes/evolution.ts (new)
- server/routes.ts
- server/services/evolution/patch-store.ts (new)
- tests/evolution.routes.ingest.spec.ts (new)

Requirements:
1) Add POST /api/evolution/patches/ingest.
2) Generate deterministic patchId from canonicalized inputs.
3) Persist patch records under .cal/evolution/patches.jsonl.
4) Return deterministic error envelopes.

Checks:
- npx vitest run tests/evolution.routes.ingest.spec.ts
- casimir verify command
```

## Prompt 4: Momentum engine

```text
Objective:
Implement deterministic momentum calculation and subsystem projection.

Allowed paths:
- server/services/evolution/momentum.ts (new)
- tests/evolution.momentum.spec.ts (new)

Requirements:
1) Implement scope/subsystem/coupling/test/uncertainty components.
2) Keep functions pure and deterministic.
3) Emit stable output ordering.

Checks:
- npx vitest run tests/evolution.momentum.spec.ts
- casimir verify command
```

## Prompt 5: Checklist addendum generator

```text
Objective:
Generate deterministic patch checklist addendum compatible with AGENTS/WARP expectations.

Allowed paths:
- server/services/evolution/checklist-generator.ts (new)
- tests/evolution.checklist.spec.ts (new)
- docs/architecture/evolution-governance-contract.md

Requirements:
1) Generate schema helix_agent_patch_checklist_addendum/1.
2) Deterministically map touched paths to mandatory reads/tests/hooks.
3) Stable sorting and stable IDs/hashes.

Checks:
- npx vitest run tests/evolution.checklist.spec.ts
- casimir verify command
```

## Prompt 6: Congruence gate endpoint

```text
Objective:
Implement POST /api/evolution/gate/run and deterministic scoring/fail taxonomy.

Allowed paths:
- server/services/evolution/congruence-gate.ts (new)
- server/routes/evolution.ts
- tests/evolution.gate.spec.ts (new)

Requirements:
1) Compute score and apply hard-fail overrides.
2) Emit Casimir-like envelope fields (verdict, firstFail, deltas, artifacts).
3) Keep report-only mode default.
4) Keep additive and non-breaking route behavior.

Checks:
- npx vitest run tests/evolution.gate.spec.ts
- casimir verify command
```

## Prompt 7: Training-trace integration

```text
Objective:
Write congruence outcomes into existing training-trace lifecycle without schema break.

Allowed paths:
- server/routes/training-trace.ts
- server/services/observability/training-trace-store.ts
- server/routes/evolution.ts
- tests/evolution.training-trace.spec.ts (new)

Requirements:
1) Record evolution runs as additive trace records.
2) Keep /api/agi/training-trace/export JSONL valid.
3) Preserve existing trace consumers.

Checks:
- npx vitest run tests/evolution.training-trace.spec.ts tests/training-trace.*.ts
- casimir verify command
```

## Prompt 8: Trajectory and logical coupling

```text
Objective:
Add trajectory endpoint with rolling state and co-change baseline from git history.

Allowed paths:
- server/services/evolution/trajectory.ts (new)
- server/services/evolution/git-history.ts (new)
- server/routes/evolution.ts
- tests/evolution.trajectory.spec.ts (new)

Requirements:
1) Add GET /api/evolution/trajectory/:id.
2) Compute hotspot and unresolved risk summaries deterministically.
3) Do not require cloud dependencies.

Checks:
- npx vitest run tests/evolution.trajectory.spec.ts
- casimir verify command
```

## Prompt 9: Runbook and CI report-only hook

```text
Objective:
Document and wire report-only evolution gating in CI without blocking existing pipelines.

Allowed paths:
- docs/runbooks/evolution-governance-operations-2026-02-23.md (new)
- .github/workflows/casimir-verify.yml
- docs/helix-ask-runtime-limitations.md

Requirements:
1) Add runbook for local and CI execution.
2) Add optional report-only CI step for evolution gate artifact.
3) Do not change baseline Casimir required behavior.

Checks:
- casimir verify command
```

## Prompt 10: Closure readiness report

```text
Objective:
Publish final readiness report with blockers, commit chain, and decision.

Allowed paths:
- reports/helix-ask-evolution-governance-readiness-2026-02-23.md (new)
- reports/helix-ask-evolution-governance-ledger-2026-02-23.md

Requirements:
1) Include ordered commit table Prompt 0..10.
2) Include artifact existence table.
3) Include GO/NO-GO and explicit blockers.
4) Include final Casimir PASS block with certificate hash and integrity status.

Checks:
- casimir verify command
```
