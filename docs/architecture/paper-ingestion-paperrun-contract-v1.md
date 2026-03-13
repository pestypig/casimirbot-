# Paper Ingestion PaperRun Contract v1

## Objective

Define a deterministic per-paper vertical ingestion contract so every uploaded paper
(PDF or image) runs end-to-end through parse, claim extraction, Tree + DAG + Atlas
merge, retrieval indexing, and review before publish.

This contract replaces horizontal batch staging. A `PaperRun` completes one paper at
a time while still updating shared global structures.

## Deterministic State Machine

State machine id: `paper_run.v1`

Terminal states:
- `published`
- `failed`
- `canceled`

Non-terminal states:
- `queued`
- `intake_validated`
- `parsing`
- `extracting`
- `normalizing`
- `graph_merging`
- `indexing`
- `review_pending`
- `blocked`

### Allowed transitions

| From | Event | To | Guard | Notes |
|---|---|---|---|---|
| `queued` | `validate_intake` | `intake_validated` | request schema valid, hash present | creates immutable `paper_id` + `run_id` |
| `intake_validated` | `start_parse` | `parsing` | source reachable | parser chosen by mime |
| `parsing` | `parse_complete` | `extracting` | parse artifact exists | OCR fallback allowed |
| `extracting` | `extract_complete` | `normalizing` | claims extracted with provenance | each claim typed |
| `normalizing` | `normalize_complete` | `graph_merging` | entities/units resolved | symbols harmonized |
| `graph_merging` | `merge_complete` | `indexing` | tree/dag/atlas deltas emitted | conflicts preserved, not overwritten |
| `indexing` | `index_complete` | `review_pending` | lexical/vector/graph refs written | retrieval ready |
| `review_pending` | `review_approved` | `published` | reviewer or policy auto-pass | emits knowledge pack |
| `review_pending` | `review_requires_remerge` | `graph_merging` | corrective annotations provided | deterministic re-merge loop |
| `parsing` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=parsing` |
| `extracting` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=extracting` |
| `normalizing` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=normalizing` |
| `graph_merging` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=graph_merging` |
| `indexing` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=indexing` |
| `review_pending` | `soft_fail` | `blocked` | retryable failure | stores `resume_stage=review_pending` |
| `blocked` | `retry_stage` | `resume_stage` | attempt budget not exhausted | increments stage attempt |
| `blocked` | `hard_fail` | `failed` | non-recoverable error | first hard failure is preserved |
| `queued` | `abort_run` | `canceled` | operator cancel | |
| `intake_validated` | `abort_run` | `canceled` | operator cancel | |
| `parsing` | `abort_run` | `canceled` | operator cancel | |
| `extracting` | `abort_run` | `canceled` | operator cancel | |
| `normalizing` | `abort_run` | `canceled` | operator cancel | |
| `graph_merging` | `abort_run` | `canceled` | operator cancel | |
| `indexing` | `abort_run` | `canceled` | operator cancel | |
| `review_pending` | `abort_run` | `canceled` | operator cancel | |
| `blocked` | `abort_run` | `canceled` | operator cancel | |

No transition is allowed out of `published`, `failed`, or `canceled`.

## Stage Contracts

1. `parsing`
- Inputs: raw file bytes + ingest metadata.
- Outputs: canonical text blocks, section map, figure/equation anchors, page map.

2. `extracting`
- Inputs: parse artifacts.
- Outputs: atomic claims typed as:
  - `observation`
  - `measurement`
  - `theory`
  - `theoretical_congruence`
- Requirement: every claim includes provenance span and confidence.

3. `normalizing`
- Inputs: raw claims.
- Outputs: canonical entities, symbols, units, variable bindings.

4. `graph_merging`
- Inputs: normalized claims.
- Outputs:
  - `tree_delta`
  - `dag_delta`
  - `atlas_delta`
  - `math_registry` (equations, definitions, variables, units, assumptions)
  - contradiction and congruence edges.

5. `indexing`
- Inputs: merged graph deltas + claims.
- Outputs: lexical index ref, vector index ref, graph traversal anchors.

6. `review_pending`
- Inputs: generated knowledge pack.
- Outputs: `approved` or `requires_remerge` with deterministic reason codes.

## TOE Math-Trace Extension (Required)

Each published paper knowledge pack must include:

1. Formal math layer in DAG
- Node types: `equation`, `definition`, `variable`, `unit`, `assumption`.
- Relations: `defines`, `uses_variable`, `has_unit`, `assumes`.

2. Prediction contracts
- Explicit chain:
  - `model_node_id`
  - `input_bindings`
  - `predicted_observable`
  - `measured_observable`
  - `fit` (`residual`, `normalized_residual`, `r2`, `chi2`, `dof`)

3. Cross-paper symbol equivalence map
- Canonical symbol table with aliases per paper.
- Unit transform support (`scale`, `offset`) when symbols differ by normalization.

4. Versioned derivation lineage
- Deterministic derivation steps with ordered `step_id`s.
- Hash-anchored lineage replay (`lineage_hash` + replay metadata).

5. Falsifier edges + maturity gates
- DAG `falsifies` edges for hypothesis challenge paths.
- Per-target maturity gate record:
  - `required_stage`
  - `current_stage`
  - `status`
  - `blocking_reason`

## Retry and Failure Policy

- Retry budget is per stage.
- `soft_fail` is retryable and moves run to `blocked`.
- `hard_fail` is non-retryable for current run and moves run to `failed`.
- `first_fail` must record:
  - `stage`
  - `reason_code`
  - `severity` (`soft` or `hard`)
  - `message`
  - `observed_at`

## Artifact Contracts

- Ingest request schema: `schemas/paper-ingest-request.schema.json`
- Run record schema: `schemas/paper-run-record.schema.json`
- Knowledge pack schema: `schemas/paper-knowledge-pack.schema.json`

These schemas define the wire format for each paper run and are intended to be
validated at API boundaries and before persistence.

## Operational Model

- One uploaded paper creates one `PaperRun`.
- Multiple papers can run in parallel.
- Each paper independently reaches a terminal state.
- Shared Tree + DAG + Atlas are updated incrementally at each successful merge.
