# Warp Energetics/QEI Replay (EXT-WARP-NAT-E001, 2026-03-18)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-natario-2002-energetics.v1.json`
- baseline: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- chain_id: `CH-WARP-002`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| negative_energy_branch_policy | pass | unknown | inconclusive | energy_sign_not_explicitly_classified |
| qei_worldline_requirement | pass | unknown | inconclusive | worldline_qei_not_explicit_in_source |
| stress_source_contract | pass | pass | pass | geometry_derived_stress_identity_present |
| assumption_domain_disclosure | pass | pass | pass | adm_domain_disclosed |
| physical_feasibility_boundary | pass | unknown | inconclusive | feasibility_boundary_not_explicit_in_source |

## Result
- comparison_status: `partial`
- pass_count: `2`
- fail_count: `0`
- inconclusive_count: `3`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- adm_domain_disclosed, energy_sign_not_explicitly_classified, feasibility_boundary_not_explicit_in_source, geometry_derived_stress_identity_present, worldline_qei_not_explicit_in_source

## Blockers
- none

