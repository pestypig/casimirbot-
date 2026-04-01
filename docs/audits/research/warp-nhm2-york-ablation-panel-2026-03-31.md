# NHM2 York Ablation Panel (2026-03-31)

"This ablation panel localizes which NHM2 subsystem most strongly drives the current Lane A morphology under the same fixed-scale render contract used for canonical controls."

## Comparison Contract
| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| exportDirectory | artifacts/research/full-solve/rendered-york-ablation-panel-2026-03-31 |

## NHM2 Current Status
| field | value |
|---|---|
| current_case_id | nhm2_certified |
| nhm2_current_class | natario_like_low_expansion |
| dominantSensitivityCause | casimir_drive |
| ablationDecision | no_single_ablation_explains_morphology |
| implementedAblations | nhm2_without_hull_coupling, nhm2_without_casimir_drive, nhm2_simplified_source |
| stillUnavailableAblations | nhm2_support_mask_off |

## Ablation Comparisons
| ablation_id | status | movementClass | movementMagnitude | metricT00Ref | metricT00Source | dominantShift | likelySubsystemImplication | reason |
|---|---|---|---:|---|---|---|---|---|
| nhm2_without_hull_coupling | available | toward_flat_or_degenerate | 0.05242879476895257 | warp.metric.T00.natario.shift | metric | Ablation collapses part of the current morphology toward flat/degenerate output. | The ablated subsystem carries a substantial portion of the current morphology amplitude. | Derived from the live NHM2 brick request by deterministic selector overrides. |
| nhm2_without_casimir_drive | available | toward_flat_or_degenerate | 0.052527516457954504 | warp.metric.T00.natario_sdf.shift | metric | Ablation collapses part of the current morphology toward flat/degenerate output. | Casimir drive materially supports the current morphology amplitude. | Derived from the live NHM2 brick request by deterministic selector overrides. |
| nhm2_simplified_source | available | toward_flat_or_degenerate | 0.0523175188002839 | warp.metric.T00.irrotational.shift | metric | Ablation collapses part of the current morphology toward flat/degenerate output. | The ablated subsystem carries a substantial portion of the current morphology amplitude. | Derived from the live NHM2 brick request by deterministic selector overrides. |
| nhm2_support_mask_off | unavailable | unavailable | null | null | null | Unavailable in the current repo. | Support-mask behavior remains display-only and should not be treated as a solve-side morphology driver. | Support-mask toggles exist only as display overlays in the current pipeline; they are not a distinct NHM2 solve/source ablation surface. |

## Notes
- calibration_verdict=canonical_controls_validated_nhm2_natario_like
- control_validation_status=validated
- implemented_ablations=nhm2_without_hull_coupling,nhm2_without_casimir_drive,nhm2_simplified_source
- still_unavailable=nhm2_support_mask_off
- Canonical controls validate the current Lane A render contract before any NHM2-local blame assignment.
- Visual metrics in this ablation panel are computed from the corrected pre-PNG color buffer under the shared fixed-scale policy.

