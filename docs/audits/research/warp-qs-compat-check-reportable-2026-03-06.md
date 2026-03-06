# Q-Spoiling Compatibility Check (2026-03-06)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.qs-primary-reportable.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-qs-primary-reportable-2026-03-06.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 54
- congruent: 5
- incongruent: 24
- unknown: 25

## Mechanism Summary
| mechanism_lane | congruent | incongruent | unknown |
|---|---:|---:|---:|
| hydride_q_disease | 2 | 13 | 3 |
| tls_oxide | 0 | 7 | 11 |
| trapped_flux | 3 | 4 | 11 |

## Scenario Checks
| scenario_id | mechanism_lane | q0_baseline | q0_spoiled | q_spoil_ratio | f_q_spoil | q0_clean_floor | q0_spoiled_ceiling | f_q_spoil_floor | u_q0_rel | u_f_rel | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| qs_primary_typed_hydride_q_disease_q0_1e10_f_1e0 | hydride_q_disease | 10000000000 | 10000000000 | 1 | 1 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease, q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_1e10_f_3e0 | hydride_q_disease | 10000000000 | 3333330000 | 3 | 3 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease, q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_1e10_f_1e1 | hydride_q_disease | 10000000000 | 1000000000 | 10 | 10 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_1e10_f_2e1 | hydride_q_disease | 10000000000 | 500000000 | 20 | 20 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_1e10_f_4e1 | hydride_q_disease | 10000000000 | 250000000 | 40 | 40 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_1e10_f_8e1 | hydride_q_disease | 10000000000 | 125000000 | 80 | 80 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_baseline_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_1e0 | hydride_q_disease | 20000000000 | 20000000000 | 1 | 1 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_3e0 | hydride_q_disease | 20000000000 | 6666670000 | 3 | 3 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_1e1 | hydride_q_disease | 20000000000 | 2000000000 | 10 | 10 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_2e1 | hydride_q_disease | 20000000000 | 1000000000 | 20 | 20 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | unknown | compatible | edge_uncertainty_overlap:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_4e1 | hydride_q_disease | 20000000000 | 500000000 | 40 | 40 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | unknown | compatible | edge_uncertainty_overlap:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_2e10_f_8e1 | hydride_q_disease | 20000000000 | 250000000 | 80 | 80 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | unknown | compatible | edge_uncertainty_overlap:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_1e0 | hydride_q_disease | 30000000000 | 30000000000 | 1 | 1 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_3e0 | hydride_q_disease | 30000000000 | 10000000000 | 3 | 3 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_1e1 | hydride_q_disease | 30000000000 | 3000000000 | 10 | 10 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease, f_q_spoil_below_floor:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_2e1 | hydride_q_disease | 30000000000 | 1500000000 | 20 | 20 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | incongruent | compatible | q0_spoiled_above_ceiling:hydride_q_disease |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_4e1 | hydride_q_disease | 30000000000 | 750000000 | 40 | 40 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | congruent | compatible | none |
| qs_primary_typed_hydride_q_disease_q0_3e10_f_8e1 | hydride_q_disease | 30000000000 | 375000000 | 80 | 80 | 20000000000 | 1000000000 | 20 | 0.053 | 0.053 | congruent | compatible | none |
| qs_primary_typed_trapped_flux_q0_1e10_f_1e0 | trapped_flux | 10000000000 | 10000000000 | 1 | 1 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | incongruent | compatible | q0_spoiled_above_ceiling:trapped_flux, f_q_spoil_below_floor:trapped_flux |
| qs_primary_typed_trapped_flux_q0_1e10_f_3e0 | trapped_flux | 10000000000 | 3333330000 | 3 | 3 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_1e10_f_1e1 | trapped_flux | 10000000000 | 1000000000 | 10 | 10 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_1e10_f_2e1 | trapped_flux | 10000000000 | 500000000 | 20 | 20 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_1e10_f_4e1 | trapped_flux | 10000000000 | 250000000 | 40 | 40 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_1e10_f_8e1 | trapped_flux | 10000000000 | 125000000 | 80 | 80 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_1e0 | trapped_flux | 20000000000 | 20000000000 | 1 | 1 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | incongruent | compatible | q0_spoiled_above_ceiling:trapped_flux, f_q_spoil_below_floor:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_3e0 | trapped_flux | 20000000000 | 6666670000 | 3 | 3 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_1e1 | trapped_flux | 20000000000 | 2000000000 | 10 | 10 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_2e1 | trapped_flux | 20000000000 | 1000000000 | 20 | 20 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_4e1 | trapped_flux | 20000000000 | 500000000 | 40 | 40 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_2e10_f_8e1 | trapped_flux | 20000000000 | 250000000 | 80 | 80 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_3e10_f_1e0 | trapped_flux | 30000000000 | 30000000000 | 1 | 1 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | incongruent | compatible | q0_spoiled_above_ceiling:trapped_flux, f_q_spoil_below_floor:trapped_flux |
| qs_primary_typed_trapped_flux_q0_3e10_f_3e0 | trapped_flux | 30000000000 | 10000000000 | 3 | 3 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | incongruent | compatible | q0_spoiled_above_ceiling:trapped_flux |
| qs_primary_typed_trapped_flux_q0_3e10_f_1e1 | trapped_flux | 30000000000 | 3000000000 | 10 | 10 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | unknown | compatible | edge_uncertainty_overlap:trapped_flux |
| qs_primary_typed_trapped_flux_q0_3e10_f_2e1 | trapped_flux | 30000000000 | 1500000000 | 20 | 20 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | congruent | compatible | none |
| qs_primary_typed_trapped_flux_q0_3e10_f_4e1 | trapped_flux | 30000000000 | 750000000 | 40 | 40 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | congruent | compatible | none |
| qs_primary_typed_trapped_flux_q0_3e10_f_8e1 | trapped_flux | 30000000000 | 375000000 | 80 | 80 | 18000000000 | 4153846153.846154 | 4.333333333333333 | 0.625 | 0.625 | congruent | compatible | none |
| qs_primary_typed_tls_oxide_q0_1e10_f_1e0 | tls_oxide | 10000000000 | 10000000000 | 1 | 1 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide, f_q_spoil_below_floor:tls_oxide |
| qs_primary_typed_tls_oxide_q0_1e10_f_3e0 | tls_oxide | 10000000000 | 3333330000 | 3 | 3 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide |
| qs_primary_typed_tls_oxide_q0_1e10_f_1e1 | tls_oxide | 10000000000 | 1000000000 | 10 | 10 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_1e10_f_2e1 | tls_oxide | 10000000000 | 500000000 | 20 | 20 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_1e10_f_4e1 | tls_oxide | 10000000000 | 250000000 | 40 | 40 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_1e10_f_8e1 | tls_oxide | 10000000000 | 125000000 | 80 | 80 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_1e0 | tls_oxide | 20000000000 | 20000000000 | 1 | 1 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide, f_q_spoil_below_floor:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_3e0 | tls_oxide | 20000000000 | 6666670000 | 3 | 3 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_1e1 | tls_oxide | 20000000000 | 2000000000 | 10 | 10 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_2e1 | tls_oxide | 20000000000 | 1000000000 | 20 | 20 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_4e1 | tls_oxide | 20000000000 | 500000000 | 40 | 40 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_2e10_f_8e1 | tls_oxide | 20000000000 | 250000000 | 80 | 80 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_1e0 | tls_oxide | 30000000000 | 30000000000 | 1 | 1 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide, f_q_spoil_below_floor:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_3e0 | tls_oxide | 30000000000 | 10000000000 | 3 | 3 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_1e1 | tls_oxide | 30000000000 | 3000000000 | 10 | 10 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | incongruent | compatible | q0_spoiled_above_ceiling:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_2e1 | tls_oxide | 30000000000 | 1500000000 | 20 | 20 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_4e1 | tls_oxide | 30000000000 | 750000000 | 40 | 40 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |
| qs_primary_typed_tls_oxide_q0_3e10_f_8e1 | tls_oxide | 30000000000 | 375000000 | 80 | 80 | 20000000000 | 1538461538.4615386 | 13 | 0.8 | 0.8 | unknown | compatible | edge_uncertainty_overlap:tls_oxide |

## Dominant Reasons
| reason | count |
|---|---:|
| edge_uncertainty_overlap:tls_oxide | 11 |
| edge_uncertainty_overlap:trapped_flux | 11 |
| f_q_spoil_below_floor:hydride_q_disease | 9 |
| q0_spoiled_above_ceiling:hydride_q_disease | 9 |
| q0_spoiled_above_ceiling:tls_oxide | 7 |
| q0_baseline_below_floor:hydride_q_disease | 6 |
| q0_spoiled_above_ceiling:trapped_flux | 4 |
| edge_uncertainty_overlap:hydride_q_disease | 3 |
| f_q_spoil_below_floor:tls_oxide | 3 |
| f_q_spoil_below_floor:trapped_flux | 3 |

