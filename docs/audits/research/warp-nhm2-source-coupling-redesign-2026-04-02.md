# NHM2 Source/Coupling Redesign (2026-04-02)

"This source/coupling redesign panel tests whether modest NHM2 architecture changes can move the current Lane A morphology away from the Natario-like low-expansion class under the canonical render contract."

## Comparison Contract
| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| exportDirectory | artifacts/research/full-solve/rendered-york-redesign-panel-2026-04-02 |

## Redesign Verdict
| field | value |
|---|---|
| redesignVerdict | source_coupling_redesign_still_natario_locked |
| authoritativeMorphologyChangeObserved | yes |
| bestRedesignVariant | nhm2_redesign_source_profile_simplified_signed |
| alcubierreLikeTransitionObserved | no |
| strongestMorphologyShift | nhm2_redesign_source_profile_simplified_signed / toward_flat_or_degenerate / 0.05290445819067069 |
| recommendedNextAction | Modest source/coupling redesign remains Natario-locked; prioritize deeper NHM2 model reformulation over additional local tuning. |

## Redesign Comparisons
| redesign_id | authoritativeMorphologyChanged | redesignRealizationStatus | dropStage | movementBasis | movementClass | movementMagnitude | hypothesis | metricT00Ref | sourceRedesignMode | distance_to_nhm2 | distance_to_natario | distance_to_alcubierre | distance_to_flat | realizationNote | dominantShift | likelySubsystemImplication |
|---|---|---|---|---|---:|---|---|---|---:|---:|---:|---:|---|---|
| nhm2_redesign_signed_shell_bias | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05280801787906442 | A stronger signed fore/aft shell bias may unlock Alcubierre-like signed lobes that the current NHM2 shell family suppresses. | warp.metric.T00.natario_sdf.shift | signed_shell_bias | 0.0696870822787833 | 0.07316987743271718 | 0.18998069622649394 | 0.5854196772979765 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Redesign variant collapses part of the current morphology toward flat or degenerate output. | This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure. |
| nhm2_redesign_coupling_localization | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05289811345991213 | Tighter shell-localized coupling may reduce the diffuse low-expansion behavior that keeps NHM2 in the current Natario-like class. | warp.metric.T00.natario_sdf.shift | coupling_localization | 0.06594634015005386 | 0.06935022643949931 | 0.18643882072141635 | 0.5853295817171288 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Redesign variant collapses part of the current morphology toward flat or degenerate output. | The localized-coupling redesign is over-constraining the shell and shedding too much morphology amplitude. |
| nhm2_redesign_drive_vs_geometry_split | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.052326497373072156 | Changing the structural mix between geometry-normal coupling and drive-direction coupling may create a more signed longitudinal lobe pattern. | warp.metric.T00.natario_sdf.shift | drive_vs_geometry_split | 0.060047224901065316 | 0.05780579164721397 | 0.18975651166909996 | 0.5859011978039688 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Redesign variant collapses part of the current morphology toward flat or degenerate output. | This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure. |
| nhm2_redesign_source_profile_simplified_signed | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05290445819067069 | A simpler signed diagnostic shell profile can test whether higher-order NHM2 shaping is what keeps the baseline morphology Natario-like. | warp.metric.T00.natario_sdf.shift | source_profile_simplified_signed | 0.06617607395484142 | 0.06957407943725949 | 0.1866825591551997 | 0.5853232369863702 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Redesign variant collapses part of the current morphology toward flat or degenerate output. | This redesign direction is structurally too destructive and is removing morphology amplitude faster than it creates signed-lobe structure. |

## Notes
- calibration_verdict=canonical_controls_validated_nhm2_natario_like
- ablation_decision=no_single_ablation_explains_morphology
- parameter_sweep_verdict=alcubierre_like_not_found
- visual_metric_source_stage=pre_png_color_buffer
- authoritative_morphology_change_observed=yes
- Chronology: canonical controls validated first, then NHM2 ablations, then bounded selector sweep, then this source/coupling redesign pass.
- Redesign comparisons use the corrected pre-PNG color buffer metric source stage under the shared fixed-scale policy.

