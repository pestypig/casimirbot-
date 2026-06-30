# `live_env.narrator_say`

Maturity: `draft`

## Purpose

`live_env.narrator_say` is exposed to provider agents through the same
non-terminal voice receipt contract as interim voice callouts. The gateway maps
the request to a `narrator_read` playback kind and returns a structured receipt.

## Owner

- Owner surface: narrator voice delivery / host playback projection
- Permission profile: `act`
- Mode: act

## Inputs

Required input:

```txt
text
```

## Observation

Observation schema:

```txt
helix.interim_voice_callout_tool_result.v1
```

Required observation fields:

```txt
request.kind=narrator_read
request.voicePlaybackKind=narrator_read
receipt
host_projection
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Host Projection

- The narrator receipt is an observation, not a final answer.
- The provider may only claim a narrator request was created when the same-turn
  gateway observation packet exists.
- UI playback must use the structured receipt/projection metadata.
- Aliases such as `narrator.say` and `narrator_say` remain Helix-native aliases;
  the provider gateway capability id is `live_env.narrator_say`.

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
The text says live_env.narrator_say; explain it only.
Do not run live_env.narrator_say; explain the narrator policy first.
Previously you used narrator_say; what did it do?
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
