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
- scenario_pack: `configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json`
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
| se_primary_typed_se_std_2_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.3622474501173695 | -0.6377525498826305 | none |
| se_primary_typed_se_std_2_delta_1_u_2 | sem_ellipsometry | SE-STD-2;delta=1;U=2 | compatible | true | 0.32114406201927037 | -0.6788559379807296 | none |
| se_primary_typed_se_std_2_delta_1_u_2p4 | sem_ellipsometry | SE-STD-2;delta=1;U=2.4 | compatible | true | 0.2977820016523604 | -0.7022179983476395 | none |
| se_primary_typed_se_std_2_delta_m2_u_1 | sem_ellipsometry | SE-STD-2;delta=-2;U=1 | compatible | true | 0.2698543116036525 | -0.7301456883963475 | none |
| se_primary_typed_se_std_2_delta_m2_u_2 | sem_ellipsometry | SE-STD-2;delta=-2;U=2 | compatible | true | 0.2933107269239444 | -0.7066892730760557 | none |
| se_primary_typed_se_std_2_delta_m2_u_2p4 | sem_ellipsometry | SE-STD-2;delta=-2;U=2.4 | compatible | true | 0.291099473983091 | -0.708900526016909 | none |
| se_primary_typed_se_std_2_delta_2p4_u_1 | sem_ellipsometry | SE-STD-2;delta=2.4;U=1 | compatible | true | 0.2845618912400363 | -0.7154381087599637 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2 | compatible | true | 0.28028252998501063 | -0.7197174700149893 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2p4 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2.4 | compatible | true | 0.2539442766683084 | -0.7460557233316916 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.28028252998501063 | -0.7197174700149893 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1 | compatible | true | 0.29553819800520426 | -0.7044618019947957 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1.2 | compatible | true | 0.27816622562226734 | -0.7218337743777327 | none |
| se_primary_typed_se_adv_1_delta_m1_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=-1;U=0.5 | compatible | true | 0.2698543116036525 | -0.7301456883963475 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1 | compatible | true | 0.3385402481038553 | -0.6614597518961447 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1.2 | compatible | true | 0.3163343916696474 | -0.6836656083303526 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=0.5 | compatible | true | 0.2824143818942586 | -0.7175856181057414 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1 | compatible | true | 0.2739798236667395 | -0.7260201763332605 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1.2 | compatible | true | 0.33600051505012196 | -0.663999484949878 | none |

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


