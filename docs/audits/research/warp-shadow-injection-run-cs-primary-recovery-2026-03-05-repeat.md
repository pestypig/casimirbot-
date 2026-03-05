# Warp Shadow Injection Run (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 18
- compatible: 18
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`

## Recovery Contract
- recovery_goal: casimir_sign_control_recovery
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
| scenario_id | lane | experimental_context | classification | congruentSolvePass | marginRatioRaw | deltaMarginRatioRaw | fail_or_error |
|---|---|---|---|---|---:|---:|---|
| cs_primary_attractive_gap_10nm | casimir_sign_control | n/a | compatible | true | 0.22652103813228594 | -0.773478961867714 | none |
| cs_primary_attractive_gap_51p5nm | casimir_sign_control | n/a | compatible | true | 0.20508832087663792 | -0.7949116791233621 | none |
| cs_primary_attractive_gap_90nm | casimir_sign_control | n/a | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| cs_primary_attractive_gap_100nm | casimir_sign_control | n/a | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| cs_primary_attractive_gap_140nm | casimir_sign_control | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| cs_primary_attractive_gap_220nm | casimir_sign_control | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| cs_primary_transition_gap_10nm | casimir_sign_control | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| cs_primary_transition_gap_51p5nm | casimir_sign_control | n/a | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| cs_primary_transition_gap_90nm | casimir_sign_control | n/a | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| cs_primary_transition_gap_100nm | casimir_sign_control | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| cs_primary_transition_gap_140nm | casimir_sign_control | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| cs_primary_transition_gap_220nm | casimir_sign_control | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| cs_primary_repulsive_gap_10nm | casimir_sign_control | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| cs_primary_repulsive_gap_51p5nm | casimir_sign_control | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| cs_primary_repulsive_gap_90nm | casimir_sign_control | n/a | compatible | true | 0.2035234136253071 | -0.7964765863746929 | none |
| cs_primary_repulsive_gap_100nm | casimir_sign_control | n/a | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| cs_primary_repulsive_gap_140nm | casimir_sign_control | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| cs_primary_repulsive_gap_220nm | casimir_sign_control | n/a | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |

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


