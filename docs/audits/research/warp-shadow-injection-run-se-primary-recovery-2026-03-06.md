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
| se_primary_se_std_2_delta_1_u_1 | sem_ellipsometry | n/a | compatible | true | 0.35151946658159006 | -0.6484805334184099 | none |
| se_primary_se_std_2_delta_1_u_2 | sem_ellipsometry | n/a | compatible | true | 0.35151946658159006 | -0.6484805334184099 | none |
| se_primary_se_std_2_delta_1_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.2889043255252519 | -0.7110956744747481 | none |
| se_primary_se_std_2_delta_m2_u_1 | sem_ellipsometry | n/a | compatible | true | 0.30461256386929075 | -0.6953874361307093 | none |
| se_primary_se_std_2_delta_m2_u_2 | sem_ellipsometry | n/a | compatible | true | 0.4023408302039053 | -0.5976591697960947 | none |
| se_primary_se_std_2_delta_m2_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.27816622562226734 | -0.7218337743777327 | none |
| se_primary_se_std_2_delta_2p4_u_1 | sem_ellipsometry | n/a | compatible | true | 0.2760653596550585 | -0.7239346403449415 | none |
| se_primary_se_std_2_delta_2p4_u_2 | sem_ellipsometry | n/a | compatible | true | 0.2598013562071703 | -0.7401986437928296 | none |
| se_primary_se_std_2_delta_2p4_u_2p4 | sem_ellipsometry | n/a | compatible | true | 0.2539442766683084 | -0.7460557233316916 | none |
| se_primary_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.27190950997029617 | -0.7280904900297038 | none |
| se_primary_se_adv_1_delta_0p5_u_1 | sem_ellipsometry | n/a | compatible | true | 0.2889043255252519 | -0.7110956744747481 | none |
| se_primary_se_adv_1_delta_0p5_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.3092500676596367 | -0.6907499323403633 | none |
| se_primary_se_adv_1_delta_m1_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.2933107269239444 | -0.7066892730760557 | none |
| se_primary_se_adv_1_delta_m1_u_1 | sem_ellipsometry | n/a | compatible | true | 0.3000422530639194 | -0.6999577469360806 | none |
| se_primary_se_adv_1_delta_m1_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.2698543116036525 | -0.7301456883963475 | none |
| se_primary_se_adv_1_delta_1p2_u_0p5 | sem_ellipsometry | n/a | compatible | true | 0.2889043255252519 | -0.7110956744747481 | none |
| se_primary_se_adv_1_delta_1p2_u_1 | sem_ellipsometry | n/a | compatible | true | 0.2845618912400363 | -0.7154381087599637 | none |
| se_primary_se_adv_1_delta_1p2_u_1p2 | sem_ellipsometry | n/a | compatible | true | 0.30461256386929075 | -0.6953874361307093 | none |

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


