# Helix Ask Latency vs Accuracy Study

This study compares two Helix Ask request profiles for the same question pack:

- `quality_extended` (higher retrieval + evidence budgets, extended output)
- `fast_brief` (lower budgets, brief output)

Both profiles are currently used with:

- `HELIX_ASK_SWEEP_PACK=scripts/helix-ask-latency-study-pack.json`
- `HELIX_ASK_SWEEP_MATRIX=scripts/helix-ask-latency-matrix.json`

## Run

```bash
HELIX_ASK_SWEEP_PACK=scripts/helix-ask-latency-study-pack.json ^
HELIX_ASK_SWEEP_MATRIX=scripts/helix-ask-latency-matrix.json ^
HELIX_ASK_SWEEP_TIMEOUT_MS=120000 ^
HELIX_ASK_SWEEP_OUT_DIR=artifacts/helix-ask-latency ^
npm run helix:ask:sweep
```

On Windows PowerShell, use `-e` style env vars if needed, or keep values in `.env` and only
export `HELIX_ASK_SWEEP_*` for that run.

## What the output includes

Each config in `artifacts/helix-ask-sweep.*.json` includes:

- per-question case outputs
- `duration_ms` for the wall-clock request time
- `quality_score` derived from answer and gate signals
- summary stats:
  - `avg_duration_ms`
  - `p50_duration_ms`
  - `p95_duration_ms`
  - `avg_quality_score`
  - `quality_rate` (share of responses above a `0.75` quality score threshold)

## How to read it

- If `quality` improves while latency increases, you get stronger evidence that longer paths are
  increasing grounded quality for these prompts.
- If latency drops but quality stays flat or rises, the "fast" profile may be a better default.
- Compare gate-level signals (`evidence_gate_ok`, `coverage_ratio`, `belief_unsupported_rate`) if you want
  to isolate which quality axis is changing.
