# live_env live-source mailbox reads

Maturity: `draft`

## Purpose

Expose existing Helix live-source mailbox read/reflection tools to provider
agents as bounded workstation evidence.

Capabilities:

- `live_env.check_live_source_mail`
- `live_env.read_live_source_mail`
- `live_env.read_processed_live_source_mail`
- `live_env.record_live_source_mail_decision`
- `live_env.reflect_live_source_mail_loop`

`live_env.process_live_source_mail` is intentionally not included. Processing
mail can materialize new packets and remains Helix-owned until a stronger phase,
permission, and receipt contract exists.

## Owner

- Owner surface: Helix live-source mailbox / Live Answer environment
- Permission profile: `read`
- Mode: read

## Contract

The read capabilities inspect or reflect existing live-source mailbox state.
The decision capability is a narrowly bounded evidence-ledger mutation that is
available only after an exact processed packet has re-entered the current
provider turn.

They must not:

- process new live-source mail
- mark mail as processed through provider access
- mutate live-source watch jobs or interpreter profiles
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

The decision manifest instead uses `mode=act`, `mutating=true`, and permission
profile `act`, while remaining confirmation-free and non-terminal. It requires
`decision`, `processed_packet_ids`, and `mail_ids`. The gateway verifies every
identity against normalized authoritative artifacts whose IDs belong to the
same provider turn; stale, guessed, prompt-only, or missing identities fail
closed without recording a decision.

## Inputs

Accepted bounded inputs:

- `thread_id`
- `environment_id`
- `room_id`
- `ui_thread_id` / `uiThreadId`
- `source_id` / `sourceId`
- `source_ref` / `sourceRef`
- `source_kind` / `sourceKind`
- `mail_ids` / `mailIds`
- `limit`
- `batch_cap` / `batchCap`
- `include_read` / `includeRead`
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
stage_play_live_source_mail_read_result
stage_play_processed_live_source_mail_read_result
stage_play_live_source_mail_loop_reflection.v1
```

The workstation gateway must wrap the live-environment observation in a
workstation observation packet and emit tool lifecycle/follow-up trace rows.

## Host Projection

The UI may render same-turn request/observation rows and mailbox evidence refs
from structured gateway/debug fields. It must not create mailbox processing
actions from final prose.

## Visible Trace

The latest turn/debug trace should show:

- runtime selected
- tool request
- tool observation
- model re-entry
- final answer or typed failure

The observation may report missing mailbox packets or missing processed packets.
Missing mailbox materialization is evidence about availability, not a final
answer.

## Negative Admission

Do not admit these tools from:

- quoted phrases such as `The text says live_env.read_live_source_mail`
- negated commands such as `Do not run live_env.read_processed_live_source_mail`
- future or hypothetical mentions
- historical mentions of earlier mailbox tools
- explanatory prompts asking what the tool means
- screen/UI/debug labels that contain the tool name

Do not substitute `live_env.process_live_source_mail` as a fallback provider
gateway call.

## Tests

Before treating this group as stable, keep deterministic coverage for:

- manifest exposure with read-only/non-terminal authority fields
- positive prompt-named admission
- quoted/negated/future/text-only non-admission
- observation packet creation through `executeLiveEnvironmentTool`
- exact current-turn packet admission and stale/missing evidence rejection for
  `live_env.record_live_source_mail_decision`
- `live_env.process_live_source_mail` remaining outside the provider gateway
- terminal equivalence and API parity
