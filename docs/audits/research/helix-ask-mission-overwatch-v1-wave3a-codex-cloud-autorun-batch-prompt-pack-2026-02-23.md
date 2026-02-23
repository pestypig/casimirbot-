# Helix Ask Mission Overwatch v1 Wave 3A Dot Reality Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- Research handback: "Auntie Dottie Operating Model for Dot-Style Situational Awareness on Current Devices" (2026-02-23)
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/helix-ask-runtime-limitations.md`
- `docs/BUSINESS_MODEL.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `reports/helix-ask-mission-overwatch-v1-closure-wave2b-readiness-2026-02-23.md`

## Baseline lock

Use this exact baseline and do not re-open completed slices:
- `origin/main@9cea4805`

Wave-3A scope is implementation of "Dot reality now" with session-based context:
- Tier 0/Tier 1 context model and explicit permission posture
- Always-visible context state and controls in Helix Ask UI
- Deterministic, low-noise context event ingestion and callout gating
- Non-breaking integration with mission-overwatch and Helix Ask APIs
- Latency/noise SLO gates for context-driven callouts

Execution ledger for this wave:
- `reports/helix-ask-mission-overwatch-v1-wave3a-ledger-2026-02-23.md`

Ledger policy: update prompt table and per-prompt report block after every prompt commit.

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Preserve Helix Ask scientific/evidence posture and certainty parity.
2) Voice remains event-driven, low-noise, rate-limited, action-oriented.
3) Do not break /api/agi/ask behavior or existing job lifecycle paths.
4) Keep mission and voice endpoint changes additive/non-breaking.
5) Enforce "no covert monitoring" posture:
   - no hidden sensing
   - no auto-start screen capture
   - no Tier 1+ sensing without explicit user action/session state
6) Keep patch scope path-bounded per prompt.
7) Commit once per prompt scope.

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


## Wave-3A deterministic done checklist

- [ ] Prompt path scope honored for each slice.
- [ ] Tier 0/Tier 1 lock preserved (no speculative Tier 2/3 overreach).
- [ ] Prompt checks executed with deterministic output capture.
- [ ] Casimir verify PASS recorded with certificate hash and `integrityOk: true`.
- [ ] Ledger updated after every prompt commit with status and commit SHA.

## Wave-3A blocker handling policy

If blocked in a prompt, commit the maximal safe additive subset, mark status as `partial-blocked` or `blocked`, and continue to the next prompt while preserving API compatibility and no-covert posture constraints.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Run Prompt 0 through Prompt 8 in strict order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/helix-ask-flow.md
- docs/helix-ask-agent-policy.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md

Baseline lock:
- origin/main@9cea4805

Global rules:
1) Keep changes additive and non-breaking.
2) Implement Tier 0/Tier 1 first; do not over-scope to speculative mobile cross-app features.
3) If blocked, ship max safe additive subset and continue.
4) After each prompt, run prompt checks and mandatory Casimir verify.
5) On Casimir FAIL, repair first failing HARD constraint and rerun.
6) Do not claim completion without final PASS + integrityOk true.
7) Update Wave-3A ledger after each prompt commit.

Final deliverables:
- ordered commit table
- artifact existence table
- final GO/NO-GO + blockers
- final Casimir PASS block
```

## Prompt 0: Wave-3A ledger and scope lock

```text
Objective:
Create deterministic execution tracking for Wave-3A and lock scope to Tier 0/Tier 1 context reality.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-wave3a-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-mission-overwatch-v1-wave3a-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add prompt table for Prompt 0..8.
2) Add "Wave-3A targets" section with context tier and no-covert constraints.
3) Add deterministic done checklist and blocker policy.

Checks:
- casimir verify command
```

## Prompt 1: Context tier contract and policy docs

```text
Objective:
Define an explicit context session contract (Tier 0/Tier 1 first) and no-covert policy rails.

Allowed paths:
- docs/architecture/dottie-context-session-contract.md (new)
- docs/helix-ask-flow.md
- docs/helix-ask-agent-policy.md
- docs/helix-ask-runtime-limitations.md

Requirements:
1) Define context tiers:
   - Tier 0: text-only
   - Tier 1: explicit screen session
2) Define session states and transitions (idle, requesting, active, stopping, error).
3) Define canonical context event envelope fields.
4) Define policy constraints:
   - explicit user action required for Tier 1 start
   - visible active indicator required
   - no implicit background auto-capture

Checks:
- casimir verify command
```

## Prompt 2: Mission-overwatch context controls library

```text
Objective:
Implement deterministic client-side context controls and eligibility helpers.

Allowed paths:
- client/src/lib/mission-overwatch/index.ts
- client/src/lib/audio-focus.ts
- tests/mission-overwatch-context-controls.spec.ts (new)

Requirements:
1) Add typed control state for:
   - context tier
   - voice mode (off, critical_only, normal, dnd)
   - mute while typing
2) Add persisted helpers for control state.
3) Add deterministic helpers:
   - canStartContextSession
   - shouldEmitContextCallout
4) Ensure helpers do not modify text ask semantics.

Checks:
- npx vitest run tests/mission-overwatch-context-controls.spec.ts
- casimir verify command
```

## Prompt 3: Helix Ask pill context UI

```text
Objective:
Add always-visible Dot context status and control surface in the Helix Ask pill.

Allowed paths:
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/mission-overwatch/index.ts
- tests/helix-ask-live-events.spec.ts

Requirements:
1) Show tier badge and context status (IDLE/LIVE/ERROR).
2) Show active sensor indicators at minimum for Tier 1 screen context.
3) Provide explicit controls for:
   - tier switch
   - voice mode
   - mute while typing
   - stop context session
4) Keep text answer behavior unchanged.

Checks:
- npx vitest run tests/helix-ask-live-events.spec.ts tests/helix-ask-focused-utility-hardening.spec.ts
- casimir verify command
```

## Prompt 4: Desktop Tier 1 context session lifecycle

```text
Objective:
Implement explicit user-started screen session lifecycle in desktop flow.

Allowed paths:
- client/src/pages/desktop.tsx
- client/src/lib/mission-overwatch/index.ts
- tests/mission-context-session.spec.ts (new)

Requirements:
1) Start Tier 1 session only from explicit user action.
2) Use browser screen session capture APIs via user-triggered flow only.
3) Emit context lifecycle events:
   - context_session_started
   - context_session_stopped
   - context_session_error
4) Never auto-restart capture without user action.
5) Stop callout eligibility when session is inactive.

Checks:
- npx vitest run tests/mission-context-session.spec.ts tests/helix-ask-live-events.spec.ts
- casimir verify command
```

## Prompt 5: Non-breaking server context event ingestion

```text
Objective:
Ingest context events into mission-overwatch without breaking existing API behavior.

Allowed paths:
- server/routes.ts
- server/routes/mission-board.ts
- server/services/mission-overwatch/event-normalizer.ts
- tests/mission-board.routes.spec.ts

Requirements:
1) Add additive context event ingestion path under mission-board routes.
2) Validate deterministic payload schema (tier, session state, event type, trace linkage).
3) Preserve deterministic error envelopes and optional traceId parity.
4) Keep /api/agi/ask unchanged.

Checks:
- npx vitest run tests/mission-board.routes.spec.ts tests/mission-board.state.spec.ts
- casimir verify command
```

## Prompt 6: Context salience and low-noise callout policy

```text
Objective:
Map context events into strict salience tiers and callout budgets.

Allowed paths:
- server/services/mission-overwatch/salience.ts
- server/services/mission-overwatch/dottie-orchestrator.ts
- server/routes/voice.ts
- tests/mission-overwatch-salience.spec.ts
- tests/voice.routes.spec.ts

Requirements:
1) Define context event class -> priority mapping:
   - info, warn, critical, action
2) Enforce deterministic cooldown, dedupe, and per-window caps.
3) Ensure no callouts fire when:
   - tier is 0
   - context session is inactive
   - voice mode is off or dnd (except critical policy if defined)
4) Preserve existing voice route contract.

Checks:
- npx vitest run tests/mission-overwatch-salience.spec.ts tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 7: Wave-3A SLO gates and runbook

```text
Objective:
Add executable Wave-3A SLO checks for latency and noise budgets.

Allowed paths:
- docs/runbooks/mission-overwatch-wave3a-slo-2026-02-23.md (new)
- reports/helix-ask-mission-overwatch-v1-wave3a-slo-gate-2026-02-23.md (new)
- tests/mission-overwatch-slo-wave3a.spec.ts (new)
- tests/helix-ask-live-events.spec.ts

Requirements:
1) Define measurable SLOs:
   - event -> visual callout latency
   - event -> voice-callout-start latency budget
   - non-critical callout noise budget per active hour
2) Implement deterministic tests/checks and report pass/fail.
3) Document commands and thresholds in runbook.

Checks:
- npx vitest run tests/mission-overwatch-slo-wave3a.spec.ts tests/helix-ask-live-events.spec.ts
- casimir verify command
```

## Prompt 8: Final Wave-3A readiness report

```text
Objective:
Publish decision-ready closure report for Wave-3A Tier 0/Tier 1 rollout.

Allowed paths:
- reports/helix-ask-mission-overwatch-v1-wave3a-readiness-2026-02-23.md (new)
- reports/helix-ask-mission-overwatch-v1-wave3a-ledger-2026-02-23.md

Requirements:
1) Prompt-by-prompt status and commit mapping.
2) Ordered commit table.
3) Artifact existence table.
4) Final GO/NO-GO with blockers and deferred items (Tier 2/3).
5) Final Casimir PASS block (verdict, firstFail, certificateHash, integrityOk, traceId, runId).

Checks:
- casimir verify command
```

## Operator checklist

```text
1) Start local server:
   npm run dev:agi:5173

2) Paste the single launcher prompt in Codex Cloud.

3) Verify output artifacts:
   - reports/helix-ask-mission-overwatch-v1-wave3a-ledger-2026-02-23.md
   - reports/helix-ask-mission-overwatch-v1-wave3a-slo-gate-2026-02-23.md
   - reports/helix-ask-mission-overwatch-v1-wave3a-readiness-2026-02-23.md

4) Confirm final Casimir block:
   - verdict PASS
   - certificateHash present
   - integrityOk true
```
