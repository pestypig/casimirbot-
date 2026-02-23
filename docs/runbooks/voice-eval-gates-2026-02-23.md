# Voice Eval Gates (2026-02-23)

Regression gates for ownership-first Dottie voice mode.

## Offline-core gate suite
- `tests/voice.offline-core.spec.ts`
- `tests/voice.routes.spec.ts`

## Required assertions
1. Managed providers disabled mode is deterministic and blocks non-critical managed calls.
2. Mission-critical callouts continue to synthesize through local-only routing.
3. Request envelopes and deterministic error codes remain stable for replay.

## Harness hook guidance
- Run in CI with stable env:
  - `VOICE_PROXY_DRY_RUN=1`
  - `VOICE_MANAGED_PROVIDERS_ENABLED=0`
  - `VOICE_LOCAL_ONLY_MISSION_MODE=1`
- Keep prompt fixtures deterministic (fixed priorities, trace IDs, and provider selection).
