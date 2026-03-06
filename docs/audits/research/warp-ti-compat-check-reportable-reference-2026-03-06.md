# Timing Compatibility Check (2026-03-06T15:48:31.544Z)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Inputs
- scenario_pack: `configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`
- run_artifact: `artifacts/research/full-solve/shadow-injection-run-ti-primary-reportable-reference-2026-03-06.json`
- registry: `docs\specs\casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Summary
- scenario_count: 2
- congruent: 2
- incongruent: 0
- unknown: 0

## Profile Summary
| profile_id | congruent | incongruent | unknown |
|---|---:|---:|---:|
| WR-LONGHAUL-EXP | 1 | 0 | 0 |
| WR-SHORT-PS | 1 | 0 | 0 |

## Scenario Checks
| scenario_id | profile_id | sigma_t_ps | tie_pp_ps | u_sigma_t_ps | timestamping_mode | synce_enabled | topology_class | evidence_congruence | run_classification | reasons |
|---|---|---:|---:|---:|---|---|---|---|---|---|
| ti_primary_typed_wr_short_ps_sigma_50ps | WR-SHORT-PS | 50 | 150 | 6 | hardware | true | wr_short_fiber | congruent | compatible | none |
| ti_primary_typed_wr_longhaul_exp_sigma_6ps | WR-LONGHAUL-EXP | 6 | 375 | 6 | hardware | false | wr_longhaul_unrepeated | congruent | compatible | none |

## Dominant Reasons
| reason | count |
|---|---:|
| n/a | 0 |

