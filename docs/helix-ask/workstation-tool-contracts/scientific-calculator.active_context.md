# scientific-calculator.active_context

Maturity: `draft`

## Purpose

Read the bounded state of the scientific calculator panel. This is useful for
following up on a recent calculator expression/result, but it is not a new
calculation and cannot prove a result unless the observed panel state contains
that result.

## Owner

- Capability id: `scientific-calculator.active_context`
- Panel: `scientific-calculator`
- Action id: `active_context`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Optional:

- `calculator_context`
- `reason`
- `trace_id`

Blocked:

- requests that need a new solve; use `scientific-calculator.solve_expression`
- quoted or text-only mentions of the capability name
- treating stale panel text as a fresh tool result

## Observation

Required observation fields:

- `schema`: `helix.calculator_active_context_observation.v1`
- `capability_key`: `scientific-calculator.active_context`
- `current_latex`
- `last_result_text`
- `last_normalized_expression`
- `last_trace_id`
- `last_ok`
- bounded recent debug events when available
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

The observation may support a final answer only after model re-entry and only
for claims that the observed panel state actually contains.

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
```

The UI may show the active calculator context in the trace. It must not infer a
new calculator solve from final prose.

## Visible Trace

```txt
Tool request: scientific-calculator.active_context
Tool observation: scientific-calculator.active_context observed bounded panel state
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- active context is non-terminal and requires model re-entry
- stale calculator panel state does not override same-turn solve observations
- no panel context means no claim that a calculator solve ran
