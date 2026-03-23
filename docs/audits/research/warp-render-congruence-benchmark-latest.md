# Warp Render Congruence Benchmark (2026-03-23)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PARTIAL`
- note: Some lanes pass while others are warn/unknown.
- checksum: `b1fc760ff965c7d25143ba8a7b87a5d4ad25a662c826b0b557163d65baabf1b1`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-command-2026-03-23T19-41-20-567Z.jsonl`
- total_events: `12`
- displacement_events: `12` (required >= `6`)
- verdict: `PARTIAL`
- note: Integral displacement status is stable but includes warning events.
- status_mismatch_count: `0`
- max_rms_z_residual_m: `0.015446524842522204`
- max_abs_z_residual_m: `0.042261518812390264`
- max_hausdorff_m: `1.1377487686610834`
- window: `2026-03-23T19:41:21.055Z` -> `2026-03-23T19:41:25.706Z`

Integral status counts:
- pass: `6`
- warn: `6`
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

