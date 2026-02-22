# Helix Ask Mission Systems Codex Cloud Autorun Batch Prompt Pack (2026-02-22)

Derived from:
- `docs/architecture/helix-ask-mission-systems-integration-plan.md`
- `docs/audits/research/helix-ask-mission-systems-research-annex-2026-02-22.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/BUSINESS_MODEL.md`

Use this document to run mission-systems implementation in Codex Cloud with deterministic sequencing and mandatory Casimir verification.

Execution ledger for this batch:
- `reports/helix-ask-mission-systems-execution-ledger-2026-02-22.md`

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Preserve Helix Ask scientific/evidence posture; no overclaiming certainty.
2) Voice must remain event-driven, low-noise, rate-limited, and action-oriented.
3) Do not break existing /api/agi/ask behavior or job lifecycle paths.
4) Keep local-first ownership assumptions and replaceable TTS backend boundary.
5) Use deterministic error envelopes for new mission/voice endpoints.
6) Keep patch scope path-bounded per prompt.

Mandatory verification gate after each patch:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix the first failing HARD constraint
- rerun verification until PASS

Always report:
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
AUTORUN. Execute this full batch end-to-end without pause unless a hard blocker prevents continuation.

Primary source of truth:
- docs/audits/research/helix-ask-mission-systems-codex-cloud-autorun-batch-prompt-pack-2026-02-22.md
- docs/architecture/helix-ask-mission-systems-integration-plan.md
- docs/audits/research/helix-ask-mission-systems-research-annex-2026-02-22.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md

Objective:
Run Prompt -1 through Prompt 10 in strict order, one prompt scope per commit, including required checks and Casimir verification after each prompt.

Global rules:
1) Execute exactly in order: -1 -> 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10.
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

Final deliverables:
- ordered commit table by prompt
- final artifact table (exists/missing)
- final GO/NO-GO and top blockers
```

## Prompt -1: Research annex preflight and evidence lock

```text
Objective:
Load and normalize decision context so implementation prompts inherit the full research rationale, not only build steps.

Allowed paths:
- docs/audits/research/helix-ask-mission-systems-research-annex-2026-02-22.md
- reports/helix-ask-mission-systems-execution-ledger-2026-02-22.md

Requirements:
1) Read the annex and extract:
   - assumptions register
   - rejected alternatives
   - time-sensitive external dependency notes
   - leadership decision backlog
2) Add a preflight block to the execution ledger capturing these as locked context.
3) If implementation prompts conflict with annex constraints, log conflict and mark affected prompts partial-blocked until reconciled.

Checks:
- casimir verify command

Done criteria:
- Execution starts with an explicit evidence/rationale baseline and conflict policy.
```

## Prompt 0: Coordinator and execution ledger

```text
Objective:
Create deterministic execution tracking for this batch.

Allowed paths:
- reports/helix-ask-mission-systems-execution-ledger-2026-02-22.md (new)
- docs/audits/research/helix-ask-mission-systems-codex-cloud-autorun-batch-prompt-pack-2026-02-22.md

Requirements:
1) Add rows for Prompt -1..10 with status, commit hash, checks, and Casimir fields.
2) Define lanes:
   - lane_research_annex
   - lane_contracts
   - lane_server_overwatch
   - lane_client_overwatch
   - lane_quality_slo
   - lane_commercial_controls
3) Add deterministic done checklist per prompt.

Checks:
- casimir verify command

Done criteria:
- Ledger is ready for replay-auditable batch tracking.
```

## Prompt 1: Contract lock and optional non-breaking diffs

```text
Objective:
Freeze mission and voice contract implementation targets before server work.

Allowed paths:
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/architecture/helix-ask-mission-systems-integration-plan.md
- docs/architecture/mission-systems-contract-diff-2026-02-22.md (new)

Requirements:
1) Confirm required endpoint shapes and deterministic error envelopes.
2) If needed, add only non-breaking optional fields:
   - voice: dedupe_key, mission_id, event_id
   - mission-board: optional SSE stream endpoint
3) Record accepted/rejected diff decisions with rationale.

Checks:
- markdown consistency checks if available
- casimir verify command

Done criteria:
- Contract surface is explicit and stable for implementation.
```

## Prompt 2: Voice proxy route and provider boundary

```text
Objective:
Implement server voice proxy contract without modifying Helix Ask ask API behavior.

Allowed paths:
- server/routes/voice.ts (new)
- server/routes.ts
- server/startup-config.ts (if needed)
- tests/voice.routes.spec.ts (new)

Requirements:
1) Implement POST /api/voice/speak with deterministic envelope behavior.
2) Enforce:
   - text length cap
   - priority/mode validation
   - consent_asserted rules
   - queue/rate limits and cooldown hooks
3) Add provider boundary via TTS_BASE_URL and deterministic fallback when unavailable.
4) Keep this route independent from /api/agi/ask internals.

Checks:
- npx vitest run tests/voice.routes.spec.ts
- casimir verify command

Done criteria:
- Voice route is contract-compliant, deterministic, and fail-safe.
```

## Prompt 3: Mission Go Board persistence and APIs

```text
Objective:
Implement mission-board state storage and baseline API endpoints per spec.

Allowed paths:
- server/routes/mission-board.ts (new)
- server/routes.ts
- server/services/mission-board/* (new)
- server/db/migrations/025_mission_board.ts (new)
- tests/mission-board.routes.spec.ts (new)

Requirements:
1) Implement endpoints:
   - GET /api/mission-board/:missionId
   - GET /api/mission-board/:missionId/events
   - POST /api/mission-board/:missionId/actions
   - POST /api/mission-board/:missionId/ack
2) State must be reconstructable from event log folds.
3) Deterministic ordering and idempotency for repeated event ingestion.
4) Use one deterministic error envelope shape.

Checks:
- npx vitest run tests/mission-board.routes.spec.ts
- casimir verify command

Done criteria:
- Go Board APIs are stable, replay-safe, and spec-aligned.
```

## Prompt 4: Dottie orchestration service (ingest -> salience -> debrief)

```text
Objective:
Implement deterministic server orchestration for mission callouts and micro-debriefs.

Allowed paths:
- server/services/mission-overwatch/dottie-orchestrator.ts (new)
- server/services/mission-overwatch/salience.ts (new)
- server/services/mission-overwatch/event-normalizer.ts (new)
- server/services/mission-overwatch/micro-debrief.ts (new)
- tests/mission-overwatch-salience.spec.ts (new)

Requirements:
1) Ingest normalized events from:
   - Helix Ask job lifecycle
   - Helix Ask tool logs
   - operator readiness and board timers
2) Emit deterministic outputs:
   - board state updates
   - callout decisions (info|warn|critical|action)
   - micro-debrief append events
3) Implement cooldown/dedupe policy with stable keys.
4) No LLM dependency for v1 salience decisions.

Checks:
- npx vitest run tests/mission-overwatch-salience.spec.ts
- casimir verify command

Done criteria:
- Orchestrator produces replayable, low-noise callout decisions.
```

## Prompt 5: Helix Ask integration hooks (desktop + pill)

```text
Objective:
Wire mission-overwatch state and callout outputs into existing Helix Ask surfaces.

Allowed paths:
- client/src/pages/desktop.tsx
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/audio-focus.ts
- client/src/lib/mission-overwatch/* (new)
- tests/helix-ask-live-events.spec.ts

Requirements:
1) Subscribe to mission-board snapshots/events without regressing current ask flow.
2) Add callout playback gating using existing audio focus behavior.
3) Add user controls:
   - voice on/off
   - critical-only
   - mute while typing
4) Preserve existing ask output rendering and queue behavior.

Checks:
- npx vitest run tests/helix-ask-live-events.spec.ts
- casimir verify command

Done criteria:
- Overwatch overlays are additive and non-breaking in both surfaces.
```

## Prompt 6: Operator actions, timers, and risk transitions

```text
Objective:
Add actionable mission controls and deterministic state transitions.

Allowed paths:
- server/services/mission-board/*
- client/src/lib/mission-overwatch/*
- client/src/components/helix/* (only mission-overwatch related components)
- tests/mission-board.state.spec.ts (new)

Requirements:
1) Implement operator intents:
   - ACK_AND_CONTINUE
   - VERIFY_WITH_SENSOR
   - NAVIGATE_TO
   - ESCALATE_TO_COMMAND
   - START_TIMER/CANCEL_TIMER
   - MARK_RISK_MITIGATED/MARK_FALSE_ALARM
2) Implement timer threshold triggers (T-60, T-10, overdue) as deterministic events.
3) Ensure confidence state propagation on risk/claim objects.

Checks:
- npx vitest run tests/mission-board.state.spec.ts
- casimir verify command

Done criteria:
- Mission actions and timer/risk transitions are deterministic and replay-safe.
```

## Prompt 7: Quality gates, SLO instrumentation, and regressions

```text
Objective:
Add test coverage and measurable runtime SLO hooks for mission systems.

Allowed paths:
- tests/voice.routes.spec.ts
- tests/mission-board.routes.spec.ts
- tests/mission-overwatch-salience.spec.ts
- tests/helix-ask-focused-utility-hardening.spec.ts
- docs/runbooks/mission-overwatch-slo-2026-02-22.md (new)

Requirements:
1) Add/extend tests for:
   - deterministic error envelopes
   - dedupe/cooldown enforcement
   - no regressions to focused utility behavior
2) Define SLO targets and measurement points:
   - callout decision latency
   - board update latency
   - false positive callout rate
3) Ensure regression tests fail if voice certainty exceeds text certainty markers.

Checks:
- npx vitest run tests/voice.routes.spec.ts tests/mission-board.routes.spec.ts tests/mission-overwatch-salience.spec.ts tests/helix-ask-focused-utility-hardening.spec.ts
- casimir verify command

Done criteria:
- Mission features are test-gated with explicit SLO metrics.
```

## Prompt 8: Commercial and provider gating controls

```text
Objective:
Implement policy-ready provider gating and documentation for commercialization.

Allowed paths:
- docs/BUSINESS_MODEL.md
- docs/runbooks/voice-provider-policy-2026-02-22.md (new)
- server/startup-config.ts
- tests/startup-config.spec.ts

Requirements:
1) Add provider policy model with explicit commercial_allowed flag.
2) Fail closed if provider policy is required but missing/invalid.
3) Document provider selection modes:
   - self-hosted only
   - managed allowlist
   - disabled
4) Keep pricing references time-sensitive and externalized in docs.

Checks:
- npx vitest run tests/startup-config.spec.ts
- casimir verify command

Done criteria:
- Provider governance is enforceable and auditable for enterprise lanes.
```

## Prompt 9: Training trace and replay integration

```text
Objective:
Tie mission events/callouts/actions into existing trace export and replay pipeline.

Allowed paths:
- server/routes/training-trace.ts
- server/services/observability/training-trace-store.ts
- docs/architecture/mission-go-board-spec.md
- tests/trace-export.spec.ts

Requirements:
1) Emit mission-overwatch trace events with stable kinds and IDs.
2) Link callouts/actions to mission_id + event_id + trace_id.
3) Ensure export remains JSONL-compatible and backward compatible.
4) Add replay notes for derived micro-debrief events.

Checks:
- npx vitest run tests/trace-export.spec.ts
- casimir verify command

Done criteria:
- Mission loop is visible in training-trace export with replay-safe linkage.
```

## Prompt 10: Final hardening and release readiness report

```text
Objective:
Produce final integration closure report and GO/NO-GO decision.

Allowed paths:
- reports/helix-ask-mission-systems-release-readiness-2026-02-22.md (new)
- reports/helix-ask-mission-systems-execution-ledger-2026-02-22.md

Requirements:
1) Summarize prompt-by-prompt outcomes and commit list.
2) Report all artifacts as EXISTS/MISSING.
3) Include final Casimir block and certificate metadata.
4) Provide GO/NO-GO with top blockers and deterministic next actions.

Checks:
- casimir verify command

Done criteria:
- Batch has an auditable closure artifact suitable for leadership review.
```

## Suggested batch command checklist (operator side)

```text
1) Start server:
   npm run dev:agi:5173

2) Paste the "Single autorun launcher prompt" into Codex Cloud.

3) After batch completes, verify final report artifacts exist:
   - reports/helix-ask-mission-systems-execution-ledger-2026-02-22.md
   - reports/helix-ask-mission-systems-release-readiness-2026-02-22.md

4) Confirm final Casimir block in report has:
   - verdict PASS
   - certificateHash present
   - integrityOk true
```
