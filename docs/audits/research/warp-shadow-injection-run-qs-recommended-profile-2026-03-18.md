# Warp Shadow Injection Run (2026-03-18)

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
- commit_pin: `531f8cffff4a54a90720d0f93ddd6b8f78c138ed`

## Recovery Contract
- recovery_goal: q_spoiling_recovery
- success_bar: map_only
- winnerScenarioId: null
- success_achieved: true
- baseline_reference_path: artifacts/research/full-solve/shadow-injection-run-generated-2026-03-17.json

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
| qs_primary_typed_hydride_q_disease_q0_2e10_f_2e1 | q_spoiling | hydride_q_disease;Q0=20000000000;F=20 | compatible | true | 0.2163729288083322 | -0.7836270711916677 | none |
| qs_primary_typed_trapped_flux_q0_2e10_f_1e1 | q_spoiling | trapped_flux;Q0=20000000000;F=10 | compatible | true | 0.2035234136253071 | -0.7964765863746929 | none |
| qs_primary_typed_tls_oxide_q0_2e10_f_2e1 | q_spoiling | tls_oxide;Q0=20000000000;F=20 | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |

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


