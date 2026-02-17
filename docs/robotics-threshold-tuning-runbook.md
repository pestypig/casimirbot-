# Robotics Threshold Tuning Runbook (Phase 12)

## Purpose
Provide a deterministic operator procedure for tuning pick/place benchmark thresholds while preserving replay comparability.

## Inputs
- Benchmark fixture: `tests/fixtures/robotics-pick-place.fixture.json`
- Benchmark endpoint: `POST /api/agi/demonstration/benchmark/pick-place`
- Trace export: `GET /api/agi/training-trace/export`

## Procedure
1. Run baseline benchmark and capture `deltas` and `firstFail`.
2. If `firstFail` is null, tighten one threshold by <=10% per run.
3. If `firstFail` appears, revert half the last tightening and rerun.
4. Record accepted threshold set + trace IDs in handback summary.
5. Re-run adapter verification gate and require PASS before promotion.

## Guardrails
- Do not change more than one threshold per iteration.
- Keep fixture seed and frame sequence fixed during tuning.
- Any HARD gate failure blocks threshold promotion.

## Promotion checklist
- Deterministic primitive path unchanged across 2 reruns
- Benchmark `firstFail` behavior understood/documented
- Casimir adapter verification PASS with certificate integrity true
