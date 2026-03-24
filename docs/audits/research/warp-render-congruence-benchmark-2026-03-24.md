# Warp Render Congruence Benchmark (2026-03-24)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PASS`
- note: Render integral congruence and GR observable parity anchors are aligned.
- checksum: `90f76fc8f6b1942cc7e5f1fceb4eab9e67ed69debf21eb770d85b2ea6530a5f7`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-command-2026-03-24T00-51-32-856Z.jsonl`
- total_events: `8`
- displacement_events: `8` (required >= `6`)
- verdict: `PASS`
- note: Integral displacement status and recomputed thresholds are fully aligned (pass).
- status_mismatch_count: `0`
- max_rms_z_residual_m: `0.01129625685394143`
- max_abs_z_residual_m: `0.08207591927555313`
- max_hausdorff_m: `0.06739543253464478`
- window: `2026-03-24T00:51:33.498Z` -> `2026-03-24T00:51:37.303Z`

Integral status counts:
- pass: `8`
- warn: `0`
- fail: `0`
- unknown: `0`

## Observable Parity Anchors
- source: `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- integrity_suite_present: `true`
- final_parity_verdict: `PASS`
- verdict: `PASS`
- note: GR observable parity anchors are all pass in the latest integrity suite.
- mercury: `true`
- lensing: `true`
- frame_dragging: `true`
- shapiro: `true`

