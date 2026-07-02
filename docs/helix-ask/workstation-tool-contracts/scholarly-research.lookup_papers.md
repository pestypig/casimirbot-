# scholarly-research.lookup_papers

Maturity: `draft`

## Purpose

Look up scholarly paper metadata, abstracts, identifiers, full-text candidate
URLs, and source refs as bounded research-paper evidence. This capability stays
metadata-only: it does not fetch or parse paper bodies and does not prove a
scientific claim by itself.

## Owner

- Capability id: `scholarly-research.lookup_papers`
- Panel: `scholarly-research`
- Action id: `lookup_papers`
- Permission profile: `read`
- Mode: read/observe

## Inputs

Required:

- `query`

Optional:

- `mode`
- `providers`
- `limit`
- `source_target_intent`
- DOI or arXiv id aliases when the adapter supports them

Blocked:

- missing query
- query too broad
- prompt asking about the phrase `scholarly-research.lookup_papers`
- claims that require paper full text when only metadata/abstracts are present

## Observation

Required observation fields:

- `schema`: `helix.scholarly_research_observation.v1`
- `capability_key`: `scholarly-research.lookup_papers`
- `capability`: `scholarly-research.lookup_papers`
- `query`
- `intent`
- `providers_considered`
- `providers_called`
- `evidence_refs`
- `papers`
- `missing_requirements`
- `selected_for_answer`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

Provider gaps must appear as missing/blocked evidence, not as proof.

When the lookup participates in a compound scholarly workflow, a relevance gate
may be attached to the observation:

- `lookup_relevance_gate`
- `status`: `satisfied` or `blocked`
- `code`: `lookup_result_irrelevant` when none of the returned papers match the
  source requirement
- `required_any`
- `supporting_any`
- `selected_result_id`
- `rejected_result_ids`

The relevance gate is diagnostic evidence for the next model step. It does not
answer the user and must not silently fetch full text for an irrelevant first
result.

When the relevance gate blocks a formula-bound workflow, the observation should
also include `scholarly_lookup_recovery_affordance`:

- `schema`: `helix.scholarly_lookup_recovery_affordance.v1`
- `reason`: `lookup_result_irrelevant`
- `failed_query`
- `expected_variables`
- `expected_source_classes`
- `rejected_results` with per-paper reasons
- `recovery_queries`
- `recommended_next_capability`: `scholarly-research.lookup_papers`
- `terminal_eligible=false`
- `post_tool_model_step_required=true`
- `assistant_answer=false`
- `raw_content_included=false`

For the fusion validation fixture, rejected first-pass results should preserve
why a paper was unusable, for example missing thermonuclear/fusion topic terms
or missing cross-section/reactivity/source-class terms. The recovery queries
should point Codex toward sources that can bind the formula variables, such as
D-T fusion ion density, cross section, relative velocity, or
Maxwellian-averaged `sigma v` tables.

Prompts that ask for a Theory Badge Graph formula plus `paper-backed`,
`research-paper`, `source-backed`, or `calculator binding` numeric evidence
should enter this scholarly lookup lane before any docs-search or calculator
lane. The first lookup remains a metadata observation. If it cannot identify a
relevant source, it must return the relevance gate and recovery affordance so
Codex can choose the next retrieval step after re-entry.

## Host Projection

Allowed metadata:

```txt
support_refs
tool_output_refs
```

Future panel affordances may open a paper result only when a structured paper id,
DOI, arXiv id, URL, or evidence ref is present.

## Visible Trace

```txt
Tool request: scholarly-research.lookup_papers
Tool observation: scholarly lookup returned bounded paper evidence or missing-provider evidence
Model re-entry
Final answer or typed failure
```

## Tests

Required stable tests:

- specific query returns non-terminal paper evidence or a clear provider/missing
  rail
- missing query asks for a specific search target, DOI, or arXiv id
- metadata-only results are not treated as full-text evidence
- metadata-only results produce `source_ref` and `citation_evidence`, not
  `text_evidence` or `numeric_value_evidence`
- compound prompts can combine docs, calculator, theory, civilization, repo, and
  scholarly observations without collapsing missing scholarly evidence into
  proof
- irrelevant lookup results block dependent full-text fetch with
  `lookup_result_irrelevant`
- relevant lookup results still require an explicit full-text/numeric chain or a
  post-observation model decision before `fetch_full_text`
