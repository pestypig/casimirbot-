# client.read_aloud

Maturity: `draft`

Owner surface: Helix Ask client UI projection

Provider status: client-only, not a provider gateway capability

## Purpose

Define the boundary between the client `Read aloud` affordance and provider
agent voice tools. Client read-aloud playback is a UI projection action, not an
agent tool call, and must not count as Codex Workstation Mode voice parity.

## Owner

The client UI owns `client.read_aloud`. Helix Ask provider runtimes may return
final text, but they do not execute this capability through the workstation
gateway.

## Inputs

Valid input is user/client interaction with the UI read-aloud affordance. Prompt
text that mentions read-aloud, speech, or voice must not execute
`client.read_aloud` as a provider tool.

Provider voice behavior, when requested, must use an admitted structured voice
tool such as `live_env.request_interim_voice_callout` or `live_env.narrator_say`
and return a receipt observation.

## Observation

`client.read_aloud` has no provider observation packet and no gateway execution
receipt. It must remain absent from the provider gateway manifest.

If UI diagnostics record client playback, that diagnostic is client projection
metadata only. It is not answer authority and does not prove an agent voice tool
ran.

Client playback diagnostics, when exported, must preserve the same non-answer
authority flags used by provider observations:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
```

## Host Projection

Host projection is local playback of already selected text. The projection must
not be inferred from provider final prose and must not mutate the provider turn
contract.

## Visible Trace

Provider-mode Ask turns should not show `client.read_aloud` as a tool request or
tool observation. If client playback diagnostics are displayed, they must be
clearly separated from provider gateway trace rows.

## Tests

Current behavior:

```txt
availability=client_projection_only
permission_class=user_confirmed_side_effect
codex_workstation=false
future_provider=false
gateway_manifest=absent
```

Required assertions:

- `client.read_aloud` is classified as `client_projection_only`
- `client.read_aloud` is absent from the provider gateway manifest
- provider voice tests do not count client playback as a voice tool receipt
- final prose is not parsed to trigger read-aloud

Implementation anchors:

- Classification:
  `server/services/helix-ask/provider-agent-capability-contract.ts`
- UI surfaces:
  `client/src/components/helix/HelixAskPill.tsx`
  `client/src/lib/helix/ask-voice-copy-display.ts`
  `client/src/lib/helix/ask-voice-diagnostics-export.ts`
- Provider capability tests:
  `server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts`

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run client/src/components/__tests__/helix-ask-pill-ui.spec.tsx --pool=forks
npm run helix:ask:discipline:quick
git diff --check
```
