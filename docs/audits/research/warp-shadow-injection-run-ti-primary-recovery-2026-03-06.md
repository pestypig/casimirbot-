# Warp Shadow Injection Run (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 12
- compatible: 12
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json`
- commit_pin: `f6d6146d26885aae34ebd8785950df07d6af9731`

## Recovery Contract
- recovery_goal: timing_compatibility_recovery
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
| ti_primary_wr_short_ps_sigma_6ps | timing | n/a | compatible | true | 0.2282565057759659 | -0.7717434942240341 | none |
| ti_primary_wr_short_ps_sigma_12ps | timing | n/a | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| ti_primary_wr_short_ps_sigma_50ps | timing | n/a | compatible | true | 0.20508832087663792 | -0.7949116791233621 | none |
| ti_primary_wr_short_ps_sigma_100ps | timing | n/a | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ti_primary_wr_short_ps_sigma_120ps | timing | n/a | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ti_primary_wr_short_ps_sigma_300ps | timing | n/a | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ti_primary_wr_longhaul_exp_sigma_6ps | timing | n/a | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ti_primary_wr_longhaul_exp_sigma_12ps | timing | n/a | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| ti_primary_wr_longhaul_exp_sigma_50ps | timing | n/a | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| ti_primary_wr_longhaul_exp_sigma_100ps | timing | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_wr_longhaul_exp_sigma_120ps | timing | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_wr_longhaul_exp_sigma_300ps | timing | n/a | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |

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


