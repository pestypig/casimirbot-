# SEM+Ellipsometry Compatibility Check (2026-03-06T19:25:30.844Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-2026-03-06.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 2
- congruent: 0
- incongruent: 0
- unknown: 2

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| SE-ADV-1 | 0 | 0 | 1 |
| SE-STD-2 | 0 | 0 | 1 |

## Scenario Checks
| scenario_id | profile_id | delta_se_nm | U_fused_nm | u_fused_nm | reportable_ready | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|
| se_primary_typed_se_std_2_delta_1_u_1 | SE-STD-2 | 1 | 1 | 0.5 | false | unknown | compatible | reportable_not_ready |
| se_primary_typed_se_adv_1_delta_0p5_u_0p5 | SE-ADV-1 | 0.5 | 0.5 | 0.25 | false | unknown | compatible | reportable_not_ready |

## Dominant Reasons
| reason | count |
|---|---:|
| reportable_not_ready | 2 |

