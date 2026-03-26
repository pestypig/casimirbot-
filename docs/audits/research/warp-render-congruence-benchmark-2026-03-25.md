# Warp Render Congruence Benchmark (2026-03-25)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PASS`
- note: Render integral congruence and GR observable parity anchors are aligned.
- checksum: `40272919a8017e80fc60a26499294ec3f1f494f0915cfad0985dfcf1732051b9`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-command-2026-03-25T00-54-09-482Z.jsonl`
- total_events: `1`
- displacement_events: `1` (required >= `1`)
- verdict: `PASS`
- note: Integral displacement status and recomputed thresholds are fully aligned (pass).
- status_mismatch_count: `0`
- max_rms_z_residual_m: `0.011122910288938427`
- max_abs_z_residual_m: `0.08207591927555313`
- max_hausdorff_m: `0.064774256000148`
- window: `2026-03-25T00:54:09.963Z` -> `2026-03-25T00:54:09.963Z`

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

