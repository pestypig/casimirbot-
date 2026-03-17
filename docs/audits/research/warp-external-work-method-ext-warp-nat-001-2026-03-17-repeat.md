# Warp Geometry Replay (EXT-WARP-NAT-001, 2026-03-17)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-natario-2002.v1.json`
- baseline: `artifacts/research/full-solve/geometry-conformance-2026-03-17.json`
- chain_id: `CH-WARP-001`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| metric_form_alignment | pass | pass | pass | natario_metric_definition_present |
| shift_mapping | pass | pass | pass | shift_vector_mapping_present |
| york_time_sign_parity | pass | pass | pass | expansion_trace_sign_mapping_present |
| natario_control_behavior | pass | pass | pass | zero_expansion_control_anchor_present |
| metric_derived_t00_path | pass | pass | pass | geometry_tied_stress_identity_present |

## Result
- comparison_status: `compatible`
- pass_count: `5`
- fail_count: `0`
- inconclusive_count: `0`
- recompute_ready: `full`
- replay_status: `pass_full`

## Reason Codes
- expansion_trace_sign_mapping_present, geometry_tied_stress_identity_present, natario_metric_definition_present, shift_vector_mapping_present, zero_expansion_control_anchor_present

## Blockers
- none

