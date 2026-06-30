# theory-badge-graph.reflect_discussion_context

Maturity: `candidate`

## Purpose

Reflect a prompt through the Theory Badge Graph to identify relevant badges,
claim-boundary notes, recommended next actions, and theory context. This is
diagnostic context; it is not proof of the final claim.

## Owner

- Capability id: `theory-badge-graph.reflect_discussion_context`
- Panel: `theory-badge-graph`
- Action id: `reflect_discussion_context`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `prompt`

Optional:

- `conversation_context`
- `mentioned_equations`
- `mentioned_symbols`
- `mentioned_domains`
- `build_explanation_plan`
- `limit`

Blocked:

- missing prompt
- prompts that only quote or discuss the capability name
- claims that ask the reflection itself to validate physical viability

## Observation

Required observation fields:

- `schema`: theory context reflection observation schema
- `capability_key`: `theory-badge-graph.reflect_discussion_context`
- `panel_id`: `theory-badge-graph`
- `action_id`: `reflect_discussion_context`
- `reflection_id`
- `summary`
- `exact_badge_ids`
- `likely_badge_ids`
- `claim_boundary_notes`
- `recommended_action_ids`
- `authority`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=inspect_workstation_receipt
receipt_ref
support_refs
tool_output_refs
```

Future panel affordances may highlight badges or open the graph region, but only
from structured badge ids in the observation.

## Visible Trace

```txt
Tool request: theory-badge-graph.reflect_discussion_context
Tool observation: theory reflection returned badge and claim-boundary evidence
Model re-entry
Final answer
```

## Tests

Candidate evidence currently includes UI/API compound tests with Civilization
Bounds.

Required stable tests:

- reflection succeeds with prompt and returns badge ids/boundary notes
- missing prompt blocks
- reflection is not auto-admitted for unrelated docs+repo prompts
- final answer distinguishes diagnostic context from proof
