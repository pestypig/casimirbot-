# Warp Render Congruence Benchmark (2026-03-23)

"This benchmark checks renderer/metric congruence and GR observable parity anchors; it is not a physical warp feasibility claim."

## Overall
- verdict: `PASS`
- note: Render integral congruence and GR observable parity anchors are aligned.
- checksum: `0da5cb9bf34623e579448cc9e53f7bf29b88f13d257009db31c3aac11bb59bfb`

## Render Lane (Integral Signal)
- source: `artifacts/research/full-solve/alcubierre-debug-log-latest.jsonl`
- total_events: `24`
- displacement_events: `24` (required >= `6`)
- verdict: `PASS`
- note: Integral displacement status and recomputed thresholds are fully aligned (pass).
- status_mismatch_count: `0`
- max_rms_z_residual_m: `0.01129625685394143`
- max_abs_z_residual_m: `0.08207591927555313`
- max_hausdorff_m: `0.06739543253464478`
- window: `2026-03-23T21:57:18.746Z` -> `2026-03-23T21:57:31.909Z`

Integral status counts:
- pass: `24`
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

