# `live_env.request_interim_voice_callout`

Maturity: `draft`

## Purpose

`live_env.request_interim_voice_callout` creates a structured interim voice
request and receipt for host-side playback projection. The gateway does not
play audio directly and does not turn the receipt into an answer.

The canonical provider-facing TTS alias is `text_to_speech.speak_text`. It uses
this same receipt contract with optional `voice`/`profile`, `locale`, and
`source_observation_ref` metadata.

## Owner

- Owner surface: voice delivery / host playback projection
- Permission profile: `act`
- Mode: act

## Inputs

Required input:

```txt
text
```

Optional input:

```txt
thread_id
turn_id
kind
source
max_chars
timing_hint_ms
voice_playback_kind
requires_confirmation
evidence_refs
reason_codes
```

## Observation

Observation schema:

```txt
helix.interim_voice_callout_tool_result.v1
```

Required observation fields:

```txt
request
receipt
host_projection
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Host Projection

- The receipt is an observation, not a final answer.
- The provider may say the voice request was created only when the same-turn
  observation packet exists.
- UI playback is host-side projection from the structured receipt, not final
  prose scraping.
- Browser playback outcomes are posted to
  `/api/helix/live-environment/voice-playback/outcome` and recorded as
  evidence-only server receipts.
- `requires_confirmation=true` must return a blocked policy receipt until a
  confirmation path authorizes playback.

## Visible Trace

Expected rows:

```txt
runtime selected
action request
action observation
model re-entry
final answer or typed failure
```

## Negative Admission

These prompts must not execute or speak:

```txt
The text says live_env.request_interim_voice_callout; explain it only.
Do not speak aloud, just explain the voice tool.
Previously you used live_env.request_interim_voice_callout; what did that mean?
```

## Tests

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
```

Implementation anchors:

```txt
server/services/helix-ask/workstation-tool-gateway/registry.ts
server/services/helix-ask/interim-voice-callout-store.ts
shared/contracts/helix-interim-voice-callout.v1.ts
```
