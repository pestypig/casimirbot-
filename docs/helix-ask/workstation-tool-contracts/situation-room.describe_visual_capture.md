# `situation-room.describe_visual_capture`

Status: draft.

## Purpose

Read the active, admitted SituationRun for the current conversation thread and
return bounded visual evidence for the runtime agent to interpret.

`image_lens.inspect` is a provider-shared alias to this canonical capability.
Neither identifier grants execution authority from lexical mention alone.

## Owner

- Capability id: `situation-room.describe_visual_capture`
- Alias: `image_lens.inspect`
- Panel: `image-lens`
- Action id: `describe_visual_capture`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- authoritative hard `visual_capture` source admission
- current conversation `thread_id`

Optional:

- `prompt`
- structured `source_target_intent`

## Negative Admission

This capability must not execute for quoted, negated, historical, future,
conditional, or screen-visible mentions of visual inspection. Examples:

```txt
Do not inspect the visual screen capture.
Yesterday I asked you to inspect the visual screen capture.
Later we may inspect the visual screen capture.
The screen says "inspect the visual screen capture."
```

These remain conversational unless another authoritative current-turn source
contract admits the visual source.

## Observation

```txt
hard visual-source admission
-> situation-room.describe_visual_capture admitted
-> active SituationRun read
-> helix.visual_situation_observation.v1
-> current-turn evidence re-entry
-> runtime follow-up reasoning
-> Helix terminal eligibility
```

The gateway observation is never an assistant answer:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

When no answerable current visual evidence exists, the capability remains
admitted and returns a failed observation with:

```txt
active_visual_situation_evidence_unavailable
```

That state is an execution/evidence result, not an admission block. The runtime
may retry, request a source repair, or return an actionable typed failure.

## Host Projection

The host may project the selected SituationRun id, bounded observation refs,
freshness status, and source-binding status. It must not project gateway
`answer_text` as the assistant's terminal answer.

## Visible Trace

```txt
Tool request: situation-room.describe_visual_capture
Tool admission: admitted
Tool observation: succeeded or active_visual_situation_evidence_unavailable
Model re-entry
Runtime follow-up answer or actionable typed failure
```

## Tests

Required stable tests:

- generic current-visual prompts use the canonical gateway
- `image_lens.inspect` resolves as an alias, not a separate runner
- missing visual evidence is an admitted failed observation
- successful evidence requires a later model decision before terminal authority
- named-receipt evaluation is not promoted merely because it is allowed
- contextual, negated, historical, future, and quoted visual language does not execute

## Terminal Contract

A generic current-visual question requires a post-observation
`model_synthesized_answer`. Merely allowing
`image_lens_named_receipt_evaluation` as a possible artifact must not promote it
to the required terminal product. Named-receipt evaluation is selected only
when the operator explicitly requests that product or an authoritative route
already requires it.
