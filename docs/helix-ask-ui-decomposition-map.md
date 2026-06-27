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

## Wave 2 UI Ownership Extraction

Status: second UI ownership extraction wave committed.

Starting HEAD: `fa7309c1d994fb6e6ac213b25fe2defd0daf90f0`
`2026-06-27 13:44:54 -0400`, `helix-route-slice-129-130-objective-contracts`

Ending extraction HEAD: `f70b08f61f335f4539509fe02c3cbf2ce8162870`
`helix-ui-slice-turn-transcript-builders`

Two route-runtime commits appeared in history between Wave 2 UI commits and were not part of this UI extraction wave. The Wave 2 UI-owned commits are listed below.

| File | Start lines | End lines | Start bytes | End bytes |
| --- | ---: | ---: | ---: | ---: |
| `client/src/components/helix/HelixAskPill.tsx` | 38,031 | 36,960 | 1,655,738 | 1,614,172 |
| `client/src/lib/helix/voice/voice-transcript.ts` | 88 | 88 | 3,685 | 3,685 |
| `client/src/lib/helix/voice/voice-turn-authority.ts` | 155 | 155 | 5,519 | 5,519 |
| `client/src/lib/helix/ask-terminal-projection.ts` | 489 | 489 | 23,039 | 23,039 |
| `client/src/lib/helix/ask-observer-events.ts` | 0 | 302 | 0 | 10,162 |
| `client/src/lib/helix/ask-active-turn-stream.ts` | 0 | 453 | 0 | 15,191 |
| `client/src/lib/helix/ask-turn-transcript.ts` | 0 | 583 | 0 | 23,754 |

`HelixAskPill.tsx` exported-symbol count moved from 222 to 214. Production static import files for `HelixAskPill.tsx` are 5 at the end of the wave, all existing render/settings owners: `desktop.tsx`, `mobile-start.tsx`, `HelixAskDock.tsx`, `MobileHelixAskDrawer.tsx`, and `HelixSettingsDialogContent.tsx`. Test import hit lines moved from 187 to 175.

### Wave 2 Commits

- `c6d7ec732` `helix-ui-slice-observer-lifecycle-builders`
- `d45383171` `helix-ui-slice-active-turn-stream-helpers`
- `f70b08f61` `helix-ui-slice-turn-transcript-builders`

### Wave 2 Owners

| Module | Lines | Responsibility |
| --- | ---: | --- |
| `client/src/lib/helix/ask-observer-events.ts` | 302 | Pure observer lifecycle, handoff, workstation procedural step, and retrieval-plan event builders. |
| `client/src/lib/helix/ask-active-turn-stream.ts` | 453 | Pure active-turn stream row building, live event admission/filtering, client trace attachment, and console ingress debug assembly. |
| `client/src/lib/helix/ask-turn-transcript.ts` | 583 | Pure transcript event resolution, runtime transcript rows, causal trace rows, public commentary rows, visible transcript text normalization, and durable mail transcript group detection. |

The component re-exports these helpers for compatibility. Inline implementations are gone for the moved symbols.

### Extracted Candidates

| Slice | Symbols | Owner |
| --- | --- | --- |
| Observer lifecycle builders | `buildObserverPlanDeltaEvent`, `buildObserverPlanItemCompletedEvent`, `buildObserverFinalizationEvent`, `buildObserverHandoffEvent`, `buildWorkstationProceduralStepEvent`, `buildNeedsRetrievalPlanEvent` | `ask-observer-events.ts` |
| Active-turn stream helpers | `createHelixAskConsoleStreamIngressDebug`, `attachHelixAskClientTraceToLiveEvent`, `buildAskLiveAgenticEventRows`, `buildHelixActiveTurnStreamRows`, `shouldAdmitHelixAskExternalLiveEventToActiveStream`, `filterHelixAskActiveTurnStreamRows` | `ask-active-turn-stream.ts` |
| Transcript and causal display builders | `buildHelixRuntimeTranscriptEvents`, `resolveHelixTurnTranscriptEvents`, `normalizeHelixVisibleEventText`, `readHelixCausalTurnTimeline`, `buildHelixCausalTurnTraceRows`, `buildHelixTurnTranscriptRows`, `isDurableHelixAskMailTranscriptGroup` | `ask-turn-transcript.ts` |

`shouldRenderHelixAskActiveTurnStream` intentionally remains in `HelixAskPill.tsx` because it depends on reply ordering and canonical reply-key helpers shared with the component's chronological reply merge path.

### Boundary Coverage

`client/src/lib/helix/__tests__/ask-ui-ownership-boundary.spec.ts` now proves:

- observer lifecycle builders live in `ask-observer-events.ts`
- active-turn stream helpers live in `ask-active-turn-stream.ts`
- transcript and causal display builders live in `ask-turn-transcript.ts`
- the new owner modules do not import React, stores, or `HelixAskPill.tsx`
- the new owner modules do not write `setAskReplies`, `enqueueVoicePlaybackIntent`, or backend turn execution state

Wave-level focused tests run:

- `npx vitest run client/src/lib/helix/__tests__/ask-ui-ownership-boundary.spec.ts client/src/components/__tests__/helix-ask-pill-ui.spec.tsx client/src/components/__tests__/helix-ask-pill-e63-terminal-projection.spec.tsx client/src/components/__tests__/helix-ask-pill-e68-debug-export.spec.tsx client/src/lib/helix/__tests__/turn-loop-harness.spec.ts client/src/components/__tests__/helix-read-aloud-state.spec.ts --pool=forks`
- Result: 6 files passed, 241 tests passed.

`client/src/lib/helix/__tests__/helix-read-aloud-state.spec.ts` does not exist locally; the local equivalent used was `client/src/components/__tests__/helix-read-aloud-state.spec.ts`.

Additional checks:

- `git diff --check`: pass.
- Bounded import scan for `ask-observer-events.ts`, `ask-active-turn-stream.ts`, and `ask-turn-transcript.ts`: no React/store/component imports and no state/effect writer strings found.

### Map-Only Sink Pass

No behavior was changed for these sinks. They remain behavior-goal work, not extraction proof.

| Sink | Current owner | Source anchors | Side effects | Authority risk | Extraction readiness | Focused tests needed |
| --- | --- | --- | --- | --- | --- | --- |
| Chat persistence text source | `HelixAskPill.tsx` | `useAgiChatStore`, `addMessage`, `setAskReplies`, `chooseVisibleFinalText`, `buildVisibleResolvedTurn` | writes chat sessions and visible reply state | high: can persist non-terminal or stale text | not ready for structural extraction | chat persistence transcript/terminal authority matrix |
| Visible answer state source | `ask-terminal-projection.ts` plus `HelixAskPill.tsx` state assembly | `resolveHelixAskFinalAnswerPresentation`, `chooseVisibleFinalText`, `setAskReplies` | selects displayed final text and reply debug metadata | high: legacy shadow/static fallback can surface | behavior goal first | terminal precedence and stale completion fixtures |
| TTS/read-aloud text source | `HelixAskPill.tsx` | `handleReadAloud`, `enqueueVoicePlaybackIntent`, `speakVoice`, read-aloud state tests | queues/stops voice playback | high: stale finals can speak after newer turns | not ready | voice queue freshness, manual read-aloud, abort/barge-in fixtures |
| Active turn completion guard | `HelixAskPill.tsx` | `activeAskTurnIdRef`, `runAskTurnId`, `setAskReplies`, active stream rows | admits final reply and clears active turn state | high: stale completion can overwrite UI | behavior goal first | competing turn completion and aborted turn fixtures |
| Stale async completion guard | `HelixAskPill.tsx` | `stale_revision_dropped`, `reasoningAttemptAbortControllerRef`, active attempt refs | drops/suppresses older voice/reasoning completions | high: stale closures and mixed voice/text turns | not ready | superseded intent revision and delayed completion fixtures |
| Request abort guard | `HelixAskPill.tsx` and `api.ts` | `AbortController`, `askAbortRef`, `resumeHelixAskJob`, `askLocal`, job polling abort listeners | aborts active fetch/job/voice flows | medium-high: abort semantics cross endpoint modes | not ready | direct/job/stream abort parity fixtures |
| Endpoint fallback behavior | `client/src/lib/agi/api.ts` | `askLocalDirect`, `askLocal`, `runAskTurn`, `runAskTurnStream`, `/api/agi/ask`, `/api/agi/ask/jobs` | chooses endpoint, retries, jobs-to-direct fallback | high: explicitly quarantined behavior problem | behavior goal only | direct/job/stream endpoint transition tests |
| Route metadata behavior | `api.ts` and `HelixAskPill.tsx` | `appendHelixAskRouteMetadataToBody`, `routeMetadataForTurn`, `buildHelixAskPastedTextResumeRecallRouteMetadata` | shapes backend request authority hints | high: policy-shaped route metadata is quarantined | behavior goal only | route metadata shape and hard-source-target fixtures |

### Deferred Behavior Traps

No repair was attempted for:

- job-to-direct re-execution
- reachable legacy `/api/agi/ask`
- static fallback text in `normalizeLocalAskResponse`
- `legacy_shadow`
- policy-shaped route metadata
- unguarded stale completion
- stream retry behavior
- TTS and chat persistence semantics
- endpoint selection, ids, timeouts, and polling behavior

### Recommended Next Wave

1. Extract Stage Play chat-ledger display builders into a dedicated non-React module after adding a narrow ledger fixture boundary.
2. Extract workstation parser helpers only after parser-focused characterization tests are green.
3. Produce an `api.ts` split plan artifact before moving direct/job/stream transport code.
4. Keep TTS, chat persistence, stale completion, endpoint fallback, route metadata, and `legacy_shadow` in the behavior queue.

## Wave 3 UI Ownership Extraction

Status: third UI ownership extraction wave committed.

Starting HEAD: `188e2c58d0d7fa4f636ce2614d2556d28d2e4bb5`
`2026-06-27 14:34:04 -0400`, `Document runtime goal observation extraction`

Ending extraction HEAD: `25ee2f9d0cc51f7e5f009ee40d6a9ca031c530b0`
`2026-06-27 14:44:21 -0400`, `helix-ui-slice-workstation-parser-helpers`

An unrelated route-runtime commit, `3bd0e4c93` `helix-route-slice-135-runtime-composer-support-refs`, appeared between the starting HEAD and the Wave 3 UI commits. It is not part of this UI extraction accounting.

| File | Start lines | End lines | Start bytes | End bytes |
| --- | ---: | ---: | ---: | ---: |
| `client/src/components/helix/HelixAskPill.tsx` | 36,960 | 36,543 | 1,614,172 | 1,593,105 |
| `client/src/lib/helix/ask-stage-play-ledger.ts` | 0 | 406 | 0 | 19,639 |
| `client/src/lib/workstation/ask-workstation-parser.ts` | 0 | 78 | 0 | 3,540 |
| `artifacts/helix-ask-ui-current-head-proof/api-transport-split-plan.md` | 0 | 47 | 0 | 4,875 |

`HelixAskPill.tsx` exported-symbol count moved from 214 to 211. Production static import files from `HelixAskPill.tsx` stayed at 5. Test import hit lines moved from 175 to 177 after compatibility re-exports and boundary coverage.

### Wave 3 Commits

- `5df286c6b` `helix-ui-slice-stage-play-ledger-display`
- `25ee2f9d0` `helix-ui-slice-workstation-parser-helpers`

The transport split plan artifact was created at `artifacts/helix-ask-ui-current-head-proof/api-transport-split-plan.md` and left uncommitted because this artifact directory is not tracked in the current repo.

### Wave 3 Owners

| Module | Lines | Responsibility |
| --- | ---: | --- |
| `client/src/lib/helix/ask-stage-play-ledger.ts` | 406 | Pure Stage Play chat-ledger display event construction, ledger payload readers, evidence ref normalization, and row ordering. |
| `client/src/lib/workstation/ask-workstation-parser.ts` | 78 | Pure chained workstation action parser for copy-selection-to-note then compare workflows. |

The component re-exports moved helpers for compatibility. Inline implementations are gone for the moved symbols.

### Extracted Candidates

| Slice | Symbols | Owner |
| --- | --- | --- |
| Stage Play ledger display | `buildStagePlayChatLedgerEvents`, `StagePlayChatLedgerEvent`, `StagePlayChatLedgerEventKind` | `ask-stage-play-ledger.ts` |
| Workstation parser helper | `parseWorkstationActionChainCommand` | `ask-workstation-parser.ts` |

`parseWorkstationActionCommand` intentionally remains in `HelixAskPill.tsx` because the current implementation still reads `useDocViewerStore` for deictic current-doc commands. Moving it safely requires dependency reduction or an explicit store-free input contract.

### Boundary Coverage

`client/src/lib/helix/__tests__/ask-ui-ownership-boundary.spec.ts` now also proves:

- Stage Play chat-ledger display helpers live in `ask-stage-play-ledger.ts`
- the pure chained workstation parser lives in `ask-workstation-parser.ts`
- both new owners avoid React, stores, `HelixAskPill.tsx`, reply-state writers, TTS writers, turn execution, and workstation dispatch functions

Focused slice tests run:

- `npx vitest run client/src/lib/helix/__tests__/ask-ui-ownership-boundary.spec.ts client/src/components/__tests__/helix-ask-pill-ui.spec.tsx --pool=forks`
- Slice A result: 2 files passed, 163 tests passed.
- Slice B result: 2 files passed, 164 tests passed.

### API Transport Split Plan

Map-only plan created at `artifacts/helix-ask-ui-current-head-proof/api-transport-split-plan.md`.

Planned future owners:

- request body assembly
- direct Ask transport
- turn transport
- stream transport
- job transport
- pending job persistence
- response normalization
- retry/fallback policy

Blocked behavior goals remain: legacy `/api/agi/ask` cleanup, jobs-to-direct re-execution cleanup, stream retry cleanup, static fallback cleanup, pending-job stale completion cleanup, and route metadata trust cleanup.

### Deferred Behavior Traps

No repair was attempted for:

- endpoint behavior or legacy `/api/agi/ask`
- jobs-to-direct fallback
- stream retry behavior
- response normalization fallback text
- terminal legacy shadow
- route metadata shape or policy fields
- stale-completion behavior
- TTS or chat persistence
- local workstation action execution or panel/docs/notes/clipboard mutation
- ids, timeouts, polling, pending-request behavior

### Remaining HelixAskPill Policy Exports

Representative remaining non-rendering export families:

- planner/dispatch policy: `classifyHelixReasoningIntent`, `resolveHelixDispatchPolicyAtTurnStart`, `deriveHelixPlannerContract`, `deriveObserverDispatchPlan`
- evidence/finalization: `evaluateEvidenceFinalizationGate`, `registerTurnTerminalOutcome`
- workstation/pending input: `parseWorkstationActionCommand`, `buildWorkstationUserInputRequest`, `resolvePendingWorkstationUserInput`, `syncDocViewerStateFromWorkstationAction`
- voice/read-aloud/TTS: `shouldAutoSpeakAnswerForTurn`, voice playback retry helpers, transcript confirmation helpers, barge-in helpers
- active reply ordering/render gate: `sortHelixAskRepliesChronologically`, `appendHelixAskReplyChronologically`, `shouldRenderHelixAskActiveTurnStream`
- Stage Play/live bridge display: `buildLiveAnswerTurnBridgeState`, mail-loop stream rows, steering queue display helpers
- math/debug utilities: math tokenization/render debug and debug export drawer helpers

### Recommended Next Wave

1. Extract mail-loop stream row builders and steering queue display helpers into a Stage Play/live-source display owner.
2. Extract `buildLiveAnswerTurnBridgeState` only after adding bridge-specific fixtures for receipt fallback, checkpoint queued, checkpoint waiting, and reviewed snapshot cases.
3. Reduce `parseWorkstationActionCommand` dependencies by passing current-doc context explicitly before moving it.
4. Keep planner/dispatch policy helpers for a separate owner-proof wave, not a broad utility extraction.
