# civilization-bounds.reflect_system_bounds

Maturity: `candidate`

## Purpose

Reflect a prompt through Civilization Bounds to describe social, energy,
material, collaboration, and falsification constraints that would have to be
true for a scenario. This is bounded scenario context, not permission to make
technology-readiness or transport claims.

The capability is an evidence aid for the runtime agent. It may narrow the
procedural world evidence available to the next reasoning step, but it must not
force the final framing, decide the interpretation, or answer on its own.

## Owner

- Capability id: `civilization-bounds.reflect_system_bounds`
- Panel: `civilization-bounds-roadmap`
- Action id: `reflect_system_bounds`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `prompt`

Optional:

- `scenario_id`
- `phase_id`
- `layer_mode`
- `selected_system_ids`
- `selected_badge_ids`
- `theory_reflection_ref`
- `ideology_reflection_ref`
- `include_bridge_context`
- `include_collaboration_bounds`
- `include_falsification_hooks`

Explicit route alias:

- `helix_ask.reflect_civilization_bounds`

This alias is not a separate provider gateway tool. It may be admitted only as
an alias that executes the canonical
`civilization-bounds.reflect_system_bounds` gateway capability, with the
requested alias recorded as `source_target_intent.alias_capability`.

Blocked:

- missing prompt
- prompt asking the tool name as text only
- quoted, negated, future, or UI-label mentions of
  `helix_ask.reflect_civilization_bounds`
- loose metaphors or ordinary concept questions that do not ask for
  procedural-world grounding, dependency evidence, route/infrastructure
  evidence, source-backed measurement comparison, or Theory/Zen bridge context
- attempts to use the reflection as proof of feasibility, deployment readiness,
  national capacity, or transport authority

## Observation

Required observation fields:

- `schema`: civilization bounds reflection observation schema
- `capability_key`: `civilization-bounds.reflect_system_bounds`
- `panel_id`: `civilization-bounds-roadmap`
- `action_id`: `reflect_system_bounds`
- `roadmap_id`
- `scenario_id`
- `parameter_scope_kinds`
- `action_channel_kinds`
- `missing_evidence`
- `missing_evidence_boundaries`
- `analogy_boundaries`
- `support_refs`
- `bridge_context_included`
- `procedural_scaffold_id`
- `authority`
- `terminal_eligible=false`
- `context_role=tool_evidence`
- `ask_context_policy=evidence_only`
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

Future panel affordances may focus roadmap systems or scenario phases when
structured ids are present.

## Visible Trace

```txt
Tool request: civilization-bounds.reflect_system_bounds
Tool observation: Civilization Bounds returned bounded system constraints
Model re-entry
Final answer
```

## Tests

Candidate evidence currently includes a UI/API theory+civilization compound pass.

Required stable tests:

- standalone civilization-bounds reflection does not fail only because compact
  roadmap input is absent
- theory+civilization compound still executes both capabilities
- missing prompt blocks cleanly
- final answer marks missing evidence as missing, not as proof
