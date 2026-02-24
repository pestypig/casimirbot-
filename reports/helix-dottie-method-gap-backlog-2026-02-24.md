HEAD=d1c6a0db8132300f12672f749098e49896d92cc2
Date=2026-02-24

# Helix Ask x Dottie Method Gap Backlog 2026-02-24

Severity:
- P0 = launch blocker
- P1 = major
- P2 = later hardening

Effort:
- S = <= 2 days
- M = <= 2 weeks
- L = > 2 weeks

## Backlog

P0 / S - Require deterministic Tier1 event timestamps
- Files: `server/routes/mission-board.ts`
- Change: `contextEventSchema.ts` must be required for Tier1 active sessions.
- Behavior: return deterministic error envelope when missing.

P0 / S - Default repo-attribution for mission callouts
- Files: `server/routes/voice.ts`
- Change: `repoAttributed` defaults to true when `missionId` and `mode=callout`.

P0 / M - Eliminate `Date.now()` identity defaults in production mode
- Files: `server/routes/mission-board.ts`
- Change: require `actionId`/`requestedAt` in strict mode and reject unparseable `ack.ts`.

P1 / M - Policy drift prevention matrix test
- Files: `server/routes/voice.ts`, `server/services/mission-overwatch/salience.ts`, `client/src/lib/mission-overwatch/index.ts`
- Add: one matrix test for `(tier, sessionState, voiceMode, classification)` parity across layers.

P1 / M - Replay-safe voice policy evaluation clock
- Files: `server/routes/voice.ts`
- Add: deterministic timestamp input for cooldown/rate evaluation in replay mode.

P1 / M - Persist trace linkage in mission-board events
- Files: `server/services/mission-overwatch/mission-board-store.ts`, `server/routes/mission-board.ts`
- Add: `traceId`, `contextTier`, `sessionState` persistence and readback.

P0 / S - Strict persistence mode
- Files: `server/services/mission-overwatch/mission-board-store.ts`
- Add: `MISSION_BOARD_STORE_STRICT=1` hard-fails on DB-unavailable instead of memory fallback.

P2 / M - Operator-visible voice policy snapshot
- Files: `server/routes/voice.ts`
- Add: `GET /api/voice/policy` exposing governance and breaker state.
