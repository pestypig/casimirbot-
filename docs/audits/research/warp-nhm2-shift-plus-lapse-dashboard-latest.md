# NHM2 Shift-Plus-Lapse Dashboard Companion

- date: 2026-04-01
- dashboardId: nhm2_unit_lapse_vs_mild_shift_plus_lapse_dashboard
- comparisonId: nhm2_unit_lapse_vs_mild_shift_plus_lapse
- scenarioId: mild_cabin_gravity_reference
- dashboardStatus: available
- dashboardLayoutVersion: v2_measured_card_family
- renderedCardFamilyStatus: generated
- primaryRenderedCardId: dashboard_overview
- renderedCardStatus: generated_primary_overview
- renderedCardPath: artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-dashboard_overview-card.png
- renderedCardHash: 758cdfbbe153824e6a946fe98dd03c284443c55ef4ce110bf2a1da10ab2f97e6
- legacyMonolithicCardStatus: deprecated_not_generated
- legacyMonolithicCardPath: artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-diagnostics_dashboard-card.png

## Proof Status

- authoritativeProofSurface: lane_a_eulerian_comoving_theta_minus_trk
- laneAUnchanged: yes
- baselineBranchStatus: unit_lapse_baseline_unchanged
- generalizedBranchStatus: reference_only_mild_shift_plus_lapse
- proofNote: Lane A remains authoritative. The generalized branch is reference-only and this dashboard is presentation/comparison only.

## Cabin Gravity Panel

- panelPurpose: Compare local lapse diagnostics and clock-split observables between the unit-lapse baseline and the mild generalized branch.
- sectionNote: These are local lapse diagnostics. In the mild generalized branch they may use analytic companion reporting under float32 under-resolution.

| row | baseline | generalized | delta | units | baseline source | generalized source | primary badge | mismatch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Centerline Lapse | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | raw_brick | no |
| Lapse Gradient Vector | [0, 0, 0] | [0, 0, 5.456e-17] | [0, 0, +5.456e-17] | 1/m | brick_float32_direct | analytic_lapse_summary_companion | mixed_source | yes |
| Centerline dtau/dt | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | raw_brick | no |
| Cabin Clock Split Per Day | 0 | 1.178e-11 | +1.178e-11 | s/day | brick_float32_direct | analytic_lapse_summary_companion | mixed_source | yes |
| Cabin Gravity Gradient (SI) | 0 | 4.903325 | +4.903325 | m/s^2 | brick_float32_direct | analytic_lapse_summary_companion | mixed_source | yes |

## Wall Safety Panel

- panelPurpose: Compare combined shift/lapse horizon-proxy diagnostics without treating them as comfort metrics.
- sectionNote: Wall safety remains a separate diagnostic family from cabin gravity and stays brick-derived in the current comparison.

| row | baseline | generalized | delta | units | baseline source | generalized source | primary badge | mismatch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bulk |beta|/alpha Max | 0 | 2.209e-17 | +2.209e-17 | dimensionless | brick_float32_direct | brick_float32_direct | wall_safety_brick_derived | no |
| Wall-Normal beta_outward/alpha Max | 0 | 2.209e-17 | +2.209e-17 | dimensionless | brick_float32_direct | brick_float32_direct | wall_safety_brick_derived | no |
| Wall Horizon Margin | 1 | 1 | 0 | dimensionless | brick_float32_direct | brick_float32_direct | wall_safety_brick_derived | no |

## Precision Panel

- panelPurpose: Show how raw-brick and analytic-companion provenance are mixed or aligned across the comparison.
- sectionNote: Read these rows before collapsing the dashboard into any downstream summary. They explain where mild-reference under-resolution is handled analytically and where brick alignment is preserved.

| row | baseline | generalized | delta | units | baseline source | generalized source | primary badge | mismatch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cross-Case Source Mismatch Count | 0 | 5 | +5 | count | comparison_summary | comparison_summary | source_mismatch | no |
| Wall Safety Source Parity | brick_float32_direct | brick_float32_direct | aligned | status | comparison_summary | comparison_summary | wall_safety_brick_derived | no |
| Cabin Gravity Source Policy | brick_float32_direct | mixed_source_prefer_analytic_for_underflow | mixed_source_comparison_explicit | policy | comparison_summary | comparison_summary | mixed_source | yes |
| Baseline Nested Direct-Pipeline Provenance | unresolved_gravity_gradient | analytic_lapse_summary_fallback | normalized | status | comparison_summary | comparison_summary | unresolved | no |

## Rendered Card Family

- the previous single-card overlap/clipping failure was replaced by a measured multi-card family.
- each subject now has a dedicated rendered card with dynamic height, wrapped notes, and wrapped badge rows.
- proof hierarchy remains unchanged and visible on-card.
- provenance badges remain visible on-card rather than being hidden in metadata only.
- no field imagery, transport context, or volumetric render content is used in the card family.

| cardId | title | sectionSource | primary | path | hash |
| --- | --- | --- | --- | --- | --- |
| dashboard_overview | Diagnostics Dashboard Overview | dashboard_summary | yes | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-dashboard_overview-card.png | 758cdfbbe153824e6a946fe98dd03c284443c55ef4ce110bf2a1da10ab2f97e6 |
| proof_status | Proof Status | proof_status_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-proof_status-card.png | 49344fa80908294cb40dd3f7bfdc44883307a84e0b8af58928380ca1d299d452 |
| cabin_gravity | Cabin Gravity | cabin_gravity_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-cabin_gravity-card.png | e43d1a959a6bfc24ab5d7c56ba3e315a4cad625f3b3b3b0061744c5970ca6489 |
| wall_safety | Wall Safety | wall_safety_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-wall_safety-card.png | 1c21c0174f4773c689c0ba95fddb26e26e3e6d7072fb049caa54e287daf14abe |
| precision_provenance | Precision / Provenance | precision_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-precision_provenance-card.png | 1820d021481313642b7bd54767a8e2151c6ed2adfdffa95a8af2f344d0b9ed92 |

## Provenance Warnings

- provenanceWarningCount: 5
- alphaGradientVec_m_inv: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_clock_split_fraction: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_clock_split_per_day_s: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_gravity_gradient_geom: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)
- cabin_gravity_gradient_si: Cross-case comparison mixes raw brick baseline values with analytic-companion mild-reference values. Interpret as conceptually aligned but not identical numeric pipelines. (brick_float32_direct vs analytic_lapse_summary_companion)

## Badge Legend

| badge | label | meaning | priority |
| --- | --- | --- | --- |
| lane_a_unchanged | Lane A unchanged | The authoritative York proof surface remains unchanged and still governs formal comparison. | 1 |
| reference_only | reference_only | The generalized shift-plus-lapse branch remains diagnostic/reference-only and is not promoted to proof status. | 2 |
| raw_brick | raw brick | The displayed value comes directly from the float32 GR evolve brick or a brick-derived summary. | 3 |
| analytic_companion | analytic companion | The displayed value uses the analytic lapse-summary companion because the mild reference under-resolves in float32 brick channels. | 4 |
| mixed_source | mixed source | The comparison row mixes raw-brick baseline values with analytic-companion generalized values; read it as conceptually aligned, not numerically identical pipelines. | 5 |
| source_mismatch | source mismatch | Baseline and generalized values do not share the same numeric provenance and should be read with the listed source kinds. | 6 |
| wall_safety_brick_derived | wall safety brick-derived | Wall-normal and bulk shift/lapse safety rows remain brick-derived in the current comparison. | 7 |
| unresolved | unresolved | A nested supporting diagnostic remains unavailable or unresolved and is not being represented as analytic fallback. | 8 |
