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
- renderedCardHash: 7290c863dff0cb7e3496af0758f55918947fd0496e2372367a2bbacb79eefb77
- graphRenderStatus: generated
- legacyMonolithicCardStatus: deprecated_not_generated
- legacyMonolithicCardPath: artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-diagnostics_dashboard-card.png

## Proof Status

- authoritativeProofSurface: lane_a_eulerian_comoving_theta_minus_trk
- laneAUnchanged: yes
- baselineBranchStatus: unit_lapse_baseline_unchanged
- generalizedBranchStatus: candidate_authoritative_family_transport_gate_controlled_not_claimed_here
- generalizedFamilyAuthorityStatus: candidate_authoritative_solve_family
- generalizedTransportCertificationStatus: bounded_transport_fail_closed_reference_only
- proofNote: Lane A remains authoritative. nhm2_shift_lapse is a candidate authoritative solve family in full-solve provenance/model-selection, while proof-bearing bounded transport admission remains separately controlled by the authoritative shift-lapse transport-promotion gate and is not claimed by this dashboard. Source/mechanism context is bounded non-authoritative advisory only; no formula equivalence, viability promotion, or cross-lane authority expansion is implied.

## Source / Mechanism Consumer Boundary

- promotionContractStatus: active_for_bounded_claims_only
- selectedPromotionRoute: formal_exemption_route
- exemptionRouteActivated: yes
- sourceMechanismNonAuthoritative: yes
- sourceMechanismFormulaEquivalent: no
- parityRouteStatus: blocked_by_derivation_class_difference
- parityRouteBlockingClass: direct_metric_vs_reconstructed_proxy_derivation_gap
- sourceMechanismReferenceOnlyScope: yes
- activeClaimSet: bounded_non_authoritative_source_annotation, bounded_non_authoritative_mechanism_context, bounded_non_authoritative_reduced_order_comparison
- blockedClaimSet: source_mechanism_lane_promotable_non_authoritative, formula_equivalent_to_authoritative_direct_metric, source_mechanism_lane_authoritative, source_mechanism_layer_supports_viability_promotion, cross_lane_promotion_beyond_reference_only_scope
- forbiddenPromotions: formula_equivalent_to_authoritative_direct_metric, source_mechanism_lane_authoritative, source_mechanism_layer_supports_viability_promotion, cross_lane_promotion_beyond_reference_only_scope, nhm2_shift_lapse_proof_promotion
- sourceMechanismConsumerSummary: Only the bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims are active; formula equivalence remains false, the parity route remains blocked, viability and cross-lane promotions remain blocked, the source/mechanism lane remains non-authoritative, warp.metric.T00.nhm2_shift_lapse is treated as a candidate authoritative solve family in provenance/model-selection, and its proof-bearing bounded transport admission remains separately controlled by the authoritative shift-lapse transport-promotion gate.

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
- sectionNote: Read these rows before collapsing the dashboard into any downstream summary. They explain where mild-reference under-resolution is handled analytically, where brick alignment is preserved, and why the active source/mechanism route remains bounded advisory only rather than implying formula equivalence or viability promotion.

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
| dashboard_overview | Diagnostics Dashboard Overview | dashboard_summary | yes | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-dashboard_overview-card.png | 7290c863dff0cb7e3496af0758f55918947fd0496e2372367a2bbacb79eefb77 |
| proof_status | Proof Status | proof_status_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-proof_status-card.png | 7eb254b2fc6e6608d0636a57be395910ef36bbaec8ca6e71dd19acdcb765c6fb |
| cabin_gravity | Cabin Gravity | cabin_gravity_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-cabin_gravity-card.png | e43d1a959a6bfc24ab5d7c56ba3e315a4cad625f3b3b3b0061744c5970ca6489 |
| wall_safety | Wall Safety | wall_safety_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-wall_safety-card.png | 1c21c0174f4773c689c0ba95fddb26e26e3e6d7072fb049caa54e287daf14abe |
| precision_provenance | Precision / Provenance | precision_panel | no | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-precision_provenance-card.png | e39d9e4ba6d9a65c545a56694fb962e1e75b423180c914872207fcd19a437546 |

## Graph Series Blocks

- graphs are driven by explicit sampled series serialized into the dashboard JSON artifact.
- these are provenance-aware profile graphs, not raw 2D field renders.
- local clock-gradient graph remains explicitly local-only and not route-time compression.

| graphId | quantity | sampleAxis | sampleCount | baseline source | generalized source | underResolutionDetected | graphNote |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cabin_gravity_profile_z | g_local(z) (m/s^2) | z_zenith | 9 | brick_float32_direct | analytic_lapse_summary_companion | yes | Local cabin gravity proxy only. Baseline remains the raw-brick unit-lapse zero profile. The mild shift-plus-lapse branch uses the analytic companion lapse summary because float32 raw channels under-resolve the lapse gradient. Presentation-only graph; not a proof surface and not a wall-safety score. |
| clock_gradient_profile_z | delta_tau_per_day(z) (s/day) | z_zenith | 9 | brick_float32_direct | analytic_lapse_summary_companion | yes | Local cabin clock gradient relative to the centerline only. The mild shift-plus-lapse branch is reconstructed from the analytic companion lapse summary because float32 raw channels under-resolve the lapse gradient. This is not route-time compression. Scientific notation is intentional so the tiny scale stays visually honest. |

## Graph Renders

- graphRenderStatus: generated
- graphs are presentation-only and non-authoritative.
- baseImagePolicy: diagnostic_graph_canvas
- inheritsTransportContext: false
- contextCompositionMode: none

| graphId | sourcePanel | sourceSeriesBlock | authoritativeStatus | path | hash |
| --- | --- | --- | --- | --- | --- |
| cabin_gravity_profile_z | cabin_gravity_panel | cabin_gravity_profile_z | non_authoritative | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-cabin_gravity_profile_z-graph.png | 0e3958ff62b303fbf599ab36faf1b9f81bec7c79103064b229d0566efaafc043 |
| clock_gradient_profile_z | cabin_gravity_panel | clock_gradient_profile_z | non_authoritative | artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-clock_gradient_profile_z-graph.png | bcf2e35e67b35fa7ce88ba7e9fb942dde2eeb35569cbfbc309624da11ae15e22 |

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
| reference_only | reference_only | This badge marks reference_only or fail-closed boundaries. For nhm2_shift_lapse, proof-bearing bounded transport publication is controlled separately by the authoritative shift-lapse transport-promotion gate; this dashboard does not claim that gate-passed publication. | 2 |
| raw_brick | raw brick | The displayed value comes directly from the float32 GR evolve brick or a brick-derived summary. | 3 |
| analytic_companion | analytic companion | The displayed value uses the analytic lapse-summary companion because the mild reference under-resolves in float32 brick channels. | 4 |
| mixed_source | mixed source | The comparison row mixes raw-brick baseline values with analytic-companion generalized values; read it as conceptually aligned, not numerically identical pipelines. | 5 |
| source_mismatch | source mismatch | Baseline and generalized values do not share the same numeric provenance and should be read with the listed source kinds. | 6 |
| wall_safety_brick_derived | wall safety brick-derived | Wall-normal and bulk shift/lapse safety rows remain brick-derived in the current comparison. | 7 |
| unresolved | unresolved | A nested supporting diagnostic remains unavailable or unresolved and is not being represented as analytic fallback. | 8 |

## Source / Mechanism Consumer Conformance

- consumerConformanceStatus: conformant
- conformanceDataMode: artifact_coupled
- stalenessRisk: possible_latest_artifact_drift
- artifactCouplingNote: Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts.
- checkedSurfaceCount: 6
- conformantSurfaces: proof_pack_alias_json, proof_pack_audit_markdown, shift_plus_lapse_dashboard_json, shift_plus_lapse_dashboard_audit_markdown, shift_plus_lapse_dashboard_cards, shift_plus_lapse_dashboard_graphs
- nonConformantSurfaces: none
- referenceOnlyScopePreserved: yes
- referenceOnlyMissingOnSurfaces: none
- laneAAuthorityPreserved: yes
- laneAAuthorityMissingOnSurfaces: none
- summary: Checked proof-pack JSON/markdown, dashboard JSON/markdown, and rendered dashboard card/graph sources preserve the bounded advisory source/mechanism route, explicit Lane A authority, and the candidate-family versus fail-closed transport split. Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts.
- artifactPath: C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-source-mechanism-consumer-conformance-latest.json
- reportPath: C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-source-mechanism-consumer-conformance-latest.md
