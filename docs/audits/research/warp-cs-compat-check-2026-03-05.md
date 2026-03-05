# Casimir Sign Compatibility Check (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-cs-primary-typed-2026-03-05.json`
- registry: `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Primary Window Anchors
- attractive_window_nm: [3, 100]
- repulsive_window_nm: [100, inf)

## Summary
- scenario_count: 18
- congruent: 6
- incongruent: 9
- unknown: 3

## Scenario Checks
| scenario_id | branch_hypothesis | gap_nm | u_gap_nm | u_window_nm | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|
| cs_primary_typed_attractive_gap_10nm | attractive | 10 | 5 | 5 | congruent | compatible | none |
| cs_primary_typed_attractive_gap_51p5nm | attractive | 51.5 | 5 | 5 | congruent | compatible | none |
| cs_primary_typed_attractive_gap_90nm | attractive | 90 | 5 | 5 | congruent | compatible | none |
| cs_primary_typed_attractive_gap_100nm | attractive | 100 | 5 | 5 | unknown | compatible | edge_uncertainty_overlap |
| cs_primary_typed_attractive_gap_140nm | attractive | 140 | 5 | 5 | incongruent | compatible | gap_outside_primary_window |
| cs_primary_typed_attractive_gap_220nm | attractive | 220 | 5 | 5 | incongruent | compatible | gap_outside_primary_window |
| cs_primary_typed_transition_gap_10nm | transition | 10 | 5 | 5 | incongruent | compatible | gap_outside_transition_band |
| cs_primary_typed_transition_gap_51p5nm | transition | 51.5 | 5 | 5 | incongruent | compatible | gap_outside_transition_band |
| cs_primary_typed_transition_gap_90nm | transition | 90 | 5 | 5 | unknown | compatible | edge_uncertainty_overlap |
| cs_primary_typed_transition_gap_100nm | transition | 100 | 5 | 5 | congruent | compatible | none |
| cs_primary_typed_transition_gap_140nm | transition | 140 | 5 | 5 | incongruent | compatible | gap_outside_transition_band |
| cs_primary_typed_transition_gap_220nm | transition | 220 | 5 | 5 | incongruent | compatible | gap_outside_transition_band |
| cs_primary_typed_repulsive_gap_10nm | repulsive | 10 | 5 | 5 | incongruent | compatible | gap_outside_primary_window |
| cs_primary_typed_repulsive_gap_51p5nm | repulsive | 51.5 | 5 | 5 | incongruent | compatible | gap_outside_primary_window |
| cs_primary_typed_repulsive_gap_90nm | repulsive | 90 | 5 | 5 | incongruent | compatible | gap_outside_primary_window |
| cs_primary_typed_repulsive_gap_100nm | repulsive | 100 | 5 | 5 | unknown | compatible | edge_uncertainty_overlap |
| cs_primary_typed_repulsive_gap_140nm | repulsive | 140 | 5 | 5 | congruent | compatible | none |
| cs_primary_typed_repulsive_gap_220nm | repulsive | 220 | 5 | 5 | congruent | compatible | none |

## Dominant Reasons
| reason | count |
|---|---:|
| gap_outside_primary_window | 5 |
| gap_outside_transition_band | 4 |
| edge_uncertainty_overlap | 3 |

