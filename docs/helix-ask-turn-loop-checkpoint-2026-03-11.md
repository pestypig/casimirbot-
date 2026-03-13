# Helix Ask Voice/Reasoning Checkpoint (2026-03-11)

Status: active checkpoint for conversational-lane stability on mobile and desktop voice surfaces.

## Baseline Identity
- Date: 2026-03-11
- Branch: `main`
- Commit: `b2be6f71`
- Client build observed: `client:2026-03-11T02:27:17.822Z`
- Server build observed: `0.0.0` (runtime banner)

## Why This Checkpoint Matters
This checkpoint captures the first session sequence where conversational flow
stayed coherent across multiple interruptions while mobile playback remained
audible under the audio-graph path. It also captures the guardrail fix that
prevents runtime-fallback boilerplate from being voiced as final content.

## Known-Good Signals (Observed)
1. Conversational turn loop remains deterministic under interruption:
   - `brief` and `final` revisions supersede correctly.
   - stale chunks are cancelled with typed suppression.
2. Audio graph path is active and stable in successful runs:
   - `expectedPath: "audio_graph"`
   - `audioUnlocked: true`
   - `audioGraphAttached: true`
   - `gainNodeValue: 5`
3. Chunk playback progression is healthy when stable:
   - `chunk_synth_ok -> chunk_play_start -> chunk_play_end` across prefetched chunks.
4. Mobile STT format path is valid in successful runs:
   - `voiceRecorderMimeType: "audio/mp4;codecs=mp4a.40.2"`
   - multiple `stt_ok` segments in same session.
5. Runtime-fallback artifact spill is now guarded in voice lane:
   - repeated `Runtime fallback: fetch failed` text is treated as artifact-dominated.
   - guard triggers restart/clarify path instead of voicing boilerplate finals.

## Behavior Contract To Preserve
1. One sealed revision yields one authoritative reasoning attempt.
2. Brief is conversational and precedes final unless barge-in interrupts.
3. Interruption hard-cuts playback and reseals with newer transcript.
4. Suppression remains typed (`suppressionCause`, `authorityRejectStage`).
5. Voice certainty must not exceed text certainty.
6. Runtime fallback diagnostics may exist in debug payloads, but must not leak
   into spoken final text.

## Evidence Anchors From This Run Class
- Turn key examples:
  - `voice:459c86fb-233f-4866-9924-799b980cae10`
  - `voice:67b4020b-a3f9-4195-9d3b-8a3039fe97b7`
- Typed suppression examples:
  - `inactive_attempt`
  - `artifact_guard_restart`
- Audio health snapshot examples:
  - `audioUnlocked: true`
  - `audioGraphAttached: true`
  - `fallbackCount: 0` (stable run)

## Residual Gaps (Still Open)
1. Intermittent iOS playback instability remains possible:
   - occasional `voice_audio_playback_error` with `media_err_unknown`.
2. STT still has sporadic low-information segment misses:
   - occasional `stt_error: no_transcript`.
3. Settings-open interaction can still perturb active playback in some sessions.

## Regression Checklist (Quick)
Run before calling a new build stable:

```powershell
npm run test -- client/src/lib/helix/__tests__/turn-loop-harness.spec.ts
npm run test -- client/src/lib/helix/__tests__/turn-loop-timeline-reference.spec.ts
npm run test -- client/src/components/__tests__/helix-ask-pill-ui.spec.tsx
npm run test -- client/src/components/__tests__/helix-read-aloud-state.spec.ts
npm run test -- tests/helix-conversation-turn.routes.spec.ts
```

Required gate:

```powershell
npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export
```

## Related References
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/voice-service-contract.md`
- `docs/helix-ask-turn-loop-checkpoint-2026-03-10.md`
- `docs/helix-ask-turn-loop-debug-framework.md`

