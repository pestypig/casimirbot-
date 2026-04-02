# NHM2 Canonical Visual Comparison (2026-04-02)

"This final comparison pack combines the authoritative Lane A diagnostic contract with the readable solve-backed OptiX 3+1 presentation layer so NHM2, Natario, and Alcubierre can be compared without changing the proof basis."

## Summary
| field | value |
|---|---|
| finalComparisonVerdict | canonical_controls_validated_nhm2_natario_like |
| diagnosticVerdict | shared_scale_preserves_natario_like_class |
| presentationVerdict | presentation_layer_has_advisories |
| nhm2ClosestCanonicalFamily | natario_like_low_expansion |
| alcubierreLikeTransitionObserved | no |
| recommendedNextAction | Resolve remaining presentation issues before relying on the OptiX layer for human-facing comparison. |
| overviewPanelPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02/nhm2-canonical-comparison-overview.png |
| exportDirectory | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02 |

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
| fieldSuiteReadabilityStatus | flat |
| presentationRenderQuality | warning |
| presentationReadinessVerdict | field_realized_but_presentation_flat |
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
| standardPath | docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md |

## Flat-space zero-theta baseline

### Diagnostic Layer
| field | value |
|---|---|
| authoritative | true |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| primaryViewId | york-surface-3p1 |
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | e07726206a29855a25c3295f9f19c61dc26b7e011de7340e6b80d9f9b085f508 |
| morphologyClass | flat_zero_reference |

Flat space remains the zero-theta reference and anchors both the diagnostic and presentation layers against a known near-zero baseline.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| natario_control | 0.7762967054031266 | 0.013643014670862109 | 0.0003532685986107226 | 0.011008029513888889 | 1.9446711446959833e-32 | pre_png_color_buffer |
| alcubierre_control | 0.7761387753726 | 0.012660367682187966 | 0.00032734009419267056 | 0.011496310763888889 | 1.7817745171052893e-32 | pre_png_color_buffer |
| nhm2_certified | 0.7761954920053937 | 0.013332913240758542 | 0.0003447801274728799 | 0.011008029513888889 | 1.8934768963497341e-32 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | flat |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02/flat_space_zero_theta-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-02/flat_space_zero_theta-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status flat. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk, use a dedicated neutral field canvas, and keep transport-context inheritance absent. They remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | baseImagePolicy | baseImageSource | inheritsTransportContext | contextCompositionMode | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| beta_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-beta_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 3.350494510452571e-33 | 3.350494510452571e-33 | optix_beta_magnitude_positive_log10 | 0 | 2.3836738909476263e-33 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| beta_x | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-beta_x-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -5.756061095593246e-34 | 5.756061095593246e-34 | 5.756061095593246e-34 | optix_beta_x_signed_asinh | -5.756061095593246e-34 | 5.756061095593246e-34 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.055384660818314e-34 | 2.4968469794304815e-32 | 2.4968469794304815e-32 | optix_longitudinal_signed_strain_signed_asinh | -8.738964428006685e-33 | 8.738964428006685e-33 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 1.4694217249909488e-66 | 1.4694217249909488e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 5.8776868999637955e-67 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -1.792995492304651e-33 | 0 | 1.792995492304651e-33 | optix_energy_density_signed_asinh | -1.792995492304651e-33 | 1.792995492304651e-33 | signed_asinh | diverging_teal_rose | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/flat_space_zero_theta-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -7.442107044554514e-32 | 6.766958227474085e-34 | 7.442107044554514e-32 | optix_trace_check_signed_linear_anchor | -7.442107044554514e-32 | 7.442107044554514e-32 | signed_linear | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |

### Morphology Interpretation
- beta_magnitude: Shift magnitude stays near the zero baseline and does not produce a localized transport shell.
- beta_x: Ship-axis shift stays near zero and serves as the transport baseline for the canonical controls.
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
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_control-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 92086c6e5c98a9f189829bad2cf7a4f463a6dfb2392f866ff0f29f269518d811 |
| morphologyClass | natario_like_low_expansion_control |

Natario remains the calibrated low-expansion control family. Its diagnostic separation from Alcubierre stays materially larger than the NHM2-to-Natario gap.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7762967054031266 | 0.013643014670862109 | 0.0003532685986107226 | 0.011008029513888889 | 1.9446711446959833e-32 | pre_png_color_buffer |
| alcubierre_control | 0.1275099245102431 | 0.0009830737323783462 | 0.000025944730374495958 | 0.011008029513888889 | 1.62896627590694e-33 | pre_png_color_buffer |
| nhm2_certified | 0.0020422635435102315 | 0.0003110357906100846 | 0.000008488471137842656 | 0.008501519097222222 | 5.119424834624915e-34 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | flat |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02/natario_control-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-02/natario_control-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status flat. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk, use a dedicated neutral field canvas, and keep transport-context inheritance absent. They remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | baseImagePolicy | baseImageSource | inheritsTransportContext | contextCompositionMode | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| beta_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-beta_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 3.350494510452571e-33 | 3.350494510452571e-33 | optix_beta_magnitude_positive_log10 | 0 | 2.3836738909476263e-33 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| beta_x | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-beta_x-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -5.756061095593246e-34 | 5.756061095593246e-34 | 5.756061095593246e-34 | optix_beta_x_signed_asinh | -5.756061095593246e-34 | 5.756061095593246e-34 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.055384660818314e-34 | 2.4968469794304815e-32 | 2.4968469794304815e-32 | optix_longitudinal_signed_strain_signed_asinh | -8.738964428006685e-33 | 8.738964428006685e-33 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 1.4694217249909488e-66 | 1.4694217249909488e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 5.8776868999637955e-67 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -1.792995492304651e-33 | 0 | 1.792995492304651e-33 | optix_energy_density_signed_asinh | -1.792995492304651e-33 | 1.792995492304651e-33 | signed_asinh | diverging_teal_rose | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/natario_control-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -7.442107044554514e-32 | 6.766958227474085e-34 | 7.442107044554514e-32 | optix_trace_check_signed_linear_anchor | -7.442107044554514e-32 | 7.442107044554514e-32 | signed_linear | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |

### Morphology Interpretation
- beta_magnitude: Shift magnitude localizes on the transport-support shell without producing the stronger Alcubierre-side transport split.
- beta_x: Ship-axis shift shows the sliding transport organization expected for the calibrated Natario-like low-expansion control.
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
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/alcubierre_control-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | 33dbf0dbf62b3a3b7983934cdfb0d371b73d462d1990b25201ddbdc634e4e0e1 |
| morphologyClass | alcubierre_like_signed_lobe_control |

Alcubierre remains the signed-lobe control comparator. Against the same Lane A contract, NHM2 stays materially farther from Alcubierre than from Natario.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7761387753726 | 0.012660367682187966 | 0.00032734009419267056 | 0.011496310763888889 | 1.7817745171052893e-32 | pre_png_color_buffer |
| natario_control | 0.1275099245102431 | 0.0009830737323783462 | 0.000025944730374495958 | 0.011008029513888889 | 1.62896627590694e-33 | pre_png_color_buffer |
| nhm2_certified | 0.12547084479018483 | 0.0006725696250388191 | 0.00001748159159722399 | 0.010519748263888889 | 1.1170237924444484e-33 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | flat |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02/alcubierre_control-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-02/alcubierre_control-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status flat. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk, use a dedicated neutral field canvas, and keep transport-context inheritance absent. They remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | baseImagePolicy | baseImageSource | inheritsTransportContext | contextCompositionMode | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| beta_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-beta_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 3.6984436228326073e-33 | 3.6984436228326073e-33 | optix_beta_magnitude_positive_log10 | 0 | 2.4236006407337986e-33 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| beta_x | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-beta_x-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.353828901167669e-34 | 6.353828901167669e-34 | 6.353828901167669e-34 | optix_beta_x_signed_asinh | -6.353828901167669e-34 | 6.353828901167669e-34 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.6893071828751764e-34 | 2.7561448701745543e-32 | 2.7561448701745543e-32 | optix_longitudinal_signed_strain_signed_asinh | -9.64650704561094e-33 | 9.64650704561094e-33 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 1.789770759963932e-66 | 1.789770759963932e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 7.159083039855728e-67 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -1.979198205578717e-33 | 0 | 1.979198205578717e-33 | optix_energy_density_signed_asinh | -1.979198205578717e-33 | 1.979198205578717e-33 | signed_asinh | diverging_teal_rose | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/alcubierre_control-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -8.214971070333151e-32 | 7.46969262762465e-34 | 8.214971070333151e-32 | optix_trace_check_signed_linear_anchor | -8.214971070333151e-32 | 8.214971070333151e-32 | signed_linear | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |

### Morphology Interpretation
- beta_magnitude: Shift magnitude remains solve-backed and readable, but the more important separation still comes from the signed transport structure.
- beta_x: Ship-axis shift presents the strongest canonical signed transport split and remains the clearest Alcubierre-side comparator.
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
| primaryViewPath | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_certified-york-surface-3p1-fixed-global-raw.png |
| primaryViewHash | a229f6aef31103fb841537d9e8240f2a5c9f72a56fc1834849cd4a61d809e669 |
| morphologyClass | natario_like_low_expansion |

Under the authoritative Lane A contract, NHM2 remains closer to Natario than Alcubierre. Raw-control distance is 0.0020422635435102315 to Natario versus 0.12547084479018483 to Alcubierre, and shared-scale pixel RMS is 0.0003110357906100846 versus 0.0006725696250388191.

| other_case_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage |
|---|---:|---:|---:|---:|---:|---|
| flat_space_zero_theta | 0.7761954920053937 | 0.013332913240758542 | 0.0003447801274728799 | 0.011008029513888889 | 1.8934768963497341e-32 | pre_png_color_buffer |
| natario_control | 0.0020422635435102315 | 0.0003110357906100846 | 0.000008488471137842656 | 0.008501519097222222 | 5.119424834624915e-34 | pre_png_color_buffer |
| alcubierre_control | 0.12547084479018483 | 0.0006725696250388191 | 0.00001748159159722399 | 0.010519748263888889 | 1.1170237924444484e-33 | pre_png_color_buffer |

### Presentation Layer
| field | value |
|---|---|
| secondary | true |
| readabilityStatus | flat |
| laneBinding | lane_a_eulerian_comoving_theta_minus_trk |
| mainRenderPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-york-optix-3p1-main.png |
| hullOverlayPath | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-york-optix-3p1-hull-overlay.png |
| comparisonCardPath | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02/nhm2_certified-comparison-card.png |
| comparisonCardCategory | comparison_panel |
| comparisonCardRole | presentation |
| comparisonCardCanonicalPath | artifacts/research/full-solve/rendered/comparison_panel/2026-04-02/nhm2_certified-comparison_panel-comparison_card-card.png |

Solve-backed OptiX 3+1 presentation is available for this case with readability status flat. Field renders stay bound to lane_a_eulerian_comoving_theta_minus_trk, use a dedicated neutral field canvas, and keep transport-context inheritance absent. They remain secondary to the fixed-scale diagnostic layer.

| presentationFieldId | imagePath | laneId | baseImagePolicy | baseImageSource | inheritsTransportContext | contextCompositionMode | fieldMin | fieldMax | fieldAbsMax | displayPolicyId | displayRangeMin | displayRangeMax | displayTransform | colormapFamily | warnings |
|---|---|---|---|---|---|---|---:|---:|---:|---|---:|---:|---|---|---|
| beta_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-beta_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 3.509740090578672e-33 | 3.509740090578672e-33 | optix_beta_magnitude_positive_log10 | 0 | 2.4231888294519856e-33 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| beta_x | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-beta_x-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.029641334535306e-34 | 6.029641334535306e-34 | 6.029641334535306e-34 | optix_beta_x_signed_asinh | -6.029641334535306e-34 | 6.029641334535306e-34 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| longitudinal_signed_strain | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-longitudinal_signed_strain-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -6.341077542526132e-34 | 2.615519599364921e-32 | 2.615519599364921e-32 | optix_longitudinal_signed_strain_signed_asinh | -9.154318597777223e-33 | 9.154318597777223e-33 | signed_asinh | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| tracefree_magnitude | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-tracefree_magnitude-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | 0 | 1.6113969679115234e-66 | 1.6113969679115234e-66 | optix_tracefree_magnitude_positive_log10 | 0 | 6.445587871646094e-67 | positive_log10 | sequential_inferno | presentation_image_low_non_background_fraction,presentation_image_low_contrast |
| energy_density | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-energy_density-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -1.878214791977436e-33 | 0 | 1.878214791977436e-33 | optix_energy_density_signed_asinh | -1.878214791977436e-33 | 1.878214791977436e-33 | signed_asinh | diverging_teal_rose | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| trace_check | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-02/nhm2_certified-trace_check-optix-3p1-main.png | lane_a_eulerian_comoving_theta_minus_trk | neutral_field_canvas | none | false | none | -7.795823286418922e-32 | 7.088565216664409e-34 | 7.795823286418922e-32 | optix_trace_check_signed_linear_anchor | -7.795823286418922e-32 | 7.795823286418922e-32 | signed_linear | diverging_cyan_amber | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |

### Morphology Interpretation
- beta_magnitude: Shift magnitude is live and shell-localized, but its solved transport pattern remains closer to Natario than to Alcubierre.
- beta_x: Ship-axis shift is now directly visible and still stays closer to Natario's low-expansion transport family than to Alcubierre's stronger signed transport split.
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

