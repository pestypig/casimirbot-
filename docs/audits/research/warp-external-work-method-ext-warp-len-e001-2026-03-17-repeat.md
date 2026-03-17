# Warp Energetics/QEI Replay (EXT-WARP-LEN-E001, 2026-03-17)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-lentz-2021-energetics.v1.json`
- baseline: `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- chain_id: `CH-WARP-002`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| negative_energy_branch_policy | pass | unknown | inconclusive | positive_energy_claim_in_noncomparable_domain |
| qei_worldline_requirement | pass | unknown | inconclusive | worldline_qei_not_explicit_in_source |
| stress_source_contract | pass | unknown | inconclusive | non_comparable_assumption_domain |
| assumption_domain_disclosure | pass | pass | inconclusive | noncomparable_domain_explicitly_disclosed |
| physical_feasibility_boundary | pass | unknown | inconclusive | feasibility_boundary_not_explicit_in_source |

## Result
- comparison_status: `inconclusive`
- pass_count: `0`
- fail_count: `0`
- inconclusive_count: `5`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- feasibility_boundary_not_explicit_in_source, non_comparable_assumption_domain, noncomparable_domain_explicitly_disclosed, positive_energy_claim_in_noncomparable_domain, worldline_qei_not_explicit_in_source

## Blockers
- none

