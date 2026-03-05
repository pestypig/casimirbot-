# Warp Shadow Injection Run (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 10
- compatible: 2
- partial: 0
- incompatible: 8
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.qei-boundary.v1.json`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`

## Recovery Contract
- recovery_goal: qei_boundary_refinement
- success_bar: at_least_one_compatible
- winnerScenarioId: qei_boundary_compact_tau_0p1ms
- success_achieved: true
- baseline_reference_path: artifacts/research/full-solve/shadow-injection-run-generated-2026-03-05.json

## Baseline
- marginRatioRaw: 1
- marginRatioRawComputed: 179045.76526706913
- applicabilityStatus: PASS
- congruentSolvePass: false
- sampler: lorentzian
- fieldType: em
- tauSelected_s: 0.00002

## Scenario Results
| scenario_id | lane | classification | congruentSolvePass | marginRatioRaw | deltaMarginRatioRaw | fail_or_error |
|---|---|---|---|---:|---:|---|
| qei_boundary_gaussian_tau_0p02ms | qei_worldline | compatible | true | 0.22479832453285556 | -0.7752016754671445 | none |
| qei_boundary_gaussian_tau_0p025ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_gaussian_tau_0p03ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_gaussian_tau_0p04ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_gaussian_tau_0p05ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_compact_tau_0p1ms | qei_worldline | compatible | true | 0 | -1 | none |
| qei_boundary_compact_tau_0p125ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_compact_tau_0p15ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_compact_tau_0p175ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_boundary_compact_tau_0p2ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |

## Failure Envelope
- n/a (winner found)



