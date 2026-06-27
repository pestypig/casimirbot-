# Helix Ask UI Behavior Trap Map

Status: current-head characterization only. No production behavior was changed.

Patch class: terminal authority / presentation characterization and Ask API behavior mapping.

Controlling state from the current UI proof pack:

- `READY_FOR_UI_EXTRACTION_GOALS: YES`
- `READY_FOR_UI_BEHAVIOR_GOALS: NO`

## Snapshot

- Branch: `main`
- Starting HEAD: `c85a2fa1f3db63168beee06dd528c094e3e5094e`
- HEAD date: `2026-06-27 15:02:44 -0400`
- HEAD subject: `helix-route-slice-138-runtime-repo-evidence-synthesis-text`

Git status at pass start:

```text
 M docs/helix-ask-route-decomposition-map.md
 M server/routes/agi.plan.ts
 M server/services/helix-ask/language-contract.ts
?? server/__tests__/helix.ask.response-language-instruction-extraction-boundary.test.ts
```

The objective-named file `server/services/helix-ask/runtime/runtime-voice-side-effect-composer.ts` is tracked at this HEAD:

```text
100644 ec9e9451cf9ef833a9969fd334bfbaa07547c8ce 0 server/services/helix-ask/runtime/runtime-voice-side-effect-composer.ts
```

It was not touched by this pass.

| File | Lines | Bytes | Exported symbols |
| --- | ---: | ---: | ---: |
| `client/src/components/helix/HelixAskPill.tsx` | 35,450 | 1,593,105 | 205 |
| `client/src/lib/agi/api.ts` | 3,050 | 108,912 | 74 |
| `client/src/lib/helix/resolveHelixVisibleTerminal.ts` | 464 | 20,064 | 7 |
| `client/src/lib/helix/ask-terminal-projection.ts` | 465 | 23,039 | 9 |
| `client/src/lib/agi/debugExport.ts` | 1,148 | 61,393 | 5 |
| `docs/helix-ask-ui-decomposition-map.md` | 223 | 20,106 | 0 |

## Trap Index

Classifications:

- `TRANSPORT_COMPATIBILITY`
- `DUPLICATE_EXECUTION_RISK`
- `CLIENT_TEXT_AUTHORITY_RISK`
- `TERMINAL_SHADOW_RISK`
- `ROUTE_METADATA_POLICY_RISK`
- `STALE_COMPLETION_RISK`
- `PERSISTENCE_AUTHORITY_RISK`
- `TTS_AUTHORITY_RISK`
- `DEBUG_ONLY`
- `UNKNOWN_NEEDS_MORE_PROOF`

Priorities:

- `P0_FIX_FIRST`
- `P1_FIX_SOON`
- `P2_CHARACTERIZE_MORE`
- `P3_KEEP_COMPATIBILITY`
- `P4_DEFER`

### TRAP-01: Legacy Direct Ask Reachability

- Title: legacy `/api/agi/ask` reachability.
- Classification: `TRANSPORT_COMPATIBILITY`.
- Priority: `P3_KEEP_COMPATIBILITY`.
- Current owner file: `client/src/lib/agi/api.ts`.
- Current symbols: `askLocal`, `askLocalDirect`, `isHelixE814LaneParityEnabled`, `appendHelixAskRouteMetadataToBody`, `normalizeLocalAskResponse`.
- Current callers: `HelixAskPill.tsx` via `askLocalWithMultilangFailOpenFallback`, compatibility tests in `api.voice-transcribe.spec.ts`, and any external imports of `askLocal`.
- Endpoint or UI lane: legacy direct Ask transport.
- Trigger condition: `__HELIX_E8_14_LANE_PARITY__` is false, no `turn_input_items`, and job creation is unsupported or interrupted enough to fall through direct.
- State written: no UI state directly; returns a `LocalAskResponse` consumed by UI reply/chat/TTS paths.
- Visible text effect: whatever `normalizeLocalAskResponse` returns can become visible through `resolveHelixAskVisibleTerminal` and reply content.
- Persistence effect: `HelixAskPill` may persist returned text through `addMessage(sessionId, { role: "assistant", content: responseText, traceId })`.
- TTS/read-aloud effect: returned text can be spoken if final autospeak gates pass.
- Duplicate execution risk: only when this lane is reached as fallback after a job already executed.
- Route-policy effect: body still carries `route_metadata`, `source_target_intent`, and `mandatory_next_tool`.
- Current guards: parity flag, `turn_input_items` force turn lane, `AbortSignal`, and fetch error handling.
- Missing guards: no direct-lane deprecation guard, no idempotency token, no proof that legacy endpoint enforces route/terminal authority parity.
- Tests present: `askLocal` default turn lane, job unsupported compatibility fallback, job-missing direct fallback, turn input item lane, route metadata serialization.
- Tests missing: server-side legacy endpoint authority parity and migration cutoff tests.
- Proposed future repair owner: `client/src/lib/agi/api.ts`, later `ask-direct-transport.ts` after compatibility policy is explicit.
- Proposed future repair strategy: make legacy direct reachability an explicit compatibility branch with a named reason and a single testable condition before any removal.
- Stop condition: do not remove `/api/agi/ask` until all callers and server parity are proven.
- Confidence: high for client reachability, medium for server parity.

### TRAP-02: Jobs-To-Direct Re-Execution

- Title: job polling fallback can submit the same logical prompt directly after a job was created.
- Classification: `DUPLICATE_EXECUTION_RISK`.
- Priority: `P0_CLIENT_GUARDED_SERVER_PROOF_REMAINING`.
- Repair status: client guard applied in `client/src/lib/agi/api.ts`; once `createAskJob` succeeds, interrupted/missing job polling no longer automatically calls direct Ask for the same logical request.
- Current owner file: `client/src/lib/agi/api.ts`.
- Current symbols: `askLocal`, `createAskJob`, `pollAskJob`, `isInterruptedJobFallbackResponse`, `askLocalDirect`, `writePendingHelixAskJob`, `clearPendingHelixAskJob`.
- Current callers: `askLocal` compatibility path, `HelixAskPill` legacy/local fallback wrappers, `resumeHelixAskJob` for pending jobs.
- Endpoint or UI lane: `/api/agi/ask/jobs`, `/api/agi/ask/jobs/:id`; direct `/api/agi/ask` remains reachable only when no job was successfully created or another compatibility lane selects direct.
- Trigger condition: job polling returns `"Request interrupted. Please try again."`, job missing returns interrupted fallback text, or job endpoint is unsupported before any job is created.
- State written: `sessionStorage` pending job record, then returned `LocalAskResponse`.
- Visible text effect: interrupted job text is returned as a marked non-authoritative client transport fallback instead of a direct fallback answer.
- Persistence effect: the returned interruption text may still be consumed by existing UI persistence paths, but it now carries `client_transport_fallback`, `fallback_blocked`, `terminal_eligible: false`, and `authorityVerified: false` markers.
- TTS/read-aloud effect: no TTS/read-aloud behavior was changed; downstream suppression from the new markers remains a future sink-specific repair.
- Duplicate execution risk: client-side automatic duplicate direct execution is guarded after successful job creation. Server-side late job completion/dedupe proof remains open.
- Route-policy effect: route metadata shape is unchanged; direct fallback after job creation is blocked, so route metadata is no longer re-submitted by that path.
- Current guards: local `AbortSignal`, pending job cleanup, offline wait, compatibility flag, and `buildBlockedJobDirectFallbackResponse` for interrupted polling after job creation.
- Missing guards: no server cancellation proof, no idempotency key, no `turnId` in `askLocal`, no dedupe token shared across job/direct lanes, and no downstream persistence/TTS marker suppression proof.
- Tests present: job-missing direct re-execution blocked, route metadata/request identity preserved on job create body while direct re-execution is blocked, interrupted partial-text fallback blocked, job unsupported direct compatibility fallback preserved, empty turn fallback remains non-authoritative.
- Tests missing: server dedupe contract, cancellation-before-fallback contract, stale later-job completion suppression, and UI persistence/TTS behavior for `client_transport_fallback`.
- Proposed future repair owner: server idempotency/dedupe owner after backend ownership wave; UI sink suppression later in `HelixAskPill.tsx`.
- Proposed future repair strategy: add server-side idempotency/cancellation proof and teach UI persistence/TTS sinks to suppress or demote `client_transport_fallback` responses.
- Stop condition: if a patch changes endpoint selection, retry behavior, response normalization, or route metadata shape at the same time, stop and split the work.
- Confidence: high.

### TRAP-03: Stream Retry Behavior

- Title: stream final failure can throw and cause non-stream turn fallback.
- Classification: `DUPLICATE_EXECUTION_RISK`.
- Priority: `P2_CHARACTERIZE_MORE`.
- Current owner file: `client/src/lib/agi/api.ts`, with UI catch/fallback in `HelixAskPill.tsx`.
- Current symbols: `runAskTurnStream`, `askTurnStreamRetryableFailureCode`, `runAskTurn`, stream fallback catch path in `runAsk`.
- Current callers: `HelixAskPill.runAsk`.
- Endpoint or UI lane: `/api/agi/ask/turn/stream` then `/api/agi/ask/turn`.
- Trigger condition: stream unavailable, stream missing `turn_final`, or retryable final failure code for model-only/general-background context.
- State written: active live stream rows and final `LocalAskResponse`; partial stream text may be displayed as progress but discarded for terminal return.
- Visible text effect: fallback turn response can become visible.
- Persistence effect: fallback turn response can be persisted in chat.
- TTS/read-aloud effect: fallback turn response can be spoken if final autospeak gates pass.
- Duplicate execution risk: high if the stream request already reached server-side tool/model work.
- Route-policy effect: stream and fallback both use `buildRunAskTurnBody`, preserving route metadata.
- Current guards: `AbortSignal`, retryable failure code filter, stream final requirement.
- Missing guards: no server cancellation/dedupe proof before fallback; no deterministic local test for retryable final throwing.
- Tests present: source scan confirms `runAskTurnStream` exists and UI uses it; focused UI tests cover surrounding projection paths.
- Tests missing: fetch-mock SSE test for retryable final failure and stream-missing-final fallback reason.
- Proposed future repair owner: `client/src/lib/agi/api.ts`.
- Proposed future repair strategy: characterize stream terminal failures first, then add a no-reexecution guard keyed by `turnId`/trace once server idempotency is explicit.
- Stop condition: do not alter stream event parsing and fallback in one patch without a transport matrix test.
- Confidence: medium-high.

### TRAP-04: `normalizeLocalAskResponse` Static Fallback Text

- Title: client response normalization manufactures final-looking text.
- Classification: `CLIENT_TEXT_AUTHORITY_RISK`.
- Priority: `P1_FIX_SOON`.
- Current owner file: `client/src/lib/agi/api.ts`.
- Current symbols: `normalizeLocalAskResponse`, `runAskTurn`, `runAskTurnStream`, `askLocalDirect`, `pollAskJob`, `askLocal`.
- Current callers: all Ask client transport lanes.
- Endpoint or UI lane: all `LocalAskResponse` lanes.
- Trigger condition: server payload lacks `selected_final_answer`, `assistant_answer`, usable `text`, `message`, or interpreter confirmation text.
- State written: returned `LocalAskResponse.text`.
- Visible text effect: static `"I couldn't produce a final answer for that turn. Please retry once."` can become visible text.
- Persistence effect: the manufactured text can be persisted as assistant chat content.
- TTS/read-aloud effect: the manufactured text can be spoken if downstream gates treat it as final.
- Duplicate execution risk: none by itself.
- Route-policy effect: none by itself.
- Current guards: invalid raw text filter and multilang blocked text mapping.
- Missing guards: no explicit `client_fallback_text` marker, no authority metadata proving the text is non-authoritative.
- Tests present: empty turn response returns static fallback text without authority markers; multilang blocked fallback mapping.
- Tests missing: UI persistence/TTS proof that this text is never spoken/persisted as authoritative.
- Proposed future repair owner: one-file patch in `client/src/lib/agi/api.ts`.
- Proposed future repair strategy: return an explicit non-authoritative fallback marker or typed failure field while preserving current `text` compatibility until UI callers are migrated.
- Stop condition: do not change terminal precedence or visible projection in the same patch.
- Confidence: high.

### TRAP-05: `resolveHelixVisibleTerminal` `legacy_shadow`

- Title: compatibility fields can still become visible for non-source turns.
- Classification: `TERMINAL_SHADOW_RISK`.
- Priority: `P1_FIX_SOON`.
- Current owner file: `client/src/lib/helix/resolveHelixVisibleTerminal.ts`.
- Current symbols: `resolveHelixVisibleTerminal`, `firstText`, `isSourceOrCapabilityTurn`, `renderTypedFailureFallback`.
- Current callers: `ask-terminal-projection.ts`, `HelixAskPill.tsx`, debug export helpers.
- Endpoint or UI lane: terminal projection.
- Trigger condition: no envelope/single-writer/authority/presentation/direct-answer artifact/typed failure is selected and legacy fields contain usable text.
- State written: no state directly; returns `source: "legacy_shadow"` and `usedLegacyShadow: true`.
- Visible text effect: legacy `selected_final_answer`, `assistant_answer`, `answer`, `text`, `finalAnswer`, `content`, or fallback content can become visible for non-source compatibility turns.
- Persistence effect: if already in reply content, it can be persisted/rendered as a normal reply.
- TTS/read-aloud effect: manual read-aloud can speak visible legacy text; autospeak depends on final gates.
- Duplicate execution risk: none.
- Route-policy effect: source/capability turns are guarded to fail closed as `terminal_authority_missing`.
- Current guards: source/capability turns do not allow legacy shadow; tests prove this.
- Missing guards: no plan yet to quarantine legacy shadow for all turns.
- Tests present: `resolveHelixVisibleTerminal.spec.ts` covers legacy shadow allowed for non-source compatibility and blocked for source/capability turns.
- Tests missing: UI chat/TTS sink tests for legacy-shadow text.
- Proposed future repair owner: `client/src/lib/helix/resolveHelixVisibleTerminal.ts`.
- Proposed future repair strategy: add a compatibility marker and allowlist for model-only turns before removing legacy shadow.
- Stop condition: do not break non-source compatibility replies without migration tests.
- Confidence: high.

### TRAP-06: Policy-Shaped Route Metadata

- Title: client-written route metadata can steer server policy.
- Classification: `ROUTE_METADATA_POLICY_RISK`.
- Priority: `P2_CHARACTERIZE_MORE`.
- Current owner files: `client/src/lib/agi/api.ts`, `client/src/components/helix/HelixAskPill.tsx`, `client/src/lib/helix/ask-prompt-launch.ts`, server readers under `server/routes/agi.plan.ts` and `server/services/helix-ask/**`.
- Current symbols: `appendHelixAskRouteMetadataToBody`, `buildRunAskTurnBody`, `launchHelixAskPrompt`, `consumePendingHelixAskPrompt`, hard backend route-metadata builders.
- Current callers: manual Ask submit, external prompt launch, Stage Play mailbox wake, workstation job executor.
- Endpoint or UI lane: request-body assembly and server route admission.
- Trigger condition: caller supplies `route_metadata` or `routeMetadata`.
- State written: request body fields `route_metadata`, `source_target_intent`, `mandatory_next_tool`, mailbox authority summaries.
- Visible text effect: indirect; can steer terminal product family or fail-closed reason.
- Persistence effect: indirect through chosen terminal response.
- TTS/read-aloud effect: indirect through chosen terminal response.
- Duplicate execution risk: none by itself, but preserved into duplicate fallback bodies.
- Route-policy effect: high; metadata contains admission/policy-shaped fields.
- Current guards: shape serialization tests; server has many readers and validators but full trust boundary is not proven.
- Missing guards: field-by-field trusted/descriptive policy boundary and server origin validation.
- Tests present: prompt launch route metadata tests and API route metadata serialization tests.
- Tests missing: server-side rejection/normalization tests for untrusted mandatory policy fields.
- Proposed future repair owner: server route metadata validation first, not UI.
- Proposed future repair strategy: classify fields as descriptive, admission hint, trusted invocation contract, mandatory policy, debug-only, ignored, or unknown; reject mandatory policy unless server-originated or operator-authorized.
- Stop condition: do not alter route metadata shape in UI before server validation tests exist.
- Confidence: medium.

### TRAP-07: Stale Async Completion

- Title: older async attempts may complete after newer UI state.
- Classification: `STALE_COMPLETION_RISK`.
- Priority: `P1_FIX_SOON`.
- Current owner file: `client/src/components/helix/HelixAskPill.tsx`.
- Current symbols: `runAsk`, `resumePendingAsk`, `activeAskTurnIdRef`, `askAbortRef`, `askBusy`, `pendingExternalAskPromptRef`, `askQueue`, `setAskReplies`, `appendHelixAskReplyChronologically`.
- Current callers: manual submit, queued ask, external prompt event, voice command retry, pending job resume.
- Endpoint or UI lane: UI async lifecycle.
- Trigger condition: concurrent or superseded jobs/streams/direct requests, queued prompts, component unmount, or resumed jobs after a newer prompt.
- State written: replies, active turn id, ask status/error, chat messages, voice queue.
- Visible text effect: stale response can append or overwrite visible answer if local guards miss it.
- Persistence effect: stale response can be persisted to chat.
- TTS/read-aloud effect: stale response can enqueue final speech.
- Duplicate execution risk: yes when combined with job/direct or stream fallback.
- Route-policy effect: no direct policy effect.
- Current guards: `askBusy`, local `AbortController`, active turn id clearing, queueing, pending external prompt replay, duplicate external prompt claim ids.
- Missing guards: proof that every completion path checks active turn identity before reply/chat/TTS side effects.
- Tests present: focused UI tests cover many helper gates but not full stale timeline matrix.
- Tests missing: deterministic fake-promise UI lifecycle tests for the six requested timelines.
- Proposed future repair owner: `HelixAskPill.tsx` until completion sinks are reduced further.
- Proposed future repair strategy: add a one-turn completion admission function and gate reply/chat/TTS writes on current turn identity.
- Stop condition: do not combine stale guard with transport fallback changes.
- Confidence: medium.

### TRAP-08: Chat Persistence Text Source

- Title: assistant chat messages persist `responseText` after client projection and fallback logic.
- Classification: `PERSISTENCE_AUTHORITY_RISK`.
- Priority: `P2_CHARACTERIZE_MORE`.
- Current owner file: `client/src/components/helix/HelixAskPill.tsx`.
- Current symbols: `addMessage`, `useAgiChatStore`, `resolveHelixAskVisibleTerminal`, `chooseVisibleFinalText`, `setAskReplies`, `responseText` assembly in `runAsk` and `resumePendingAsk`.
- Current callers: manual Ask, resume pending job, direct workstation/dispatch branches, voice lanes.
- Endpoint or UI lane: chat persistence.
- Trigger condition: any assistant response path with a session id.
- State written: persisted chat session assistant messages.
- Visible text effect: persisted message can rehydrate UI projection.
- Persistence effect: high.
- TTS/read-aloud effect: indirect if rehydrated reply is read aloud.
- Duplicate execution risk: none by itself.
- Route-policy effect: none.
- Current guards: some durable chat projection suppression for Stage Play mail wake; terminal projection tries to select authority before `responseText` finalization.
- Missing guards: no single persistence authority source proven across all branches.
- Tests present: general Helix Ask UI tests and terminal projection tests.
- Tests missing: chat persistence matrix proving terminal source and fallback/legacy markers.
- Proposed future repair owner: `HelixAskPill.tsx`, later a chat persistence projection owner.
- Proposed future repair strategy: persist terminal-source metadata with content and reject non-authoritative client fallback text for durable assistant messages.
- Stop condition: do not change visible answer selection in the same patch.
- Confidence: medium.

### TRAP-09: TTS/Read-Aloud Text Source

- Title: voice output can consume client-selected final text.
- Classification: `TTS_AUTHORITY_RISK`.
- Priority: `P2_CHARACTERIZE_MORE`.
- Current owner file: `client/src/components/helix/HelixAskPill.tsx`.
- Current symbols: `shouldAutoSpeakAnswerForTurn`, `enqueueVoicePlaybackIntent`, `handleReadAloud`, `buildCopyText`, `buildManualReadAloudVoiceIntent`, `shouldSuppressVoiceForTerminalState`.
- Current callers: autospeak final response path, manual read-aloud button, interim callouts.
- Endpoint or UI lane: TTS/read-aloud.
- Trigger condition: final response accepted, manual read aloud requested, or interim callout handoff.
- State written: voice autospeak queue, read-aloud state, speech receipts.
- Visible text effect: none directly.
- Persistence effect: none directly.
- TTS/read-aloud effect: high.
- Duplicate execution risk: none by itself.
- Route-policy effect: none.
- Current guards: `shouldAutoSpeakAnswerForTurn` requires mic/output state and final authority; suppresses provisional/tool-only/explicit voice/action receipt cases; barge-in suppresses finals for active turns.
- Missing guards: no proof that final text came from terminal authority rather than fallback/legacy shadow.
- Tests present: `helix-ask-pill-ui.spec.tsx` autospeak gating and `helix-read-aloud-state.spec.ts`.
- Tests missing: fallback/legacy/static text speech suppression matrix.
- Proposed future repair owner: `HelixAskPill.tsx`, later voice authority owner.
- Proposed future repair strategy: pass terminal source/authority metadata to TTS selectors and suppress `legacy_shadow` and client fallback text.
- Stop condition: do not alter microphone/barge-in behavior while changing final text authority.
- Confidence: medium.

### TRAP-10: Endpoint IDs, Timeouts, And Polling

- Title: endpoint lanes do not share a proven idempotency and timeout contract.
- Classification: `UNKNOWN_NEEDS_MORE_PROOF`.
- Priority: `P2_CHARACTERIZE_MORE`.
- Current owner file: `client/src/lib/agi/api.ts`.
- Current symbols: `buildRunAskTurnBody`, `askLocal`, `runAskTurn`, `runAskTurnStream`, `createAskJob`, `pollAskJob`, `resumeHelixAskJob`, `HELIX_ASK_JOB_TIMEOUT_MS`, `HELIX_ASK_JOB_POLL_INTERVAL_MS`.
- Current callers: same as transport lanes.
- Endpoint or UI lane: all Ask transports.
- Trigger condition: any direct/stream/job request.
- State written: pending job storage, request bodies, timeout fallback response text.
- Visible text effect: timeout/interrupted fallback text can become visible through `LocalAskResponse.text`.
- Persistence effect: timeout/interrupted text can be persisted.
- TTS/read-aloud effect: timeout/interrupted text can be spoken if downstream gates pass.
- Duplicate execution risk: high when timeout/polling causes fallback.
- Route-policy effect: route metadata is preserved across current fallback bodies, but server idempotency is not proven.
- Current guards: `sessionId`, `traceId`, optional `turnId` in turn lanes, pending job record, abort signal, offline wait, max poll timeout.
- Missing guards: no explicit idempotency key, no proof fallback preserves server `turnId`, no proof server dedupes by trace/session.
- Tests present: request body and fallback tests; added job body preservation characterization.
- Tests missing: idempotency-token propagation and server dedupe tests.
- Proposed future repair owner: `client/src/lib/agi/api.ts`, then transport split owners.
- Proposed future repair strategy: define a single attempt identity contract before changing timeout/retry semantics.
- Stop condition: do not tune timeouts before identity/dedupe proof exists.
- Confidence: medium.

## Deterministic Transport State Table

| Lane | Endpoint | Request body builder | ID fields sent | Job id behavior | Retry/fallback behavior | Re-exec possible | Preserves sessionId | Preserves traceId | Preserves turnId | Can outlive first attempt | Server dedupe token visible | Fallback text as `LocalAskResponse` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Turn direct | `/api/agi/ask/turn` | `buildRunAskTurnBody` | `sessionId`, `traceId`, optional `turnId` | none | none inside helper | no | yes | yes | yes if provided | yes server can still finish after local abort | no explicit token beyond IDs | yes via `normalizeLocalAskResponse` |
| Turn stream | `/api/agi/ask/turn/stream` | `buildRunAskTurnBody` | `sessionId`, `traceId`, optional `turnId` | none | throws on missing final or retryable final; UI can call `runAskTurn` | yes | yes | yes | yes if provided | yes | no explicit token beyond IDs | not directly; fallback turn can |
| Legacy direct | `/api/agi/ask` or `/api/agi/ask/turn` inside `askLocalDirect` | `askLocal` body assembly | `sessionId`, `traceId`; no `turnId` option | none | selected directly when parity/attachments force turn or after job fallback | yes when fallback | yes | yes | no | yes | none | yes |
| Jobs create/poll | `/api/agi/ask/jobs`, `/api/agi/ask/jobs/:id` | `askLocal` body assembly | `sessionId`, `traceId`; no `turnId` option | stores `jobId`, `sessionId`, `traceId`, question | unsupported jobs or interrupted/missing job can fall back direct | yes | yes in fallback body | yes in fallback body | no | yes | none | yes: partial, timeout, interrupted |
| Pending job resume | `/api/agi/ask/jobs/:id` | stored pending job id | stored job id; session/trace outside poll body | clears pending job after poll | no direct fallback in helper; callers can retry/queue separately | possible via caller retry | n/a | n/a | n/a | yes | job id only | yes |

## Terminal Text Authority Table

| Source | Can become visible answer | Can become chat content | Can be persisted | Can be TTS/read aloud | Debug export text | Current classification |
| --- | --- | --- | --- | --- | --- | --- |
| `terminal_answer_envelope` | yes | yes via `responseText` | yes | yes | yes | authoritative when present |
| `terminal_authority_single_writer` | yes | yes via projection | yes | yes | yes | authoritative when integrity applied |
| `terminal_answer_authority` | yes | yes via projection | yes | yes | yes | authoritative when server-authoritative |
| `terminal_presentation` | yes only for non-source compatibility | possible | possible | possible | yes | compatibility projection |
| `selected_final_answer` | yes for model synthesized final drafts and typed failures | possible | possible | possible | yes | guarded but still compatibility-sensitive |
| `assistant_answer` / `answer` / `text` / `finalAnswer` / `content` | yes through `legacy_shadow` for non-source turns | yes | yes | yes | yes | compatibility shadow |
| `typed_failure` | yes as failure text | yes | yes | possible | yes | safe failure projection if not stale |
| `model_direct_answer_artifact` | yes for satisfied model-only direct answers | yes | yes | yes | yes | guarded recovery |
| `normalizeLocalAskResponse` static fallback | yes through `LocalAskResponse.text` | yes | yes | possible | yes if copied into debug/reply | client text authority risk |
| job partial/timeout/interrupted text | yes through `LocalAskResponse.text` | yes | yes | possible | yes if copied into reply | client text authority risk |

## Route Metadata Policy Field Classification

| Field | Current client writers | Server readers found by targeted search | Classification | Notes |
| --- | --- | --- | --- | --- |
| `route_metadata` / `routeMetadata` | `askLocal`, `runAskTurn`, prompt launcher, Stage Play handoff | `agi.plan.ts`, `turn-finalizer.ts`, recovery helpers | trusted invocation contract / admission hint | Shape is preserved exactly by client transport tests. |
| `source_target_intent` | copied from route metadata by `appendHelixAskRouteMetadataToBody` | solver, runtime authority, tool admission, terminal authority | admission hint with policy impact | Server must own final authority; client origin still influences routing. |
| `requiredCanonicalGoal` | route metadata builders | route readers and solver goal framing | admission hint / mandatory policy depending lane | Needs server-origin distinction. |
| `requiredToolFamily` | hard backend family route metadata | tool admission and route readers | mandatory policy | Should not be trusted solely from UI. |
| `allowedCapabilities` | prompt launcher and Stage Play metadata | route/tool admission readers | admission hint / mandatory policy | Needs server validation. |
| `forbiddenCapabilities` | prompt launcher and Stage Play metadata | route/tool admission readers | mandatory policy | Needs server validation. |
| `mandatory_next_tool` | route metadata builders and API body copy | tool admission, solver controller, turn finalizer | mandatory policy | Highest policy-shaped field. |
| `answer_contract` | `askLocal`, `runAskTurn`, `HelixAskPill` options | finalizer/terminal authority readers | trusted invocation contract | Needs origin rules. |
| `forceReasoningDispatch` | `HelixAskPill`, prompt launcher | client dispatch only in inspected paths | client execution policy | Do not treat as server authority. |
| `bypassWorkstationDispatch` | `HelixAskPill`, prompt launcher | client dispatch only in inspected paths | client execution policy | Can suppress local fast paths. |
| `suppressWorkstationPayloadActions` | `HelixAskPill`, prompt launcher | client dispatch only in inspected paths | client execution policy | Affects local action execution, not answer authority. |
| `requiredEvidence` | `askLocal` options | scattered server evidence readers | admission hint | Enforcement not proven for all lanes. |
| `context_mode` | `buildRunAskTurnBody` | turn request readers | descriptive context | Safe as context, but can affect source scope. |
| `turn_input_items` | `askLocal`, `buildRunAskTurnBody` | turn input normalizer/auditor and multimodal route | user evidence input | Stronger backend-owned lane, but client assembles attachment metadata. |

## Stale Completion Timelines

| Timeline | Classification | Current evidence |
| --- | --- | --- |
| Job starts, direct fallback starts, job completes later | `DUPLICATE_EXECUTION_POSSIBLE` | `askLocal` can create a job, poll missing/interrupted, then submit the same body to `askLocalDirect`; no cancellation/dedupe proof. |
| Stream starts, retry/fallback starts, stream finishes later | `DUPLICATE_EXECUTION_POSSIBLE` | `runAskTurnStream` throws on missing/retryable final; UI fallback can call `runAskTurn` with the same payload. |
| Typed prompt starts, voice prompt starts before completion | `STALE_WRITE_POSSIBLE` | `askBusy` queues many paths, but voice retry/send paths can enqueue or replay; server cancellation is local-only. |
| External prompt arrives during active turn | `STALE_WRITE_POSSIBLE` | `pendingExternalAskPromptRef` defers while busy; older server work can still complete. |
| Component unmounts during request | `UNKNOWN_NEEDS_MORE_PROOF` | `AbortController` is used, but a complete unmount cleanup audit for every in-flight lane was not proven. |
| Resumed job finishes after newer prompt | `STALE_WRITE_POSSIBLE` | auto-resume is gated by `askBusy`, but pending job retry and later completion still need turn-identity proof. |

## Ranked Future Behavior Goals

### A. Job/Direct Duplicate Execution Guard

- Priority: `DONE_CLIENT_GUARD_SERVER_PROOF_REMAINING`.
- Exact owner file: `client/src/lib/agi/api.ts`.
- Exact symbols: `askLocal`, `createAskJob`, `pollAskJob`, `isInterruptedJobFallbackResponse`, `askLocalDirect`, pending job helpers.
- Tests now present: job missing blocked, interrupted partial-text blocked, job unsupported direct compatibility preserved, request identity/route metadata preserved in the job create body.
- Behavior invariant: after `createAskJob` succeeds for a request, `askLocal` must not issue an automatic direct Ask request for that same logical request merely because polling returned interrupted/missing fallback text.
- Applied patch shape: one-file API change introducing `buildBlockedJobDirectFallbackResponse`, which returns a marked non-authoritative `LocalAskResponse` instead of calling `askLocalDirect` after job creation.
- Rollback condition: if endpoint selection or response text changes outside the job-to-direct fallback cases, revert.
- Reason for priority: highest direct duplicate execution risk with narrowest owner; client guard is now applied.
- Server-side proof required: yes, for final dedupe/cancellation guarantee and late job completion semantics.
- Keyed validation required afterward: no for unit behavior; yes later for live job/dedupe parity.

### B. `normalizeLocalAskResponse` Fallback Text Quarantine

- Priority: `P1_FIX_SOON`.
- Exact owner file: `client/src/lib/agi/api.ts`.
- Exact symbols: `normalizeLocalAskResponse`, `runAskTurn`, `runAskTurnStream`, `askLocalDirect`, `pollAskJob`.
- Tests to write first: empty turn response fallback test now exists; add UI sink tests before suppressing persistence/TTS.
- Behavior invariant: client fallback text must be distinguishable from server terminal text and must not carry authority.
- Proposed patch shape: add a non-authoritative fallback marker while preserving `text` compatibility initially.
- Rollback condition: if valid `selected_final_answer`, `assistant_answer`, or typed failure text precedence changes, revert.
- Reason for priority: one-file owner and visible/persistence/TTS risk without endpoint complexity.
- Server-side proof required: no.
- Keyed validation required afterward: no.

### C. `legacy_shadow` Quarantine

- Priority: `P1_FIX_SOON`.
- Exact owner file: `client/src/lib/helix/resolveHelixVisibleTerminal.ts`.
- Exact symbols: `resolveHelixVisibleTerminal`.
- Tests to write first: source/capability closed tests and model-only compatibility tests already exist; add chat/TTS sink tests for legacy shadow before suppressing it.
- Behavior invariant: legacy compatibility text must not impersonate terminal authority.
- Proposed patch shape: mark legacy shadow as non-authoritative and allow only model-only compatibility turns.
- Rollback condition: if source/capability fail-closed behavior weakens, revert.
- Reason for priority: visible text authority risk with single owner.
- Server-side proof required: no.
- Keyed validation required afterward: no.

### D. Stale Completion Guard

- Priority: `P1_FIX_SOON`.
- Exact owner file: `client/src/components/helix/HelixAskPill.tsx`.
- Exact symbols: `runAsk`, `resumePendingAsk`, `activeAskTurnIdRef`, `askAbortRef`, `setAskReplies`, `addMessage`, `enqueueVoicePlaybackIntent`.
- Tests to write first: fake-promise timeline tests for stale job, stale stream, voice supersede, external prompt, unmount, resumed job after newer prompt.
- Behavior invariant: reply/chat/TTS writes must require the completion's turn identity to still be current or explicitly durable.
- Proposed patch shape: centralize completion admission before the three side-effect sinks.
- Rollback condition: if legitimate queued prompt or pending input completion is suppressed, revert.
- Reason for priority: high blast radius, but broader owner than A/B/C.
- Server-side proof required: no for client write guard, yes for server cancellation claims.
- Keyed validation required afterward: yes for live supersede paths.

### E. TTS/Read-Aloud Authority Source

- Priority: `P2_CHARACTERIZE_MORE`.
- Owner file: `client/src/components/helix/HelixAskPill.tsx`.
- Symbols: `shouldAutoSpeakAnswerForTurn`, `enqueueVoicePlaybackIntent`, `handleReadAloud`, `buildCopyText`.
- Tests to write first: fallback/static/legacy source suppression matrix.
- Invariant: voice certainty must be no stronger than text terminal certainty.
- Patch shape: pass terminal source metadata into speech selectors.
- Rollback condition: if manual read-aloud loses valid authoritative answers, revert.
- Server-side proof required: no.
- Keyed validation required afterward: yes for voice/live callout behavior.

### F. Route Metadata Server Validation

- Priority: `P2_CHARACTERIZE_MORE`.
- Owner file: server route metadata readers first, then `client/src/lib/agi/api.ts`.
- Symbols: `appendHelixAskRouteMetadataToBody`, server route metadata readers, tool admission and solver-controller readers.
- Tests to write first: server-side rejection/normalization for client-origin mandatory policy fields.
- Invariant: client context can hint, but server policy must authorize mandatory tool/route constraints.
- Patch shape: server origin validation and debug reason fields.
- Rollback condition: if Stage Play mailbox wake route metadata is broken without replacement, revert.
- Server-side proof required: yes.
- Keyed validation required afterward: yes for Stage Play/live-source wake flows.

### G. Stream Retryable Terminal Behavior

- Priority: `P2_CHARACTERIZE_MORE`.
- Owner file: `client/src/lib/agi/api.ts`.
- Symbols: `runAskTurnStream`, `askTurnStreamRetryableFailureCode`, `runAskTurn`.
- Tests to write first: SSE fetch-mock tests for retryable final failure and missing final.
- Invariant: stream fallback must not duplicate server execution without dedupe/cancellation proof.
- Patch shape: add explicit stream retry policy result before changing UI fallback.
- Rollback condition: if normal successful stream final parsing changes, revert.
- Server-side proof required: yes.
- Keyed validation required afterward: yes.

### H. Legacy `/api/agi/ask` Reachability

- Priority: `P3_KEEP_COMPATIBILITY`.
- Owner file: `client/src/lib/agi/api.ts`.
- Symbols: `askLocalDirect`, `askLocal`, `isHelixE814LaneParityEnabled`.
- Tests to write first: caller inventory and server parity tests.
- Invariant: compatibility endpoint remains reachable only under a named compatibility condition.
- Patch shape: document and narrow the condition after behavior traps A/B are controlled.
- Rollback condition: if compatibility callers break unexpectedly, revert.
- Server-side proof required: yes.
- Keyed validation required afterward: no unless live compatibility path is still used.

## Tests Added In This Pass

Updated in `client/src/lib/agi/__tests__/api.voice-transcribe.spec.ts`:

- `blocks direct fallback when a created job disappears during polling`
- `preserves request identity and route metadata while blocking job-to-direct re-execution`
- `blocks direct fallback when polling returns interrupted text after a partial result`
- `falls back to legacy direct ask when jobs are unsupported under the current compatibility flag`
- `characterizes empty turn responses as client fallback text without authority markers`

These tests use fetch mocks only. They preserve direct compatibility when no job was created and prove the new client guard when a job was created.

## API Split Plan Status

The ignored artifact `artifacts/helix-ask-ui-current-head-proof/api-transport-split-plan.md` was updated as a map-only plan for current post-Wave-3 code. No `api.ts` production split was performed.

Extractable without behavior change after characterization:

- request body assembly
- direct transport wrapper with exact compatibility condition preserved
- turn transport
- stream transport parser
- pending job persistence helpers

Requires behavior work first:

- server idempotency/dedupe proof for job/direct fallback policy
- response normalization fallback text
- stream retry/fallback policy
- legacy direct endpoint removal or narrowing
- endpoint idempotency/dedupe contract

## Readiness

`READY_FOR_FIRST_UI_BEHAVIOR_REPAIR: NO`

The first UI behavior repair is now applied on the client side. The next repair should be selected after reviewing the backend ownership result or after choosing a separate client-only sink repair for response normalization markers, legacy shadow, persistence, or TTS.
