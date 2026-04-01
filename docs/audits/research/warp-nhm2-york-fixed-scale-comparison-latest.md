# NHM2 York Fixed-Scale Comparison (2026-04-01)

"This fixed-scale export compares Lane A York slices under one shared presentation policy and a display-only NASA Figure 1-style reprojection. It does not retune NHM2 or change Lane A semantics."

## Comparison Basis
- lane used: `lane_a_eulerian_comoving_theta_minus_trk`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta definition: `theta=-trK`
- sign convention: `ADM`
- export directory: `artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01`

## Render Policy
| field | value |
|---|---|
| lane_scope | lane_a_only |
| comparison_basis | Lane A theta=-trK slices are rendered with one shared global raw scale per view. Lane B is excluded from the comparison basis. |
| output_size | 320x180 |
| color_map | signed diverging blue-white-red |
| sign_encoding | Lane A signed theta for fixed-scale exports; display-only sign flip for NASA Figure 1 reprojection when needed. |
| clipping_policy | none; fixed global raw abs-max per view |
| raw_amplitude_scaling_scope | shared global raw amplitude range per view across all compared cases |
| topology_scaling_scope | unit-max topology normalization per case, then fixed shared [-1,1] display range |
| near_zero_policy | values below 1e-20 remain near-white but are not separately autoscaled |

## View Policies
| view_id | policy_id | coordinate_mode | output_size | global_abs_max | color_scale_mode | sign_encoding | note |
|---|---|---|---|---:|---|---|---|
| york-surface-3p1 | comparison_fixed_raw_global | x-z-midplane | 320x180 | 3.0000285034962945e-32 | signed_diverging_global | lane_a_signed_theta | All compared cases share one global raw amplitude range for this view with no per-case autoscaling. |
| york-surface-rho-3p1 | comparison_fixed_raw_global | x-rho | 320x180 | 7.114586253487799e-33 | signed_diverging_global | lane_a_signed_theta | All compared cases share one global raw amplitude range for this view with no per-case autoscaling. |
| york-topology-normalized-3p1 | comparison_fixed_topology_global | x-z-midplane | 320x180 | 1 | signed_diverging_unit | lane_a_signed_theta | Each case is first topology-normalized to unit max; the displayed range is then fixed globally at [-1,1]. |

## Case Exports
| case_id | view_id | policy_id | theta_abs_max | global_abs_max | source_slice_hash | transformed_slice_hash | display_buffer_hash | color_buffer_hash | png_path | png_hash |
|---|---|---|---:|---:|---|---|---|---|---|---|
| alcubierre_control | york-surface-3p1 | comparison_fixed_raw_global | 2.7487295579359796e-32 | 3.0000285034962945e-32 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | d5e452afcf2a61846656847931748834122e5cfa6865dacfb820a8e13c587347 | dbab057bc4b472329f92b4b76c968c40f0dd940b2620030317820dc6a7bdbc61 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/alcubierre_control-york-surface-3p1-fixed-global-raw.png | 7c2db767855954020f8a08b3b49bf113fa8ef043fa4db4b1b7b45b57a90a43ba |
| alcubierre_control | york-surface-rho-3p1 | comparison_fixed_raw_global | 7.114586253487799e-33 | 7.114586253487799e-33 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | cae3b8acd46d6c9cf8037d7e78252803541f7b8f3bb826f5f303ba40bd25a984 | c392c929d4249d98da1adc09081a223ca2982a4a7eb74757cbf1d4a8e47338f4 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/alcubierre_control-york-surface-rho-3p1-fixed-global-raw.png | e18128b6475b4b4be958d30b9d12a26e91278aa6417f35a4df53f4415c9e10c6 |
| alcubierre_control | york-topology-normalized-3p1 | comparison_fixed_topology_global | 2.7487295579359796e-32 | 1 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 4936224fc543734e35bc42238960df797d2509617e8c55116d71803fdab52637 | 49661f6119408f921db9a13de26ceee1887d8d1e3be1627d273c67fccd32c73c | ef7ae7fcad49e5802aec26323e7d19a8d0c80af54a7862deafbee820525b47c3 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/alcubierre_control-york-topology-normalized-3p1-fixed-global-topology.png | d16a88bf40b37eb313fbbac8afe9f13aae197876cbb8396f13ebd639d1753c73 |
| natario_control | york-surface-3p1 | comparison_fixed_raw_global | 3.0000285034962945e-32 | 3.0000285034962945e-32 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | c1441cf63340dc441cbf378d19fd7cafdaef36bc557327a507e4409be306da30 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_control-york-surface-3p1-fixed-global-raw.png | 91b4ad9eab88e4b1d4a33b3ca3a3576cd65a25d95f0fd4016789a6b026a7f778 |
| natario_control | york-surface-rho-3p1 | comparison_fixed_raw_global | 6.432953078960448e-33 | 7.114586253487799e-33 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 09956be8813bab416c4028a2e1eee01642f871feb3821eecdc0b9990800691e8 | 487fd3d712a5b45081a3a47225a62e43ba8db4c8a52210e6bad257ba26166820 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_control-york-surface-rho-3p1-fixed-global-raw.png | 393be6869737d90cd860da72c6ec8e246a1bd854b926bd51ee47d034c70b9197 |
| natario_control | york-topology-normalized-3p1 | comparison_fixed_topology_global | 3.0000285034962945e-32 | 1 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 756e95104436a3bc9c52157a29b111be0eba1a94e76609f9fbb8d74b7c051fe9 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | c1441cf63340dc441cbf378d19fd7cafdaef36bc557327a507e4409be306da30 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_control-york-topology-normalized-3p1-fixed-global-topology.png | 91b4ad9eab88e4b1d4a33b3ca3a3576cd65a25d95f0fd4016789a6b026a7f778 |
| nhm2_certified | york-surface-3p1 | comparison_fixed_raw_global | 2.9210517400419483e-32 | 3.0000285034962945e-32 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 49ed86846c5b381a9cf2d06eb6c5b78e6f2ef890181014b047a8ffc7496d867b | 5fa3303573f25e9b94e2fde1058d51730b6a97b3352fbdf7c5c7757042c32b7c | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_certified-york-surface-3p1-fixed-global-raw.png | 4af638fbdb87bf787012f9353670bfcec67540fc21696e2598f5518614e45f5e |
| nhm2_certified | york-surface-rho-3p1 | comparison_fixed_raw_global | 6.636569271674008e-33 | 7.114586253487799e-33 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | d47e9945d76dfe0a9aa7747653e12ef50afafac521c041ba458b525d855ba116 | 1477812181cb089bb5d7eda5240b96414f7d30ef5e28b083fe9f69ecb14a63ae | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_certified-york-surface-rho-3p1-fixed-global-raw.png | e60b4bdb698c0f787681c400d28808053a6d5340de40ce4e269c3cec670a3131 |
| nhm2_certified | york-topology-normalized-3p1 | comparison_fixed_topology_global | 2.9210517400419483e-32 | 1 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 5d2f88acb8449d9614b4ddcda7895579540156354a02cb87236867a04d2f5b20 | c52dd696dbf18a4589ebd8d5931ccbfa1be082decbdcf6b7af2b1ed32a831447 | d0ee825a9f3b57cd2a4ac2c85b2e8083b2849b46fc5b1f34416faf83842bf2f8 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_certified-york-topology-normalized-3p1-fixed-global-topology.png | fe73a5cc0243cc15c381746e398f190b362b4a85d11e12fa211e1893e55914c0 |

## Pairwise Metrics
| pair_id | view_id | metric_source_stage | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | lhs_display_buffer_hash | rhs_display_buffer_hash | amplification_gain | diff_png_path |
|---|---|---|---:|---:|---:|---:|---|---|---:|---|
| nhm2_vs_natario | york-surface-3p1 | pre_png_color_buffer | 0.0012469161139296696 | 0.0003245026921436903 | 0.00000899390416203951 | 0.008628472222222221 | 49ed86846c5b381a9cf2d06eb6c5b78e6f2ef890181014b047a8ffc7496d867b | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | 37.986217366713305 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_natario-york-surface-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-rho-3p1 | pre_png_color_buffer | 0.0012469161139296696 | 0.0004018944636779556 | 0.000019659148066201548 | 0.023385416666666665 | d47e9945d76dfe0a9aa7747653e12ef50afafac521c041ba458b525d855ba116 | 09956be8813bab416c4028a2e1eee01642f871feb3821eecdc0b9990800691e8 | 34.94116140112864 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_natario | york-topology-normalized-3p1 | pre_png_color_buffer | 0.0012469161139296696 | 0.000023546710710167155 | 5.22939396251367e-7 | 0.0027951388888888887 | c52dd696dbf18a4589ebd8d5931ccbfa1be082decbdcf6b7af2b1ed32a831447 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-3p1 | pre_png_color_buffer | 0.13559288214795065 | 0.0007036011734714586 | 0.000018693803000375824 | 0.010642361111111111 | 49ed86846c5b381a9cf2d06eb6c5b78e6f2ef890181014b047a8ffc7496d867b | d5e452afcf2a61846656847931748834122e5cfa6865dacfb820a8e13c587347 | 17.40941570512055 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-rho-3p1 | pre_png_color_buffer | 0.13559288214795065 | 0.0008348071372539716 | 0.00003845026265297876 | 0.02486111111111111 | d47e9945d76dfe0a9aa7747653e12ef50afafac521c041ba458b525d855ba116 | cae3b8acd46d6c9cf8037d7e78252803541f7b8f3bb826f5f303ba40bd25a984 | 14.883542895258998 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-topology-normalized-3p1 | pre_png_color_buffer | 0.13559288214795065 | 0.000005671279308556868 | 1.5735866330968186e-7 | 0.002309027777777778 | c52dd696dbf18a4589ebd8d5931ccbfa1be082decbdcf6b7af2b1ed32a831447 | 49661f6119408f921db9a13de26ceee1887d8d1e3be1627d273c67fccd32c73c | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-3p1 | pre_png_color_buffer | 0.1368366108420511 | 0.0010276397123231476 | 0.00002765591753346388 | 0.011006944444444444 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | d5e452afcf2a61846656847931748834122e5cfa6865dacfb820a8e13c587347 | 11.938086317104146 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-rho-3p1 | pre_png_color_buffer | 0.1368366108420511 | 0.0010879414840749221 | 0.00004996773352661428 | 0.02779513888888889 | 09956be8813bab416c4028a2e1eee01642f871feb3821eecdc0b9990800691e8 | cae3b8acd46d6c9cf8037d7e78252803541f7b8f3bb826f5f303ba40bd25a984 | 10.437558674313504 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-topology-normalized-3p1 | pre_png_color_buffer | 0.1368366108420511 | 0.000028955029950726357 | 6.46035903913374e-7 | 0.0029861111111111113 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | 49661f6119408f921db9a13de26ceee1887d8d1e3be1627d273c67fccd32c73c | 128 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |

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
| alcubierre_control | -1 | 3.0000285034962945e-32 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 4855e2205fb286481ea7a38536ae5a7031e176209de41aa8d3cdba1b53bf6d4f | cfaeac99f90cf863257eb04442b61a52b2ef441352814196d4dc12e43bbec0f0 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/alcubierre_control-york-surface-3p1-nasa-fig1-style.png | 601cca52a1d2c91342d61882eb85a21cdc407b8da22daf2eeb192898274a57ab | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |
| natario_control | -1 | 3.0000285034962945e-32 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 4bbb3c1f3b69d8b97774aba8cfd46aa0c4286c1e1961f4be117b220f303bb158 | 65382724c9146852910f35a683afc51e1ad38fc60e014b3d6dee723aa46d0eef | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/natario_control-york-surface-3p1-nasa-fig1-style.png | 97c5a7357da74167d7211afe3a0ec5dd29e4344a1f533bc066da067457af13eb | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |
| nhm2_certified | -1 | 3.0000285034962945e-32 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | c4ce8f8e1d6dd619452b40bfe58118a559e8b216ef72867de66cb61f9927ed9b | dc3c364a2df705c59654ddf6bf1c45e01b4c8693ef3761db34104db439d50ff2 | artifacts/research/full-solve/rendered-york-frames-fixed-scale-2026-04-01/nhm2_certified-york-surface-3p1-nasa-fig1-style.png | 48450da0be58d8fd0fd03e39e5b63631eb8e5f5c727b9a03fcb217612c87ff98 | Display-only sign flip applied so the Alcubierre control follows White Figure 1's fore-contraction/aft-expansion presentation. |

## NASA Figure 1 Comparison
| field | value |
|---|---|
| fixed_scale_pair_proxy_case | alcubierre_control |
| display_sign_multiplier | -1 |
| nhm2_to_figure1_class_pixel_rms | 0.0008191196517368534 |
| nhm2_to_figure1_class_mean_absolute_pixel_difference | 0.00002116668291469924 |
| nhm2_to_figure1_class_changed_pixel_fraction | 0.010642361111111111 |
| metric_source_stage | pre_png_color_buffer |
| primary_control_baseline_case | natario_control |
| relative_to_primary_control_pixel_rms_ratio | 2.5242306814950735 |
| relative_to_alcubierre_control_pixel_rms_ratio | 1.1641817589579115 |
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
| nhm2_vs_natario_visual_distance.pixel_rms | 0.0003245026921436903 |
| nhm2_vs_alcubierre_visual_distance.pixel_rms | 0.0007036011734714586 |
| dominant_visual_difference_cause | real_nhm2_vs_alcubierre_morphology_difference |
| is_nhm2_close_to_nasa_fig1 | no |
| scope_note | The fixed-scale export answers a presentation-fidelity question for authoritative Lane A geometry. It does not assert exact metric identity with White Figure 1 and does not reopen the closed mechanism chain. |

## Notes
- mechanism_chain_ready=true
- diagnostic_authority_closed=true
- raw_distance_to_natario=0.0012469161139296696
- raw_distance_to_alcubierre=0.13559288214795065
- autoscale_masked_visual_difference=false
- nasa_display_sign_multiplier=-1
- Corrected export integrity: visual metrics are computed from the pre-PNG color buffer rather than the final quantized PNG pixels.
- Previous invalid collapse point: post-colormap 8-bit quantization could flatten distinct transformed buffers into identical PNGs.
- Images are comparison aids only; numerical distance and convention alignment remain the primary evidence.

