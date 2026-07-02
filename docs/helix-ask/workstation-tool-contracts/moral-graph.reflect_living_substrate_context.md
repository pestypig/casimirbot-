# moral-graph.reflect_living_substrate_context

Maturity: `candidate`

## Purpose

Reflect a prompt through the Moral Graph living-substrate layer to identify
bounded moral substrate badges, source Theory Badge Graph links, claim-boundary
notes, and recommended next actions. This is diagnostic evidence for compound
reasoning; it is not a final answer, a proof of consciousness, or a moral-status
verdict.

This contract is defined by
`docs/architecture/moral-graph-consciousness-substrate-patch-goal.md`.

## Owner

- Capability id: `moral-graph.reflect_living_substrate_context`
- Panel: `moral-badge-graph`
- Action id: `reflect_living_substrate_context`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `prompt`

Optional:

- `text`
- `query`
- `conversation_context`
- `source_theory_badge_ids`
- `requested_substrate_badge_ids`
- `refs`
- `include_theory_bridge`
- `include_recommended_actions`
- `include_admissions`
- `limit`

Blocked:

- missing prompt
- quoted, negated, historical, future-only, or screen-visible capability
  mentions
- requests that ask the reflection itself to prove consciousness, personhood,
  physical viability, or final moral status

## Observation

Required observation fields:

- `schema`: `helix.moral_living_substrate_reflection_observation.v1`
- `capability_key`: `moral-graph.reflect_living_substrate_context`
- `panel_id`: `moral-badge-graph`
- `action_id`: `reflect_living_substrate_context`
- `reflection_id`
- `summary`
- `exact_substrate_badge_ids`
- `likely_substrate_badge_ids`
- `matched_substrate_badge_ids`
- `source_theory_badge_ids`
- `claim_boundary_notes`
- `recommended_action_ids`
- `admissions_included`
- `admission_reason_codes`, when `include_admissions=true`
- `authority`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

## Boundary

The Moral Graph substrate lane derives procedural constraints from living-system
primitives: organism/environment boundary, entropy-gradient exposure, sensing,
perturbation response, homeostatic maintenance, and cross-scale coordination.

Mechanism, equations, Fourier/frequency payloads, source maturity, and
calculator loadouts remain owned by the Theory Badge Graph and calculator. A
recommended calculator action is a theory-owned next action; it is not a Moral
Graph solve.

Orch-OR, Hameroff/Penrose, microtubule, and anesthetic perturbation references
are frontier context only. They must not be promoted into proof of human-like
consciousness, personhood, or final moral standing.

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=inspect_workstation_receipt
receipt_ref
support_refs
tool_output_refs
matched_substrate_badge_ids
source_theory_badge_ids
claim_boundary_notes
```

Host projection may highlight Moral Graph substrate badges or offer a
theory/calculator next action from structured ids only. It must not present the
observation as a final answer.

## Visible Trace

```txt
Tool request: moral-graph.reflect_living_substrate_context
Tool observation: living substrate reflection returned badge and boundary evidence
Model re-entry
Final synthesis with explicit claim boundaries
```

## Tests

Required stable tests:

- reflection succeeds with prompt and returns substrate badge ids
- missing prompt blocks with `moral_living_substrate_prompt_missing`
- reflection remains non-terminal evidence
- recommended actions preserve the Moral Graph / Theory Graph / calculator split
- quoted, negated, historical, future-only, and screen-visible mentions do not
  admit the tool
