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
| ti_primary_wr_short_ps_sigma_6e0ps | timing | n/a | compatible | true | 0.2520204203124254 | -0.7479795796875746 | none |
| ti_primary_wr_short_ps_sigma_1e1ps | timing | n/a | compatible | true | 0.23532774404059986 | -0.7646722559594001 | none |
| ti_primary_wr_short_ps_sigma_5e1ps | timing | n/a | compatible | true | 0.22652103813228594 | -0.773478961867714 | none |
| ti_primary_wr_short_ps_sigma_1e2ps | timing | n/a | compatible | true | 0.22308827469892908 | -0.7769117253010709 | none |
| ti_primary_wr_short_ps_sigma_1e2ps | timing | n/a | compatible | true | 0.21146505557529513 | -0.7885349444247048 | none |
| ti_primary_wr_short_ps_sigma_3e2ps | timing | n/a | compatible | true | 0.20825309986725563 | -0.7917469001327444 | none |
| ti_primary_wr_longhaul_exp_sigma_6e0ps | timing | n/a | compatible | true | 0.20825309986725563 | -0.7917469001327444 | none |
| ti_primary_wr_longhaul_exp_sigma_1e1ps | timing | n/a | compatible | true | 0.20508832087663792 | -0.7949116791233621 | none |
| ti_primary_wr_longhaul_exp_sigma_5e1ps | timing | n/a | compatible | true | 0.21146505557529513 | -0.7885349444247048 | none |
| ti_primary_wr_longhaul_exp_sigma_1e2ps | timing | n/a | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| ti_primary_wr_longhaul_exp_sigma_1e2ps | timing | n/a | compatible | true | 0.21308893587673397 | -0.7869110641232661 | none |
| ti_primary_wr_longhaul_exp_sigma_3e2ps | timing | n/a | compatible | true | 0.2035234136253071 | -0.7964765863746929 | none |

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


