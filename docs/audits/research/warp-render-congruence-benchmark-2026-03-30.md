# Warp Render Congruence Benchmark (2026-03-30)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PARTIAL`
- note: Some lanes pass while others are warn/unknown.
- checksum: `a67c2425e2e429c6ce26621b2822ff71c2305d414c1653c313ecb4222ca7869f`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-latest.jsonl`
- total_events: `1`
- displacement_events: `1` (required >= `6`)
- verdict: `INCONCLUSIVE`
- note: Need >= 6 displacement events; found 1.
- status_mismatch_count: `0`
- max_rms_z_residual_m: `77.84370308237918`
- max_abs_z_residual_m: `237.08368977457837`
- max_hausdorff_m: `225.26991990892125`
- window: `2026-03-27T04:10:10.584Z` -> `2026-03-27T04:10:10.584Z`

Integral status counts:
- pass: `0`
- warn: `0`
- fail: `1`
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

