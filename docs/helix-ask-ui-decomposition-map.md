# Helix Ask UI Decomposition Map

Status: first UI ownership extraction wave committed.

## Snapshot

Starting HEAD: `61423d4450bb7f20b31881387b572e2637fa13a0`
`2026-06-27 13:18:18 -0400`, `helix-route-slice-128-objective-scoped-recovery-route-compatible-enforcement`

Ending extraction HEAD: `f6d7d0e77e5bce12e14b11212094a9b9b4fa6ff8`
`2026-06-27 13:39:14 -0400`, `helix-ui-slice-terminal-projection-helpers`

This map is the follow-up documentation artifact for that extraction head.

Unrelated worktree changes remain outside this wave in docs and server objective-route files. They were not staged into the UI extraction commits.

| File | Start lines | End lines | Start bytes | End bytes |
| --- | ---: | ---: | ---: | ---: |
| `client/src/components/helix/HelixAskPill.tsx` | 38,569 | 38,031 | 1,646,339 | 1,655,738 |
| `client/src/lib/agi/api.ts` | 3,197 | 3,197 | 107,642 | 108,912 |
| `client/src/lib/helix/resolveHelixVisibleTerminal.ts` | 507 | 507 | 20,063 | 20,064 |
| `client/src/lib/agi/debugExport.ts` | 1,177 | 1,177 | 61,215 | 61,393 |
| `client/src/lib/helix/turn-loop-harness.ts` | 519 | 521 | 15,450 | 15,512 |

## Selected Candidates

| Slice | Symbols | Readiness | Owner |
| --- | --- | --- | --- |
| Voice transcript helpers | `mergeVoiceTranscriptDraft`, `resolveVoiceDispatchTranscriptFromDraft` | `READY_MECHANICAL` | `client/src/lib/helix/voice/voice-transcript.ts` |
| Voice turn authority | `evaluateVoiceTurnSealGate`, `evaluateVoiceReasoningResponseAuthority` plus authority decision types | `READY_AFTER_CHARACTERIZATION` | `client/src/lib/helix/voice/voice-turn-authority.ts` |
| Terminal projection | `buildVisibleResolvedTurn`, `chooseVisibleFinalText`, `readHelixAskFinalAnswerSourceLabel`, `resolveHelixAskFinalAnswerPresentation`, `renderTypedFailureFallback` | `READY_AFTER_CHARACTERIZATION` | `client/src/lib/helix/ask-terminal-projection.ts` |

## Commits

- `8c5b48dd3` `helix-ui-slice-voice-transcript-helpers`
- `8d91a57f8` `helix-ui-slice-voice-turn-authority`
- `f6d7d0e77` `helix-ui-slice-terminal-projection-helpers`

## New Owners

| Module | Lines | Responsibility |
| --- | ---: | --- |
| `client/src/lib/helix/voice/voice-transcript.ts` | 88 | Pure voice transcript merge and dispatch transcript selection. |
| `client/src/lib/helix/voice/voice-turn-authority.ts` | 155 | Pure voice turn seal and final response authority decisions. |
| `client/src/lib/helix/ask-terminal-projection.ts` | 489 | Pure visible terminal projection, final text selection, source labels, and final answer presentation. |

The component re-exports moved helpers for compatibility with existing tests/importers, but the implementations no longer live inline in `HelixAskPill.tsx`.

## Boundary Coverage

`client/src/lib/helix/__tests__/voice-ownership-boundary.spec.ts` now proves:

- transcript helpers live in `voice/voice-transcript.ts`
- voice authority evaluators live in `voice/voice-turn-authority.ts`
- terminal projection helpers live in `ask-terminal-projection.ts`
- new owner modules do not import React, stores, or `HelixAskPill.tsx`
- terminal projection owner does not write chat, TTS, or request state

Existing fingerprint coverage used for this wave:

- `client/src/components/__tests__/helix-ask-pill-ui.spec.tsx`
- `client/src/components/__tests__/helix-read-aloud-state.spec.ts`
- `client/src/components/__tests__/helix-ask-pill-e63-terminal-projection.spec.tsx`
- `client/src/components/__tests__/helix-ask-pill-e65-rendering-invariants.spec.tsx`
- `client/src/lib/helix/__tests__/turn-loop-harness.spec.ts`

`client/src/lib/helix/__tests__/resolveHelixVisibleTerminal.spec.ts` was listed in the goal but does not exist locally.

## Deferred Behavior Traps

No behavior repair was attempted for:

- legacy `/api/agi/ask` reachability
- job-to-direct re-execution
- stream retry behavior
- `normalizeLocalAskResponse` static fallback text
- `resolveHelixVisibleTerminal` `legacy_shadow`
- policy-shaped route metadata
- stale completion behavior
- TTS and chat persistence semantics
- endpoint selection, request ids, retry timeouts, and polling behavior

## Remaining HelixAskPill Reverse Dependencies

Production static imports remaining:

- render ownership: `client/src/pages/desktop.tsx`, `client/src/pages/mobile-start.tsx`, `client/src/components/workstation/HelixAskDock.tsx`, `client/src/components/workstation/mobile/MobileHelixAskDrawer.tsx`
- non-rendering helper export: `client/src/components/HelixSettingsDialogContent.tsx` imports `buildHelixAskMathRenderDebugForText`

Tests still dynamically import many compatibility exports from `HelixAskPill.tsx`; those imports are now safety coverage for the extracted compatibility re-exports and remaining unmoved helpers.

## Recommended Next Wave

1. Extract additional pure transcript/read-aloud helpers that do not touch playback queues or microphone effects.
2. Extract observer/lifecycle event builders after characterization of event schemas and ordering.
3. Extract workstation parsers after focused parser fingerprint tests.
4. Produce the `api.ts` transport split plan artifact before any transport code move.
5. Keep behavior repairs for legacy direct Ask, re-execution fallback, static fallback text, `legacy_shadow`, route metadata, and stale completions in separate behavior goals.
