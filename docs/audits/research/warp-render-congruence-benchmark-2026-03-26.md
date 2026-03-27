# Warp Render Congruence Benchmark (2026-03-26)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PASS`
- note: Render integral congruence and GR observable parity anchors are aligned.
- checksum: `597be4f3317dc43719b5e61751d4a9a8a922aa9949ba94ff181627f304e55d70`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-command-2026-03-26T18-37-10-902Z.jsonl`
- total_events: `1`
- displacement_events: `1` (required >= `1`)
- verdict: `PASS`
- note: Integral displacement status and recomputed thresholds are fully aligned (pass).
- status_mismatch_count: `0`
- max_rms_z_residual_m: `0.025723927083116528`
- max_abs_z_residual_m: `0.10053370338951595`
- max_hausdorff_m: `0.07210492793253974`
- window: `2026-03-26T18:37:39.683Z` -> `2026-03-26T18:37:39.683Z`

Integral status counts:
- pass: `1`
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

