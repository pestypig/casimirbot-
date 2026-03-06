# Warp Shadow Injection Run (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 3
- compatible: 3
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.qs-primary-reportable-reference.v1.json`
- commit_pin: `0b65cb4b7b5dff40b72c032dd6424319fbd5ff41`

## Recovery Contract
- recovery_goal: q_spoiling_recovery
- success_bar: map_only
- winnerScenarioId: null
- success_achieved: true
- baseline_reference_path: artifacts/research/full-solve/shadow-injection-run-generated-2026-03-06.json

## Baseline
- marginRatioRaw: 1
- marginRatioRawComputed: 179045.76526706913
- applicabilityStatus: PASS
- congruentSolvePass: false
- sampler: lorentzian
- fieldType: em
- tauSelected_s: 0.00002

## Scenario Results
| scenario_id | lane | experimental_context | classification | congruentSolvePass | marginRatioRaw | deltaMarginRatioRaw | fail_or_error |
|---|---|---|---|---|---:|---:|---|
| qs_primary_typed_hydride_q_disease_q0_2e10_f_2e1 | q_spoiling | n/a | compatible | true | 0.21970580827264663 | -0.7802941917273534 | none |
| qs_primary_typed_trapped_flux_q0_2e10_f_1e1 | q_spoiling | n/a | compatible | true | 0.20508832087663792 | -0.7949116791233621 | none |
| qs_primary_typed_tls_oxide_q0_2e10_f_2e1 | q_spoiling | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |

## Failure Envelope

- near_pass_scenario: n/a
- near_pass_marginRatioRaw: n/a

### Fail Reasons
| reason | count |
|---|---:|
| n/a | 0 |

### Recurrent Incompatibility Regions
| sampler | tauSelected_s | count |
|---|---:|---:|
| n/a | n/a | 0 |


