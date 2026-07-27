# Theory Semantic Admitter Workstation Tool Contract

Status: developer-only deterministic normalization and admission rail.

## Purpose

`theory-semantic-admitter.normalize` accepts a
`casimir_spec_source_packet/v1`, deterministically formats its canonical source
bytes, builds the sole canonical `casimir_spec_scientific_claim_ir/v1`, and
checks declared identities and bridges against the repository-owned semantic
snapshot store.

It does not parse arbitrary prose, execute tools, prove propositions, validate
numerics, or produce an answer.

## Owner

Helix owns developer-account admission, source-target admission, selection of
server-owned semantic snapshots, evidence identity, and terminal eligibility.
The agent runtime owns tool selection, evidence re-entry, and later bounded
synthesis.

## Inputs

Required:

```txt
source_evidence_ref  exact current-turn authoritative source artifact
source_packet  casimir_spec_source_packet/v1
source_path    portable logical path bound into the parsed IR
receipt_id     caller-stable receipt identity
```

The packet is not admitted by value alone. The gateway must find exactly one
same-turn, non-terminal source artifact under `source_evidence_ref`, verify its
producer provenance, packet ID, path, media type, canonical bytes, and SHA-256,
and confirm that the generated claim IR preserves that path and hash. Callers
cannot supply catalog, registered-identity, or graph snapshots. Missing or
mismatched evidence and missing server-owned bindings fail closed.

## Observation

The capability emits `casimir.theory_semantic_admitter.observation.v1`.

An admitted observation contains:

- the exact normalized source-packet SHA-256;
- the exact source-evidence ref, packet ID, path, media type, producer, and
  current-turn binding;
- the canonical scientific-claim IR;
- a hash-bound `casimir_spec_semantic_admission_receipt/v1`; and
- preserved typed blockers and authority boundaries.

## Host Projection

No panel mutation is required. The Theory Badge Graph may display normalization,
snapshot-binding, blocker, and receipt status from the structured observation.
It must not present admitted as proved, physically true, or empirically valid.

## Visible Trace

The trace should show account admission, source normalization, claim-IR
construction, server-owned snapshot resolution, semantic admission, receipt
observation, and post-tool model re-entry as distinct events.

## Authority boundary

The observation verifies declared snapshot bindings only:

```txt
semanticIntentAuthority=false
graphCompletenessAuthority=false
proofAuthority=false
numericalAuthority=false
empiricalAuthority=false
physicalTruthAuthority=false
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Account policy

The developer wildcard admits this experimental capability. User and unsigned
sessions remain blocked because it is absent from the public allowlist. The
gateway executor repeats the developer check.

## Negative admission

The capability must not run for a public account, contextual or quoted tool
mention, future or negated instruction, absent source target, missing, stale,
ambiguous, or substituted source evidence, malformed packet, unknown packet or
body fields, noncanonical scientific content, broken IR integrity,
caller-supplied snapshots, missing server-owned bindings, mismatched catalog
identities, or forged registered graph bridges.

## Tests

- deterministic canonical format/parse/format equality
- exact source-byte hashing and parsed-surface binding
- unknown-field, ambiguity, integrity, and operator-arity rejection
- server-owned snapshot selection
- developer listing and public server-policy denial
- provider capability catalog and lifecycle checks
- Helix Ask discipline checks
- Casimir verification because semantic receipt behavior is in scope
