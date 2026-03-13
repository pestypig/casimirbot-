# Warp Shadow Injection Run (2026-03-11)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 18
- compatible: 18
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs\warp-shadow-injection-scenarios.se-primary-reportable.v1.json`
- commit_pin: `cb0d5202f348c9c21ab4add7852903ac66e2d127`

## Recovery Contract
- recovery_goal: sem_ellipsometry_compatibility_recovery
- success_bar: map_only
- winnerScenarioId: null
- success_achieved: true
- baseline_reference_path: artifacts/research/full-solve/shadow-injection-run-generated-2026-03-11.json

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
| se_primary_typed_se_std_2_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.23354034503609122 | -0.7664596549639088 | none |
| se_primary_typed_se_std_2_delta_1_u_2 | sem_ellipsometry | SE-STD-2;delta=1;U=2 | compatible | true | 0.2098531385402239 | -0.7901468614597761 | none |
| se_primary_typed_se_std_2_delta_1_u_2p4 | sem_ellipsometry | SE-STD-2;delta=1;U=2.4 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| se_primary_typed_se_std_2_delta_m2_u_1 | sem_ellipsometry | SE-STD-2;delta=-2;U=1 | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| se_primary_typed_se_std_2_delta_m2_u_2 | sem_ellipsometry | SE-STD-2;delta=-2;U=2 | compatible | true | 0.20666485523008782 | -0.7933351447699122 | none |
| se_primary_typed_se_std_2_delta_m2_u_2p4 | sem_ellipsometry | SE-STD-2;delta=-2;U=2.4 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| se_primary_typed_se_std_2_delta_2p4_u_1 | sem_ellipsometry | SE-STD-2;delta=2.4;U=1 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2p4 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2.4 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1.2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_adv_1_delta_m1_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=-1;U=0.5 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1 | compatible | true | 0.19737841176938295 | -0.802621588230617 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1.2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=0.5 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1 | compatible | true | 0.20042815053284566 | -0.7995718494671543 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1.2 | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |

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


