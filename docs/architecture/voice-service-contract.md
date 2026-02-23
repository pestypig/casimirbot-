# Voice Service Contract (v1)

Status: draft.

## Purpose
Define a stable server-side contract for Dot-style callouts and briefings while
keeping TTS engine implementation replaceable.

## Architecture boundary
- Helix server exposes a proxy route under `/api/voice/*`.
- Proxy forwards to a dedicated local/remote TTS service via `TTS_BASE_URL`.
- If voice is not configured, proxy returns deterministic capability error.

## Endpoint
`POST /api/voice/speak`

## Request body
```json
{
  "text": "Evidence gate passed. Next action: verify equation tree coverage.",
  "mode": "callout",
  "priority": "warn",
  "voiceProfile": "dottie_default",
  "format": "wav",
  "consent_asserted": true,
  "watermark_mode": "default",
  "traceId": "ask:abc123",
  "missionId": "mission-42",
  "eventId": "evt-908",
  "referenceAudioHash": null
}
```

## Request rules
- `text` required, trimmed, max length enforced.
- `mode` enum: `callout|briefing|debrief`.
- `priority` enum: `info|warn|critical|action`.
- `consent_asserted` required for any reference-audio or custom profile route.
- `traceId` recommended for replay/audit linkage.
- `missionId` and `eventId` optional but recommended for Go Board linkage.

## Response (success)
Headers:
- `content-type: audio/wav` (or requested format)
- `x-voice-provider`
- `x-voice-profile`
- `x-watermark-mode`

Body:
- audio bytes.

## Response (JSON metadata mode, optional)
```json
{
  "ok": true,
  "audioUrl": "/api/voice/artifacts/voice-3f92.wav",
  "durationMs": 1840,
  "provider": "local-chatterbox",
  "voiceProfile": "dottie_default",
  "watermarkApplied": true,
  "traceId": "ask:abc123"
}
```

## Error envelope
```json
{
  "error": "voice_unavailable",
  "message": "Voice service is not configured.",
  "details": {
    "providerConfigured": false
  },
  "traceId": "ask:abc123"
}
```

Stable error codes:
- `voice_unavailable`
- `voice_invalid_request`
- `voice_consent_required`
- `voice_rate_limited`
- `voice_queue_full`
- `voice_backend_timeout`
- `voice_backend_error`


## Ownership-first routing policy (mission callouts)
- Mission-critical callouts (`priority=critical|action` or explicit mission/go-board events) must route through the local ownership path first.
- Managed providers are fallback-only and must never be required for production-core mission continuity.
- If managed providers are disabled, `/api/voice/speak` must continue serving local-capable synthesis or deterministic `voice_unavailable`/capacity envelopes.

## Governance fields (consent + profile)
The request contract supports explicit governance fields and existing clients remain compatible:
- `consent_asserted` indicates operator consent for custom/reference voice paths.
- `voiceProfile` remains accepted for current clients.
- `voice_profile_id` is an optional alias for policy-controlled profile routing.
- `referenceAudioHash` is audit metadata, not an implicit consent bypass.

Compatibility rule: servers should accept existing payloads without requiring new fields unless custom-profile governance policy explicitly demands consent.

## Runtime controls
- Concurrency guard for synthesis jobs.
- Queue cap with deterministic rejection when full.
- Timeout budget for backend call.
- Priority handling: `critical` and `action` may preempt lower-priority queued
  callouts.

## Policy controls
- Certainty parity: voice must not amplify certainty beyond text.
- Low-noise guard: duplicate callouts within cooldown are suppressed.
- Audit minimum fields:
  - `ts`
  - `traceId`
  - `missionId`/`eventId` (if present)
  - `voiceProfile`
  - `mode`
  - `priority`
  - `consent_asserted`
  - `referenceAudioHash` (if provided)

## Integration points
- Input signals from Helix Ask live events and final envelopes.
- Optional integration with Mission Go Board event stream.
- `client/src/lib/audio-focus.ts` should control barge-in behavior to avoid
  overlapping playback.

## Acceptance criteria (v1)
- Returns audio for valid configured requests.
- Returns deterministic JSON error envelope when unavailable or invalid.
- Enforces consent and request limits.
- Emits enough metadata for replay and operator audit.
