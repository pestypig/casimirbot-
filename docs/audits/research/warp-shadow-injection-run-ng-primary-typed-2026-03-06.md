# Warp Shadow Injection Run (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 10
- compatible: 10
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json`
- commit_pin: `0b65cb4b7b5dff40b72c032dd6424319fbd5ff41`

## Recovery Contract
- recovery_goal: nanogap_compatibility_recovery
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
| ng_primary_typed_ng_std_10_gap_5e0nm | nanogap | NG-STD-10;u_mean=1;u_sigma=1.2 | compatible | true | 0.22652103813228594 | -0.773478961867714 | none |
| ng_primary_typed_ng_std_10_gap_1e1nm | nanogap | NG-STD-10;u_mean=1;u_sigma=1.2 | compatible | true | 0.20825309986725563 | -0.7917469001327444 | none |
| ng_primary_typed_ng_std_10_gap_2e1nm | nanogap | NG-STD-10;u_mean=1;u_sigma=1.2 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ng_primary_typed_ng_std_10_gap_1e2nm | nanogap | NG-STD-10;u_mean=1;u_sigma=1.2 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ng_primary_typed_ng_std_10_gap_1e2nm | nanogap | NG-STD-10;u_mean=1;u_sigma=1.2 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| ng_primary_typed_ng_adv_5_gap_5e0nm | nanogap | NG-ADV-5;u_mean=1;u_sigma=1.2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| ng_primary_typed_ng_adv_5_gap_1e1nm | nanogap | NG-ADV-5;u_mean=1;u_sigma=1.2 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ng_primary_typed_ng_adv_5_gap_2e1nm | nanogap | NG-ADV-5;u_mean=1;u_sigma=1.2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| ng_primary_typed_ng_adv_5_gap_1e2nm | nanogap | NG-ADV-5;u_mean=1;u_sigma=1.2 | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| ng_primary_typed_ng_adv_5_gap_1e2nm | nanogap | NG-ADV-5;u_mean=1;u_sigma=1.2 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |

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


