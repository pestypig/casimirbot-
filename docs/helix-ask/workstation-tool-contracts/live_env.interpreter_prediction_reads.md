# live_env interpreter and prediction reads

Maturity: `draft`

## Purpose

Expose existing live-source interpreter and prediction evidence tools to
provider agents as bounded workstation observations.

Capabilities:

- `live_env.compare_mail_to_interpreter_profile`
- `live_env.validate_live_source_prediction`
- `live_env.predict_live_source_immediate`
- `live_env.compare_live_source_prediction`

These are read/evaluation tools. They do not configure route watches, configure
interpreter profiles, record mailbox decisions, or project narrative state.

## Owner

- Owner surface: Helix live-source interpreter/prediction loop
- Permission profile: `read`
- Mode: read

## Contract

These capabilities read or compare existing live-source mail, interpreter
profile, prediction, and narrative evidence through the workstation gateway.
They are observation tools only.

They must not:

- configure interpreter profiles or route-watch policies
- record live-source mail decisions
- project or persist narrative state
- update immersion state
- speak aloud or trigger client playback
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
- `ui_thread_id` / `uiThreadId`
- `source_id` / `sourceId`
- `source_ref` / `sourceRef`
- `source_kind` / `sourceKind`
- `mailbox_thread_id` / `mailboxThreadId`
- `mail_ids` / `mailIds`
- `profile_id` / `profileId`
- `job_id` / `jobId`
- `policy_id` / `policyId`
- `current_scene_summary` / `currentSceneSummary`
- `running_story_summary` / `runningStorySummary`
- `limit`
- `read_only` / `readOnly`
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
stage_play_interpreter_profile_comparison_result/v1
stage_play_live_source_prediction_validation_tool_result/v1
helix.live_source_immediate_prediction.v1
helix.live_source_prediction_comparison.v1
```

The workstation gateway must wrap the live-environment observation in a
workstation observation packet and emit tool lifecycle/follow-up trace rows.

## Host Projection

The UI may render same-turn request/observation rows and evidence refs from
structured gateway/debug fields. It must not create route-watch, interpreter,
mail-decision, or narrative-projection actions from final prose.

## Visible Trace

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer or typed failure

The observation may report missing profile, missing mail ids, no prior
prediction, or unavailable narrative state. Missing state is evidence about
availability, not a final answer.

## Negative Admission

Do not admit these tools from:

- quoted phrases such as `The text says live_env.compare_live_source_prediction`
- negated commands such as `Do not run live_env.validate_live_source_prediction`
- future or hypothetical mentions
- historical mentions of earlier prediction tools
- explanatory prompts asking what the tool means
- screen/UI/debug labels that contain the tool name

Do not substitute held-back controls such as
`live_env.project_live_source_narrative`,
`live_env.configure_route_watch`,
`live_env.configure_interpreter_profile`, or
`live_env.record_live_source_mail_decision` as provider gateway calls.

## Tests

Before treating this group as stable, keep deterministic coverage for:

- manifest exposure with read-only/non-terminal authority fields
- positive prompt-named admission
- quoted/negated/future/text-only non-admission
- observation packet creation through `executeLiveEnvironmentTool`
- projection/configuration/decision controls remaining outside the provider
  gateway
- terminal equivalence and API parity
