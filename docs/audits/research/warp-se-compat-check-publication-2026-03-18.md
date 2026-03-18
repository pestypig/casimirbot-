# SEM+Ellipsometry Compatibility Check (2026-03-18T02:00:28.530Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs\warp-shadow-injection-scenarios.se-publication-typed.v1.json`
- run_artifact: `artifacts\research\full-solve\shadow-injection-run-se-publication-typed-2026-03-18.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 6
- congruent: 2
- incongruent: 0
- unknown: 4

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| SE-ADV-1 | 1 | 0 | 2 |
| SE-STD-2 | 1 | 0 | 2 |

## Scenario Checks
| scenario_id | profile_id | delta_se_nm | U_fused_nm | u_fused_nm | reportable_ready | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|
| se_publication_typed_se_std_2_ideal_target_delta_1_u_1 | SE-STD-2 | 1 | 1 | 0.5 | false | congruent | compatible | none |
| se_publication_typed_se_std_2_publication_baseline_delta_3_u_1p2 | SE-STD-2 | 3 | 1.2 | 0.6 | false | unknown | compatible | delta_exceeds_profile:SE-STD-2 |
| se_publication_typed_se_std_2_publication_stress_delta_46_u_3p8 | SE-STD-2 | 46 | 3.8 | 1.9 | false | unknown | compatible | delta_exceeds_profile:SE-STD-2 |
| se_publication_typed_se_adv_1_ideal_target_delta_0p5_u_0p5 | SE-ADV-1 | 0.5 | 0.5 | 0.25 | false | congruent | compatible | none |
| se_publication_typed_se_adv_1_publication_baseline_delta_3_u_1p2 | SE-ADV-1 | 3 | 1.2 | 0.6 | false | unknown | compatible | delta_exceeds_profile:SE-ADV-1 |
| se_publication_typed_se_adv_1_publication_stress_delta_46_u_3p8 | SE-ADV-1 | 46 | 3.8 | 1.9 | false | unknown | compatible | delta_exceeds_profile:SE-ADV-1, U_fused_exceeds_profile:SE-ADV-1 |

## Dominant Reasons
| reason | count |
|---|---:|
| delta_exceeds_profile:SE-ADV-1 | 2 |
| delta_exceeds_profile:SE-STD-2 | 2 |
| U_fused_exceeds_profile:SE-ADV-1 | 1 |

