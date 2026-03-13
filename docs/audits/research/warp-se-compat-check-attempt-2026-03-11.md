# SEM+Ellipsometry Compatibility Check (2026-03-11T18:08:55.638Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs\warp-shadow-injection-scenarios.se-primary-reportable.v1.json`
- run_artifact: `artifacts\research\full-solve\shadow-injection-run-se-primary-reportable-attempt-2026-03-11.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 18
- congruent: 0
- incongruent: 0
- unknown: 18

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| SE-ADV-1 | 0 | 0 | 9 |
| SE-STD-2 | 0 | 0 | 9 |

## Scenario Checks
| scenario_id | profile_id | delta_se_nm | U_fused_nm | u_fused_nm | reportable_ready | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|
| se_primary_typed_se_std_2_delta_1_u_1 | SE-STD-2 | 1 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_1_u_2 | SE-STD-2 | 1 | 2 | 1 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_1_u_2p4 | SE-STD-2 | 1 | 2.4 | 1.2 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_m2_u_1 | SE-STD-2 | -2 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_m2_u_2 | SE-STD-2 | -2 | 2 | 1 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_m2_u_2p4 | SE-STD-2 | -2 | 2.4 | 1.2 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_2p4_u_1 | SE-STD-2 | 2.4 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_2p4_u_2 | SE-STD-2 | 2.4 | 2 | 1 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_std_2_delta_2p4_u_2p4 | SE-STD-2 | 2.4 | 2.4 | 1.2 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | SE-ADV-1 | 0.5 | 0.5 | 0.25 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_0p5_u_1 | SE-ADV-1 | 0.5 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_0p5_u_1p2 | SE-ADV-1 | 0.5 | 1.2 | 0.6 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_m1_u_0p5 | SE-ADV-1 | -1 | 0.5 | 0.25 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_m1_u_1 | SE-ADV-1 | -1 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_m1_u_1p2 | SE-ADV-1 | -1 | 1.2 | 0.6 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_1p2_u_0p5 | SE-ADV-1 | 1.2 | 0.5 | 0.25 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_1p2_u_1 | SE-ADV-1 | 1.2 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |
| se_primary_typed_se_adv_1_delta_1p2_u_1p2 | SE-ADV-1 | 1.2 | 1.2 | 0.6 | false | unknown | compatible | reportable_not_ready, missing_measurement_provenance_raw_hash_for_ref |

## Dominant Reasons
| reason | count |
|---|---:|
| missing_measurement_provenance_raw_hash_for_ref | 18 |
| reportable_not_ready | 18 |

