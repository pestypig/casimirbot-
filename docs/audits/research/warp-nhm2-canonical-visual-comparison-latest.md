# NHM2 Canonical Visual Comparison (2026-04-01)

"This final comparison pack combines the authoritative Lane A diagnostic contract with the readable solve-backed OptiX 3+1 presentation layer so NHM2, Natario, and Alcubierre can be compared without changing the proof basis."

## Summary
| field | value |
|---|---|
| finalComparisonVerdict | canonical_controls_validated_nhm2_natario_like |
| diagnosticVerdict | shared_scale_preserves_natario_like_class |
| presentationVerdict | presentation_layer_ready_and_consistent |
| nhm2ClosestCanonicalFamily | natario_like_low_expansion |
| alcubierreLikeTransitionObserved | no |
| recommendedNextAction | If a different morphology is still desired, continue model-family work rather than render debugging. |
| overviewPanelPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01/nhm2-canonical-comparison-overview.png |
| exportDirectory | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01 |

## Basis
| layer | status | basis | use |
|---|---|---|---|
| authoritative diagnostic layer | primary | Lane A fixed-scale slices + pre-PNG color-buffer metrics | morphology class decisions |
| presentation layer | secondary | solve-backed OptiX 3+1 renders bound to the same metric volume path | human-facing morphology inspection |

| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| signConvention | ADM |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| presentationRenderLayerStatus | available |
| fieldSuiteRealizationStatus | realized |
| fieldSuiteReadabilityStatus | readable |
| presentationRenderQuality | ok |
| presentationReadinessVerdict | ready_for_human_inspection |
| presentationRenderBackedByAuthoritativeMetric | true |

## Render Taxonomy
| field | value |
|---|---|
| authoritativeRenderCategory | diagnostic_lane_a |
| presentationRenderCategory | scientific_3p1_field |
| comparisonRenderCategory | comparison_panel |
| repoOrientationConvention | x_ship_y_port_z_zenith |
| canonicalRenderRoot | artifacts/research/full-solve/rendered |
| artifactPath | artifacts/research/full-solve/render-taxonomy-latest.json |
| reportPath | docs/audits/research/warp-render-taxonomy-latest.md |
| standardPath | docs/research/render-taxonomy-and-labeling-standard-2026-04-01.md |

## Flat-space zero-theta baseline

### Diagnostic Layer
| field | value |
|---|---|
| authoritative | true |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| primaryViewId | york-surface-3p1 |
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-01/flat_space_zero_theta-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 6a0e1da23a1b4eeab3dcd08897a86bd41c5766420ab485ba31d19b51f910f2f4 |
| morphologyClass | flat_zero_reference |

Flat space remains the zero-theta reference and anchors both the diagnostic and presentation layers against a known near-zero baseline.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| natario_control | 0.7765797642253518 | 0.014275268008031746 | 0.00037802080949111164 | 0.0109375 | 3.0000285034962945e-32 | pre_png_color_buffer |
| alcubierre_control | 0.7764518019567034 | 0.013247999281701723 | 0.00035038467217121753 | 0.011493055555555555 | 2.7487295579359796e-32 | pre_png_color_buffer |
| nhm2_certified | 0.7764875062193409 | 0.013951578948218416 | 0.0003690269053290721 | 0.0109375 | 2.9210517400419483e-32 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | readable |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01/flat_space_zero_theta-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/flat_space_zero_theta-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status readable. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk and remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -9.341594831267178e-34 | 3.8518660601198135e-32 | 3.8518660601198135e-32 | optix_longitudinal_signed_strain_signed_asinh | -1.3481531210419346e-32 | 1.3481531210419346e-32 | signed_asinh | diverging_cyan_amber | none |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | 0 | 3.4970749780882613e-66 | 3.4970749780882613e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 1.3988299912353045e-66 | positive_log10 | sequential_inferno | none |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -2.7660397775435932e-33 | 0 | 2.7660397775435932e-33 | optix_energy_density_signed_asinh | -2.7660397775435932e-33 | 2.7660397775435932e-33 | signed_asinh | diverging_teal_rose | none |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/flat_space_zero_theta-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -1.1480880526811711e-31 | 1.0439332067492494e-33 | 1.1480880526811711e-31 | optix_trace_check_signed_linear_anchor | -1.1480880526811711e-31 | 1.1480880526811711e-31 | signed_linear | diverging_cyan_amber | none |

### Morphology Interpretation
- trace_check: Trace check stays near the zero baseline and serves as the control reference for the other cases.
- longitudinal_signed_strain: Longitudinal signed strain stays near the flat reference with no meaningful ship-axis deformation pattern.
- tracefree_magnitude: Tracefree magnitude remains effectively a baseline support map and does not introduce a non-flat morphology signal.
- energy_density: Energy density remains the baseline reference rather than a warp-family morphology driver.
- comparativeNote: Use the flat baseline only as a zero reference. The family decision comes from how NHM2 separates from Natario and Alcubierre above this baseline.

## Natario-like control

### Diagnostic Layer
| field | value |
|---|---|
| authoritative | true |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| primaryViewId | york-surface-3p1 |
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-01/natario_control-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 91b4ad9eab88e4b1d4a33b3ca3a3576cd65a25d95f0fd4016789a6b026a7f778 |
| morphologyClass | natario_like_low_expansion_control |

Natario remains the calibrated low-expansion control family. Its diagnostic separation from Alcubierre stays materially larger than the NHM2-to-Natario gap.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7765797642253518 | 0.014275268008031746 | 0.00037802080949111164 | 0.0109375 | 3.0000285034962945e-32 | pre_png_color_buffer |
| alcubierre_control | 0.1368366108420511 | 0.0010276397123231476 | 0.00002765591753346388 | 0.011006944444444444 | 2.5129894556031486e-33 | pre_png_color_buffer |
| nhm2_certified | 0.0012469161139296696 | 0.0003245026921436903 | 0.00000899390416203951 | 0.008628472222222221 | 7.89767634543462e-34 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | readable |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01/natario_control-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/natario_control-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status readable. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk and remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -9.341594831267178e-34 | 3.851865766246226e-32 | 3.851865766246226e-32 | optix_longitudinal_signed_strain_signed_asinh | -1.348153018186179e-32 | 1.348153018186179e-32 | signed_asinh | diverging_cyan_amber | none |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | 0 | 3.497074978088269e-66 | 3.497074978088269e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 1.3988299912353076e-66 | positive_log10 | sequential_inferno | none |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -2.7660399612145856e-33 | 0 | 2.7660399612145856e-33 | optix_energy_density_signed_asinh | -2.7660399612145856e-33 | 2.7660399612145856e-33 | signed_asinh | diverging_teal_rose | none |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/natario_control-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -1.148087935131736e-31 | 1.0439332067492494e-33 | 1.148087935131736e-31 | optix_trace_check_signed_linear_anchor | -1.148087935131736e-31 | 1.148087935131736e-31 | signed_linear | diverging_cyan_amber | none |

### Morphology Interpretation
- trace_check: Trace check remains low-expansion and near-zero dominant, which is consistent with the current Natario-like control class.
- longitudinal_signed_strain: Longitudinal signed strain carries the main visible deformation pattern without producing an Alcubierre-style fore/aft signed lobe split.
- tracefree_magnitude: Tracefree magnitude localizes deformation while staying in a low-expansion presentation family.
- energy_density: Energy density stays localized on the same solved support family and provides context rather than a separate class decision.
- comparativeNote: Natario provides the closest canonical visual family for NHM2 in both the authoritative metrics and the readable OptiX field suite.

## Alcubierre-like control

### Diagnostic Layer
| field | value |
|---|---|
| authoritative | true |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| primaryViewId | york-surface-3p1 |
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-01/alcubierre_control-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 7c2db767855954020f8a08b3b49bf113fa8ef043fa4db4b1b7b45b57a90a43ba |
| morphologyClass | alcubierre_like_signed_lobe_control |

Alcubierre remains the signed-lobe control comparator. Against the same Lane A contract, NHM2 stays materially farther from Alcubierre than from Natario.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7764518019567034 | 0.013247999281701723 | 0.00035038467217121753 | 0.011493055555555555 | 2.7487295579359796e-32 | pre_png_color_buffer |
| natario_control | 0.1368366108420511 | 0.0010276397123231476 | 0.00002765591753346388 | 0.011006944444444444 | 2.5129894556031486e-33 | pre_png_color_buffer |
| nhm2_certified | 0.13559288214795065 | 0.0007036011734714586 | 0.000018693803000375824 | 0.010642361111111111 | 1.7232218210596865e-33 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | readable |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01/alcubierre_control-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/alcubierre_control-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status readable. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk and remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -1.0319540927949049e-33 | 4.251882967347998e-32 | 4.251882967347998e-32 | optix_longitudinal_signed_strain_signed_asinh | -1.4881590385717992e-32 | 1.4881590385717992e-32 | signed_asinh | diverging_cyan_amber | none |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | 0 | 4.259473549839161e-66 | 4.259473549839161e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 1.7037894199356644e-66 | positive_log10 | sequential_inferno | none |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -3.0532934953441125e-33 | 0 | 3.0532934953441125e-33 | optix_energy_density_signed_asinh | -3.0366958025556197e-33 | 3.0366958025556197e-33 | signed_asinh | diverging_teal_rose | none |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/alcubierre_control-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -1.2673171516412898e-31 | 1.1523435405958195e-33 | 1.2673171516412898e-31 | optix_trace_check_signed_linear_anchor | -1.2673171516412898e-31 | 1.2673171516412898e-31 | signed_linear | diverging_cyan_amber | none |

### Morphology Interpretation
- trace_check: Trace check remains the clearest signed-lobe comparator and anchors what the repo treats as Alcubierre-like morphology under the current contract.
- longitudinal_signed_strain: Longitudinal signed strain presents a stronger signed split than the NHM2/Natario pair and remains the canonical Alcubierre-side visual comparator.
- tracefree_magnitude: Tracefree magnitude is localized, but the decisive separation from NHM2 still comes from the signed-lobe behavior rather than the magnitude channel alone.
- energy_density: Energy density stays solve-backed and readable, but it remains secondary to the signed-lobe diagnostic difference.
- comparativeNote: Alcubierre remains the canonical outlier for NHM2. The presentation layer now makes that gap easier to inspect, but the class verdict still comes from Lane A diagnostics.

## NHM2 certified snapshot

### Diagnostic Layer
| field | value |
|---|---|
| authoritative | true |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| primaryViewId | york-surface-3p1 |
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-01/nhm2_certified-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 4af638fbdb87bf787012f9353670bfcec67540fc21696e2598f5518614e45f5e |
| morphologyClass | natario_like_low_expansion |

Under the authoritative Lane A contract, NHM2 remains closer to Natario than Alcubierre. Raw-control distance is 0.0012469161139296696 to Natario versus 0.13559288214795065 to Alcubierre, and shared-scale pixel RMS is 0.0003245026921436903 versus 0.0007036011734714586.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7764875062193409 | 0.013951578948218416 | 0.0003690269053290721 | 0.0109375 | 2.9210517400419483e-32 | pre_png_color_buffer |
| natario_control | 0.0012469161139296696 | 0.0003245026921436903 | 0.00000899390416203951 | 0.008628472222222221 | 7.89767634543462e-34 | pre_png_color_buffer |
| alcubierre_control | 0.13559288214795065 | 0.0007036011734714586 | 0.000018693803000375824 | 0.010642361111111111 | 1.7232218210596865e-33 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | readable |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01/nhm2_certified-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_certified-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status readable. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk and remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -9.782329907718686e-34 | 4.034941076799929e-32 | 4.034941076799929e-32 | optix_longitudinal_signed_strain_signed_asinh | -1.412229376879975e-32 | 1.412229376879975e-32 | signed_asinh | diverging_cyan_amber | none |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | 0 | 3.8349611119566775e-66 | 3.8349611119566775e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 1.533984444782671e-66 | positive_log10 | sequential_inferno | none |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -2.8975068820685656e-33 | 0 | 2.8975068820685656e-33 | optix_energy_density_signed_asinh | -2.8975068820685656e-33 | 2.8975068820685656e-33 | signed_asinh | diverging_teal_rose | none |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-01/nhm2_certified-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | -1.2026554408418224e-31 | 1.0935473335486042e-33 | 1.2026554408418224e-31 | optix_trace_check_signed_linear_anchor | -1.2026554408418224e-31 | 1.2026554408418224e-31 | signed_linear | diverging_cyan_amber | none |

### Morphology Interpretation
- trace_check: Trace check remains low-amplitude and does not recover the stronger Alcubierre-style signed fore/aft lobe pattern.
- longitudinal_signed_strain: Longitudinal signed strain is the clearest human-facing deformation view for NHM2 and it stays closer to Natario’s low-expansion structure than to Alcubierre’s signed-lobe structure.
- tracefree_magnitude: Tracefree magnitude is live and localized, but it does not reveal an Alcubierre-like transition; it stays in the same low-expansion family as the Natario control.
- energy_density: Energy density remains solve-backed and localized on the same support family that already underwrites the Lane A classification.
- comparativeNote: Taken together, the authoritative metrics and the readable OptiX fields keep NHM2 in the Natario-like low-expansion family rather than the Alcubierre-like signed-lobe family.


## Use Policy
- diagnostic layer is primary
- OptiX layer is secondary presentation
- if presentation and diagnostics disagree, debug presentation first
- current morphology verdict still comes from Lane A diagnostics

## Scope
This is a repo-local comparison pack. The authoritative morphology verdict still comes from Lane A diagnostics; the OptiX suite is secondary presentation only.

