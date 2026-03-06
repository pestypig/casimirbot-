# Timing Compatibility Check (2026-03-06T06:59:05.575Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-ti-primary-reportable-2026-03-06.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 12
- congruent: 3
- incongruent: 2
- unknown: 7

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| WR-LONGHAUL-EXP | 0 | 0 | 6 |
| WR-SHORT-PS | 3 | 2 | 1 |

## Scenario Checks
| scenario_id | profile_id | sigma_t_ps | u_sigma_t_ps | timestamping_mode | synce_enabled | topology_class | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---|---|---|---|---|---|
| ti_primary_typed_wr_short_ps_sigma_6e0ps | WR-SHORT-PS | 6 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_1e1ps | WR-SHORT-PS | 12 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_5e1ps | WR-SHORT-PS | 50 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_short_ps_sigma_1e2ps | WR-SHORT-PS | 100 | 6 | hardware | true | wr_short_fiber | unknown | compatible | edge_uncertainty_overlap |
| ti_primary_typed_wr_short_ps_sigma_1e2ps | WR-SHORT-PS | 120 | 6 | hardware | true | wr_short_fiber | incongruent | compatible | sigma_exceeds_profile:WR-SHORT-PS |
| ti_primary_typed_wr_short_ps_sigma_3e2ps | WR-SHORT-PS | 300 | 6 | hardware | true | wr_short_fiber | incongruent | compatible | sigma_exceeds_profile:WR-SHORT-PS |
| ti_primary_typed_wr_longhaul_exp_sigma_6e0ps | WR-LONGHAUL-EXP | 6 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |
| ti_primary_typed_wr_longhaul_exp_sigma_1e1ps | WR-LONGHAUL-EXP | 12 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |
| ti_primary_typed_wr_longhaul_exp_sigma_5e1ps | WR-LONGHAUL-EXP | 50 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |
| ti_primary_typed_wr_longhaul_exp_sigma_1e2ps | WR-LONGHAUL-EXP | 100 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |
| ti_primary_typed_wr_longhaul_exp_sigma_1e2ps | WR-LONGHAUL-EXP | 120 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |
| ti_primary_typed_wr_longhaul_exp_sigma_3e2ps | WR-LONGHAUL-EXP | 300 | 6 | hardware | false | wr_longhaul_unrepeated | unknown | compatible | longhaul_evidence_not_admissible_in_strict_scope |

## Dominant Reasons
| reason | count |
|---|---:|
| longhaul_evidence_not_admissible_in_strict_scope | 6 |
| sigma_exceeds_profile:WR-SHORT-PS | 2 |
| edge_uncertainty_overlap | 1 |

