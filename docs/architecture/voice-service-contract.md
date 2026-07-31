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

Additional endpoint:
- `POST /api/voice/transcribe` (multipart `audio` + optional `language`, `traceId`, `missionId`, `durationMs`)
- `GET /api/voice/debug/recent?limit=<n>&narrator=true&chunkKind=panel_narration`
  returns recent `/api/voice/speak` transport diagnostics for debugging playback
  routing. The response is metadata-only: text hash, text length, trace/event
  identifiers, chunk kind, outcome, provider/cache headers, and evidence counts.
  It must not include raw spoken text, audio, API keys, or terminal-answer
  authority.
- Response shape for UI dictation:
  - `ok`, `text`, `language`, `duration_ms`, `segments`, `traceId`, `missionId`, `engine`
  - optional multilingual metadata: `source_text`, `source_language`, `translated`
  - `engine` values: `openai_transcribe | faster_whisper_local | whisper_http`

STT runtime policy controls:
- `STT_POLICY_MODE`: `openai_first | local_first | local_only | http_only` (default: `openai_first`)
- `STT_OUTPUT_MODE`: `original | english | dual` (default: `english`)
- `WHISPER_HTTP_MODEL`: default `gpt-4o-mini-transcribe`
- STT auth key precedence: `WHISPER_HTTP_API_KEY -> OPENAI_API_KEY -> LLM_HTTP_API_KEY`

Runtime memory admission controls:
- `VOICE_TRANSCRIBE_MEMORY_GUARD`: `0` disables voice STT memory admission.
- `VOICE_TRANSCRIBE_MAX_HEAP_USED_MB`: voice STT heap threshold. Default is `480`; development servers default to `2048` because Vite/tsx middleware, Stage Play diagnostics, and local Ask workbench state can idle far above the production-sized guard.
- `VOICE_TRANSCRIBE_MAX_RSS_MB`: voice STT RSS threshold. Default is `900`; development servers default to `3200` for the same reason.
- `VOICE_TTS_MAX_HEAP_USED_MB`: voice TTS heap threshold. Default follows the `voice_tts` task budget; development servers default to `2048` so short callouts are not blocked by the lower STT-style upload guard.
- `VOICE_TTS_MAX_RSS_MB`: voice TTS RSS threshold. Default follows the `voice_tts` task budget; development servers default to `3200`.
- `VOICE_TTS_RESUME_HEAP_USED_MB`: voice TTS retry/resume heap threshold; defaults to 85% of the TTS max.
- `VOICE_TTS_RESUME_RSS_MB`: voice TTS retry/resume RSS threshold; defaults to 85% of the TTS max.
- `RUNTIME_MEMORY_GUARD`: `0` disables generic runtime memory admission.
- `RUNTIME_MEMORY_MAX_HEAP_USED_MB`: generic heap threshold, default `520`.
- `RUNTIME_MEMORY_MAX_RSS_MB`: generic RSS threshold, default `950`.
- `RUNTIME_MEMORY_RESUME_HEAP_USED_MB`: resume threshold for paused work; defaults to 85% of max.
- `RUNTIME_MEMORY_RESUME_RSS_MB`: resume threshold for paused work; defaults to 85% of max.
- `RUNTIME_MEMORY_HOST_FREE_RATIO_MIN`: host free-memory ratio floor, default `0.08`.
- `RUNTIME_MEMORY_STATUS_ENABLED`: `0` disables `/api/runtime/memory`.

Runtime task-manager controls:
- Runtime task classes include `critical_resident`, `active_user_turn`, `voice_capture`, `voice_stt`, `voice_tts`, `stage_play_refresh`, `situation_room_poll`, `debug_export`, and `repo_indexing`.
- Each class has a priority, deferrable/pausable flags, a concurrency budget, and an optional burst budget.
- Env overrides use the pattern `RUNTIME_TASK_<TASK_CLASS>_MAX_CONCURRENT`, `RUNTIME_TASK_<TASK_CLASS>_BURST_LIMIT`, and `RUNTIME_TASK_<TASK_CLASS>_BURST_WINDOW_MS`; for example `RUNTIME_TASK_VOICE_STT_MAX_CONCURRENT=1`.
- Voice STT is a foreground burst task and defaults to single-flight admission. When a second voice STT request arrives while one is active, the governor rejects it as runtime capacity pressure rather than holding another multipart request open.
- Deferrable work such as Stage Play refresh is queued under pressure or when its lane is occupied.
- Pausable background services can register with the governor. The Stage Play live-source mail wake service registers as pausable and yields while foreground work is under pressure.

Interim voice callout controls:
- `live_env.request_interim_voice_callout` records a short provisional speech request during an Ask/tool step.
- The first conversational response should use kind `immediate_ack`. It is capped at 96 characters, may carry a `timingHintMs` such as `800`, and only one pending/delivered immediate ack is allowed per Ask turn.
- Later tool-phase speech should use milestone kinds such as `tool_started`, `tool_progress`, `tool_result`, `waiting_for_evidence`, `memory_pressure`, or `clarifying_status`; these should correspond to real solver/tool progress, blockers, or wait states.
- Interim callouts use playback kind `tool_receipt` or `translation_relay` and authority `provisional`.
- Interim callout requests and receipts are tool evidence only: `assistant_answer:false`, `terminal_eligible:false`, `raw_content_included:false`, and `instruction_authority:"none"`.
- The callout is admitted through the runtime `voice_tts` task class. If admitted, the backend receipt records `awaiting_client_playback` with `playbackStatus:"awaiting_client_receipt"`; this is a browser playback handoff, not proof that audio bytes played.
- If the voice TTS lane is occupied or under pressure, the receipt records `queued_for_retry` and keeps a short-lived delivery job containing only text, request metadata, evidence refs, retry count, and expiry.
- The provider-facing `text_to_speech.speak_text` capability lane may use a
  lightweight browser playback handoff when server-side TTS admission is blocked
  by heap/RSS pressure. This handoff records `awaiting_client_playback` plus the
  pressure reason and still requires a later client playback outcome receipt
  before the agent may claim audio was delivered. Other interim callouts continue
  to use `queued_for_retry` under pressure.
- Retry jobs do not hold audio buffers or open HTTP requests. When capacity recovers, the retry produces `awaiting_client_playback` with an `utteranceId`; if capacity does not recover before expiry, the receipt records `expired`.
- Actual heard-audio confirmation must come from the client playback receipt stream, for example `helix.voice_playback_outcome_receipt.v1` with a delivered outcome. A backend interim callout receipt alone must not be narrated as completed playback.
- Interim callouts must not contain final-answer text and must not satisfy terminal answer gates. The completed Ask solver path remains the only answer route, and final answer reads must derive from a completed answer snapshot rather than an interim callout.

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
- Optional chunk metadata for low-latency playback orchestration:
  - `utteranceId`, `turnKey`, `chunkKind` (`brief|final|tool_receipt|manual_read_aloud|translation_relay`), `chunkIndex`, `chunkCount`
- `consent_asserted` required for any reference-audio or custom profile route.
- `traceId` recommended for replay/audit linkage.
- `missionId` and `eventId` optional but recommended for Go Board linkage.

## Response (success)
Headers:
- `content-type: audio/wav` (or requested format)
- `x-voice-provider`
- `x-voice-profile`
- `x-voice-cache` (`hit|miss`, optional)
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
- `voice_memory_pressure`
- `voice_rate_limited`
- `voice_queue_full`
- `voice_backend_timeout`
- `voice_backend_error`

`voice_memory_pressure` means the runtime memory governor refused a voice STT
burst to protect the main Ask/Express server. It does not mean the user's audio
was invalid. The route checks memory before accepting multipart audio and again
before STT, where buffer expansion such as base64/data-URI conversion can
increase temporary memory use.

Example memory-pressure envelope:
```json
{
  "error": "voice_memory_pressure",
  "message": "Voice transcription is temporarily paused because the server is under memory pressure.",
  "details": {
    "reason": "heap_used_limit",
    "heapUsedMiB": 500,
    "rssMiB": 1030,
    "maxHeapUsedMiB": 480,
    "maxRssMiB": 900,
    "pausedTaskCount": 0,
    "activeTaskCount": 0
  }
}
```

Runtime memory status is available at `GET /api/runtime/memory` when enabled.
Runtime task-manager status is available at `GET /api/runtime/tasks` when
enabled. These status responses expose process memory, host free-memory ratio,
active runtime task leases, paused task identifiers, registered pausable tasks,
per-class task budgets, recent admission decisions, recent completions, and
limits. They must not expose transcript text, prompts, audio, API keys, or raw
request bodies.

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

## Prompt-style contract binding (v1, additive)

For mission-overwatch and Helix Ask callouts, implementations should also comply with:
- `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md`

Recommended additive request metadata (when available):
- `contextTier` (`0|1`)
- `sessionState` (`idle|requesting|active|stopping|error`)
- `voiceMode` (`normal|critical_only|dnd|off`)
- `certaintyClass` (`confirmed|reasoned|hypothesis|unknown`)

Behavioral binding:
- Speak eligibility is determined by tier/session/voice mode matrix.
- Missing evidence for repo-attributed mission claims should suppress or downgrade certainty.
- Suppression responses should carry stable deterministic reason labels.

## GPT Realtime grounded worker relay (additive)

Each finalized GPT Realtime utterance receives one server-owned interaction
mode. The mode is admission policy, not answer authority:

| Interaction mode | Live behavior | Runtime behavior |
| --- | --- | --- |
| `conversation_local` | Respond naturally and immediately. | Do not dispatch a runtime turn. Use for greetings, acknowledgements, microphone/connection checks, and fragments without affirmative worker demand. |
| `parallel_conversation` | Respond naturally and immediately without announcing or waiting for a workstation check. | Stage the complete utterance for the selected runtime, then launch it after the correlated Live response finishes playback. If the user resumes speaking first, cancel that partial dispatch; the next handoff carries the prior segment in its bounded context pack. A later authorized result may be relayed into the ongoing Live conversation. |
| `worker_required` | Give only the bounded operational status after dispatch is confirmed. | Use the selected runtime and admitted read-only capabilities for explicit docs, repository, research, calculator, workstation-state, or durable-goal requests. |

Runtime selection and interaction mode are independent decisions. Selecting
Codex means every substantive non-local utterance is offered to Codex; it does
not promote an otherwise model-answerable turn to `worker_required`. Only a
current request for fresh workstation/source evidence, an admitted tool or
action, or a durable goal requires Live to wait.

Contextual, negated, quoted, historical, future, and screen-visible control
language must not become tool execution. A mixed utterance such as a microphone
check followed by an affirmative docs request is `worker_required`, not
`conversation_local`.

- The complete current utterance is offered to Codex for both
  `parallel_conversation` and `worker_required`; parsing must not reduce it to a
  fragment such as "look at the docs".
- A provider-finalized transcription segment is durable Stage Play context but
  is not, by itself, proof that a conversational thought is finished. For
  `parallel_conversation`, the browser records `worker_dispatch_deferred`, then
  waits for the handoff-bound Live playback to settle. A later
  `speech_started` cancels the pending launch with a typed
  `worker_dispatch_skipped` receipt. A bounded fallback launches the staged
  turn if provider playback lifecycle events are missing. Explicit
  `worker_required` and durable-goal dispatches remain immediate.
- Stage Play binds a bounded server-side conversation context pack to the
  handoff. Codex receives prior user turns, grounded assistant answers, goal
  summaries, and source identities only after the current transcript hash,
  length, event, session, thread, context ID, and context hash match. The exact
  current transcript remains the separate current user request.
- The bounded context is conversational evidence, not operator authority. It
  may resolve ordinary references and omitted subjects such as "it", "that",
  or "look at the docs", but prior directives cannot authorize current tool use.
  Helix still admits the current source, capability, arguments, and permissions;
  Codex still owns reasoning, tool-result re-entry, and answer generation.
- GPT Realtime conversation audio remains separate from `/api/voice/speak` and
  the ElevenLabs/local read-aloud queue. An eligible terminal result is
  presented through the existing OpenAI Realtime sideband call as a correlated
  out-of-band `response.create` audio response.
- Terminal speech authority and grounding authority are independent gates. A
  completed, server-authoritative model-direct terminal may be relayed without
  selected evidence. A terminal that claims a document, panel, calculation,
  repository, research, or other workstation observation must carry the
  completed route's current-turn evidence.
- The completed solver route determines whether grounding is required.
  Preliminary interaction admission and candidate capability IDs are routing
  hypotheses and must not suppress a canonical model-direct terminal.
- The canonical terminal boundary emits
  `helix.terminal_grounding_authority.v1` after terminal selection and final
  evidence re-entry audit. It binds the Ask turn, selected terminal artifact,
  terminal text hash, grounding mode, and selected evidence refs. The authority
  is tool-neutral: GPT Realtime validates the certificate and exact terminal
  binding instead of matching capabilities, gateway results, or tool-specific
  observation schemas again.
- Older response paths without the artifact may use the same canonical builder
  as an explicitly labeled compatibility reconstruction. A malformed or
  rejected artifact is never replaced silently, and no Realtime-side
  capability guess can upgrade it.
- Every relay binds the Realtime session, Stage Play handoff, Ask turn,
  terminal artifact ref, and terminal text hash. Tool receipts, typed failures,
  requests for input, action candidates, and client projections are ineligible.
- The projection is bounded and credential-redacted. Raw documents, tool
  output, debug exports, provider payloads, and the full answer are not sent;
  the canonical full answer remains in Helix Ask chat and Stage Play.
- GPT Realtime receives no workstation tools and gains no mutation or terminal
  answer authority. It presents the worker's result without adding claims or
  implying that it executed the worker's tools.
- Codex and GPT Realtime cannot grant relay eligibility by emitting a
  "read aloud", relevance, success, or satisfaction tag. Relay admission is
  deterministic server policy over the exact handoff and terminal binding,
  terminal and grounding authority, freshness, supersession, and transport
  state. Model prose is never its own speech-authority receipt.
- User speech, provider response activity, and browser playback hold the relay
  queue busy. Newer competing worker or action handoffs supersede older pending
  results; conversation-local transcripts and unqualified short
  parallel-conversation fragments do not discard already-bound worker results.
  Qualified barge-in cancels active relay speech; session closure cancels
  remaining work.
- Delivery follows `eligible -> queued -> response requested -> provider
  acknowledged -> speaking -> playback confirmed`. A stable idempotency key and
  bounded retry cover missing provider acknowledgement, explicit provider
  failure, and missing or failed playback. Supersession, qualified barge-in,
  expiry, and session closure stop retries.
- Response acknowledgement and audio completion use separate watchdogs. Before
  browser playback starts, a short fixed deadline detects a response that never
  became audible. After `playback_started`, the completion deadline is derived
  from the bounded answer projection length and capped, so a valid long answer
  is not retried merely because it speaks for more than the playback-start
  window.
- Delivery is complete only after the correlated browser playback receipt.
  Debug records relay basis, speech authority, grounding requirement/status,
  exact terminal binding, delivery attempts, last failure, provider response
  ID, and playback receipt without raw answer content.

### Contract-stable baseline

The three interaction modes, Stage Play handoff identity, solver-authorized
terminal feedback, sideband relay, and browser playback receipt are the
contract-stable baseline. Changes to these paths must preserve:

1. `conversation_local` never dispatches Codex or workstation tools.
2. `parallel_conversation` does not force GPT Realtime to wait for Codex.
3. `worker_required` does not claim a check started before the dispatch receipt.
4. A relay requires a completed solver path plus route, poison, and terminal
   authority; no receipt or client projection becomes an answer.
5. Model-direct terminals do not require synthetic tool evidence. Grounded
   terminals continue to fail closed without a validated terminal grounding
   authority carrying current-turn selected observations.
6. GPT Realtime remains presentation-only: no workstation execution or terminal
   authority is transferred.
7. Delivery requires a handoff-bound provider response and browser playback
   receipt. Conversational rendering may paraphrase the canonical answer, so a
   spoken transcript hash mismatch is not itself a failure when binding and
   playback correlation succeed.
8. When selected Ask evidence includes a scientific closure packet, the relay
   carries its integrity-verified identity and claim ceiling. Voice may say
   “canonical within the exact enrollment” only when that bounded flag is true,
   and may never promote the result to source, semantic, theory, empirical,
   physical, or implementation-correctness authority.

Implementation files are not frozen. Source breadth, tool parity, speech style,
and context economy may evolve behind these invariants.

### Accepted keyed proof

The 2026-07-22 manual parallel-conversation proof is accepted as the initial
known-good baseline:

- Ask turn: `ask:b96255c0-1f05-4419-a417-5d547dcb91d2`
- Stage Play handoff: `realtime-stage-play-handoff:2952569c8a3ee66f6319`
- admission: `parallel_conversation`, selected runtime `codex`, model `gpt-5.5`
- provisional Live response: `delivered`
- solver: completed with route, poison, and terminal authority all true
- grounded answer hash:
  `sha256:a9e1aae86598f29158e81ded0fd6a4a9471f081c09f196c40188bec9b8645a60`
- grounded relay: `delivered` with correlated browser playback receipt
- final binding: `provider_response_bound_to_selected_answer`, playback
  confirmed

This proves the model-only parallel path. A source-backed `worker_required`
docs/tool run remains a separate rollout proof and must not be inferred from
this baseline.

Deterministic baseline checks:

```bash
npx vitest run server/services/helix-ask/realtime-session/__tests__/worker-admission.test.ts server/services/helix-ask/realtime-session/__tests__/provisional-response.test.ts server/services/helix-ask/realtime-session/__tests__/grounded-answer-feedback.test.ts server/services/helix-ask/realtime-session/__tests__/grounded-answer-relay.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.turn-lifecycle-solver-authority.test.ts server/__tests__/helix.ask.turn-lifecycle-debug-export.test.ts client/src/lib/agi/__tests__/debug-export-capability-lanes.spec.ts --pool=forks
npm run helix:ask:discipline:quick
```

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


## Training lane compatibility contract

- Existing train APIs (`/api/train/status`, `/api/train/start`, `/api/train/job/:id`) remain backward-compatible for existing callers.
- Existing Audiocraft/Colab lane remains available as an experimental path and must not be removed.
- New production lane (`tts_prod_train`) is additive and must emit deterministic `PROGRESS`/`STATS`/`ARTIFACT` lines plus train-status JSON.
- Voice serving contract at `/api/voice/speak` is non-breaking and independent from training-lane internals.

## Addendum: Helix Ask x Dottie prompt-style parity (v1)

Voice service consumers integrating mission-overwatch callouts MUST follow `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md` for:
- canonical `certainty_class` ordering and parity constraints,
- suppression reason labels,
- bounded mode-specific output lengths, and
- required `evidence_anchor` behavior for repo-attributed claims.

This addendum is additive: existing `/api/voice/speak` transport fields remain unchanged.


## Replay-safe policy clock

`/api/voice/speak` accepts optional `policyTsMs` (and alias `tsMs`) for replay-mode policy evaluation (dedupe, rate-limit, budget, and circuit-breaker gates).

Clock override is honored only when both of the following are true:
- request sets `replayMode=true`
- runtime enables trusted replay clock (`VOICE_REPLAY_CLOCK_TRUSTED=1`)

Otherwise, policy evaluation uses server wall-clock time.

## Mission callout repo-attribution default

For mission callouts, effective repo attribution defaults to true when `missionId` is present and `mode` is `callout` unless `repoAttributed` is explicitly provided. This enforces evidence parity by default while preserving backward compatibility through explicit `repoAttributed: false`.
