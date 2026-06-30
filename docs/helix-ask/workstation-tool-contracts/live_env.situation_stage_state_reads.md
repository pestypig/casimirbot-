# live_env situation/stage state reads

Maturity: `draft`

## Purpose

Expose existing Helix situation-room and stage-play read tools to provider
agents as read-only workstation evidence.

Capabilities:

- `live_env.query_event_log`
- `live_env.query_world_events`
- `live_env.query_navigation_state`
- `live_env.query_stage_sources`
- `live_env.query_constructs`
- `live_env.query_job_evidence`

## Owner

- Owner surface: Helix live environment / situation-stage state
- Permission profile: `read`
- Mode: read

## Contract

These capabilities expose existing Helix situation-room and stage-play read
tools to provider agents through the workstation gateway. They are read-only
evidence tools.

They must not:

- configure route watches or interpreter profiles
- plan, start, or enqueue stage jobs
- process live-source mail
- repair sources or loops
- mutate navigation, world, construct, or job state
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
- `route_id` / `routeId`
- `job_id` / `jobId`
- `stage_id` / `stageId`
- `construct_id` / `constructId`
- `since_ms` / `sinceMs`
- `limit`
- `source_target_intent`

If no source reference is supplied, the gateway may synthesize a bounded
`workstation_gateway:<thread>:<capability>` source ref for observation identity.

## Observation

Output observation schema:

```txt
helix.live_environment_tool_observation.v1
```

Expected nested observation families may include event-log, world-event,
navigation-state, stage-source, construct, or job-evidence payloads depending
on the selected capability. The nested payload is evidence only.

The workstation gateway must wrap the live-environment observation in a
workstation observation packet and emit tool lifecycle/follow-up trace rows.

## Host Projection

The UI may render same-turn request/observation rows and bounded state refs from
structured gateway/debug fields. It must not create situation-room actions from
final prose.

## Visible Trace

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer or typed failure

Missing state, empty results, stale events, or unavailable job/source evidence
are observations about availability. They are not proof of a user's claim.

## Negative Admission

Do not admit these tools from:

- quoted phrases such as `The text says live_env.query_event_log`
- negated commands such as `Do not run live_env.query_stage_sources`
- future or hypothetical mentions
- explanatory prompts asking what the tool means
- screen/UI/debug labels that contain the tool name

## Tests

Before treating this group as stable, keep deterministic coverage for:

- manifest exposure with read-only/non-terminal authority fields
- positive prompt-named admission
- quoted/negated/future/text-only non-admission
- observation packet creation through `executeLiveEnvironmentTool`
- terminal equivalence and API parity
