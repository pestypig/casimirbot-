# NHM2 Curvature Invariant Visualization (2026-04-24)

"This artifact adds a Rodal-inspired NHM2 curvature-invariant inspection suite in repo-native hull/body-fixed 3+1 frames while keeping Lane A diagnostics as the authoritative proof surface."

## Summary
| field | value |
|---|---|
| caseId | nhm2_certified |
| suiteStatus | available |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| laneId | lane_a_eulerian_comoving_theta_minus_trk |
| framePresetId | rodal_natario_secondary_v1 |
| signConvention | ADM-compatible 4D curvature invariants on the comoving Cartesian snapshot; secondary scientific presentation only |
| invariantCrosscheckStatus | unpopulated |
| momentumDensityStatus | deferred_not_yet_first_class |

## Style Reference Policy
- presetId: rodal_natario_secondary_v1
- inspiration: Jose Rodal (2024) invariant visual language
- usagePolicy: Use Rodal only as visualization/style inspiration. Do not relabel repo proof surfaces, do not imply literature authority, and do not clone spherical chart conventions.
- repo-native frame = comoving Cartesian 3+1 with hull/body-fixed slice conventions
- current suite is solve-backed secondary presentation, not a certified invariant proof lane

## Field Summaries
| fieldId | label | brickNative | solveBackedSecondary | crosscheckOnly | displayNormalization | displayPolicyId | displayTransform | colormapFamily | mainRender | volumetricCompanion | xzSliceCompanion | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kretschmann | Kretschmann scalar | true | true | false | case_local_robust_scale_no_cross_case_matched_vertical_scale | optix_kretschmann_positive_log10 | positive_log10 | sequential_inferno | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-kretschmann-optix-3p1-main.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-kretschmann-volumetric_companion.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-kretschmann-xz_slice_companion.png | brick-native invariant channel; secondary scientific presentation only; includes a solve-backed volumetric companion alongside the x-z slice companion; not a morphology verdict surface; not a Rodal-spherical coordinate clone; display normalization uses a per-case robust range without cross-case matched vertical scale; field semantics follow the brick-native export contract |
| ricci4 | Ricci scalar (4D) | true | true | false | case_local_robust_scale_no_cross_case_matched_vertical_scale | optix_ricci4_signed_asinh | signed_asinh | diverging_teal_rose | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-ricci4-optix-3p1-main.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci4-volumetric_companion.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci4-xz_slice_companion.png | brick-native invariant channel; secondary scientific presentation only; includes a solve-backed volumetric companion alongside the x-z slice companion; not a morphology verdict surface; not a Rodal-spherical coordinate clone; display normalization uses a per-case robust range without cross-case matched vertical scale; field semantics follow the brick-native export contract |
| ricci2 | Ricci contraction | true | true | false | case_local_robust_scale_no_cross_case_matched_vertical_scale | optix_ricci2_signed_asinh | signed_asinh | diverging_teal_rose | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-ricci2-optix-3p1-main.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci2-volumetric_companion.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci2-xz_slice_companion.png | brick-native invariant channel; secondary scientific presentation only; includes a solve-backed volumetric companion alongside the x-z slice companion; not a morphology verdict surface; not a Rodal-spherical coordinate clone; display normalization uses a per-case robust range without cross-case matched vertical scale; ricci2 preserves sign because the Lorentzian contraction is not assumed nonnegative in the repo contract |
| weylI | Weyl contraction | true | true | false | case_local_robust_scale_no_cross_case_matched_vertical_scale | optix_weylI_signed_asinh | signed_asinh | diverging_teal_rose | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-weylI-optix-3p1-main.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-weylI-volumetric_companion.png | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-weylI-xz_slice_companion.png | brick-native invariant channel; secondary scientific presentation only; includes a solve-backed volumetric companion alongside the x-z slice companion; not a morphology verdict surface; not a Rodal-spherical coordinate clone; display normalization uses a per-case robust range without cross-case matched vertical scale; field semantics follow the brick-native export contract |

## Render Entries
| fieldId | framePresetId | variant | renderCategory | renderRole | authoritativeStatus | baseImagePolicy | baseImageSource | inheritsTransportContext | contextCompositionMode | displayPolicyId | displayTransform | imagePath | imageHash |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| kretschmann | rodal_natario_secondary_v1 | volumetric_companion | scientific_3p1_field | presentation | secondary_solve_backed | neutral_field_canvas | none | false | hull_overlay | optix_kretschmann_positive_log10 | positive_log10 | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-kretschmann-optix-3p1-hull-overlay.png | 85842e7163813b8863f7f9835dffe68aea7d6e392774ed88c8da99785eb7dea8 |
| kretschmann | rodal_natario_secondary_v1 | xz_slice_companion | scientific_3p1_field | presentation | secondary_solve_backed | field_plus_context_overlay | hull_mask | false | hull_overlay | optix_kretschmann_positive_log10 | positive_log10 | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-kretschmann-xz_slice_companion.png | 2a664e3db7da779bfb609baa5df002d256ec3238ef93794126547edfa0b247eb |
| ricci4 | rodal_natario_secondary_v1 | volumetric_companion | scientific_3p1_field | presentation | secondary_solve_backed | neutral_field_canvas | none | false | hull_overlay | optix_ricci4_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-ricci4-optix-3p1-hull-overlay.png | e3f3b04cc22d683d73f6cc2a8f01d9c85069ddc876fc714804b2d78dd1cc2bc4 |
| ricci4 | rodal_natario_secondary_v1 | xz_slice_companion | scientific_3p1_field | presentation | secondary_solve_backed | field_plus_context_overlay | hull_mask | false | hull_overlay | optix_ricci4_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci4-xz_slice_companion.png | e02af539a51aec8d0d53c65b5550ba41574d393e259241209a6799b554bd888e |
| ricci2 | rodal_natario_secondary_v1 | volumetric_companion | scientific_3p1_field | presentation | secondary_solve_backed | neutral_field_canvas | none | false | hull_overlay | optix_ricci2_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-ricci2-optix-3p1-hull-overlay.png | 8def0f9f86c20249c9c43eba0dccb565e44545322da8859f49ff86f856e6a7d6 |
| ricci2 | rodal_natario_secondary_v1 | xz_slice_companion | scientific_3p1_field | presentation | secondary_solve_backed | field_plus_context_overlay | hull_mask | false | hull_overlay | optix_ricci2_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-ricci2-xz_slice_companion.png | afcc41ca65d75b2acdf408d074b6d30a22c09dcc2e90c67e6cdbbf23bf5ed67c |
| weylI | rodal_natario_secondary_v1 | volumetric_companion | scientific_3p1_field | presentation | secondary_solve_backed | neutral_field_canvas | none | false | hull_overlay | optix_weylI_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered-york-optix-panel-2026-04-24/nhm2_certified-weylI-optix-3p1-hull-overlay.png | 8def0f9f86c20249c9c43eba0dccb565e44545322da8859f49ff86f856e6a7d6 |
| weylI | rodal_natario_secondary_v1 | xz_slice_companion | scientific_3p1_field | presentation | secondary_solve_backed | field_plus_context_overlay | hull_mask | false | hull_overlay | optix_weylI_signed_asinh | signed_asinh | artifacts/research/full-solve/rendered/scientific_3p1_field/2026-04-24/nhm2_certified-scientific_3p1_field-weylI-xz_slice_companion.png | afcc41ca65d75b2acdf408d074b6d30a22c09dcc2e90c67e6cdbbf23bf5ed67c |

## Notes
- diagnostic_lane_a_remains_primary=true
- curvature_invariant_suite_secondary_scientific=true
- main invariant renders stay solve-backed and secondary to Lane A diagnostics
- volumetric companions reuse solve-backed OptiX transport-3p1 views as secondary scientific context
- x-z slice companions use explicit hull/support overlays instead of transport-context inheritance
- invariant_crosscheck remains empty until explicit comparison or residual products are added
- brick channels Sx,Sy,Sz exist but momentum-density render families are deferred pending a clean display policy and first-class taxonomy contract

