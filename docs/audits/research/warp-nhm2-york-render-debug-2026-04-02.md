# NHM2 York Render Debug (2026-04-02)

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
| alcubierre_control | york-surface-3p1 | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | 106 | 66 | 2132 | fore+/aft- | null | 1 | signed_diverging_p98_symmetric | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 |
| alcubierre_control | york-surface-rho-3p1 | -4.6117989868238336e-33 | 3.282585480812693e-35 | 4.6117989868238336e-33 | 131 | 150 | 2023 | null | null | 1 | signed_diverging_p98_symmetric | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec |
| alcubierre_control | york-topology-normalized-3p1 | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | 106 | 66 | 2132 | fore+/aft- | null | 1 | signed_diverging_unit_max | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 |
| alcubierre_control | york-shell-map-3p1 | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | 106 | 66 | 2132 | fore+/aft- | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 |
| natario_control | york-surface-3p1 | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_p98_symmetric | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 |
| natario_control | york-surface-rho-3p1 | -4.169953068210798e-33 | 3.005990741709247e-35 | 4.169953068210798e-33 | 130 | 149 | 2025 | null | null | 1 | signed_diverging_p98_symmetric | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 |
| natario_control | york-topology-normalized-3p1 | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_unit_max | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 |
| natario_control | york-shell-map-3p1 | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | 106 | 66 | 2132 | null | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 |
| nhm2_certified | york-surface-3p1 | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_p98_symmetric | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c |
| nhm2_certified | york-surface-rho-3p1 | -4.301940512657002e-33 | 3.1046137419910904e-35 | 4.301940512657002e-33 | 131 | 150 | 2023 | null | null | 1 | signed_diverging_p98_symmetric | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d |
| nhm2_certified | york-topology-normalized-3p1 | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | 106 | 66 | 2132 | null | null | 1 | signed_diverging_unit_max | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c |
| nhm2_certified | york-shell-map-3p1 | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | 106 | 66 | 2132 | null | 0.16666666666666666 | 1 | signed_diverging_shell_localized | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c |

## Control Comparison
| reference_case_id | reference_role | signed_lobe_expectation | nhm2_distance | nhm2_match_status | rendered_frame_reflects_numeric_classification |
|---|---|---|---:|---|---|
| alcubierre_control | high_expansion_calibration_reference | fore+/aft- signed-lobe control under Lane A | 0.12547084479018483 | morphology_different | true |
| natario_control | low_expansion_calibration_reference | low-expansion / zero-expansion comparison control under Lane A | 0.0020422635435102315 | compatible_after_observer_scope_note | true |

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
- NHM2 classification distances: to Natario control=0.0020422635435102315; to Alcubierre control=0.12547084479018483.
- Primary-paper comparison is scope-limited to observer/foliation/sign-aligned Lane A semantics and does not assert invariant theory identity from image similarity.

