# Helix Ask Mission Overwatch v1 Closure Wave 2 Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/audits/research/helix-ask-mission-systems-codex-cloud-autorun-batch-prompt-pack-2026-02-22.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/helix-ask-runtime-limitations.md`
- `docs/BUSINESS_MODEL.md`

## Baseline lock

Use this exact baseline and do not re-open completed slices:
- `origin/main@2f95b867`

Already closed in baseline:
- voice route implemented with deterministic envelopes and provider proxy boundary
- mission-board routes implemented with deterministic fold
- deterministic salience/orchestration modules implemented
- deterministic event ID hardening completed
- ack clears unresolved critical semantics completed
- mission-board persistence adapter and replay durability tests completed

Execution ledger for this wave:
- `reports/helix-ask-mission-overwatch-v1-closure-wave2-ledger-2026-02-23.md`

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Preserve Helix Ask scientific/evidence posture and certainty parity.
2) Voice remains event-driven, low-noise, rate-limited, action-oriented.
3) Do not break /api/agi/ask behavior or job lifecycle paths.
4) Keep mission and voice endpoint changes additive/non-breaking.
5) Keep patch scope path-bounded per prompt.
6) Commit once per prompt scope.

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

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Run Prompt 0 through Prompt 7 in strict order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-mission-overwatch-v1-closure-wave2-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/helix-ask-agent-policy.md

Baseline lock:
- origin/main@2f95b867

Global rules:
1) Do not redo completed baseline slices.
2) If blocked, ship max safe additive subset and continue.
3) After each prompt, run prompt checks and mandatory Casimir verify.
4) On Casimir FAIL, repair first failing HARD constraint and rerun.
5) Do not claim completion without final PASS + integrityOk true.
6) Update wave ledger after each prompt.

Final deliverables:
- ordered commit table
- artifact existence table
- final GO/NO-GO + blockers
```

## Prompt 0: Wave-2 ledger and closure lock

```text
Objective:
Create deterministic execution tracking for this wave and lock closed baseline items.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-closure-wave2-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-mission-overwatch-v1-closure-wave2-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add rows for Prompt 0..7.
2) Add "closed-in-baseline" section listing completed slices from lock commit.
3) Add deterministic done checklist and blocker policy.

Checks:
- casimir verify command
```

## Prompt 1: Tenant partitioning for mission-board and voice

```text
Objective:
Partition mission-board and voice runtime state by tenant + mission without breaking single-tenant defaults.

Allowed paths:
- server/routes/mission-board.ts
- server/routes/voice.ts
- server/services/mission-overwatch/mission-board-store.ts
- tests/mission-board.routes.spec.ts
- tests/voice.routes.spec.ts
- tests/mission-board.persistence.spec.ts

Requirements:
1) Add tenant resolver (header/JWT-compatible hook) with deterministic default tenant in dev mode.
2) Partition all mission-board storage keys by tenant_id + mission_id.
3) Partition voice dedupe and mission rate windows by tenant_id + mission_id.
4) Preserve backward compatibility when tenant header is absent in local/dev.

Checks:
- npx vitest run tests/mission-board.routes.spec.ts tests/mission-board.persistence.spec.ts tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 2: Auth gating for mission-overwatch endpoints

```text
Objective:
Add production-safe auth gate for /api/mission-board/* and /api/voice/* without breaking local workflows.

Allowed paths:
- server/routes.ts
- server/routes/mission-board.ts
- server/routes/voice.ts
- tests/mission-overwatch-auth.spec.ts (new)

Requirements:
1) Add env flag ENABLE_MISSION_OVERWATCH_AUTH (default false in dev, true allowed in prod).
2) When enabled, require existing JWT middleware at mount layer.
3) Ensure deterministic unauthorized envelope behavior.
4) Keep auth disabled behavior unchanged for local/dev.

Checks:
- npx vitest run tests/mission-overwatch-auth.spec.ts
- casimir verify command
```

## Prompt 3: Voice backpressure and queue-full contract

```text
Objective:
Bound voice resource usage under load with deterministic queue/concurrency behavior.

Allowed paths:
- server/routes/voice.ts
- tests/voice.routes.spec.ts

Requirements:
1) Add ACTIVE_LIMIT and QUEUE_LIMIT with strict bounds.
2) Emit deterministic voice_queue_full envelope when queue saturated.
3) Preserve existing dry-run, timeout, dedupe, rate-limited behaviors.
4) Keep action/critical priority handling bounded and deterministic.

Checks:
- npx vitest run tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 4: Envelope parity and trace linkage

```text
Objective:
Standardize mission-board envelopes to include optional traceId for parity with voice contracts.

Allowed paths:
- server/routes/mission-board.ts
- client/src/lib/mission-overwatch/index.ts
- tests/mission-board.routes.spec.ts

Requirements:
1) Accept optional traceId in actions/ack payloads.
2) Include traceId in mission-board error envelopes and receipts when provided.
3) Keep response envelope deterministic and non-breaking for clients that omit traceId.

Checks:
- npx vitest run tests/mission-board.routes.spec.ts
- casimir verify command
```

## Prompt 5: Runtime stability pruning and bounded maps

```text
Objective:
Prevent long-lived memory growth in voice and mission-overwatch runtime maps.

Allowed paths:
- server/routes/voice.ts
- server/services/mission-overwatch/salience.ts
- server/services/mission-overwatch/mission-board-store.ts
- tests/mission-overwatch-salience.spec.ts
- tests/voice.routes.spec.ts

Requirements:
1) Add TTL pruning/hard caps for dedupe and mission window maps.
2) Keep semantics unchanged within active TTL windows.
3) Add tests that assert pruning does not break deterministic suppression behavior.

Checks:
- npx vitest run tests/mission-overwatch-salience.spec.ts tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 6: Policy + business model closure updates

```text
Objective:
Update docs to reflect implemented controls and remaining release gates.

Allowed paths:
- docs/BUSINESS_MODEL.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/helix-ask-runtime-limitations.md

Requirements:
1) Document tenant/auth modes and defaults.
2) Document voice queue/full behavior and bounded backpressure.
3) Document provider gating and metering requirements for commercialization.
4) Keep docs implementation-true and mark unresolved decisions explicitly.

Checks:
- casimir verify command
```

## Prompt 7: Final wave-2 closure report

```text
Objective:
Produce decision-ready closure report for remaining v1 edges.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-closure-wave2-readiness-2026-02-23.md (new)
- reports/helix-ask-mission-overwatch-v1-closure-wave2-ledger-2026-02-23.md

Requirements:
1) Prompt-by-prompt status and commit mapping.
2) Artifact existence table.
3) GO/NO-GO with remaining blockers (if any).
4) Final Casimir PASS block with certificate metadata.

Checks:
- casimir verify command
```

## Operator checklist

```text
1) Start server:
   npm run dev:agi:5173

2) Paste the single launcher prompt in Codex Cloud.

3) Verify outputs:
   - reports/helix-ask-mission-overwatch-v1-closure-wave2-ledger-2026-02-23.md
   - reports/helix-ask-mission-overwatch-v1-closure-wave2-readiness-2026-02-23.md

4) Confirm final Casimir block:
   - verdict PASS
   - certificateHash present
   - integrityOk true
```
