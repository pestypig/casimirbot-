# Helix Ask x Dottie Pipeline Bottleneck Audit (2026-02-24)

## Stage map
| Stage | Primary files | IO contract | Determinism contract | Failure modes |
|---|---|---|---|---|
| Ingest/normalize | `server/services/mission-overwatch/event-normalizer.ts` | raw event -> normalized event | fixed enum defaults, deterministic timestamp fallback | invalid event shape, unknown types, missing mission/event IDs |
| Salience gate | `server/services/mission-overwatch/salience.ts` | normalized event -> speak/suppress decision + reason | deterministic cooldown/rate logic from state and key tuple | rate limit saturation, missing dedupe key, invalid ts ordering |
| Orchestration | `server/services/mission-overwatch/dottie-orchestrator.ts` | normalized + salience -> outcome (+ debrief candidate) | micro-debrief creation follows classification gates | no persistence for debrief lifecycle, weak reason taxonomy |
| Mission board persistence | `server/routes/mission-board.ts`, `server/services/mission-overwatch/mission-board-store.ts` | route payloads <-> event/action records | sorted by `(ts,eventId)`, stable status fold rules | storage unavailable, shape mismatch, missing references |
| Voice emission | `server/routes/voice.ts` + service adapters | text/utility -> voice speak request | bounded payload lengths + optional suppression | backend key missing, voice lane timeout, noisy repeats |

## Bottleneck register
| ID | Severity | Bottleneck | Evidence | Unblock action |
|---|---|---|---|---|
| B1 | High | Orchestrator debrief generation is inline and non-persisted, limiting replay closure semantics. | `dottie-orchestrator` constructs debrief but does not persist linkage metadata.【server/services/mission-overwatch/dottie-orchestrator.ts:31-44】 | Persist `derived_from` links through mission-board write path.
| B2 | High | Mission board snapshot ack resolution depends on overloaded `evidenceRefs` semantics, increasing ambiguity. | ack logic deletes unresolved critical IDs from evidence refs list.【server/routes/mission-board.ts:174-184】 | Add explicit ack linkage field and deterministic parser contract.
| B3 | Medium | Event normalization path lacks explicit timer-specific validation in route layer. | timer_update exists as enum, but no timer schema in top-level event object in mission-board route section shown.【server/routes/mission-board.ts:20-47】 | Add timer payload schema + tests for deterministic timer updates.
| B4 | Medium | Salience dedupe key in orchestrator uses raw `eventId` only, not canonical normalized tuple. | salience call uses `dedupeKey: raw.eventId` directly.【server/services/mission-overwatch/dottie-orchestrator.ts:25】 | Build stable hash from `(mission,eventType,classification,text)` when eventId absent/noisy.
| B5 | Medium | Storage-unavailable handling maps all persistence errors to one 503 envelope, reducing actionable diagnostics. | `missionBoardUnavailable` emits single `mission_board_unavailable` envelope for all errors.【server/routes/mission-board.ts:124-133】 | Preserve deterministic sub-reason labels while keeping public contract stable.

## Top 5 blockers by impact/effort
1. B1 (high impact / medium effort)
2. B2 (high impact / medium effort)
3. B3 (medium impact / low-medium effort)
4. B4 (medium impact / low effort)
5. B5 (medium impact / low effort)

## Instrumentation gaps + required metrics
- Missing explicit counters for suppression reason distribution by event class (`suppression_reason_count{reason,event_type}`).
- Missing timer lifecycle latency (`timer_due_ts - now` at callout/debrief emit).
- Missing closure-loop SLI (`trigger_to_ack_ms`, `ack_to_outcome_ms`, `trigger_to_debrief_closed_ms`).
- Missing overload envelope observability (`agi_overload_429_count{reason,route}`).
- Missing certainty parity drift monitor (`voice_certainty_gt_text_certainty_count`).
