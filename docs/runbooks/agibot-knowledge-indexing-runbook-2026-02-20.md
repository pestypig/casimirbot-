# Runbook: AGIBOT Knowledge Indexing (2026-02-20)

## Purpose

Operational procedure to index canonical evidence for knowledge-linked agent runs under deterministic lane controls.

## Inputs

- canonical artifacts from: docs, runbooks, incident reports, selected code snapshots
- metadata fields: `repo/module/date/environment/customer/confidence`
- optional filters: `lane_id`, `claim_ids`, `incident_id`

## Procedure

1. **Collect + pin**
   - Select source artifacts and pin commit hashes for code snapshots.
   - Reject unpinned code snapshots for production-bound runs.

2. **Normalize metadata**
   - Ensure all required fields are present.
   - Clamp confidence to `[0.0, 1.0]` and record derivation rationale.

3. **Index to vector store**
   - Chunk by semantic section, preserving source path and date.
   - Attach normalized metadata to each chunk.

4. **Register retrieval selectors**
   - Set filters for environment/customer/lane when required.
   - Register `claim_ids` lookups for direct evidence linking.

5. **Smoke retrieval**
   - Run one semantic retrieval and one exact `file_search` retrieval.
   - Confirm at least one canonical source is returned.

6. **Fail-closed validation**
   - Simulate a missing-evidence query.
   - Verify blocked status and deterministic reason code emission.

## Output contract

Each indexing run must produce:

- artifact list and counts by source class,
- metadata validation summary,
- retrieval smoke results (semantic + exact),
- fail-closed validation result,
- reproducible command list.

## Deterministic safeguards

- Use immutable source snapshots for all code artifacts.
- Keep retrieval filters explicit in logs.
- Version index schema changes; do not silently mutate metadata requirements.
