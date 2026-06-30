# live_env live-source state reads

Maturity: `draft`

## Purpose

Expose existing Helix live-source state reads to provider agents as read-only
workstation evidence.

Capabilities:

- `live_env.query_live_source_quality`
- `live_env.query_workstation_goal_context`
- `live_env.summarize_live_source_current_state`

## Owner

- Owner surface: Helix live environment / Live Answer environment
- Permission profile: `read`
- Mode: read

## Contract

These capabilities expose existing Helix live-source state reads to provider
agents through the workstation gateway. They are read-only evidence tools.

They must not:

- configure live-source watches
- process mailbox packets
- repair sources or loops
- pause, resume, bind, unbind, or mutate workstation state
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
- `goal_id` / `goalId`
- `limit`
- `mail_limit` / `mailLimit`
- `include_sessions` / `includeSessions`
- `include_updates` / `includeUpdates`
- `freshness_status` / `freshnessStatus`
- `expected_cadence_ms` / `expectedCadenceMs`
- `source_target_intent`

If no source reference is supplied, the gateway may synthesize a bounded
`workstation_gateway:<thread>:<capability>` source ref for observation identity.

## Observation

Output observation schema:

```txt
helix.live_environment_tool_observation.v1
```

Expected nested observation families include:

```txt
stage_play_live_source_quality
stage_play_workstation_goal_context_read_result
stage_play_live_source_current_state
helix.workstation_goal_context_update.v1
helix.agent_goal_session.v1
```

The workstation gateway must wrap the live-environment observation in a
workstation observation packet and emit tool lifecycle/follow-up trace rows.

## Host Projection

The UI may render same-turn request/observation rows and source-health refs from
structured gateway/debug fields. It must not create live-source actions from
final prose.

## Visible Trace

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer or typed failure

The observation may report missing source/profile/session state. Missing state
is evidence about availability, not proof of the user's claim.

## Negative Admission

Do not admit these tools from:

- quoted phrases such as `The text says live_env.query_live_source_quality`
- negated commands such as `Do not run live_env.query_workstation_goal_context`
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
