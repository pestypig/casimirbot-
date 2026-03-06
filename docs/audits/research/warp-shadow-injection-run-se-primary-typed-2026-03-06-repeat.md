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
| se_primary_typed_se_std_2_delta_1_u_1 | sem_ellipsometry | SE-STD-2;delta=1;U=1 | compatible | true | 0.30231906821639243 | -0.6976809317836076 | none |
| se_primary_typed_se_std_2_delta_1_u_2 | sem_ellipsometry | SE-STD-2;delta=1;U=2 | compatible | true | 0.2637783496384243 | -0.7362216503615757 | none |
| se_primary_typed_se_std_2_delta_1_u_2p4 | sem_ellipsometry | SE-STD-2;delta=1;U=2.4 | compatible | true | 0.23354034503609122 | -0.7664596549639088 | none |
| se_primary_typed_se_std_2_delta_m2_u_1 | sem_ellipsometry | SE-STD-2;delta=-2;U=1 | compatible | true | 0.23712835781575098 | -0.762871642184249 | none |
| se_primary_typed_se_std_2_delta_m2_u_2 | sem_ellipsometry | SE-STD-2;delta=-2;U=2 | compatible | true | 0.23354034503609122 | -0.7664596549639088 | none |
| se_primary_typed_se_std_2_delta_m2_u_2p4 | sem_ellipsometry | SE-STD-2;delta=-2;U=2.4 | compatible | true | 0.22139079896456007 | -0.77860920103544 | none |
| se_primary_typed_se_std_2_delta_2p4_u_1 | sem_ellipsometry | SE-STD-2;delta=2.4;U=1 | compatible | true | 0.22308827469892908 | -0.7769117253010709 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2 | compatible | true | 0.20825309986725563 | -0.7917469001327444 | none |
| se_primary_typed_se_std_2_delta_2p4_u_2p4 | sem_ellipsometry | SE-STD-2;delta=2.4;U=2.4 | compatible | true | 0.22139079896456007 | -0.77860920103544 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=0.5 | compatible | true | 0.24076960648028975 | -0.7592303935197102 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1 | compatible | true | 0.23354034503609122 | -0.7664596549639088 | none |
| se_primary_typed_se_adv_1_delta_0p5_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=0.5;U=1.2 | compatible | true | 0.21308893587673397 | -0.7869110641232661 | none |
| se_primary_typed_se_adv_1_delta_m1_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=-1;U=0.5 | compatible | true | 0.21970580827264663 | -0.7802941917273534 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1 | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| se_primary_typed_se_adv_1_delta_m1_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=-1;U=1.2 | compatible | true | 0.21970580827264663 | -0.7802941917273534 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_0p5 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=0.5 | compatible | true | 0.2163729288083322 | -0.7836270711916677 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1 | compatible | true | 0.20508832087663792 | -0.7949116791233621 | none |
| se_primary_typed_se_adv_1_delta_1p2_u_1p2 | sem_ellipsometry | SE-ADV-1;delta=1.2;U=1.2 | compatible | true | 0.2147248649305589 | -0.7852751350694411 | none |

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


