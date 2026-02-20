# Runbook: Rare Bug Replay and Lane Debugging (2026-02-20)

## Objective

Reproduce low-frequency timing/concurrency incidents from capture to deterministic replay verification.

## Capture protocol

For each incident, capture:

- `incident_id`, `scenario_id`, `lane_id`, `environment`, `commit_hash`
- event stream with `monotonic_ts`, `logical_seq`, `seed_id`
- external input snapshots and deterministic substitutes
- observed failure signature (assertion, metric threshold, or behavior divergence)

Capture steps:

1. Mark incident envelope and freeze relevant deployment metadata.
2. Export training trace JSONL and pin artifact hash.
3. Save external dependencies (API responses, queue payloads, timers) as replay fixtures.

## Replay protocol

1. Load captured fixtures and trace stream.
2. Enforce replay ordering using `(scenario_id, lane_id, logical_seq)`.
3. Apply deterministic substitutes for nondeterministic sources:
   - random seeds from `seed_id`,
   - stable clock wrappers,
   - pinned network payload fixtures.
4. Run target patch candidate against replay corpus.

## Replay pass/fail equivalence criteria

Pass requires all conditions:

- expected failure is reproduced pre-fix,
- failure is absent post-fix,
- no new HARD gate failures,
- logical ordering remains stable.

Fail if any condition breaks, including drift in deterministic ordering invariants.

## Commands and artifact conventions

Suggested command sequence:

1. Capture export:
   - `curl -sS http://127.0.0.1:5173/api/agi/training-trace/export -o artifacts/replay/<incident_id>/training-trace.jsonl`
2. Replay candidate:
   - `npm run agi:replay -- --trace artifacts/replay/<incident_id>/training-trace.jsonl --scenario <scenario_id> --lane <lane_id>`
3. Gate verification:
   - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

Artifact path convention:

- `artifacts/replay/<incident_id>/capture/*`
- `artifacts/replay/<incident_id>/fixtures/*`
- `artifacts/replay/<incident_id>/replay-results/*`

## Incident-to-patch closure checklist

- incident capture complete,
- replay pre-fix reproduces failure,
- fix patch references incident id,
- replay post-fix passes equivalence,
- Casimir verify PASS with certificate integrity OK.
