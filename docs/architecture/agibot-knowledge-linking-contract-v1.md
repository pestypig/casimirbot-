# AGIBOT Knowledge-Linking Contract v1

## Objective

Define a deterministic source-of-truth -> retrieval-runtime contract for SoulSync-style knowledge binding in CasimirBot lanes.

## 1) Canonical source classes

Required source classes and minimum inclusion policy:

1. **Docs**: architecture specs, policy docs, theory constraints.
2. **Runbooks**: operational procedures, incident response, replay workflows.
3. **Incident reports**: postmortems, timeline captures, mitigation summaries.
4. **Selected code snapshots**: pinned file+commit slices used as runtime evidence.

All runtime claims in knowledge-linked agent outputs must resolve to one of the above classes.

## 2) Metadata schema (required)

Every indexed unit MUST include:

- `repo` (string)
- `module` (string)
- `date` (ISO-8601 string)
- `environment` (`dev` | `staging` | `prod` | `lab`)
- `customer` (string; `internal` allowed)
- `confidence` (number, 0.0..1.0)

Recommended optional metadata:

- `lane_id`
- `incident_id`
- `commit_hash`
- `claim_ids` (array of stable evidence claim IDs)

## 3) Retrieval behavior contract

The runtime retrieval policy uses a two-tier strategy:

1. **Vector store recall** for semantically similar candidate documents.
2. **`file_search` grounding** for direct source citation and exact text confirmation.

Behavioral expectations:

- At least one source from canonical classes is required before final response generation for implementation/planning claims.
- Retrieval must prioritize exact-match/pinned artifacts when `claim_ids` or `commit_hash` filters are available.
- If vector candidates conflict with exact file evidence, file evidence wins.
- Runtime response payloads should include provenance tuples: `(source_class, path_or_uri, date, confidence)`.

## 4) Fail-closed policy

Knowledge-linked runtime must fail closed when required evidence retrieval fails.

Fail-closed conditions (non-exhaustive):

- no canonical evidence found for a required claim,
- metadata missing any required fields,
- retrieval returns sources outside allowed classes for a gated action,
- confidence below policy floor for safety-critical answer classes.

Fail-closed behavior:

- Return a blocked status with deterministic reason code (`EVIDENCE_MISSING`, `METADATA_INCOMPLETE`, `SOURCE_CLASS_INVALID`, `CONFIDENCE_BELOW_FLOOR`).
- Emit a training trace event containing reason code + query fingerprint.
- Do not proceed to actuator-adjacent execution plans while blocked.

## 5) Lane bindings

- `lane_evidence`: claim IDs and confidence normalization.
- `lane_knowledge_binding`: indexing, retrieval, fail-closed controls.
- `lane_timing_replay`: traceability of retrieval decisions in replay.
- `lane_risk_governance`: acceptance checks for evidence sufficiency.

## 6) Timing/replay trace hooks

Knowledge retrieval decisions that affect output claims should emit timing/replay fields compatible with `docs/architecture/event-segmented-timing-and-replay-v1.md`:

- `monotonic_ts`, `logical_seq`, `scenario_id`, `seed_id`, `lane_id`

These hooks allow deterministic replay of retrieval-linked decision paths without changing existing trace consumer contracts.

## 7) AGIBOT surface mapping linkage

Integration proposals for Link-U-OS, AimRT, and X1 surfaces are tracked in `docs/audits/research/agibot-stack-mapping-proposals-2026-02-20.md`.
