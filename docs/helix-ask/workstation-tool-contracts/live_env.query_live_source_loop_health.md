# `live_env.query_live_source_loop_health`

Maturity: `draft`

## Purpose

Read live-source loop health as bounded diagnostic evidence. This capability
cannot configure, repair, pause, resume, bind, unbind, or mutate any live-source
loop.

## Owner Surface

Helix live environment / Live Answer environment.

## Permission Profile

`read`

This capability is available through the shared provider gateway for Helix
Native, Codex Workstation Mode, and future provider runtimes.

## Inputs

Supported bounded inputs include `thread_id`, `environment_id`, `room_id`,
`source_id` / `sourceId`, `source_ref` / `sourceRef`,
`expected_cadence_ms` / `expectedCadenceMs`, and `source_target_intent`.

## Observation Contract

The gateway delegates to the existing live-environment adapter and wraps the
returned `helix.live_environment_tool_observation.v1` envelope in a workstation
gateway observation packet.

The nested loop-health observation uses:

```txt
stage_play_live_source_loop_health/v1
```

The returned observation may include policy/profile/source health state,
pressure reason, cadence, backlog, and `nextUsefulTool`. These fields are
diagnostic evidence only and must not execute live controls.

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

The UI may render request/observation rows and loop-health evidence refs from
structured gateway/debug fields. It must not infer loop-health execution from
final prose.

## Admission Rules

- Explicit direct gateway calls may request the capability by id.
- Prompt-derived admission must still pass Helix tool-admission policy.
- Quoted, negated, historical, future, or explanatory mentions must not execute
  the capability unless admitted as an affirmative operator request.
- The tool can read health state; it cannot configure, repair, pause, resume,
  bind, unbind, or mutate a live-source loop.

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
