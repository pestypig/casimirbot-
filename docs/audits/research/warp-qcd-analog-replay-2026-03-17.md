# QCD Analog Replay (2026-03-17)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope
- lane: `qcd_analog`
- chain_id: `CH-QCD-001`
- posture: `reference_only`

## Inputs
- record_snapshot: `docs\specs\data\qcd-hepdata-record-159491.v1.json`
- table_short_snapshot: `docs\specs\data\qcd-hepdata-table-159491-t3.v1.json`
- table_long_snapshot: `docs\specs\data\qcd-hepdata-table-159491-t4.v1.json`
- table_dr_snapshot: `docs\specs\data\qcd-hepdata-table-159491-t5.v1.json`
- source_ids: `SRC-069`, `SRC-070`

## Extracted Anchors
| field | value |
|---|---:|
| cm_energy_gev | 200 |
| event_count_millions | 600 |
| beam_speed_pct_c | 99.996 |
| p_rel_short_range | 0.181 |
| p_rel_short_stat | 0.035 |
| p_rel_short_sys | 0.022 |
| p_rel_long_range | 0.02 |
| p_rel_long_stat | 0.023 |
| p_rel_long_sys | 0.022 |
| dr_row_count | 5 |

## Replay Equation
`z = |P| / sqrt(sigma_stat^2 + sigma_sys^2)`

## Replay Results
| metric | value |
|---|---:|
| sigma_combined_short | 0.04134 |
| z_score_short | 4.37832 |
| sigma_combined_long | 0.031828 |
| z_score_long | 0.628384 |
| z_target | 4.4 |
| z_abs_diff_short | 0.02168 |
| abs_p_short_minus_long | 0.161 |
| dr_mean_abs_near | 0.1405 |
| dr_mean_abs_far | 0.0045 |
| dr_near_far_ratio | 31.222222 |
| status | pass_partial |
| recompute_ready | partial |

## Deterministic Checks
| check | status |
|---|---|
| recordDoiPresent | PASS |
| hepdataDoiPresent | PASS |
| shortTableDoiPresent | PASS |
| longTableDoiPresent | PASS |
| drTableDoiPresent | PASS |
| shortRangeRowPresent | PASS |
| longRangeRowPresent | PASS |
| shortStatUncertaintyPresent | PASS |
| shortSysUncertaintyPresent | PASS |
| longStatUncertaintyPresent | PASS |
| longSysUncertaintyPresent | PASS |
| shortZComputable | PASS |
| longZComputable | PASS |
| shortZParityWithinTolerance | PASS |
| longRangeConsistentWithZero | PASS |
| shortLongContrastPresent | PASS |
| drRowsPresent | PASS |
| drNearFarTrendPresent | PASS |
| drPeakAtOrBelowOne | PASS |

## Blockers
- none
