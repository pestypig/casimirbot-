# Timing Compatibility Check (2026-03-17T16:58:28.253Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs\warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`
- run_artifact: `artifacts\research\full-solve\shadow-injection-run-ti-primary-reportable-readiness-2026-03-17.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 12
- congruent: 9
- incongruent: 2
- unknown: 1

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| WR-LONGHAUL-EXP | 6 | 0 | 0 |
| WR-SHORT-PS | 3 | 2 | 1 |

## Scenario Checks
| scenario_id | profile_id | sigma_t_ps | tie_pp_ps | u_sigma_t_ps | timestamping_mode | synce_enabled | topology_class | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|---|---|
| ti_primary_typed_wr_short_ps_sigma_6ps | WR-SHORT-PS | 6 | 150 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_12ps | WR-SHORT-PS | 12 | 150 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_50ps | WR-SHORT-PS | 50 | 150 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_100ps | WR-SHORT-PS | 100 | 150 | 6 | hardware | true | wr_short_fiber | unknown | compatible | edge_uncertainty_overlap |
| ti_primary_typed_wr_short_ps_sigma_120ps | WR-SHORT-PS | 120 | 150 | 6 | hardware | true | wr_short_fiber | incongruent | compatible | sigma_exceeds_profile:WR-SHORT-PS |
| ti_primary_typed_wr_short_ps_sigma_300ps | WR-SHORT-PS | 300 | 150 | 6 | hardware | true | wr_short_fiber | incongruent | compatible | sigma_exceeds_profile:WR-SHORT-PS |
| ti_primary_typed_wr_longhaul_exp_sigma_6ps | WR-LONGHAUL-EXP | 6 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_12ps | WR-LONGHAUL-EXP | 12 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_50ps | WR-LONGHAUL-EXP | 50 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_100ps | WR-LONGHAUL-EXP | 100 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_120ps | WR-LONGHAUL-EXP | 120 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_300ps | WR-LONGHAUL-EXP | 300 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |

## Dominant Reasons
| reason | count |
|---|---:|
| sigma_exceeds_profile:WR-SHORT-PS | 2 |
| edge_uncertainty_overlap | 1 |

