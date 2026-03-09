# Warp Geometry Replay (EXT-WARP-VDB-001, 2026-03-07)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-vandenbroeck-1999.v1.json`
- baseline: `artifacts/research/full-solve/geometry-conformance-2026-03-07.json`
- chain_id: `CH-WARP-001`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| metric_form_alignment | pass | unknown | inconclusive | conditional_b_equals_1_only |
| shift_mapping | pass | unknown | inconclusive | conditional_b_equals_1_only |
| york_time_sign_parity | pass | unknown | inconclusive | conditional_sign_parity_domain_limited |
| natario_control_behavior | pass | unknown | inconclusive | natario_specific_control_not_declared |
| metric_derived_t00_path | pass | unknown | inconclusive | requires_region_ii_derivative_closure |

## Result
- comparison_status: `inconclusive`
- pass_count: `0`
- fail_count: `0`
- inconclusive_count: `5`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- conditional_b_equals_1_only, conditional_sign_parity_domain_limited, natario_specific_control_not_declared, requires_region_ii_derivative_closure

## Blockers
- none

