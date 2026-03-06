# Nanogap Compatibility Check (2026-03-06T05:41:38.327Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.ng-primary-reportable.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-ng-primary-reportable-2026-03-06-repeat.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 10
- congruent: 5
- incongruent: 5
- unknown: 0

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| NG-ADV-5 | 0 | 5 | 0 |
| NG-STD-10 | 5 | 0 | 0 |

## Scenario Checks
| scenario_id | profile_id | gap_nm | u_g_mean_nm | u_g_sigma_nm | reportable_ready | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|
| ng_primary_typed_ng_std_10_gap_5e0nm | NG-STD-10 | 5 | 1 | 1.2 | true | congruent | compatible | none |
| ng_primary_typed_ng_std_10_gap_1e1nm | NG-STD-10 | 10 | 1 | 1.2 | true | congruent | compatible | none |
| ng_primary_typed_ng_std_10_gap_2e1nm | NG-STD-10 | 18 | 1 | 1.2 | true | congruent | compatible | none |
| ng_primary_typed_ng_std_10_gap_1e2nm | NG-STD-10 | 96 | 1 | 1.2 | true | congruent | compatible | none |
| ng_primary_typed_ng_std_10_gap_1e2nm | NG-STD-10 | 100 | 1 | 1.2 | true | congruent | compatible | none |
| ng_primary_typed_ng_adv_5_gap_5e0nm | NG-ADV-5 | 5 | 1 | 1.2 | true | incongruent | compatible | u_g_sigma_exceeds_profile:NG-ADV-5 |
| ng_primary_typed_ng_adv_5_gap_1e1nm | NG-ADV-5 | 10 | 1 | 1.2 | true | incongruent | compatible | u_g_sigma_exceeds_profile:NG-ADV-5 |
| ng_primary_typed_ng_adv_5_gap_2e1nm | NG-ADV-5 | 18 | 1 | 1.2 | true | incongruent | compatible | u_g_sigma_exceeds_profile:NG-ADV-5 |
| ng_primary_typed_ng_adv_5_gap_1e2nm | NG-ADV-5 | 96 | 1 | 1.2 | true | incongruent | compatible | u_g_sigma_exceeds_profile:NG-ADV-5 |
| ng_primary_typed_ng_adv_5_gap_1e2nm | NG-ADV-5 | 100 | 1 | 1.2 | true | incongruent | compatible | u_g_sigma_exceeds_profile:NG-ADV-5 |

## Dominant Reasons
| reason | count |
|---|---:|
| u_g_sigma_exceeds_profile:NG-ADV-5 | 5 |
