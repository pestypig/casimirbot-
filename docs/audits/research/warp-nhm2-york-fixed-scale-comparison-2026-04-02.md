# NHM2 York Fixed-Scale Comparison (2026-04-02)

"This fixed-scale export compares Lane A York slices under one shared presentation policy and a display-only NASA Figure 1-style reprojection. It does not retune NHM2 or change Lane A semantics."

## Comparison Basis
- lane used: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- sign convention: `ADM`
- export directory: `artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02`

## Render Policy
| field | value |
|---|---|
| lane_scope | lane_a_only |
| comparison_basis | Lane A theta=-trK slices are rendered with one shared global raw scale per view. Lane B is excluded from the comparison basis. |
| output_size | 1280x720 |
| color_map | signed diverging blue-white-red |
| sign_encoding | Lane A signed theta for fixed-scale exports; display-only sign flip for NASA Figure 1 reprojection when needed. |
| clipping_policy | none; fixed global raw abs-max per view |
| raw_amplitude_scaling_scope | shared global raw amplitude range per view across all compared cases |
| topology_scaling_scope | unit-max topology normalization per case, then fixed shared [-1,1] display range |
| near_zero_policy | values below 1e-20 remain near-white but are not separately autoscaled |

## View Policies
| view_id | policy_id | coordinate_mode | output_size | global_abs_max | color_scale_mode | sign_encoding | note |
|---|---|---|---|---:|---|---|---|
| york-surface-3p1 | comparison_fixed_raw_global | x-z-midplane | 1280x720 | 1.9446711446959833e-32 | signed_diverging_global | lane_a_signed_theta | All compared cases share one global raw amplitude range for this view with no per-case autoscaling. |
| york-surface-rho-3p1 | comparison_fixed_raw_global | x-rho | 1280x720 | 4.6117989868238336e-33 | signed_diverging_global | lane_a_signed_theta | All compared cases share one global raw amplitude range for this view with no per-case autoscaling. |
| york-topology-normalized-3p1 | comparison_fixed_topology_global | x-z-midplane | 1280x720 | 1 | signed_diverging_unit | lane_a_signed_theta | Each case is first topology-normalized to unit max; the displayed range is then fixed globally at [-1,1]. |

## Case Exports
| case_id | view_id | policy_id | theta_abs_max | global_abs_max | source_slice_hash | transformed_slice_hash | display_buffer_hash | color_buffer_hash | png_path | png_hash |
|---|---|---|---:|---:|---|---|---|---|---|---|
| alcubierre_control | york-surface-3p1 | comparison_fixed_raw_global | 1.7817745171052893e-32 | 1.9446711446959833e-32 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 9e108353359002224d8b0d79efa9b79f4fa0d8fc5cf6c1f70f0ad26eb5f47152 | 7197c35010765f5e28d0f22e64b682a1e67ab826c7cfbd607288f3754a1ddf1d | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/alcubierre_control-york-surface-3p1-fixed-global-raw.png | 33dbf0dbf62b3a3b7983934cdfb0d371b73d462d1990b25201ddbdc634e4e0e1 |
| alcubierre_control | york-surface-rho-3p1 | comparison_fixed_raw_global | 4.6117989868238336e-33 | 4.6117989868238336e-33 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 229db68cf149c7d9bad37f646c74570ee8bbc3789d74dc5e93646f19159bcd1c | 4b68f667d258b7d6082f867852cb53560fcc47d365521eef402c02b78be7d806 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/alcubierre_control-york-surface-rho-3p1-fixed-global-raw.png | b2e82f289227b5bf2df772af688cd7606c6b4f12cf211eb56514024e7f7b08cb |
| alcubierre_control | york-topology-normalized-3p1 | comparison_fixed_topology_global | 1.7817745171052893e-32 | 1 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 20ba7be7ae71d327e3a00f520f1ed876a42fc22244cc0d51442790457c9bc0f0 | 729750d050a77964710655b2f09eb8fc62b846043356f6984867693bc7644027 | 04dac0848591901dc3bff54377649396208fd3a413f79874ecb9e526483c5bb6 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/alcubierre_control-york-topology-normalized-3p1-fixed-global-topology.png | 2123bc4dc41085be4028efba3d2754e4ff76e8bf4397759077f381bf691774af |
| natario_control | york-surface-3p1 | comparison_fixed_raw_global | 1.9446711446959833e-32 | 1.9446711446959833e-32 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 9939de49501b95a00dacc84bf55bf65c2e518ba7fb0830be5180da1674f15ca0 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_control-york-surface-3p1-fixed-global-raw.png | 92086c6e5c98a9f189829bad2cf7a4f463a6dfb2392f866ff0f29f269518d811 |
| natario_control | york-surface-rho-3p1 | comparison_fixed_raw_global | 4.169953068210798e-33 | 4.6117989868238336e-33 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 71d572b11a573f3d933dce71511c00b6f37afb0590ef3fa9b0e794ee218fdd49 | 127e71a860f478b70f968abe817a60a45bc0fbef37402ad628c0ccab08aaaaac | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_control-york-surface-rho-3p1-fixed-global-raw.png | 53be77129e9b38c5b22df5cb13fedd64a16e0407e5b685541c7de85d12ea5421 |
| natario_control | york-topology-normalized-3p1 | comparison_fixed_topology_global | 1.9446711446959833e-32 | 1 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 1a7ebdca41dba7aa2db2172ed6fcf90a00f247d88f0f6f3b0a06f2cb404932fa | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 9939de49501b95a00dacc84bf55bf65c2e518ba7fb0830be5180da1674f15ca0 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_control-york-topology-normalized-3p1-fixed-global-topology.png | 92086c6e5c98a9f189829bad2cf7a4f463a6dfb2392f866ff0f29f269518d811 |
| nhm2_certified | york-surface-3p1 | comparison_fixed_raw_global | 1.8934768963497341e-32 | 1.9446711446959833e-32 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 801495cdd3d0dd273e8d40f3329d1587ab124296eee7dfa5fc8ea86c677b7cc8 | 20bb0b984cf12a2f8dc8c2041cc7ac787628f7d663862377ac7e58f622c26c02 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_certified-york-surface-3p1-fixed-global-raw.png | a229f6aef31103fb841537d9e8240f2a5c9f72a56fc1834849cd4a61d809e669 |
| nhm2_certified | york-surface-rho-3p1 | comparison_fixed_raw_global | 4.301940512657002e-33 | 4.6117989868238336e-33 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 6cd7756b5f5ea97fae92ff7f625e5de6a375bd4f1e7844b66d8aeac6330fe246 | f67c2ce5bb3444001850f64a8ef6dc181bf413acb700e1fd0b2b91b019bca0dc | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_certified-york-surface-rho-3p1-fixed-global-raw.png | 252039ddee797150317a45085a81a45ef86985101d421fb4ca21c8f2f1cf325e |
| nhm2_certified | york-topology-normalized-3p1 | comparison_fixed_topology_global | 1.8934768963497341e-32 | 1 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | acfcdf19c9d405166491bc7654a30b72c375edc935f7d5246594fa0a405f81d4 | dfefaa5b447bc9cb6d67b372e29005928bde869ee0e68d5fe61c6b2f1094f3be | 2bb93d8c9c35a0f3f04a3e2c4a8e52955ec932697600c032ca78990e860ad53e | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_certified-york-topology-normalized-3p1-fixed-global-topology.png | c1a220882a28c1028871a24e88448216b11b45bd40d31c092a5350377bb2a330 |

## Pairwise Metrics
| pair_id | view_id | metric_source_stage | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | lhs_display_buffer_hash | rhs_display_buffer_hash | amplification_gain | diff_png_path |
|---|---|---|---:|---:|---:|---:|---|---|---:|---|
| nhm2_vs_natario | york-surface-3p1 | pre_png_color_buffer | 0.0020422635435102315 | 0.0003110357906100846 | 0.000008488471137842656 | 0.008501519097222222 | 801495cdd3d0dd273e8d40f3329d1587ab124296eee7dfa5fc8ea86c677b7cc8 | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 37.986125541746794 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_natario-york-surface-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-rho-3p1 | pre_png_color_buffer | 0.0020422635435102315 | 0.00040604845471451056 | 0.000019619250978060918 | 0.023544921875 | 6cd7756b5f5ea97fae92ff7f625e5de6a375bd4f1e7844b66d8aeac6330fe246 | 71d572b11a573f3d933dce71511c00b6f37afb0590ef3fa9b0e794ee218fdd49 | 34.94119464297642 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_natario | york-topology-normalized-3p1 | pre_png_color_buffer | 0.0020422635435102315 | 0.000024772624613186523 | 5.741449826075408e-7 | 0.002883029513888889 | dfefaa5b447bc9cb6d67b372e29005928bde869ee0e68d5fe61c6b2f1094f3be | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-3p1 | pre_png_color_buffer | 0.12547084479018483 | 0.0006725696250388191 | 0.00001748159159722399 | 0.010519748263888889 | 801495cdd3d0dd273e8d40f3329d1587ab124296eee7dfa5fc8ea86c677b7cc8 | 9e108353359002224d8b0d79efa9b79f4fa0d8fc5cf6c1f70f0ad26eb5f47152 | 17.409397703520224 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-rho-3p1 | pre_png_color_buffer | 0.12547084479018483 | 0.0008554154641668251 | 0.00003900347394416046 | 0.025321180555555555 | 6cd7756b5f5ea97fae92ff7f625e5de6a375bd4f1e7844b66d8aeac6330fe246 | 229db68cf149c7d9bad37f646c74570ee8bbc3789d74dc5e93646f19159bcd1c | 14.883565793139423 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-topology-normalized-3p1 | pre_png_color_buffer | 0.12547084479018483 | 0.000005894869338489697 | 1.6374970329679646e-7 | 0.0023122829861111113 | dfefaa5b447bc9cb6d67b372e29005928bde869ee0e68d5fe61c6b2f1094f3be | 729750d050a77964710655b2f09eb8fc62b846043356f6984867693bc7644027 | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-3p1 | pre_png_color_buffer | 0.1275099245102431 | 0.0009830737323783462 | 0.000025944730374495958 | 0.011008029513888889 | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 9e108353359002224d8b0d79efa9b79f4fa0d8fc5cf6c1f70f0ad26eb5f47152 | 11.938068782997194 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-rho-3p1 | pre_png_color_buffer | 0.1275099245102431 | 0.0011245043609558688 | 0.00005100165809406339 | 0.028414713541666668 | 71d572b11a573f3d933dce71511c00b6f37afb0590ef3fa9b0e794ee218fdd49 | 229db68cf149c7d9bad37f646c74570ee8bbc3789d74dc5e93646f19159bcd1c | 10.43757290165852 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-topology-normalized-3p1 | pre_png_color_buffer | 0.1275099245102431 | 0.000030460033295028186 | 7.05773914984642e-7 | 0.002883029513888889 | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 729750d050a77964710655b2f09eb8fc62b846043356f6984867693bc7644027 | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |

## NASA Figure 1 Reference
| field | value |
|---|---|
| reference_id | nasa_wfm101_fig1 |
| source_link | https://ntrs.nasa.gov/api/citations/20110015936/downloads/20110015936.pdf |
| citation_link | https://ntrs.nasa.gov/citations/20110015936 |
| implied_observer | White's figure is presented as York Time for the Alcubierre metric in a 3+1 warp-bubble frame aligned to the direction of motion. |
| implied_slice_geometry | Qualitative signed surface around the spacecraft with an x=xs symmetry surface; the paper text does not fully specify a machine-readable plotting plane, so the repo uses the Lane A x-z midplane as the closest explicit reprojection. |
| implied_sign_presentation | Fore contraction and aft expansion in the displayed York-time surface plots, as described in the text around Figure 1. |
| expected_lobe_pattern | Alcubierre-style strong signed fore/aft York lobes with a sign reversal at the x=xs symmetry surface. |

## NASA Figure 1 Reprojection Exports
| case_id | display_sign_multiplier | global_abs_max | source_slice_hash | display_buffer_hash | color_buffer_hash | png_path | png_hash | note |
|---|---:|---:|---|---|---|---|---|---|
| alcubierre_control | -1 | 1.9446711446959833e-32 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | d77645751031f00792885b0aee98d7da1fa633fa315201975a7f241c40d623c9 | df4467e955b2b39919fb240a5cfa2b7bd21c4b0fb5e6ae3023dff7b920be4e94 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/alcubierre_control-york-surface-3p1-nasa-fig1-style.png | 67c974ba1056cb2ab14e8b78a4f38d4010f4775e8247701c231e7933fdbd447d | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |
| natario_control | -1 | 1.9446711446959833e-32 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | e6e606c26b467f55a4c4e51c9eb08b2c940a7c76b857f3f84ea6520b5316516e | 62bb9586e35e1fd6115b65e7fccd04700733ec2e5197ea610bdda2c7d0758355 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/natario_control-york-surface-3p1-nasa-fig1-style.png | 7351119c76f7e03622b4b3505b3e10c0dc7a5b6e18cd2f0c0d37f57e8355dd19 | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |
| nhm2_certified | -1 | 1.9446711446959833e-32 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | ec896242b18d166c3f89a4a7f69151e695a34ef7fb4d92406c62a95ec2f6b2b5 | d91c873ea2bc03929cc5a806296a14f01821b86e8ec013b707efad402d7bfae3 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-02/nhm2_certified-york-surface-3p1-nasa-fig1-style.png | 1a242f9b0c566a73aa2e59b9dbe91e983d93ee7bed185eb1361291bce0af366c | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |

## NASA Figure 1 Comparison
| field | value |
|---|---|
| fixed_scale_pair_proxy_case | alcubierre_control |
| display_sign_multiplier | -1 |
| nhm2_to_figure1_class_pixel_rms | 0.0007829895522215042 |
| nhm2_to_figure1_class_mean_absolute_pixel_difference | 0.000019796787225302285 |
| nhm2_to_figure1_class_changed_pixel_fraction | 0.010519748263888889 |
| metric_source_stage | pre_png_color_buffer |
| primary_control_baseline_case | natario_control |
| relative_to_primary_control_pixel_rms_ratio | 2.517361589435417 |
| relative_to_alcubierre_control_pixel_rms_ratio | 1.1641762028374563 |
| closeness_policy | Closeness is relative, not absolute: Figure 1 is only 'yes' when the NHM2-to-Figure-1 proxy pixel RMS stays within 10% of both the best control baseline and the Alcubierre control distance. It is 'partially' within 50% of the best baseline and 25% of the Alcubierre distance; otherwise 'no'. |

## Export Integrity
| field | value |
|---|---|
| valid | true |
| root_cause_stage | post_colormap_8bit_quantization |
| visual_metric_source_stage | pre_png_color_buffer |
| blockingFindings | none |
| advisoryFindings | none |

| record_id | finding_code | view_id | lhs_case_id | rhs_case_id | lhs_display_buffer_hash | rhs_display_buffer_hash | lhs_png_hash | rhs_png_hash | note |
|---|---|---|---|---|---|---|---|---|---|
| none | none | none | none | none | none | none | none | none | no collisions detected |

## Final Verdict
| field | value |
|---|---|
| fixed_scale_render_verdict | shared_scale_preserves_natario_like_class |
| figure1_overlay_verdict | real_nhm2_vs_alcubierre_morphology_difference |
| nhm2_vs_natario_visual_distance.pixel_rms | 0.0003110357906100846 |
| nhm2_vs_alcubierre_visual_distance.pixel_rms | 0.0006725696250388191 |
| dominant_visual_difference_cause | real_nhm2_vs_alcubierre_morphology_difference |
| is_nhm2_close_to_nasa_fig1 | no |
| scope_note | The fixed-scale export answers a presentation-fidelity question for authoritative Lane A geometry. It does not assert exact metric identity with White Figure 1 and does not reopen the closed mechanism chain. |

## Notes
- mechanism_chain_ready=true
- diagnostic_authority_closed=true
- raw_distance_to_natario=0.0020422635435102315
- raw_distance_to_alcubierre=0.12547084479018483
- autoscale_masked_visual_difference=false
- nasa_display_sign_multiplier=-1
- Corrected export integrity: visual metrics are computed from the pre-PNG color buffer rather than the final quantized PNG pixels.
- Previous invalid collapse point: post-colormap 8-bit quantization could flatten distinct transformed buffers into identical PNGs.
- Images are comparison aids only; numerical distance and convention alignment remain the primary evidence.

