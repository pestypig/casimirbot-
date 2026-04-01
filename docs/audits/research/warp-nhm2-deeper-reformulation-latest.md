# NHM2 Deeper Reformulation (2026-04-01)

"This deeper NHM2 reformulation panel tests whether model-form changes beyond local source/coupling redesign can move the current Lane A morphology away from the Natario-like low-expansion class under the canonical render contract."

## Comparison Contract
| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| exportDirectory | artifacts/research/full-solve/rendered-york-reformulation-panel-2026-04-01 |

## Reformulation Verdict
| field | value |
|---|---|
| reformulationVerdict | deeper_reformulation_still_natario_locked |
| authoritativeMorphologyChangeObserved | yes |
| bestReformulationVariant | nhm2_reform_fore_aft_antisymmetric_driver |
| alcubierreLikeTransitionObserved | no |
| strongestMorphologyShift | nhm2_reform_fore_aft_antisymmetric_driver / toward_flat_or_degenerate / 0.05361541554114735 |
| recommendedNextAction | The current NHM2 family still appears Natario-locked even under deeper realized reformulations; the next step is a broader model reformulation rather than more local selector work. |

## Reformulation Comparisons
| reformulation_id | authoritativeMorphologyChanged | reformulationRealizationStatus | dropStage | movementBasis | movementClass | movementMagnitude | hypothesis | metricT00Ref | sourceReformulationMode | distance_to_nhm2 | distance_to_natario | distance_to_alcubierre | distance_to_flat | realizationNote | dominantShift | likelySubsystemImplication |
|---|---|---|---|---|---|---:|---|---|---|---:|---:|---:|---:|---|---|---|
| nhm2_reform_volume_driven_signed_source | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.0504662004210793 | A volume-distributed signed source may break the current shell-dominant morphology lock and allow stronger signed longitudinal structure. | warp.metric.T00.natario_sdf.shift | volume_driven_signed_source | 0.18161030114557614 | 0.1794451752577296 | 0.316295609940044 | 0.589045963310577 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Reformulation family collapses part of the current morphology toward flat or degenerate output. | This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure. |
| nhm2_reform_fore_aft_antisymmetric_driver | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05361541554114735 | A model-form antisymmetric fore/aft driver may produce stronger signed lobe separation than the current coupled shell family can support. | warp.metric.T00.natario_sdf.shift | fore_aft_antisymmetric_driver | 0.18585090098300858 | 0.18694969313160295 | 0.31382468633147287 | 0.585896748190509 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Reformulation family collapses part of the current morphology toward flat or degenerate output. | This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure. |
| nhm2_reform_geometry_source_decoupling | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05282878757854659 | More explicit geometry-source decoupling may reveal whether the current morphology lock is caused by the present shell-coupled source assembly. | warp.metric.T00.natario_sdf.shift | geometry_source_decoupling | 0.06601779516473857 | 0.06881459151314503 | 0.18352229924304317 | 0.5866833761531097 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Reformulation family collapses part of the current morphology toward flat or degenerate output. | This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure. |
| nhm2_reform_shell_to_dual_layer_family | true | realized_in_lane_a | null | authoritative_lane_pairwise_metric | toward_flat_or_degenerate | 0.05278574207744535 | Replacing the single-shell dominant family with a dual-layer signed support family may uncover a boundary between the current Natario-like regime and a stronger signed-lobe class. | warp.metric.T00.natario_sdf.shift | shell_to_dual_layer_family | 0.13694250475124872 | 0.13856247251822287 | 0.2652249467134443 | 0.586726421654211 | This redesign mode changes the authoritative Lane A render contract and can be used in morphology ranking. | Reformulation family collapses part of the current morphology toward flat or degenerate output. | This model-form change is too destructive in its current form and removes morphology amplitude faster than it creates signed-lobe structure. |

## Notes
- calibration_verdict=canonical_controls_validated_nhm2_natario_like
- source_coupling_redesign_verdict=source_coupling_redesign_still_natario_locked
- visual_metric_source_stage=pre_png_color_buffer
- authoritative_morphology_change_observed=yes
- Chronology: canonical controls validated first, then bounded tuning, then realized local redesigns, then this deeper reformulation pass.
- Reformulation comparisons use the corrected pre-PNG color buffer metric source stage under the shared fixed-scale policy.

