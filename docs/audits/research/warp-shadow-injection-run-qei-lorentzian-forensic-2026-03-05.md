# Warp Shadow Injection Run (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 10
- compatible: 0
- partial: 0
- incompatible: 10
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.qei-lorentzian-forensic.v1.json`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`

## Recovery Contract
- recovery_goal: qei_lorentzian_forensic
- success_bar: map_only
- winnerScenarioId: null
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
| qei_lorentzian_forensic_tau_0p001ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p0025ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p005ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p01ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p02ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p05ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p1ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p2ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_0p5ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| qei_lorentzian_forensic_tau_1p0ms | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |

## Failure Envelope

- near_pass_scenario: qei_lorentzian_forensic_tau_0p001ms
- near_pass_marginRatioRaw: 1

### Fail Reasons
| reason | count |
|---|---:|
| policy_margin_not_strict_lt_1 | 10 |
| computed_margin_not_strict_lt_1 | 10 |

### Recurrent Incompatibility Regions
| sampler | tauSelected_s | count |
|---|---:|---:|
| lorentzian | 0.000001 | 1 |
| lorentzian | 0.0000025 | 1 |
| lorentzian | 0.000005 | 1 |
| lorentzian | 0.00001 | 1 |
| lorentzian | 0.00002 | 1 |
| lorentzian | 0.00005 | 1 |
| lorentzian | 0.0001 | 1 |
| lorentzian | 0.0002 | 1 |
| lorentzian | 0.0005 | 1 |
| lorentzian | 0.001 | 1 |


