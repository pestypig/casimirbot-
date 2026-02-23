# Helix Ask Evolution Governance Ledger (2026-02-23)

## Wave scope lock

- Baseline lock: `origin/main@0fbdf05a`
- Primary source of truth:
  - `docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md`
  - `docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md`
  - `AGENTS.md`
  - `WARP_AGENTS.md`
- Execution mode: strict Prompt `0..10`, one commit per prompt.

## Prompt execution table (0..10)

| Prompt | Title | Allowed paths summary | Commit SHA | Casimir verdict | Integrity OK | Status | Notes |
|---|---|---|---|---|---|---|---|
| 0 | Wave ledger and scope lock | `reports/...ledger...md`, prompt-pack doc | this_commit | PASS | true | done | Ledger initialized and scope locked |
| 1 | Evolution contracts and schema docs | `docs/architecture/evolution-governance-contract.md`, flow/policy docs | _pending_ | _pending_ | _pending_ | pending |  |
| 2 | Evolution domain types and config surface | `shared/evolution-schema.ts`, config loader, tests | _pending_ | _pending_ | _pending_ | pending |  |
| 3 | Patch ingest route + storage | evolution routes/store + tests | _pending_ | _pending_ | _pending_ | pending |  |
| 4 | Momentum engine | momentum service + tests | _pending_ | _pending_ | _pending_ | pending |  |
| 5 | Checklist addendum generator | checklist service + tests + contract doc | _pending_ | _pending_ | _pending_ | pending |  |
| 6 | Congruence gate endpoint | gate service/route + tests | _pending_ | _pending_ | _pending_ | pending |  |
| 7 | Training-trace integration | training-trace + evolution route + tests | _pending_ | _pending_ | _pending_ | pending |  |
| 8 | Trajectory endpoint + deterministic persistence | trajectory route/service + tests | _pending_ | _pending_ | _pending_ | pending |  |
| 9 | Operator report + artifacts + docs wiring | docs/report artifacts integration | _pending_ | _pending_ | _pending_ | pending |  |
| 10 | Final wave validation + closeout | closeout docs and verification tables | _pending_ | _pending_ | _pending_ | pending |  |

## Wave targets and hard constraints summary

### Wave targets

1. Add an additive evolution-governance layer under `/api/evolution` without breaking existing Helix Ask behavior.
2. Keep congruence-gate outputs deterministic (`verdict`, `firstFail`, `deltas`, `artifacts`) and replay-safe.
3. Preserve compatibility with existing training-trace JSONL export lifecycle.
4. Track per-prompt progress with deterministic evidence fields and commit linkage.

### Hard constraints

1. Casimir verification remains mandatory for every prompt and cannot be replaced.
2. On Casimir FAIL, repair the first failing HARD constraint before proceeding.
3. Do not claim completion unless Casimir is PASS with certificate hash recorded and `integrityOk=true`.
4. Keep all changes additive and non-breaking to existing mission/voice and API contracts.

## Deterministic done checklist

- [ ] Prompt path scope honored for this prompt.
- [ ] Required prompt objective delivered.
- [ ] Mandatory checks for the prompt executed.
- [ ] Casimir verify returned `PASS`.
- [ ] Casimir certificate hash recorded.
- [ ] Casimir integrity recorded as `true`.
- [ ] Ledger prompt row updated with commit SHA and status.

## Blocker policy

If blocked on a prompt:
1. Deliver the maximal safe additive subset within allowed paths.
2. Mark status as `partial-blocked` or `blocked` with explicit blocker details.
3. Still run mandatory Casimir verify and record verdict/certificate/integrity fields.
4. Continue to the next prompt while preserving non-breaking guarantees.

## Per-prompt report blocks

### Prompt 0

- prompt_id: `0`
- files_changed:
  - `reports/helix-ask-evolution-governance-ledger-2026-02-23.md`
  - `docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md`
- behavior_delta: Added execution ledger scaffold, explicit prompt table, wave targets/constraints summary, deterministic done checklist, and blocker policy.
- tests_or_checks_run:
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: `PASS`
- casimir_firstFail: `null`
- casimir_certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- casimir_integrityOk: `true`
- casimir_traceId: `adapter:a559e58d-5669-459a-84b2-d7f6489aa3cc`
- casimir_runId: `1`
- commit_sha: `this_commit`
- status: `done`
