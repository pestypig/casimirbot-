# Warp Shadow Injection Run (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 18
- compatible: 18
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json`
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
| se_primary_se_std_2_delta_1_u_1 | sem_ellipsometry | n/a | compatible | true | 0.2867251686562073 | -0.7132748313437927 | none |
| se_primary_se_std_2_delta_1_u_2 | sem_ellipsometry | n/a | compatible | true | 0.27190950997029617 | -0.7280904900297038 | none |
| se_primary_se_std_2_delta_1_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.23176606739908293 | -0.7682339326009171 | none |
| se_primary_se_std_2_delta_m2_u_1 | sem_ellipsometry | n/a | compatible | true | 0.23712835781575098 | -0.762871642184249 | none |
| se_primary_se_std_2_delta_m2_u_2 | sem_ellipsometry | n/a | compatible | true | 0.23532774404059986 | -0.7646722559594001 | none |
| se_primary_se_std_2_delta_m2_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.22652103813228594 | -0.773478961867714 | none |
| se_primary_se_std_2_delta_2p4_u_1 | sem_ellipsometry | n/a | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| se_primary_se_std_2_delta_2p4_u_2 | sem_ellipsometry | n/a | compatible | true | 0.21146505557529513 | -0.7885349444247048 | none |
| se_primary_se_std_2_delta_2p4_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.22139079896456007 | -0.77860920103544 | none |
| se_primary_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.24261043137816474 | -0.7573895686218353 | none |
| se_primary_se_adv_1_delta_0p5_u_1 | sem_ellipsometry | n/a | compatible | true | 0.2300048183594453 | -0.7699951816405547 | none |
| se_primary_se_adv_1_delta_0p5_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.2300048183594453 | -0.7699951816405547 | none |
| se_primary_se_adv_1_delta_m1_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.21146505557529513 | -0.7885349444247048 | none |
| se_primary_se_adv_1_delta_m1_u_1 | sem_ellipsometry | n/a | compatible | true | 0.22139079896456007 | -0.77860920103544 | none |
| se_primary_se_adv_1_delta_m1_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| se_primary_se_adv_1_delta_1p2_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.21308893587673397 | -0.7869110641232661 | none |
| se_primary_se_adv_1_delta_1p2_u_1 | sem_ellipsometry | n/a | compatible | true | 0.21970580827264663 | -0.7802941917273534 | none |
| se_primary_se_adv_1_delta_1p2_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.20666485523008782 | -0.7933351447699122 | none |

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


