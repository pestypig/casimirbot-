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
- scenario_pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`
- commit_pin: `0b65cb4b7b5dff40b72c032dd6424319fbd5ff41`

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
| ti_primary_typed_wr_short_ps_sigma_1e2ps | timing | WR-SHORT-PS;sigma=100;ts=hardware | compatible | true | 0.2520204203124254 | -0.7479795796875746 | none |
| ti_primary_typed_wr_short_ps_sigma_1e2ps | timing | WR-SHORT-PS;sigma=120;ts=hardware | compatible | true | 0.23176606739908293 | -0.7682339326009171 | none |
| ti_primary_typed_wr_longhaul_exp_sigma_6e0ps | timing | WR-LONGHAUL-EXP;sigma=6;ts=hardware | compatible | true | 0.2163729288083322 | -0.7836270711916677 | none |

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


