# research-library.apply_evidence_enrichment

Status: draft developer-only shared provider capability.

## Purpose

Validate and persist a structured, agent-authored enrichment proposal for equation candidates already stored in one signed-in profile's encrypted Research Library. The adapter records resolved symbol meanings, optional values and units, assumptions, provenance, and a Calculator-prefill expression. It does not decide those bindings, sample a model, execute a calculation, mutate the Theory Badge Graph, or become an answer.

## Owner

- Capability id: `research-library.apply_evidence_enrichment`
- Panel: `docs-viewer`
- Action id: `apply_paper_evidence_enrichment`
- Permission profile: `act`
- Mode: `act`
- Account availability: developer only while the workflow is draft

## Admission

- Requires an authoritative profile session.
- Client- or model-supplied profile ids are discarded. Helix injects ownership only from the authenticated session; without that session the mutation fails closed.
- Requires exact `document_id` plus a `helix.paper_evidence_enrichment_proposal.v1` object.
- The proposal must carry the exact document, sidecar, integrity-hash, and expected-revision identities returned by saved evidence.
- The runtime agent authors the proposal after evidence review. Prompt-derived fallback routing must not fabricate or automatically persist one.
- Contextual, negated, historical, future, quoted, or explanatory mentions do not admit the mutation.

## Negative Admission Cases

The capability must not execute for a missing profile, a missing or mismatched
saved document, a stale revision, a malformed proposal, a quoted or screen-text
mention, a negated request, a historical description, a future or conditional
plan, or an explanatory question about the capability.

## Validation and revision boundary

- A stale expected revision fails closed.
- A repeated `proposal_id` is idempotent and does not increment the revision.
- `paper`-basis bindings and assumptions require source refs that exactly match saved page refs.
- `agent_inference` items require an explicit inference note.
- Unknown equation ids and mismatched document, sidecar, or integrity identities fail closed.
- Exact-equation authority cannot be granted in this slice; it requires a separately verified page-image lane.

## Inputs

- Required: `document_id`, `proposal`.
- Optional: `source_target_intent`.
- The proposal includes one or more equation updates with classification, normalized LaTeX, evidence depth, symbol bindings, assumptions, and Calculator-prefill data.
- `auto_run_allowed` and `exact_equation_authority_requested` must both be `false`.

## Observation

- Schema: `helix.paper_evidence_enrichment_observation.v1`.
- Reports applied, blocked, or idempotent status; proposal/document/sidecar identity; revision transition; updated equation ids; and stable missing requirements.
- It contains no decrypted paper body and no automatic Calculator result.
- `assistant_answer=false`, `terminal_eligible=false`, `raw_content_included=false`.
- A post-tool model step is required so the observation re-enters the selected runtime before any visible answer.

## Authority boundary

Persistence means the proposal passed identity, revision, and provenance checks. It does not validate a scientific claim, establish an exact transcription, authorize a calculation result, or permit Theory Graph promotion.

## Host Projection

The host may project proposal id, document and sidecar ids, revision transition,
updated equation ids, idempotency, stable failure codes, and the non-authority
flags. It must not project decrypted pages or treat the persistence receipt as
scientific validation.

## Visible Trace

```txt
Saved paper evidence read
Runtime-authored enrichment proposal
Tool request: research-library.apply_evidence_enrichment
Non-terminal validation/persistence observation
Model re-entry
Visible answer or next evidence step
```

## Tests

- valid profile-scoped proposal creates one revision
- replayed proposal id is idempotent
- stale revision, forged refs, unknown equation, and identity mismatch fail closed
- unlabeled inference, Calculator auto-run, and exact-equation elevation fail closed
- user account catalog omits the draft capability; developer catalog includes it
- natural, contextual, negated, quoted, historical, future, and explanatory prompts do not auto-mutate
- spoofed owner ids are removed and replaced only by the authenticated session profile
