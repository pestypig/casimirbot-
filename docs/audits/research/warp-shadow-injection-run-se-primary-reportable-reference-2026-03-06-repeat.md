# Warp Shadow Injection Run (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 2
- compatible: 2
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`
- commit_pin: `f6d6146d26885aae34ebd8785950df07d6af9731`

## Recovery Contract
- recovery_goal: sem_ellipsometry_compatibility_recovery
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
| se_primary_typed_se_std_2_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.3000422530639194 | -0.6999577469360806 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.2598013562071703 | -0.7401986437928296 | none |

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


