# Helix Ask Mission Overwatch v1 Closure Wave 2B Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/audits/research/helix-ask-mission-overwatch-v1-closure-wave2-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `docs/helix-ask-agent-policy.md`
- `docs/helix-ask-runtime-limitations.md`
- `docs/BUSINESS_MODEL.md`

## Baseline lock

Use this exact baseline and do not re-open completed slices:
- `origin/main@c622928a`

This Wave-2B batch targets remaining gaps from the last research:
- MO-008 failure isolation / circuit-breaker behavior
- MO-009 provider governance runtime enforcement
- MO-010 normalized metering + budget controls
- MO-011 explicit UX controls coverage for voice modes
- MO-012 explicit SLO test gates and release check enforcement

Execution ledger for this wave:
- `reports/helix-ask-mission-overwatch-v1-closure-wave2b-ledger-2026-02-23.md`

Ledger policy: update the prompt table and the corresponding per-prompt report block after every prompt commit.

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
AUTORUN. Run Prompt 0 through Prompt 6 in strict order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-mission-overwatch-v1-closure-wave2b-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/helix-ask-agent-policy.md

Baseline lock:
- origin/main@c622928a

Global rules:
1) Do not redo completed baseline slices.
2) If blocked, ship max safe additive subset and continue.
3) After each prompt, run prompt checks and mandatory Casimir verify.
4) On Casimir FAIL, repair first failing HARD constraint and rerun.
5) Do not claim completion without final PASS + integrityOk true.
6) Update wave-2B ledger after each prompt.

Final deliverables:
- ordered commit table
- artifact existence table
- final GO/NO-GO + blockers
```

## Prompt 0: Wave-2B ledger and unresolved-gap lock

```text
Objective:
Create deterministic execution tracking for unresolved gaps only.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-closure-wave2b-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-mission-overwatch-v1-closure-wave2b-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add rows for Prompt 0..6.
2) Add "gaps targeted in this wave" section mapped to MO-008..MO-012.
3) Add deterministic done checklist and blocker policy.

Checks:
- casimir verify command
```

## Prompt 1: Voice failure isolation and circuit-breaker behavior

```text
Objective:
Prevent voice backend instability from degrading unrelated mission endpoints.

Allowed paths:
- server/routes/voice.ts
- tests/voice.routes.spec.ts
- docs/architecture/voice-service-contract.md (if non-breaking contract notes are needed)

Requirements:
1) Add deterministic circuit-breaker window for repeated backend failures/timeouts.
2) When breaker is open, return deterministic envelope (voice_backend_error or new non-breaking code if contract-updated).
3) Keep mission-board writes/snapshots independent of voice success.
4) Preserve existing timeout, dedupe, and rate-limit behavior.

Checks:
- npx vitest run tests/voice.routes.spec.ts tests/mission-board.routes.spec.ts
- casimir verify command
```

## Prompt 2: Provider allowlist and commercialization runtime gates

```text
Objective:
Enforce provider governance at runtime, not just documentation.

Allowed paths:
- server/routes/voice.ts
- server/startup-config.ts
- tests/startup-config.spec.ts
- tests/voice.routes.spec.ts

Requirements:
1) Add env-driven provider mode:
   - VOICE_PROVIDER_MODE=local_only|allow_remote
   - VOICE_PROVIDER_ALLOWLIST=<csv>
2) Add commercialization gate:
   - VOICE_COMMERCIAL_MODE=0|1
   - reject disallowed providers deterministically when commercial mode is on
3) Keep non-breaking API behavior for currently allowed/default provider mode.

Checks:
- npx vitest run tests/startup-config.spec.ts tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 3: Voice metering and budget enforcement

```text
Objective:
Bound COGS risk with deterministic per-tenant/per-mission budgets.

Allowed paths:
- server/routes/voice.ts
- server/services/mission-overwatch/* (only if shared budget helpers are introduced)
- tests/voice.routes.spec.ts
- docs/BUSINESS_MODEL.md

Requirements:
1) Add normalized metering fields (request count, char count, duration when available).
2) Add deterministic budget checks with configured limits:
   - per mission per window
   - per tenant per day (or per process day in single-tenant mode)
3) Return deterministic budget envelope when exceeded.
4) Keep all existing success/error envelope fields backward compatible.

Checks:
- npx vitest run tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 4: Explicit UX controls and coverage for voice mode behavior

```text
Objective:
Encode and test critical user controls for mission voice behavior.

Allowed paths:
- client/src/pages/desktop.tsx
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/audio-focus.ts
- client/src/lib/mission-overwatch/index.ts
- tests/helix-ask-live-events.spec.ts

Requirements:
1) Implement or finalize explicit modes:
   - voice on/off
   - critical-only
   - mute while typing
2) Ensure settings do not alter text answer content or ask pipeline semantics.
3) Add/extend tests for behavior gating and non-regression.

Checks:
- npx vitest run tests/helix-ask-live-events.spec.ts tests/helix-ask-focused-utility-hardening.spec.ts
- casimir verify command
```

## Prompt 5: SLO gate implementation and release checks

```text
Objective:
Turn SLO targets into explicit executable checks.

Allowed paths:
- tests/mission-board.routes.spec.ts
- tests/voice.routes.spec.ts
- tests/mission-overwatch-salience.spec.ts
- docs/runbooks/mission-overwatch-slo-2026-02-23.md (new)
- reports/helix-ask-mission-overwatch-v1-slo-gate-2026-02-23.md (new)

Requirements:
1) Add deterministic performance/reliability gate tests or scripted checks for:
   - mission-board snapshot/events latency budget
   - voice dry-run latency budget
   - deterministic envelope reliability under controlled overload
2) Document thresholds and runner commands in SLO runbook.
3) Add release gate report artifact with pass/fail summary.

Checks:
- npx vitest run tests/mission-board.routes.spec.ts tests/voice.routes.spec.ts tests/mission-overwatch-salience.spec.ts
- casimir verify command
```

## Prompt 6: Final Wave-2B closure report

```text
Objective:
Produce decision-ready closure report for MO-008..MO-012.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-closure-wave2b-readiness-2026-02-23.md (new)
- reports/helix-ask-mission-overwatch-v1-closure-wave2b-ledger-2026-02-23.md

Requirements:
1) Prompt-by-prompt status and commit mapping.
2) Artifact existence table.
3) Final GO/NO-GO with remaining blockers (if any).
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
   - reports/helix-ask-mission-overwatch-v1-closure-wave2b-ledger-2026-02-23.md
   - reports/helix-ask-mission-overwatch-v1-closure-wave2b-readiness-2026-02-23.md

4) Confirm final Casimir block:
   - verdict PASS
   - certificateHash present
   - integrityOk true
```
