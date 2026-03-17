# Warp Shadow Injection Run (2026-03-17)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 12
- compatible: 12
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json`
- commit_pin: `5263528756309f437fdc65b0e6e900a4666b0b3f`

## Recovery Contract
- recovery_goal: timing_compatibility_recovery
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
| ti_primary_typed_wr_short_ps_sigma_6ps | timing | WR-SHORT-PS;sigma=6;ts=hardware | compatible | true | 0.2147248649305589 | -0.7852751350694411 | none |
| ti_primary_typed_wr_short_ps_sigma_12ps | timing | WR-SHORT-PS;sigma=12;ts=hardware | compatible | true | 0.2035234136253071 | -0.7964765863746929 | none |
| ti_primary_typed_wr_short_ps_sigma_50ps | timing | WR-SHORT-PS;sigma=50;ts=hardware | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_typed_wr_short_ps_sigma_100ps | timing | WR-SHORT-PS;sigma=100;ts=hardware | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| ti_primary_typed_wr_short_ps_sigma_120ps | timing | WR-SHORT-PS;sigma=120;ts=hardware | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| ti_primary_typed_wr_short_ps_sigma_300ps | timing | WR-SHORT-PS;sigma=300;ts=hardware | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_6ps | timing | WR-LONGHAUL-EXP;sigma=6;ts=hardware | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_12ps | timing | WR-LONGHAUL-EXP;sigma=12;ts=hardware | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_50ps | timing | WR-LONGHAUL-EXP;sigma=50;ts=hardware | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_100ps | timing | WR-LONGHAUL-EXP;sigma=100;ts=hardware | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_120ps | timing | WR-LONGHAUL-EXP;sigma=120;ts=hardware | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_300ps | timing | WR-LONGHAUL-EXP;sigma=300;ts=hardware | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |

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


