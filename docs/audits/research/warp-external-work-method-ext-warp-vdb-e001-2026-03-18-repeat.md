# Warp Energetics/QEI Replay (EXT-WARP-VDB-E001, 2026-03-18)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-vandenbroeck-1999-energetics.v1.json`
- baseline: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- chain_id: `CH-WARP-002`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| negative_energy_branch_policy | pass | unknown | inconclusive | conditional_sign_claim_without_full_region_closure |
| qei_worldline_requirement | pass | unknown | inconclusive | worldline_qei_not_explicit_in_source |
| stress_source_contract | pass | unknown | inconclusive | requires_region_ii_derivative_closure |
| assumption_domain_disclosure | pass | pass | pass | conditional_domain_disclosed |
| physical_feasibility_boundary | pass | unknown | inconclusive | feasibility_boundary_not_explicit_in_source |

## Result
- comparison_status: `partial`
- pass_count: `1`
- fail_count: `0`
- inconclusive_count: `4`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- conditional_domain_disclosed, conditional_sign_claim_without_full_region_closure, feasibility_boundary_not_explicit_in_source, requires_region_ii_derivative_closure, worldline_qei_not_explicit_in_source

## Blockers
- none

