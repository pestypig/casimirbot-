# `live_env.*` Micro-Reasoner Read/Dry-Run Contracts

Maturity: `draft`

## Purpose

Expose MicroDeck/micro-reasoner reads and dry-run tests as bounded workstation
observations. These capabilities cannot create, apply, update, or route
MicroDeck presets/prompts.

Capabilities:

```txt
live_env.query_micro_reasoner_presets
live_env.query_micro_reasoner_prompts
live_env.test_micro_reasoner_prompt
```

## Owner Surface

Helix live environment / MicroDeck prompt catalog.

## Permission Profile

`read`

These capabilities are available through the shared provider gateway for Helix
Native, Codex Workstation Mode, and future provider runtimes.

## Inputs

Supported bounded inputs include thread/environment/source scope, preset/prompt
ids, domain/status filters, dry-run prompt text, context, and
`source_target_intent`.

## Observation Contract

The gateway delegates to the existing live-environment adapter and wraps the
returned `helix.live_environment_tool_observation.v1` envelope in a workstation
gateway observation packet.

Nested observation schemas include:

```txt
stage_play_micro_reasoner_prompt_preset_query_result/v1
stage_play_micro_reasoner_prompt_query_result/v1
stage_play_micro_reasoner_prompt_test_result/v1
```

Required authority flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Observation

Output observation schema: `helix.live_environment_tool_observation.v1`.

## Host Projection

The UI may render request/observation rows and MicroDeck evidence refs from
structured gateway/debug fields. It must not infer MicroDeck execution from
final prose.

## Admission Rules

- Explicit direct gateway calls may request these capabilities by id.
- Prompt-derived admission must still pass Helix tool-admission policy.
- Quoted, negated, historical, future, or explanatory mentions must not execute
  the capability unless admitted as an affirmative operator request.
- `test_micro_reasoner_prompt` is a dry run; it must not activate or update a
  prompt.
- The provider gateway must not expose:
  - `live_env.draft_micro_reasoner_preset`
  - `live_env.route_micro_reasoner_prompt`
  - `live_env.apply_micro_reasoner_preset`
  - `live_env.create_micro_reasoner_preset`
  - `live_env.update_micro_reasoner_prompt`

Those require separate mutation/permission contracts.

## Visible Trace

Expected rows:

```txt
runtime selected
tool request
tool observation
model re-entry
final answer or typed failure
```

UI projection must come from structured gateway/debug fields, not final prose.

## Tests

Candidate validation requires:

```bash
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/provider-capability-contract.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npm run helix:ask:discipline:quick
```
