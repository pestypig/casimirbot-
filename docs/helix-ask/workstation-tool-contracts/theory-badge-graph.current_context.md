# theory-badge-graph.current_context

Maturity: `draft`

## Purpose

Read the bounded semantic state that the user has configured in the Theory
Badge Graph for the current Ask turn. The observation includes the selected
badge ids, active badge, canonical connection trace, intermediate badges,
available next badges, disconnected selections, claim boundaries, active atlas
lens, and declared object/semantic selections.

This capability does not infer graph state from the prompt and does not read
viewport pixels, popup geometry, or hidden panel content. It observes the same
combination-reader payload used by the graph UI.

## Owner

- Capability id: `theory-badge-graph.current_context`
- Panel: `theory-badge-graph`
- Action id: `current_context`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `current_context`: the bounded snapshot attached by the current Ask turn

Optional:

- `source_target_intent`: route and deictic-reference metadata

Blocked:

- missing current graph context
- an empty current badge selection
- contextual, negated, future, historical, quoted, or screen-visible mentions
  that do not affirmatively ask about the live graph selection
- any request to mutate badge selection through this read capability

## Observation

Required observation fields:

- `schema`: `helix.theory_badge_graph_current_context_observation.v1`
- `capability_key`: `theory-badge-graph.current_context`
- `context_ref`
- `graph_id`
- `selected_badge_ids`
- bounded `combination_reader`
- bounded `semantic_selections`
- `context_role=tool_evidence`
- `answer_authority=false`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Manual selection is operator-declared context. A graph path means the badges
are connected under the graph's declared edge semantics; it does not prove that
a physical state, transition, frequency, population, mechanism, or experimental
condition is actually present.

## Evidence Re-entry

For a deictic prompt such as “what do these badges imply?”, Helix admits this
exact current-context observation beside the normal Theory context reflection.
The provider must reason over both observations before producing a candidate
answer. Neither observation is terminal by itself.

## Host Projection

Allowed metadata:

```txt
context_ref
selected_badge_ids
support_refs
tool_output_refs
```

The UI may show the observation in the Ask trace. This read must not select,
deselect, focus, open, or rearrange badges as a host-side effect.

## Visible Trace

```txt
Tool request: theory-badge-graph.current_context
Tool observation: selected badges + trace + possibilities + boundaries
Tool request/observation: theory-badge-graph.reflect_discussion_context
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- manual selections use the same combination-reader derivation as the UI
- trace, intermediate, available-next, boundary, lens, and object fields remain bounded
- “these badges” and current-state visibility prompts admit the observation
- contextual, negated, future, historical, quoted, and screen-visible prompts do not
- empty selection fails closed with a typed missing requirement
- the observation remains non-terminal and requires provider reasoning re-entry
