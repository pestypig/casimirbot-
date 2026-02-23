# Evolution Governance Contract (v1, additive)

## Purpose

This contract defines a deterministic, additive governance surface under `/api/evolution`.
It complements (never replaces) required Casimir verification and keeps training-trace exports replay-safe.

## Deterministic envelope

All `/api/evolution` decision endpoints MUST return this envelope:

```json
{
  "verdict": "PASS|FAIL|WARN",
  "firstFail": {
    "id": "TAXONOMY_ID",
    "severity": "HARD|SOFT",
    "status": "fail|warn|pass",
    "value": "string|number|null",
    "limit": "string|number|null",
    "note": "stable-classification-notes"
  },
  "deltas": [{ "id": "metric_id", "before": 0, "after": 0, "delta": 0 }],
  "artifacts": [{ "kind": "artifact-kind", "ref": "stable-ref" }]
}
```

### Determinism rules
- Stable taxonomy IDs and ordering.
- Stable serialization keys and sorting for arrays.
- `firstFail` is either `null` or the first failed HARD constraint by deterministic order.

## Additive endpoint contracts

All endpoints are additive and non-breaking to existing `/api/agi/*` behavior.

- `POST /api/evolution/patches/ingest`
  - Ingests canonical patch metadata.
  - Returns deterministic `patchId` and persistence refs.
- `POST /api/evolution/gate/run`
  - Computes congruence score and fail taxonomy.
  - Default mode is report-only.
- `GET /api/evolution/trajectory/:id`
  - Returns rolling momentum/risks for a patch or chain id.

## Fail taxonomy IDs

### HARD (fail)
- `CASIMIR_VERIFY_REQUIRED_MISSING`
- `CASIMIR_VERIFY_FAIL`
- `CONTRACT_DRIFT_VOICE`
- `CONTRACT_DRIFT_GO_BOARD`
- `TRACE_SCHEMA_BREAK`
- `API_BREAK_DETECTED`

### SOFT (warn)
- `COUPLING_SPIKE`
- `UNCERTAINTY_SPIKE`
- `DEBT_TREND_UP`

## Compatibility requirements

### Casimir compatibility
- Casimir verify remains required baseline gate.
- Evolution gate cannot downgrade or bypass Casimir FAIL.
- Evolution artifacts may cite Casimir refs but must not mutate Casimir payload semantics.

### Training-trace compatibility
- Evolution records are additive trace payloads.
- `/api/agi/training-trace/export` remains JSONL-compatible.
- Existing trace consumers must continue to parse prior records unchanged.

## Error taxonomy for endpoint failures

Stable API errors:
- `EVOLUTION_INVALID_REQUEST`
- `EVOLUTION_CONFIG_INVALID`
- `EVOLUTION_PERSIST_FAILED`
- `EVOLUTION_NOT_FOUND`
- `EVOLUTION_INTERNAL_ERROR`

All errors should include deterministic `code`, human `message`, and optional `details`.


## Checklist addendum artifact

Generator output schema: `helix_agent_patch_checklist_addendum/1`.

Deterministic guarantees:
- touched path mapping is rule-based and stable-sorted,
- addendum IDs/hashes are computed from canonical JSON payloads,
- mandatory reads/tests/hooks include AGENTS/WARP compatibility entries when path rules match.
