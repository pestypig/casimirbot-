# NHM2 York Render Debug (2026-03-31)

"This render-debug artifact audits York-frame display policy and primary-paper comparability under the closed Lane A mechanism chain; images are not treated as primary evidence."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- solveAuthorityAuditPath: `artifacts/research/full-solve/nhm2-solve-authority-audit-latest.json`
- diagnosticContractPath: `configs/york-diagnostic-contract.v1.json`

## Render Policy
| field | value |
|---|---|
| authoritativeLaneId | lane_a_eulerian_comoving_theta_minus_trk |
| authoritativeLaneLabel | Lane A authoritative mechanism-readiness comparison lane |
| advisoryLaneIds | lane_b_shift_drift_theta_plus_div_beta_over_alpha |
| laneBReferenceOnly | true |
| laneBCanOverrideAuthoritativeComparison | false |
| mechanismChainReady | true |
| closedAuthorityStages | source,timing,brick,snapshot,diagnostic |
| imagesUsedAsPrimaryEvidence | false |

## Lane Used
| field | value |
|---|---|
| lane_id | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| observer_definition | obs.eulerian_n |
| foliation | comoving_cartesian_3p1 |
| foliation_definition | Eulerian normal observer on the fixed comoving Cartesian 3+1 foliation. |
| theta_definition | theta=-trK |
| sign_convention | ADM |
| view_geometry | {"york-surface-3p1":"x-z-midplane","york-surface-rho-3p1":"x-rho","york-topology-normalized-3p1":"x-z-midplane","york-shell-map-3p1":"x-z-midplane"} |
| scope_note | Lane A is the only authoritative lane for mechanism-readiness and paper comparison. Lane B remains advisory/reference-only and cannot override Lane A conclusions. |

## View Definitions
| view_id | coordinate_mode | slice_plane | sampling_choice | view_geometry | support_overlay | normalization | magnitude_mode | surface_height |
|---|---|---|---|---|---|---|---|---|
| york-surface-3p1 | x-z-midplane | x-z-midplane | x-z midplane | x-z midplane 3+1 York surface using raw signed theta height on the fixed comoving foliation. | null | symmetric-about-zero | null | theta |
| york-surface-rho-3p1 | x-rho | x-rho | x-rho cylindrical remap | x-rho cylindrical remap of the same Lane A York field for transverse shell morphology comparison. | null | symmetric-about-zero | null | theta |
| york-topology-normalized-3p1 | x-z-midplane | x-z-midplane | x-z midplane | x-z midplane topology-preserving unit-max surface used to compare sign topology independent of raw amplitude. | null | topology-only-unit-max | normalized-topology-only | theta_norm |
| york-shell-map-3p1 | x-z-midplane | x-z-midplane | x-z midplane | x-z midplane shell-localized theta overlay using the hull SDF plus tile support mask. | hull_sdf+tile_support_mask | symmetric-about-zero | null | theta |

## Normalization Policy
| field | value |
|---|---|
| contract_rules | {"raw":"symmetric-about-zero","topology":"topology-only-unit-max","raw_display_gain":"must-equal-1"} |
| raw_surface_rule | Raw York surfaces keep signed theta amplitude with symmetric-about-zero normalization. |
| topology_surface_rule | The topology-normalized view adds unit-max scaling to preserve sign topology while discarding absolute amplitude. |
| raw_display_gain_rule | display_gain must remain 1 for raw York views under the current contract. |
| render_range_method | computeSliceRange:diverging:p98-abs-symmetric |
| display_gain_expected | 1 |
| topology_normalization_scope | Topology-only normalization is display-only and does not alter the underlying raw theta hashes. |

## Color Policy
| view_id | color_scale_mode | sign_encoding |
|---|---|---|
| york-surface-3p1 | signed_diverging_p98_symmetric | negative theta -> blue branch, positive theta -> red branch |
| york-surface-rho-3p1 | signed_diverging_p98_symmetric | negative theta -> blue branch, positive theta -> red branch |
| york-topology-normalized-3p1 | signed_diverging_unit_max | negative theta -> blue branch, positive theta -> red branch |
| york-shell-map-3p1 | signed_diverging_shell_localized | negative theta -> blue branch, positive theta -> red branch |

## Sign Policy
| field | value |
|---|---|
| lane_theta_definition | theta=-trK |
| lane_sign_convention | ADM |
| lane_theta_source | canonical_theta_channel |
| parity_source | Lane A parity enforces theta-channel == render slice == -K trace reconstruction on required views. |
| paper_alignment_note | Alcubierre aligns directly with the Lane A Eulerian sign convention; Natario requires a sign-convention bridge because the paper expresses expansion as div(X). |

## Clipping Policy
| field | value |
|---|---|
| display_range_method | computeSliceRange:diverging:p98-abs-symmetric |
| percentile_window | 2nd to 98th percentile, symmetric about zero for diverging York views |
| clipping_is_display_only | true |
| topology_view_adds_unit_max_normalization | true |
| clipping_detected_by | display_range_method metadata, display-vs-raw extrema comparison, and topology normalized-slice hashes |

## Near-Zero Policy
| field | value |
|---|---|
| theta_abs_threshold | 1e-20 |
| signed_structure_relative_floor | 0.001 |
| requires_signed_structure_to_escape_near_zero | true |
| note | Near-zero suppression only applies when absolute amplitude is tiny and there is no meaningful signed structure above the relative structural floor. |

## Frame Debug Summary
| case_id | view_id | theta_min | theta_max | theta_abs_max | positive_count | negative_count | near_zero_count | signed_lobe_summary | shell_activity | normalization_gain | color_scale_mode | clipping_applied | theta_channel_hash | slice_array_hash |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---|---|---|---|
| alcubierre_control | york-surface-3p1 | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | 110 | 62 | 2132 | fore+/aft- | null | 1 | signed_diverging_p98_symmetric | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd |
| alcubierre_control | york-surface-rho-3p1 | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | 131 | 152 | 2021 | null | null | 1 | signed_diverging_p98_symmetric | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 |
| alcubierre_control | york-topology-normalized-3p1 | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | 110 | 62 | 2132 | fore+/aft- | null | 1 | signed_diverging_unit_max | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd |
| alcubierre_control | york-shell-map-3p1 | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | 110 | 62 | 2132 | fore+/aft- | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd |
| natario_control | york-surface-3p1 | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_p98_symmetric | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 |
| natario_control | york-surface-rho-3p1 | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | 131 | 151 | 2022 | null | null | 1 | signed_diverging_p98_symmetric | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 |
| natario_control | york-topology-normalized-3p1 | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_unit_max | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 |
| natario_control | york-shell-map-3p1 | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | 106 | 66 | 2132 | null | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 |
| nhm2_certified | york-surface-3p1 | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_p98_symmetric | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c |
| nhm2_certified | york-surface-rho-3p1 | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | 131 | 152 | 2021 | null | null | 1 | signed_diverging_p98_symmetric | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb |
| nhm2_certified | york-topology-normalized-3p1 | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_unit_max | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c |
| nhm2_certified | york-shell-map-3p1 | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | 106 | 66 | 2132 | null | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c |

## Control Comparison
| reference_case_id | reference_role | signed_lobe_expectation | nhm2_distance | nhm2_match_status | rendered_frame_reflects_numeric_classification |
|---|---|---|---:|---|---|
| alcubierre_control | high_expansion_calibration_reference | fore+/aft- signed-lobe control under Lane A | 0.13559288214795065 | morphology_different | true |
| natario_control | low_expansion_calibration_reference | low-expansion / zero-expansion comparison control under Lane A | 0.0012469161139296696 | compatible_after_observer_scope_note | true |

## Paper Reference Matrix
| reference_id | source_link | observer_definition | foliation_definition | theta_definition | sign_convention | expected_lobe_pattern | expected_expansion_class | applicability_to_repo_lane |
|---|---|---|---|---|---|---|---|---|
| alcubierre_primary | https://arxiv.org/abs/gr-qc/0009013 | Eulerian observers orthogonal to the ADM 3+1 hypersurfaces used in the paper. | Warp metric written in a 3+1 slicing with lapse, shift, and hypersurface-normal Eulerian observers. | Expansion of Eulerian volume elements expressed through the extrinsic-curvature trace in Alcubierre's ADM-style conventions. | ADM-style sign with Eulerian expansion written as minus the traced extrinsic curvature in the paper's normalization. | Strong signed fore/aft expansion-contraction pattern for the standard bubble construction. | signed fore/aft expansion-contraction | Directly comparable to Lane A after matching the Eulerian observer, 3+1 foliation, and sign convention. |
| natario_primary | https://arxiv.org/abs/gr-qc/0110086 | Eulerian observers given by the hypersurface-normal congruence of the flat-slice warp-drive foliation. | Globally hyperbolic spacetime foliated by Euclidean 3-spaces with the warp field encoded in the shift-like vector X. | Expansion of the Eulerian volume element given by div(X), with zero-expansion cases produced by divergenceless X. | Equivalent to the Lane A York diagnostic after mapping sign conventions between Natario's extrinsic-curvature definition and the repo's ADM convention. | Low-expansion or zero-expansion morphology rather than Alcubierre's strong signed fore/aft lobes. | volume-preserving or low-expansion Eulerian morphology | Comparable to Lane A after sign-convention alignment and with the explicit caveat that the comparison remains lane-local. |
| gourgoulhon_3p1_reference | https://arxiv.org/abs/gr-qc/0703035 | Generic hypersurface-normal 3+1 observer congruence used to define the extrinsic curvature and its trace. | General spacelike-hypersurface 3+1 formalism rather than a specific warp metric. | Formal relation K = -div(n), which makes the Eulerian congruence expansion equal to minus the extrinsic-curvature trace under the stated sign convention. | 3+1 formalism sign bridge used to map the repo's Lane A theta=-trK diagnostic to standard geometric notation. | No warp-specific lobe pattern; formalism-only reference. | formalism bridge only | Directly applicable for observer/foliation/sign interpretation, but not itself a warp-bubble morphology reference. |

## Paper Comparison Matrix
| reference_id | convention_match_status | observer_match_status | foliation_match_status | theta_match_status | sign_match_status | morphology_match_status | comparison_scope | difference_causes |
|---|---|---|---|---|---|---|---|---|
| alcubierre_primary | matched | matched | matched | matched | matched | morphology_different | Lane A only; compare the authoritative Eulerian 3+1 York morphology against Alcubierre's signed fore/aft expansion pattern. | real_nhm2_morphology_difference |
| natario_primary | compatible_after_sign_flip | matched | matched | compatible_after_sign_flip | compatible_after_sign_flip | compatible_after_observer_scope_note | Lane A only; compare the authoritative Eulerian low-expansion morphology against Natario's zero-expansion/volume-preserving family after sign alignment. | none |
| gourgoulhon_3p1_reference | matched | matched | matched | matched | matched | not_comparable_without_reprojection | Formalism-only bridge for the Lane A Eulerian theta=-trK interpretation; not a warp-bubble morphology comparator. | not_comparable_without_convention_remap |

## Final Verdict
| field | value |
|---|---|
| render_debug_verdict | render_matches_authoritative_geometry |
| paper_comparison_verdict | paper_match_after_convention_alignment |
| dominant_difference_cause | real_nhm2_morphology_difference |
| lane_used_for_authoritative_comparison | lane_a_eulerian_comoving_theta_minus_trk |
| images_used_as_primary_evidence | false |

## Notes
- Lane A remains the authoritative comparison lane for this artifact; Lane B is retained only for advisory/reference context.
- Render parity for NHM2 Lane A is closed, so image appearance is interpreted only after hash/parity checks.
- NHM2 classification distances: to Natario control=0.0012469161139296696; to Alcubierre control=0.13559288214795065.
- Primary-paper comparison is scope-limited to observer/foliation/sign-aligned Lane A semantics and does not assert invariant theory identity from image similarity.

