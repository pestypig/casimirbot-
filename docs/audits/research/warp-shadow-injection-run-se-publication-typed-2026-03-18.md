# Warp Shadow Injection Run (2026-03-18)

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
- commit_pin: `7e8cc8952db5649e54d797a3786bd85e3fb0e96b`

## Recovery Contract
- recovery_goal: sem_ellipsometry_publication_overlay
- success_bar: map_only
- winnerScenarioId: null
- success_achieved: true
- baseline_reference_path: artifacts/research/full-solve/shadow-injection-run-generated-2026-03-18.json

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
| se_publication_typed_se_std_2_ideal_target_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.22652103813228594 | -0.773478961867714 | none |
| se_publication_typed_se_std_2_publication_baseline_delta_3_u_1p2 | sem_ellipsometry | SE-STD-2;delta=3;U=1.2 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| se_publication_typed_se_std_2_publication_stress_delta_46_u_3p8 | sem_ellipsometry | SE-STD-2;delta=46;U=3.8 | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| se_publication_typed_se_adv_1_ideal_target_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| se_publication_typed_se_adv_1_publication_baseline_delta_3_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=3;U=1.2 | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| se_publication_typed_se_adv_1_publication_stress_delta_46_u_3p8 | sem_ellipsometry | SE-ADV-1;delta=46;U=3.8 | compatible | true | 0.1928877525715478 | -0.8071122474284522 | none |

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


