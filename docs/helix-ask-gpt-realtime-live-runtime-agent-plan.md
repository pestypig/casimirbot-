# GPT Realtime Live Runtime Agent Plan

Status: active implementation record. Phases 1 and 2 are complete; the Phase 3
read-only live companion and worker-grounded spoken relay are implemented and
awaiting keyed operator proof. Phases 4 and 5 remain governed future work.

Implementation checkpoint (2026-07-17):

- Final Realtime transcripts enter the normal Helix Ask solver path through a
  server-issued, read-only Stage Play handoff.
- An extracted worker-admission contract classifies conversation-local,
  read-only worker-grounded, durable-goal-bound, and action-candidate turns.
- Codex or the selected runtime provider remains the worker. GPT Realtime has
  no workstation tools, mutation authority, or terminal answer authority.
- Completed server-authoritative worker answers can be projected through the
  existing OpenAI sideband connection as bounded, redacted, correlated
  out-of-band audio. The full canonical answer remains in Helix Ask chat.
- Conversation-local answers, typed failures, incomplete solver paths, missing
  required observations, stale results, and action candidates are not relayed.
- Relay lifecycle covers worker running, result ready, busy queueing, provider
  response, playback receipt, supersession, interruption, closure, and failure.
- Debug export correlates transcript handoff, admission reason, worker
  provider/model, capabilities/evidence, terminal authority, relay decision,
  provider response, and playback receipt without raw answer/provider payloads.
- The recrowned Ask UI adds only passive worker status text. It adds no new
  control and does not change the runtime-agent picker.
- The README startup contract is unchanged: the existing `OPENAI_API_KEY`
  startup path enables the live transport without additional required flags.
- Implementation lives under extracted Realtime/Stage Play/recrowned Ask
  modules and does not depend on or add code to deprecated `agi.plan.ts` or
  `HelixAskPill.tsx`.

## Objective

Add OpenAI GPT Realtime-style live agents to CasimirBot as a governed Runtime
Agent lane, not as a normal Helix Ask language-model option. The live runtime
should support voice, transcription, translation, monitoring, and admitted
workstation actions while preserving Helix Ask as the authority for evidence,
final answers, terminal claims, and debug traces.

Patch classification:

- Codex-owned runtime behavior
- tool admission
- evidence re-entry
- terminal authority
- presentation
- debug trace

The core design rule is:

```txt
Realtime is not the brain of Ask.
Realtime is a live runtime session provider whose outputs become governed observations.
```

## Current Architecture Map

### Ask Lane

Entry points:

- `server/routes/agi.plan.ts`
- `server/services/helix-ask/runtime/`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-codex-loop-discipline.md`

Helix Ask owns prompt interpretation, intent arbitration, source admission,
evidence identity, proof gates, route/product contracts, terminal eligibility,
and debug traces. It must not recreate a private sampling loop, private tool
runtime, sandboxing, compaction, subagent orchestration, or terminal completion
machinery.

### Runtime Provider Lane

Entry points:

- `shared/helix-agent-runtime.ts`
- `server/routes/agi.agent-providers.ts`
- `server/services/helix-ask/agent-providers/`
- `client/src/components/helix/ask-console/HelixAskRuntimePicker.tsx`
- `client/src/components/helix/ask-console/HelixAskRuntimePreference.ts`
- `client/src/lib/helix/ask-agent-runtime-display.ts`

Current runtime ids are `helix`, `codex`, and `future`. Provider selection is
already mediated through descriptors, permission profiles, account policy, and
the provider adapter boundary. This is the right surface for a future Realtime
provider descriptor or for Realtime session capabilities exposed under an
existing runtime provider.

### Capability Lane Sessions

Entry points:

- `shared/helix-capability-lane.ts`
- `shared/helix-capability-lane-session.ts`
- `server/services/helix-ask/capability-lanes/registry.ts`
- `server/services/helix-ask/capability-lanes/session-manager.ts`
- `server/routes/agi.agent-providers.ts`

Capability lanes already define one-shot calls, session lifecycle, goal binding,
observation contracts, receipt contracts, and terminal policy. Session lifecycle
already supports `start`, `pause`, `resume`, `stop`, and `record_observation`.
Session results are explicitly `tool_evidence`, `assistant_answer:false`,
`terminal_eligible:false`, and `raw_content_included:false`.

### Voice STT/TTS Lane

Entry points:

- `docs/architecture/voice-service-contract.md`
- `server/routes/voice.ts`
- `server/services/helix-ask/capability-lanes/speech-to-text.ts`
- `server/services/helix-ask/capability-lanes/text-to-speech.ts`
- `server/services/helix-ask/voice-playback/`
- `client/src/lib/helix/voice-playback-outcome-client.ts`
- `client/src/components/helix/ask-console/HelixAskVoicePlaybackToolController.ts`

Voice already has the right governance vocabulary: consent, visible session
state, task classes, memory admission, non-terminal interim callouts, playback
receipts, and a barrier that prevents "audio delivered" claims without client
playback outcome evidence.

### Live Translation Lane

Entry points:

- `server/services/helix-ask/capability-lanes/live-translation.ts`
- `server/services/helix-ask/capability-lanes/live-translation-descriptor.ts`
- `shared/helix-live-translation-lane.ts`
- `shared/helix-live-translation-projection-target.ts`

Live translation already demonstrates backend provider selection, optional
OpenAI-compatible execution, deterministic fallback, projection receipts, source
binding, freshness, and re-entry-required observation packets.

### Runtime Goal Wake And Monitoring Lane

Entry points:

- `shared/helix-runtime-goal-session.ts`
- `server/routes/agi.runtime-goals.ts`
- `server/services/helix-ask/runtime-goals/`
- `server/services/helix-ask/agent-providers/goal-runtime-session.ts`
- `client/src/components/helix/ask-console/HelixAskRuntimeGoalWakeEmitter.ts`

Runtime goals are the existing shape for long-lived monitoring. A live runtime
agent should use this as the durable "why am I awake?" and "what am I allowed to
watch?" layer instead of creating an untracked background agent.

### Workstation Gateway And Action Receipts

Entry points:

- `server/routes/agi.workstation-tool-gateway.ts`
- `server/services/helix-ask/workstation-tool-gateway/`
- `client/src/lib/workstation/panelCapabilities.ts`
- `client/src/lib/workstation/panelActionAdapters.ts`
- `client/src/store/useWorkstationActionExecutionStore.ts`

Realtime must not mutate workstation state directly. It can request actions
only through admitted gateway capabilities. Receipts are observations until
re-entered and terminal-authorized by Helix Ask.

### Debug Export Path

Entry points:

- `server/services/helix-ask/debug/capability-lane-debug-export.ts`
- `client/src/components/helix/ask-console/HelixAskDebugDrawer.tsx`
- `client/src/components/helix/ask-console/HelixAskDebugExportModelPolicyProjection.ts`
- `client/src/lib/agi/__tests__/debug-export-capability-lanes.spec.ts`

Debug export should show live session lifecycle, selected Realtime model or
service, source binding, backend provider, client receipt state, tool/admission
decisions, failures, and terminal-authority posture.

### Account Policy Path

Entry points:

- `shared/helix-account-session.ts`
- `server/services/helix-account/account-session-store.ts`
- `server/routes/account-session.ts`

Developer policy already allows all runtime agents and exposes
`runtime_agent_controls`. User policy currently locks experimental runtime
controls. Realtime controls should launch developer-visible first and remain
locked for public user accounts until stable.

## OpenAI Realtime API Boundary

Official OpenAI docs currently describe Realtime as a low-latency multimodal API
with browser WebRTC and server-side WebSocket options. Browser clients should
not receive a normal OpenAI API key. The two relevant server-controlled browser
flows are:

- `POST /v1/realtime/client_secrets` to mint ephemeral browser/mobile
  credentials.
- `POST /v1/realtime/calls` to establish WebRTC sessions through a
  developer-controlled server.

OpenAI also documents sideband/server-side controls so application servers can
monitor a Realtime session, update instructions, and handle tool/business logic
without exposing that logic to the browser.

References:

- https://developers.openai.com/api/docs/guides/realtime
- https://developers.openai.com/api/docs/guides/realtime-webrtc
- https://developers.openai.com/api/docs/guides/realtime-websocket
- https://developers.openai.com/api/docs/guides/realtime-server-controls

For CasimirBot, this means:

- WebRTC is the likely client transport for live voice.
- A Helix server route must mint ephemeral credentials or proxy SDP setup.
- Workstation tools and action policy must stay server-side.
- Realtime events must be converted into Helix observations/receipts.

## Gap Analysis

### Already Reusable

- Runtime provider descriptors and account-policy filtering.
- Capability lane manifest, one-shot, session, goal-binding, and debug event
  contracts.
- Voice STT/TTS policy, task classes, memory governor, and playback receipt
  barrier.
- Live translation backend selection and projection receipt pattern.
- Runtime goal wake sessions for monitoring.
- Workstation gateway admission and action receipt infrastructure.
- Recrowned Ask UI runtime picker and voice-control components.
- Debug export projection for capability lane timelines.

### Missing For GPT Realtime

- Shared live runtime mode and authority types.
- A Realtime capability lane descriptor or runtime session descriptor.
- A server route for Realtime session creation or ephemeral client secrets.
- A server-side sideband/control adapter for tool-call monitoring.
- Realtime event normalization into Helix observation packets.
- Client WebRTC lifecycle and visible consent UI.
- Debug export summaries for live runtime session state.
- Runtime task class and governor budget for Realtime sessions.
- Account policy flags for developer-only rollout.
- Tests proving Realtime output is not terminal answer authority.

### Dangerous To Duplicate

- A private Realtime agent loop that bypasses Helix Ask.
- Direct client-to-workstation tool execution from Realtime events.
- Treating transcript text as user intent without an admitted handoff.
- Treating model audio playback as complete without client playback receipt.
- Adding Realtime models to the Ask language-model picker.
- Creating hidden background capture or implicit monitoring.
- Rebuilding Codex-style tool execution, approvals, sandboxing, or terminal
  completion in Helix Ask.

### Server-Owned Vs Client-Owned

Server-owned:

- OpenAI API key custody.
- Ephemeral token or `/realtime/calls` exchange.
- Runtime/session admission.
- Tool/action admission.
- Sideband tool-call handling.
- Observation packet construction.
- Debug export storage/projection.
- Account policy enforcement.
- Runtime task/memory budget admission.

Client-owned:

- Visible mic/capture consent.
- WebRTC peer connection lifecycle.
- Audio focus and playback.
- Listening/thinking/speaking/muted UI.
- Client playback outcome receipts.
- User confirmation gestures for mutating actions.

## Product Model

Keep text reasoning and live runtime controls separate.

```txt
Text Agent
  Auto
  Fast
  Balanced
  Deep

Runtime Agent
  Off
  Live Voice
  Live Voice Mini
  Live Transcription
  Live Translation

Runtime Authority
  Observe Only
  Suggest Actions
  Execute Safe Actions
  Execute Confirmed Actions
```

Model choice does not imply authority. Authority comes from the runtime
authority policy, account policy, workstation gateway admission, and any
required user confirmation.

## Backend Plan

### Existing Contracts To Reuse

Do not invent parallel contracts when these already cover the needed boundary:

- Runtime provider identity and permissions:
  `shared/helix-agent-runtime.ts`
- Capability lane descriptors, backend selection, and terminal policy:
  `shared/helix-capability-lane.ts`
- Session lifecycle and observation recording:
  `shared/helix-capability-lane-session.ts`
- Runtime goal monitoring and wake behavior:
  `shared/helix-runtime-goal-session.ts`
- Voice playback/authority receipts:
  `shared/helix-voice-live-handoff.ts`,
  `shared/contracts/helix-interim-voice-callout.v1.ts`, and
  `server/services/helix-ask/voice-playback/`
- Workstation action admission and receipts:
  `server/services/helix-ask/workstation-tool-gateway/`
- Account visibility and lock policy:
  `shared/helix-account-session.ts`

### Shared Types

Add shared contracts before adding live execution:

- `shared/helix-live-runtime-agent.ts`
- `shared/helix-realtime-session.ts`
- `shared/helix-realtime-observation.ts`

Suggested fields:

- `runtime_agent_mode`: `off | live_voice | live_voice_mini | live_transcription | live_translation`
- `runtime_agent_authority`: `observe_only | suggest_actions | execute_safe_actions | execute_confirmed_actions`
- `transport`: `webrtc | websocket | server_sideband`
- `session_status`: `idle | requesting | active | paused | stopping | stopped | error`
- `selected_backend_provider`
- `selected_model_or_service`
- `source_binding`
- `consent_state`
- `tool_admission_state`
- `client_receipt_state`
- `terminal_authority_status`

### Realtime Session Descriptor

Prefer a new capability lane or session family over a new Ask model:

- lane id: `realtime_session`
- family: `live_runtime_agent`
- capabilities:
  - `realtime_session.start`
  - `realtime_session.stop`
  - `realtime_session.record_event`
  - `realtime_session.record_tool_request`
  - `realtime_session.record_client_receipt`

If the existing lane id enum is too narrow, extend it deliberately and add
descriptor tests. Keep `assistant_answer:false` and `terminal_eligible:false`.

### Server Routes

Add routes under the agent/capability boundary, not the Ask language model
policy path:

- `POST /api/agi/realtime/session`
- `POST /api/agi/realtime/session/:id/stop`
- `POST /api/agi/realtime/session/:id/client-receipt`
- `POST /api/agi/realtime/session/:id/event`

For browser WebRTC, the first route should either:

- mint a short-lived client secret using `/v1/realtime/client_secrets`, or
- proxy the browser SDP to `/v1/realtime/calls`.

The normal OpenAI API key must stay server-side.

### Sideband And Tool Admission

Realtime tool calls should enter this path:

```txt
Realtime event
-> normalize event
-> tool/action intent candidate
-> Helix account/runtime authority check
-> workstation gateway admission
-> gateway execution or confirmation request
-> action receipt
-> observation packet
-> optional Ask re-entry
```

Do not let the Realtime provider directly call workstation adapters.

### Observation Packet Shape

Every Realtime observation should include:

- `schema`
- `realtime_session_id`
- `lane_session_id`
- `runtime_agent_mode`
- `runtime_agent_authority`
- `selected_backend_provider`
- `selected_model_or_service`
- `event_type`
- `source_id`
- `source_kind`
- `source_hash` or text/audio hash when applicable
- `observed_at_ms`
- `confidence` when model-perception-derived
- `client_receipt_ref` when applicable
- `gateway_receipt_ref` when applicable
- `reentry_required:true`
- `assistant_answer:false`
- `terminal_eligible:false`
- `raw_content_included:false`

### Debug Export Additions

Add a compact Realtime debug section:

- `realtime_runtime_session_summary`
- `realtime_runtime_session_events`
- `runtime_agent_mode`
- `runtime_agent_authority`
- `selected_realtime_model`
- `transport`
- `session_lifecycle`
- `source_binding`
- `consent_state`
- `tool_request_count`
- `admitted_tool_request_count`
- `blocked_tool_request_count`
- `client_receipt_count`
- `latest_failure_code`
- `terminal_authority_status`

### Runtime Governor

Extend `RuntimeTaskClass` only when execution is introduced:

- `realtime_session`
- `realtime_sideband`

Initial default should be low concurrency, non-hidden, and visible-session-only.
Do not treat a long-lived Realtime connection as an unbounded resident task.

## Frontend Plan

### Location In Recrowned Ask UI

Add controls inside `client/src/components/helix/ask-console/`, near existing
runtime and voice controls:

- new `HelixAskLiveRuntimePicker.tsx`
- new `HelixAskLiveRuntimeAuthorityPicker.tsx`
- extend existing runtime shell state rather than growing
  `HelixAskPill.tsx`

Do not grow deprecated monolithic Ask UI surfaces.

### Visible States

The UI should show:

- off
- requesting mic/session permission
- listening
- thinking
- speaking
- tool requested
- waiting for confirmation
- tool running
- muted
- paused
- error

### Consent And Capture

Live capture must be user-started and visible. No hidden background capture.
Stopping the session must stop browser tracks, data channels, playback, and
server session state.

### Runtime Authority Controls

Authority should be an explicit segmented control or menu:

- Observe Only
- Suggest Actions
- Execute Safe Actions
- Execute Confirmed Actions

For mutating actions, the UI must collect a confirmation receipt before the
server executes the admitted action.

### Receipts

The client must send receipts for:

- session started
- mic permission granted/denied
- track stopped
- model audio playback started/ended/failed
- user confirmation accepted/denied
- visible capture active/stopped

These receipts are not answers.

## Staged Implementation

### Phase 1: Static Plan And Disabled Descriptors

Implementation status: complete.

Add shared types, a disabled/experimental Realtime descriptor, account-policy
visibility, debug shape tests, and UI placeholders. No OpenAI network call.

Acceptance:

- Developer accounts can see disabled/experimental controls.
- User accounts keep them locked.
- Debug export can represent an inactive Realtime lane.
- No Ask language-model picker changes.

### Phase 2: Transcription-Only Session

Implementation status: complete.

Use existing voice STT lane or Realtime transcription mode to prove visible
session lifecycle, source binding, transcript observation packets, and debug
export re-entry.

Acceptance:

- Transcript is evidence, not submitted user intent by default.
- Stopping the session stops capture.
- Debug export shows lifecycle and transcript observation refs.

### Phase 3: Readonly Live Voice Companion

Implementation status: implemented; keyed grounded-relay playback proof pending.

Add live voice Q&A over current Ask/workstation context with no mutating tools.
Realtime responses can speak, but final Ask answers still come from the solver
path when terminal authority is required.

Acceptance:

- Voice certainty cannot exceed text certainty.
- Playback claims require client receipt.
- Realtime output remains non-terminal evidence.

### Phase 4: Safe Action Suggestions

Implementation status: partial policy scaffold only. Action candidates are
auditable but suppressed from Realtime execution and delayed spoken relay.

Allow Realtime to suggest safe/read-only actions. The suggestion becomes a
candidate, then gateway admission decides whether it may run.

Acceptance:

- Quoted, negated, contextual, future, and screen-visible tool mentions do not
  execute.
- Action suggestions are visible and auditable.

### Phase 5: Confirmed Mutating Actions

Implementation status: intentionally not implemented by the read-only relay.

Allow admitted mutating workstation actions only under
`execute_confirmed_actions` with explicit user confirmation and receipt.

Acceptance:

- Confirmation receipt exists before execution.
- Gateway receipt exists after execution.
- Runtime cannot claim completion without observation/receipt evidence.

### Phase 6: Keyed Live Proof And Rollout

Implementation status: pending operator-owned keyed proof.

Run keyed operator-owned localhost proof only after the user starts the normal
keyed server. Do not use a self-started unkeyed server as proof.

API parity matrix is optional for this track and is not a required gate.

## Tests

First patch tests:

- `server/services/helix-ask/agent-providers/__tests__/runtime-adapter-contract.test.ts`
- `server/services/helix-ask/capability-lanes/__tests__/registry.test.ts`
- `server/services/helix-ask/capability-lanes/__tests__/session-manager.test.ts`
- `server/__tests__/account-session-panel.test.ts`
- `client/src/components/__tests__/helix-ask-console-recrown.spec.ts`
- `client/src/lib/helix/__tests__/ask-agent-runtime-display.spec.ts` if present, or add one.
- `client/src/lib/agi/__tests__/debug-export-capability-lanes.spec.ts`

Later live/authority tests:

- Realtime session route contract tests.
- Voice/realtime terminal-authority tests.
- Client receipt tests.
- Runtime governor budget tests.
- Adversarial prompt tests for quoted, negated, contextual, historical, future,
  and mixed intent tool/action cues.

Local deterministic checks:

```bash
npm run helix:ask:discipline:quick
npx vitest run server/services/helix-ask/agent-providers/__tests__/runtime-adapter-contract.test.ts --pool=forks
npx vitest run server/services/helix-ask/capability-lanes/__tests__/session-manager.test.ts --pool=forks
npx vitest run client/src/components/__tests__/helix-ask-console-recrown.spec.ts --pool=forks
```

Keyed proof:

- User starts the normal keyed server.
- Operator tests live browser session, OpenAI Realtime auth, client receipts,
  and action admission.
- Report live proof separately from deterministic tests.

## Recommended Patch Order

1. Add shared Realtime/live runtime types and disabled descriptors.
2. Add debug export projection for inactive/disabled Realtime session state.
3. Add recrowned Ask UI controls behind developer-only account policy.
4. Add server Realtime session route with deterministic unavailable envelopes.
5. Add WebRTC client lifecycle with visible consent and no hidden capture.
6. Add transcription-only observations and re-entry.
7. Add sideband/tool-request normalization and read-only action suggestions.
8. Add confirmed action execution.
9. Run keyed live proof and then consider public user policy exposure.

## Likely Files To Change

Phase 1 likely changes:

- `shared/helix-agent-runtime.ts`
- `shared/helix-capability-lane.ts`
- `shared/helix-capability-lane-session.ts`
- `shared/helix-account-session.ts`
- `server/services/helix-ask/capability-lanes/registry.ts`
- `server/services/helix-ask/capability-lanes/session-manager.ts`
- `server/services/helix-ask/debug/capability-lane-debug-export.ts`
- `server/routes/agi.agent-providers.ts`
- `client/src/components/helix/ask-console/HelixAskRuntimePicker.tsx`
- `client/src/components/helix/ask-console/HelixAskRuntimePreference.ts`
- `client/src/components/helix/ask-console/HelixAskConsoleRuntimeShell.tsx`
- `client/src/lib/helix/ask-agent-runtime-display.ts`

Phase 2 and later likely changes:

- `server/routes/voice.ts`
- `server/routes/runtime-governor.ts`
- `server/services/runtime/runtime-memory-governor.ts`
- `server/services/helix-ask/capability-lanes/speech-to-text.ts`
- `server/services/helix-ask/capability-lanes/live-translation.ts`
- `server/services/helix-ask/voice-playback/receipt-builder.ts`
- `server/services/helix-ask/voice-playback/outcome-receipts.ts`
- `server/services/helix-ask/agent-providers/runtime-adapter-contract.ts`
- `server/services/helix-ask/agent-providers/provider-terminal-authority.ts`
- `server/routes/agi.workstation-tool-gateway.ts`
- `client/src/lib/audio-focus.ts`
- `client/src/lib/helix/voice-playback-outcome-client.ts`
- `client/src/components/helix/ask-console/HelixAskVoicePlaybackToolController.ts`
- `client/src/components/helix/ask-console/HelixAskVoiceConfirmationPanel.tsx`

## Highest-Risk Boundary

The highest-risk boundary is tool/action authority. Realtime model events will
arrive fast and may look like commands, transcripts, tool calls, or answers.
The implementation must keep those as observations or candidates until Helix
policy admits them, the gateway executes them, receipts re-enter, and terminal
authority explicitly allows any answer claim.

## Minimum Viable First Patch

The first implementation patch should be non-networked:

- Shared `runtime_agent_mode` and `runtime_agent_authority` types.
- Realtime disabled descriptor or session placeholder.
- Developer-only UI controls in recrowned Ask UI.
- Account policy lock for user accounts.
- Debug export shape for inactive Realtime state.
- Tests proving it does not appear as a text language model and does not grant
  action authority by selecting a mode.

This proves the architecture placement before introducing OpenAI keys, WebRTC,
sideband events, or workstation actions.
