# Dottie Context Session Contract (Tier 0 / Tier 1)

## Scope and intent

This contract defines deterministic context-session behavior for Helix Ask mission-overwatch in Wave-3A. Scope is limited to Tier 0 and Tier 1.

## Context tiers

- **Tier 0: text-only**
  - No sensor stream.
  - Context is derived from user-entered text, selected files, and explicit ask session data.
- **Tier 1: explicit screen session**
  - Screen context may be used only after explicit user action.
  - Session is always visible and operator-controllable.

## Session states

- `idle`: no active context session.
- `requesting`: explicit user action initiated; waiting for browser/session consent flow.
- `active`: Tier 1 session is active and eligible for context events.
- `stopping`: explicit stop in progress.
- `error`: start/stream failure or permission revocation.

## Canonical transitions

- `idle -> requesting`: user clicks start Tier 1 context.
- `requesting -> active`: browser/user consent succeeds.
- `requesting -> error`: consent denied, capture unsupported, or setup fails.
- `active -> stopping`: user clicks stop or explicit session teardown command.
- `stopping -> idle`: teardown succeeds.
- `active -> error`: permission revoked or stream failure.
- `error -> idle`: user acknowledges and resets session.

## Canonical context event envelope

```json
{
  "eventId": "ctx_evt_...",
  "ts": "2026-02-23T00:00:00.000Z",
  "traceId": "adapter:...",
  "missionId": "mission-...",
  "tier": "tier0|tier1",
  "sessionState": "idle|requesting|active|stopping|error",
  "eventType": "context_session_started|context_session_stopped|context_session_error|context_signal",
  "classification": "info|warn|critical|action",
  "source": "helix_ask|desktop|mission_overwatch",
  "payload": {}
}
```

## Policy constraints

1) Tier 1 session start requires explicit user action.
2) Tier 1 active indicator must remain visibly present while active.
3) No implicit or background auto-capture.
4) No auto-restart after stop/error without explicit user action.
5) Tier 0 mode must not emit Tier 1 sensor events.

## Deterministic replay requirement

For replay/audit, all context lifecycle changes MUST emit events with stable `eventType`, `tier`, and `sessionState` fields.
