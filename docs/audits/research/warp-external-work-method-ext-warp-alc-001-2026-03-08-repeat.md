# Warp Geometry Replay (EXT-WARP-ALC-001, 2026-03-08)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- snapshot: `docs/specs/data/warp-core4-alcubierre-1994.v1.json`
- baseline: `artifacts/research/full-solve/geometry-conformance-2026-03-08.json`
- chain_id: `CH-WARP-001`

## Signature Comparison
| key | local_status | external_status | comparison | reason_code |
|---|---|---|---|---|
| metric_form_alignment | pass | pass | pass | direct_adm_metric_form |
| shift_mapping | pass | pass | pass | direct_shift_mapping |
| york_time_sign_parity | pass | pass | pass | sign_convention_explicit |
| natario_control_behavior | pass | unknown | inconclusive | natario_specific_control_not_declared |
| metric_derived_t00_path | pass | pass | pass | wall_energy_density_anchor_present |

## Result
- comparison_status: `partial`
- pass_count: `4`
- fail_count: `0`
- inconclusive_count: `1`
- recompute_ready: `partial`
- replay_status: `pass_partial`

## Reason Codes
- direct_adm_metric_form, direct_shift_mapping, natario_specific_control_not_declared, sign_convention_explicit, wall_energy_density_anchor_present

## Blockers
- none

