# Helix Ask UI Ownership Map

This map keeps the `HelixAskPill.tsx` split readable while the component is being reduced. New extractions should land in one of these owner modules only when the code is pure display, formatting, parsing, or projection logic with no React hooks, store writes, fetches, voice playback, route authority, terminal authority, or chat persistence.

## Extracted Non-React Owners

| Owner module | Owns | Does not own |
| --- | --- | --- |
| `ask-answer-rendering.ts` | Math tokenization, answer-render debug summaries, calculator-panel display decisions. | Final answer authority, solver routing, fallback answers. |
| `ask-active-turn-stream.ts` | Active turn event projection, stream row filtering, client trace attachment. | Starting turns, retries, terminal completion, network streams. |
| `ask-context-capsule-display.ts` | Context-capsule token cleanup, palette selection, compact copy text, stamp image projection, and session-capsule confidence labels. | Capsule commit creation, automaton stepping, confidence derivation, ledger ranking, prompt admission. |
| `ask-convergence-display.ts` | Context-capsule convergence source/proof/maturity display labels. | Convergence state derivation, proof gates, capsule commits, collapse events. |
| `ask-continuous-turn-display.ts` | Continuous turn rows and live-answer bridge class/state projection. | Live answer runtime, mailbox wake decisions. |
| `ask-debug-event-display.ts` | Live event log lines, timestamp parsing, event identity display parsing, debug detail payload formatting, queued prompt normalization, rendered debug text cleanup, and shared in-progress placeholder display recognition. | Debug export authority, active-turn admission, active-turn event filtering, reply selection, reply lifecycle hiding, DOM traversal, fetches. |
| `ask-display-text.ts` | Shared deterministic display text normalization for Ask event labels. | Classification, routing, execution decisions. |
| `ask-envelope-copy.ts` | Response-envelope copy text and citation display normalization. | Response selection, envelope authority, fallback construction. |
| `ask-goal-pill-display.ts` | Goal-pill label and cadence text formatting. | Goal session transport, edits, pause/resume/stop actions. |
| `ask-live-source-display.ts` | Live-source mail transcript and turn stream display rows. | Mailbox reads, source admission, decision wakes. |
| `ask-luma-mood-display.ts` | Ask shell Luma mood palette class projection. | Mood classification, mood randomization, theme broadcasts, asset selection, state updates. |
| `ask-observer-commentary-display.ts` | Observer lane user-facing commentary text. | Workstation dispatch, observer execution, user-input requests. |
| `ask-observer-events.ts` | Observer lifecycle event object builders. | Event publication, runtime execution. |
| `ask-procedural-display.ts` | Procedural timeline/debug-copy action label formatting and workstation intent-stage detail copy. | Timeline rendering, route selection, router fail IDs, workstation dispatch, tool execution. |
| `ask-read-aloud-display.ts` | Read-aloud button labels and deterministic mic/read-aloud UI state transitions. | TTS transport, audio playback, audio graph behavior, voice diagnostics. |
| `ask-reasoning-battle-display.ts` | Reasoning battle visual class names, deterministic positions/styles, and answer tint palette projection. | Battle event construction, reasoning state, JSX rendering, terminal authority. |
| `ask-reasoning-frontier-display.ts` | Reasoning frontier action labels and floating action text/class projection. | Frontier tracker state updates, timers, rendering, route/terminal decisions. |
| `ask-reasoning-theater-display.ts` | Reasoning theater labels, stance meter classes, suppression copy, medal asset paths, Mirek cell visual classes, Mirek artifact particle projection, and frontier particle node projection. | Theater state derivation, hard-failure interpretation, Mirek evidence-anchor collection, Mirek grid density/simulation, frontier tracker updates, timers, refs, JSX rendering, route/terminal decisions. |
| `ask-stage-play-ledger.ts` | Stage Play chat ledger display events. | Stage Play runtime or chat persistence. |
| `ask-status-classnames.ts` | Procedural and causal trace row class-name mapping. | React rendering, timeline construction. |
| `ask-steering-queue-display.ts` | Steering queue item normalization and classes. | Auto-wake execution, mailbox mutation, workstation actions. |
| `ask-terminal-projection.ts` | Typed visible final-answer projection helpers. | Model sampling, terminal completion, server-side authority. |
| `ask-turn-transcript.ts` | Runtime transcript and causal trace row building. | Tool execution, live source materialization, terminal decisions. |
| `ask-voice-text-display.ts` | Voice/read-aloud text cleanup, citation stripping, artifact-spill display cleanup, and compact debug summaries. | TTS transport, playback scheduling, audio graph behavior, voice capture, route decisions. |
| `ask-voice-copy-display.ts` | Voice command labels, input status labels, reasoning lifecycle copy, brief copy joining, and timeline prompt display text. | Voice dispatch, lifecycle policy, auto-speak scheduling, retry policy, mic capture. |

## Still Quarantined In `HelixAskPill.tsx`

The following categories remain behavior-sensitive and should not be moved into display modules as part of presentation cleanup:

- Timeline entry creation, ordering, patching, filtering, and feed state. Unused timeline label constants should be deleted instead of preserved as new display owners.
- Legacy fallback and fallback reply construction.
- Transport and fetch calls, including Ask turns, live-source mail, goal sessions, and debug export endpoints.
- Stale completion and in-flight turn lifecycle.
- Route metadata, source admission, route authority, and terminal authority.
- Chat persistence and session merging.
- TTS, voice playback, voice diagnostics, mic capture, and audio graph behavior.
- Workstation dispatch, panel mutation, goal-session actions, and user-input request handling.
- Debug export authority, rendered-button export fallback, and clipboard/export bounding.

## Remaining Local Cluster Map

These are the major `HelixAskPill.tsx` clusters that still need either behavior-goal extraction or deliberate quarantine. Representative functions are listed to make the remaining monolith easier to scan; the list is not a permission slip to move the cluster as a pure display helper.

| Local cluster | Representative anchors | Current boundary |
| --- | --- | --- |
| Visual/audio capture preferences | `readHelixAskVisualCaptureAudioPreference`, `syncHelixAskVisualCaptureRoutePreference` | Reads browser state/stores and mutates capture route preferences; stale live projection components were removed instead of preserved. |
| Prompt interpretation and planner policy | `classifyHelixReasoningIntent`, `deriveHelixPlannerContract`, `evaluateEvidenceFinalizationGate`, `resolveHelixDispatchPolicyAtTurnStart` | Route admission and terminal/finalization policy; behavior-goal only. |
| Workstation pending input and dispatch arbitration | `buildWorkstationUserInputRequest`, `resolvePendingWorkstationUserInput`, `parseWorkstationActionCommand`, `syncDocViewerStateFromWorkstationAction` | User-input state, panel actions, docs-viewer handoff, and workstation mutation; behavior-goal only. |
| Voice capture, STT, confirmation, continuation, and auto-dispatch | `resolveTranscriptConfirmPolicy`, `evaluateVoiceAutoDispatchGovernance`, `shouldMergeVoiceContinuationTurn`, `buildVoiceReasoningDispatchPrompt`, `deriveVoiceTimelineSuppressionMeta` | Mic/STT/runtime control, transcript lifecycle, and dispatch policy; do not move as display. |
| Context-capsule ledger selection | `resolveSessionCapsuleConfidenceBand`, `deriveSessionCapsuleState`, `upsertContextCapsuleLedger`, `buildSelectedContextCapsuleIds` | Confidence derivation, ledger ranking, and selected capsule identity; display labels live outside, behavior stays local. |
| Ask request construction and attachment admission | `buildQueuedAskTurn`, `validateHelixAskAttachmentForSubmit`, `buildHelixAskHardBackendEntrypointRouteMetadata`, `buildAskTurnWorkspaceContextSnapshot` | Request envelope, route metadata, source admission, active-doc context, and attachment payload authority. |
| Agent runtime/provider selection | `normalizeHelixAgentProvidersResponse`, `resolveSelectedHelixAgentRuntime`, `resolveNextSelectableHelixAgentRuntime`, `resolveHelixAskActualAgentProviderLabel` | Provider availability and selected runtime policy; label helpers are coupled to provider fallback behavior for now. |
| Chat projection and reply lifecycle | `buildHelixAskRepliesFromChatSession`, `mergeHelixAskRepliesByCanonicalTurn`, `appendHelixAskReplyChronologically`, `shouldHideHelixAskTranscriptReply` | Chat persistence, stale completion, canonical reply keys, and reply ordering. |
| Visible terminal and route authority | `resolveHelixAskVisibleTerminal`, `buildHelixRuntimeAskLiveEvents`, `resolveHelixAskHardPromptProjectionGuard`, `requiresHelixAskBackendEntrypoint` | Terminal projection, route/product authority, and backend-entrypoint guard behavior. |
| Debug export and clipboard authority | `buildReplyScopedDebugExportFromRenderedReply`, `buildReplyScopedDebugExportFromRenderedButton`, `resolveAuthoritativeDebugExportPayload`, `copyDebugPayloadToClipboard` | Reply-scoped debug binding, backend debug export materialization, fallback bounding, and clipboard readback. |
| Reasoning theater state and simulation | `deriveReasoningTheaterState`, `readReasoningTheaterHardFailureSignals`, `buildMirekReasoningDisplayGrid`, `buildReasoningTheaterFrontierParticles` | State derivation, hard-failure interpretation, cellular-grid simulation, timers, and React rendering; display labels/classes are already extracted. |
| Legacy local Ask fallback output cleanup | `stripPromptEcho`, `extractAnswerBlock`, `stripEvidencePromptBlock` | Legacy/local fallback prompt construction; dead prompt/query/context builders were removed instead of preserved while backend Ask is authoritative. |

## Behavior-Sensitive Queue

These issues came from live Helix-mode UI testing and must be handled as behavior-goal work, not display-helper extraction. Do not move the named paths into non-React display modules unless behavior-preserving tests prove the move is safe.

### HASK-BSQ-001: Active document context handoff into Helix Ask requests

Evidence:

- Browser URL had `doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md`.
- UI visible focus included `docs-viewer` and `scientific-calculator`.
- Prompt using "current NHM2 whitepaper" failed with: "I need retrieval before finalizing this claim. I do not yet have grounded evidence references for it."
- The same prompt succeeds through the direct API when `doc_path` is supplied.
- The same UI prompt succeeds when the doc path is explicitly written in the prompt.

Likely boundary:

- `HelixAskPill` request construction is not consistently passing retained active docs-viewer context, doc path, or document evidence into Helix golden-path requests, especially for compound prompts.

Expected:

- When the UI is on a docs-viewer URL with `doc=...`, Helix-mode Ask request assembly should include the active doc path/context in the backend request envelope without requiring the user to restate the path.

Quarantine:

- Request-envelope assembly, active-doc context collection, workspace context snapshots, route metadata, source admission, and golden-path request transport.

### HASK-BSQ-002: Scoped Debug copy binds to stale prior turn

Evidence:

- After a complex Helix UI compound answer rendered visibly, clicking latest Debug copy copied an older calculator turn.
- Copied payload had marker mismatch, `terminal_artifact_kind = workstation_tool_evaluation`, and answer "3 + 5 = 8".
- The visible answer was the later compound answer.
- Therefore latest visible reply and debug-copy target diverged.

Likely boundary:

- `helix-ask-latest-debug-copy` or selected debug state still points to a cached prior debug payload or previous latest reply after complex/streamed golden-path turns.

Expected:

- For every rendered answer, Debug copy must bind to that reply's `turn_id` and `debug_export_ref`, not the last successful cached debug export.

Quarantine:

- Stream final projection, latest reply selection, selected debug state, debug-copy binding, rendered-button export fallback, and clipboard/export bounding.

### HASK-BSQ-003: Backend compound terminal authority is not the first suspect

Evidence:

- Direct Helix API returns `terminal_artifact_kind = compound_evidence_synthesis_answer`.
- Direct Helix API returns `final_answer_source = compound_evidence_synthesis_answer`.
- Direct Helix API returns `subgoals = 5` and `terminal_error_code = null`.
- UI explicit-doc compound prompt renders a compound answer.

Implication:

- Patch UI request context and debug binding first. Do not treat this as a backend compound failure or golden-path terminal-authority failure without new contrary evidence.

## Extraction Rule

Before moving a helper out of `HelixAskPill.tsx`, classify it:

- `presentation`: display rows, labels, class names, copy formatting, deterministic tokenization.
- `input parsing`: non-mutating parsing that only returns structured display/input data.
- `quarantined behavior`: any helper that reads/writes stores, calls fetch, starts/resumes turns, changes panels, owns voice/TTS, constructs fallbacks, or decides route/terminal authority.

Only the first two categories belong in the non-React owner modules during this cleanup. Quarantined behavior needs a separate behavior-goal patch with contract tests.
