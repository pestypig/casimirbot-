# live_env Stage Play builder reads

Maturity: `draft`

## Purpose

Expose Stage Play builder grammar, graph validation, and job planning as bounded
workstation observations for provider agents.

Capabilities:

- `live_env.describe_stage_builder`
- `live_env.validate_stage_play_graph`
- `live_env.plan_stage_play_job`

These are read/evaluation tools. They do not queue checkpoint requests, project
live-answer lines, update Stage Play context, or process live-source mail.

## Owner

- Owner surface: Helix Stage Play builder
- Permission profile: `read`
- Mode: read

## Contract

These capabilities read Stage Play builder grammar, validate a provided graph
draft, or produce a non-terminal planning observation. They are observation tools
only.

They must not:

- queue Stage Play checkpoint requests
- update live-answer projection lines
- mutate live-source or workstation state
- process mailbox packets
- become final-answer authority without model/solver re-entry

## Permission

Permission profile: `read`

The gateway manifest must expose:

```txt
mutating=false
code_mutation=false
shell_access=false
requires_confirmation=false
terminal_eligible=false
assistant_answer=false
raw_content_included=false
post_tool_model_step_required=true
```

## Inputs

Accepted bounded inputs:

- `thread_id`
- `environment_id`
- `room_id`
- `source_id` / `sourceId`
- `source_ref` / `sourceRef`
- `objective`
- `user_intent`
- `intent`
- `draft`
- `source_target_intent`

The gateway forces read-only intent for this group. If no source reference is
supplied, the gateway may synthesize a bounded
`workstation_gateway:<thread>:<capability>` source ref for observation identity.

## Observation

Output observation schema:

```txt
helix.live_environment_tool_observation.v1
```

Expected nested observation families include:

```txt
stage_play_builder_catalog
stage_play_builder_validation
stage_play_job_plan
```

The workstation gateway must wrap the live-environment observation in a
workstation observation packet and emit tool lifecycle/follow-up trace rows.

## Host Projection

The UI may render same-turn request/observation rows and bounded Stage Play
planning evidence from structured gateway/debug fields. It must not create
checkpoint, live-answer projection, or mailbox processing actions from final
prose.

## Visible Trace

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer or typed failure

The observation may report validation issues or missing sources. That is
evidence about Stage Play readiness, not a final answer.

## Negative Admission

Do not admit these tools from:

- quoted phrases such as `The text says live_env.plan_stage_play_job`
- negated commands such as `Do not run live_env.validate_stage_play_graph`
- future or hypothetical mentions
- historical mentions of earlier Stage Play tools
- explanatory prompts asking what the tool means
- screen/UI/debug labels that contain the tool name

Do not substitute held-back controls such as
`live_env.request_stage_play_checkpoint`,
`live_env.reflect_stage_play_context`, or `live_env.read_card` as provider
gateway calls.

## Tests

Before treating this group as stable, keep deterministic coverage for:

- manifest exposure with read-only/non-terminal authority fields
- positive prompt-named admission
- quoted/negated/future/text-only non-admission
- observation packet creation through `executeLiveEnvironmentTool`
- checkpoint/projection controls remaining outside the provider gateway
- terminal equivalence and API parity
