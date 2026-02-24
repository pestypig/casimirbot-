# Helix Ask x Dottie Pipeline Bottleneck Audit (2026-02-24)

Status: draft  
Scope: current `main` audit for reasoning -> mission event -> voice callout path.

## Stage map (current code)

| Stage | Owner files | Inputs -> Outputs | Deterministic contract | Primary failure modes |
|---|---|---|---|---|
| API ingress + route registration | `server/routes.ts:20`, `server/routes.ts:25`, `server/routes.ts:26`, `server/routes.ts:92` | HTTP request -> route dispatch | Optional API rate limit middleware shape (`rate_limited` envelope when enabled) | Admission controls depend on env gate (`RATE_LIMIT_ENABLED`) |
| Ask route mode/contracts | `tests/helix-ask-modes.spec.ts:21`, `tests/helix-ask-modes.spec.ts:98`, `tests/helix-ask-modes.spec.ts:102` | Ask payload -> `phase6.ask.v1` style envelope | Test evidence for normalized contract + deterministic `fail_class/fail_reason` | Missing/invalid input, strict provenance failures |
| Mission event normalization | `server/services/mission-overwatch/event-normalizer.ts:34`, `server/services/mission-overwatch/event-normalizer.ts:64`, `server/services/mission-overwatch/event-normalizer.ts:88` | Raw event -> normalized event + deterministic ID | SHA-256 canonical ID + stable normalization | Heuristic classification only (keyword rules) |
| Mission salience decision | `server/services/mission-overwatch/salience.ts:21`, `server/services/mission-overwatch/salience.ts:50`, `server/services/mission-overwatch/salience.ts:107` | Normalized event -> `speak/no-speak` + reason | Typed reasons (`emit`, `dedupe_cooldown`, `mission_rate_limited`, `context_ineligible`) | Context ineligible suppression, dedupe, mission window cap |
| Voice proxy governance + budget | `server/routes/voice.ts:9`, `server/routes/voice.ts:25`, `server/routes/voice.ts:237`, `server/routes/voice.ts:312`, `server/routes/voice.ts:327`, `server/routes/voice.ts:338` | Voice request -> audio or deterministic suppression/error | Typed errors (`voice_invalid_request`, `voice_provider_not_allowed`, `voice_budget_exceeded`, `voice_rate_limited`) + suppression reasons | Budget/rate rejection, provider governance block, context suppression |
| Mission board persistence/snapshot | `server/routes/mission-board.ts:20`, `server/routes/mission-board.ts:77`, `server/routes/mission-board.ts:162`, `server/routes/mission-board.ts:261` | Board event/action -> mission snapshot/events | Snapshot folding from ordered events + deterministic event enums | Store unavailable, invalid payload, unresolved critical accumulation |

## Bottleneck register

| ID | Severity | Symptom | Evidence | Root cause | Unblock action |
|---|---|---|---|---|---|
| `BOT-LLM-001` | Critical | Long-tail ask latency and queue buildup | `docs/helix-ask-runtime-limitations.md:35`, `docs/helix-ask-runtime-limitations.md:45`, `docs/helix-ask-runtime-limitations.md:52` | CPU generation throughput (~3-4 tok/s) + serialized concurrency (`concurrency=1`) | Implement adaptive token budgets + dedicated inference endpoint migration path |
| `BOT-QUEUE-002` | High | Operator-facing backlog feels stalled under concurrent asks | `docs/helix-ask-runtime-limitations.md:54`, `docs/helix-ask-runtime-limitations.md:132` | Queue exists but no hard admission cap behavior documented as active default | Add explicit queue caps and deterministic overload envelopes for `/api/agi/*` |
| `BOT-CONTRACT-003` | High | Text/voice/board behavior can drift | `server/services/mission-overwatch/salience.ts:21`, `server/routes/voice.ts:237`, `server/routes/mission-board.ts:20` | No single enforced cross-surface contract in runtime code | Enforce shared prompt-style contract + parity tests in CI |
| `BOT-THREAT-004` | Medium | Threat interpretation quality limited | `server/services/mission-overwatch/event-normalizer.ts:34` | Keyword heuristic classification without contradiction/corroboration model | Add typed threat object contract + contradiction tests |
| `BOT-TIMER-005` | Medium | Time-to-event not first-class in orchestration | `server/routes/mission-board.ts:20`, `server/services/mission-overwatch/salience.ts:107` | Timer events exist by enum, but no explicit T-minus policy/contract surfaced here | Add timer entity semantics with deterministic countdown/escalation rules |

## Top 5 blockers by impact/effort

| Rank | Blocker | Impact | Effort | Rationale |
|---|---|---|---|---|
| 1 | Ask-path overload envelopes | High | Medium | Current runtime constraints show queue pressure risk; deterministic 429 behavior should be explicit in ask routes |
| 2 | Cross-surface parity tests (text/voice/board) | High | Medium | Policy exists, but enforcement needs automated parity checks |
| 3 | Threat model upgrade from regex heuristics | Medium | Medium | Current classification is deterministic but shallow |
| 4 | Timer update contract wiring | Medium | Medium | Mission board supports timer event type but lacks first-class timer semantics |
| 5 | Per-stage observability | High | Medium | Need latency/gate/suppression metrics for operator SLO confidence |

## Instrumentation gaps (current state)

1. Per-stage timing (retrieve, gate, synthesize, voice proxy) is not emitted as a unified pipeline metric artifact.
2. Queue depth/admission pressure metrics for `/api/agi/*` are not surfaced as first-class operator telemetry.
3. Cross-surface parity counters (`voice_certainty > text_certainty`, missing evidence suppressions) are not published as rollups.
4. Mission-level suppression reason histograms are not exposed for replay trend analysis.
5. Timer escalation metrics (time-to-breach, overdue duration) are not represented in current board snapshot contract.

## Evidence notes

- Runtime doc explicitly identifies CPU throughput and serialized concurrency as the dominant bottleneck (`docs/helix-ask-runtime-limitations.md:35-54`).
- Salience and voice layers already have deterministic suppression/error reasons; this is a strong base to extend into unified parity enforcement (`server/services/mission-overwatch/salience.ts:21`, `server/routes/voice.ts:237-245`, `server/routes/voice.ts:338-347`).
- Mission board has deterministic event model and snapshot fold path but still requires deeper timer/threat semantics for full Auntie-Dot-style situational-awareness behavior (`server/routes/mission-board.ts:20-33`, `server/routes/mission-board.ts:162-231`).
