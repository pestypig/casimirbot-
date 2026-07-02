# theory-badge-graph.propose_frontier_conjectures

Maturity: `draft`

## Purpose

Use the Theory Badge Graph as a bounded conjecture workbench. The capability
locates a prompt in graph, biome, probability, and semantic-chunk space, then
returns unresolved frontier candidates with evidence obligations.

This is inspiration and research navigation only. It is not proof, validation,
physical viability, or badge/edge promotion.

## Owner

- Capability id: `theory-badge-graph.propose_frontier_conjectures`
- Panel: `theory-badge-graph`
- Action id: `propose_frontier_conjectures`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `prompt`

Optional:

- `query`
- `text`
- `conversation_context`
- `mentioned_equations`
- `mentioned_symbols`
- `mentioned_domains`
- `frontier_search_seed`
- `build_explanation_plan`
- `limit`

Blocked:

- missing prompt
- prompts that only quote, discuss, or display the capability name
- negated, historical, future, conditional, or screen-visible mentions
- prompts asking the tool to validate a theory, prove a physical mechanism,
  prove physical viability, or promote a badge/edge
- prompts asking graph placement, calculator output, or literature to become
  proof

## Observation

Required observation fields:

- `schema`: `helix.theory_frontier_conjecture_observation.v1`
- `capability_key`: `theory-badge-graph.propose_frontier_conjectures`
- `panel_id`: `theory-badge-graph`
- `action_id`: `propose_frontier_conjectures`
- `reflection_id`
- `search_id`
- `frontier_candidate_count`
- `candidates`
- `candidate_status_counts`
- `top_candidate_id`
- `scholarly_lookup_request_count`
- `exact_verification_result_count`
- `probability_terrain`
- `claim_boundary_notes`
- `forbidden_claim_scan_notes`
- `authority`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Each candidate must include:

```txt
candidate_id
candidate_kind
status
title
summary
nearby_badge_ids
proposed_relation_or_missing_badge
biome_region
scale_bands
render_chunk_ids
semantic_chunk_ids
congruence_score
information_gain_bits
calculator_probe_available
recommended_next_actions
required_observables
required_artifacts
source_references
falsification_checks
claim_boundary_notes
promotion_allowed=false
terminal_eligible=false
assistant_answer=false
post_tool_model_step_required=true
```

Allowed candidate statuses:

```txt
coarse_candidate
exact_verification_pending
needs_observable
needs_scholarly_evidence
blocked_by_boundary
```

## Host Projection

Allowed metadata:

```txt
workstation_actions.kind=inspect_workstation_receipt
receipt_ref
support_refs
tool_output_refs
```

The panel may visualize nearby badges, biome regions, probability terrain, and
semantic chunks from structured fields. It must not scrape final prose or use a
workbench candidate as terminal answer authority.

## Method Boundary

The capability may use:

- theory context reflection
- theory frontier search
- biome layout and probability terrain
- badge connection traces
- calculator-payload availability as a measurement/affordance hint
- scholarly lookup requests as evidence obligations
- Lean/formalization references as proof-obligation framing

Frontier candidates are measurement surfaces over badge regions. They describe
placement uncertainty, connection structure, congruence scores, required
observables, source references, and falsification checks. They must not add a
second readiness or solution layer that says a region is solved, blocked,
calculable, or missing in the final-answer sense. Any such conclusion belongs to
Codex after evidence re-entry and only after the relevant calculator, source,
runtime, or verifier receipt exists.

It must not:

- validate a theory
- prove a physical mechanism
- claim physical viability
- promote a badge or edge automatically
- treat probability as truth probability
- treat calculator output as proof
- treat literature as automatic validation
- bypass claim-boundary notes

## External Method References

These references are design anchors, not evidence that any local candidate is
true:

- Lean: `https://lean-lang.org/`
  - Use as the proof-assistant model: candidates can become formal obligations,
    but only kernel-checked proofs or local verifier gates can promote claims.
- Terence Tao formalization / machine-assisted proof writing:
  `https://terrytao.wordpress.com/`
  - Use as mathematical-process context: informal conjecture generation and
    proof strategy still need explicit formal or evidence gates.
- Google DeepMind AlphaGeometry:
  `https://deepmind.google/discover/blog/alphageometry-an-olympiad-level-ai-system-for-geometry/`
  - Use as a neuro-symbolic precedent: model-generated constructions can guide
    search, while symbolic/deductive machinery supplies proof discipline.
- Local Lean lane: `formal/lean/README.md`
  - Use for NHM2 claim-boundary formalization. It verifies diagnostic
    admissibility facts only; it does not prove physical viability.

## Visible Trace

```txt
Tool request: theory-badge-graph.propose_frontier_conjectures
Tool observation: theory frontier workbench returned bounded candidates
Model re-entry
Final answer
```

## Tests

Required candidate tests:

- positive prompt proposes candidates
- ambiguous prompt returns broad uncertainty rather than proof
- negated tool mention does not execute
- quoted tool name does not execute
- calculator probe is diagnostic only
- literature request does not auto-promote
- physical viability claim is blocked or boundary-marked
- observation packet and candidates carry non-terminal authority fields

## Implementation Anchors

- `shared/theory/theory-frontier-search.ts`
- `shared/theory/theory-context-reflection-tool.ts`
- `shared/theory/theory-frontier-conjecture-workbench.ts`
- `shared/contracts/theory-frontier-candidate.v1.ts`
- `shared/contracts/theory-frontier-search.v1.ts`
- `server/services/helix-ask/workstation-tool-gateway/registry.ts`
- `server/services/helix-ask/explicit-capability-contract.ts`
- `server/services/helix-ask/agent-providers/explicit-workstation-gateway.ts`
- `client/src/lib/workstation/panelActionAdapters.ts`
- `client/src/lib/workstation/panelCapabilities.ts`
