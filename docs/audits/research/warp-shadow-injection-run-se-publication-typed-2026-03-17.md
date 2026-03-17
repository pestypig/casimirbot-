# Warp Shadow Injection Run (2026-03-17)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 6
- compatible: 6
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs\warp-shadow-injection-scenarios.se-publication-typed.v1.json`
- commit_pin: `5263528756309f437fdc65b0e6e900a4666b0b3f`

## Recovery Contract
- recovery_goal: sem_ellipsometry_publication_overlay
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
| se_publication_typed_se_std_2_ideal_target_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.23532774404059986 | -0.7646722559594001 | none |
| se_publication_typed_se_std_2_publication_baseline_delta_3_u_1p2 | sem_ellipsometry | SE-STD-2;delta=3;U=1.2 | compatible | true | 0.20825309986725563 | -0.7917469001327444 | none |
| se_publication_typed_se_std_2_publication_stress_delta_46_u_3p8 | sem_ellipsometry | SE-STD-2;delta=46;U=3.8 | compatible | true | 0.2035234136253071 | -0.7964765863746929 | none |
| se_publication_typed_se_adv_1_ideal_target_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| se_publication_typed_se_adv_1_publication_baseline_delta_3_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=3;U=1.2 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| se_publication_typed_se_adv_1_publication_stress_delta_46_u_3p8 | sem_ellipsometry | SE-ADV-1;delta=46;U=3.8 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |

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


