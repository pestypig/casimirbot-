# Helix Ask Turn Loop And Non-Voice Debug Framework

Status: active debug guide.

## Turn-By-Turn Loop
1. User speaks in natural chunks.
2. Segments merge into one draft turn while the assembler phase is `draft`.
3. After silence + stability gates pass, the turn seals (`phase=sealed`).
4. One brief is emitted for that sealed revision.
5. One authoritative reasoning attempt runs for that sealed revision/token.
6. Final answer is emitted from normal reasoning output.
7. Any interruption hard-cuts playback, invalidates seal authority, reopens draft, and reseals on newer transcript.

## How To Drive It During Dialogue
1. Start broad.
2. Interrupt quickly to refine scope while brief is speaking.
3. Pause long enough to allow seal.
4. Let final run if it is on track.
5. Interrupt final only when you want a new direction.

## Interruption Example
1. User: "What is a system?"
2. Brief r1: "I will define the system and map components, interactions, and purpose."
3. User interrupts: "Make it about quantum inequality."
4. System hard-cuts playback, suppresses stale attempt, reseals revision 2.
5. Brief r2: "I will frame it as a quantum system and tie it to inequality constraints."
6. User interrupts again: "Compare to classical statistical mechanics."
7. System reseals revision 3 and runs one authoritative attempt.
8. Final speaks the comparison.
9. User interrupts final: "Now relate this to Penrose collapse."
10. Final is cut and a new draft/reseal chain starts.

## Healthy Timeline Signals
1. `prompt_recorded` appears for latest utterance.
2. `brief` queued/running occurs before final.
3. Older attempts are `suppressed` only when causally stale.
4. No stale replay loop or soft lock.
5. Final is spoken unless barge-in occurs.
6. `build_info` is present with current client + server build provenance.

## Non-Voice Debug Framework
Use the deterministic harness instead of mic/STT/TTS:
- Module: `client/src/lib/helix/turn-loop-harness.ts`
- Tests: `client/src/lib/helix/__tests__/turn-loop-harness.spec.ts`
- Timeline reference analyzer: `client/src/lib/helix/turn-loop-timeline-reference.ts`
- Timeline analyzer tests: `client/src/lib/helix/__tests__/turn-loop-timeline-reference.spec.ts`

The harness simulates:
1. Segment merge and revision increments.
2. Seal-gate evaluation (`closeSilence=3200ms`, `hashStable=900ms` by default).
3. Attempt start/resolve with revision+seal authority checks.
4. Interruption/reseal and stale-attempt suppression.
5. Event timeline emission with sequence, revision, seal token, suppression cause, and reject stage.

The timeline analyzer validates real voice-lane event logs as a reference:
1. Parses JSONL timeline dumps (`timeline:*`, `voice-chunk:*`, etc.).
2. Summarizes per-turn lifecycle health.
3. Flags missing brief-before-final ordering.
4. Flags missing typed suppression causes.
5. Flags soft-lock candidates (suppression loops without final completion).

## Run The Debug Tests
```powershell
npm run test -- client/src/lib/helix/__tests__/turn-loop-harness.spec.ts
npm run test -- client/src/lib/helix/__tests__/turn-loop-timeline-reference.spec.ts
```

## What The Harness Verifies
1. Seal only happens when all gate conditions are true at once.
2. Interrupted stale attempts are suppressed with typed cause.
3. Newest resealed attempt finalizes without soft lock.
4. Event sequence is monotonic and replay-friendly.
