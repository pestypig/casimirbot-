# Warp Energetics/QEI Replay (EXT-WARP-ALC-E001, 2026-03-17)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-alcubierre-1994-energetics.v1.json`
- baseline: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- chain_id: `CH-WARP-002`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| negative_energy_branch_policy | pass | pass | pass | negative_wall_energy_anchor_present |
| qei_worldline_requirement | pass | unknown | inconclusive | worldline_qei_not_explicit_in_source |
| stress_source_contract | pass | pass | pass | metric_derived_stress_lane_present |
| assumption_domain_disclosure | pass | pass | pass | adm_domain_disclosed |
| physical_feasibility_boundary | pass | unknown | inconclusive | feasibility_boundary_not_explicit_in_source |

## Result
- comparison_status: `partial`
- pass_count: `3`
- fail_count: `0`
- inconclusive_count: `2`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- adm_domain_disclosed, feasibility_boundary_not_explicit_in_source, metric_derived_stress_lane_present, negative_wall_energy_anchor_present, worldline_qei_not_explicit_in_source

## Blockers
- none

