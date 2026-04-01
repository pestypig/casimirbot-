# Warp York Canonical Calibration (2026-03-31)

"This canonical calibration ladder renders a synthetic flat baseline, Alcubierre control, Natario control, and NHM2 current solve under one authoritative Lane A contract so future York-frame debugging can distinguish renderer/convention failures from NHM2-local morphology."

## Comparison Contract
| field | value |
|---|---|
| laneUsed | lane_a_eulerian_comoving_theta_minus_trk |
| observer | eulerian_n |
| foliation | comoving_cartesian_3p1 |
| thetaDefinition | theta=-trK |
| signConvention | ADM |
| fixedScalePolicy | comparison_fixed_raw_global + comparison_fixed_topology_global with no per-case autoscaling |
| visualMetricSourceStage | pre_png_color_buffer |
| outputSize | 320x180 |
| requiredViews | york-surface-3p1, york-surface-rho-3p1, york-topology-normalized-3p1 |

## Canonical Cases
| case_id | case_role | view_id | theta_abs_max | positive_count | negative_count | near_zero_count | signed_lobe_summary | support_overlap_pct | slice_hash | display_buffer_hash | color_buffer_hash | png_path |
|---|---|---|---:|---:|---:|---:|---|---:|---|---|---|---|
| flat_space_zero_theta | zero_baseline | york-surface-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 47e31af3852c206fe4ec9088fe0d8750d6dfcb9d18105b99aaad353c05315f80 | baedbc5691ea0fc360c238c18d955d1960144888bb3ae5de29eee144a3f1c4f2 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-york-surface-3p1-fixed-global-raw.png |
| flat_space_zero_theta | zero_baseline | york-surface-rho-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 47e31af3852c206fe4ec9088fe0d8750d6dfcb9d18105b99aaad353c05315f80 | baedbc5691ea0fc360c238c18d955d1960144888bb3ae5de29eee144a3f1c4f2 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-york-surface-rho-3p1-fixed-global-raw.png |
| flat_space_zero_theta | zero_baseline | york-topology-normalized-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 47e31af3852c206fe4ec9088fe0d8750d6dfcb9d18105b99aaad353c05315f80 | baedbc5691ea0fc360c238c18d955d1960144888bb3ae5de29eee144a3f1c4f2 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-york-topology-normalized-3p1-fixed-global-topology.png |
| alcubierre_control | canonical_control | york-surface-3p1 | 2.7487295579359796e-32 | 110 | 62 | 2132 | fore+/aft- | 3.582995951417004 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | d5e452afcf2a61846656847931748834122e5cfa6865dacfb820a8e13c587347 | dbab057bc4b472329f92b4b76c968c40f0dd940b2620030317820dc6a7bdbc61 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/alcubierre_control-york-surface-3p1-fixed-global-raw.png |
| alcubierre_control | canonical_control | york-surface-rho-3p1 | 7.114586253487799e-33 | 131 | 152 | 2021 | null | 4.527665317139001 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | cae3b8acd46d6c9cf8037d7e78252803541f7b8f3bb826f5f303ba40bd25a984 | c392c929d4249d98da1adc09081a223ca2982a4a7eb74757cbf1d4a8e47338f4 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/alcubierre_control-york-surface-rho-3p1-fixed-global-raw.png |
| alcubierre_control | canonical_control | york-topology-normalized-3p1 | 1 | 110 | 62 | 2132 | fore+/aft- | 3.582995951417004 | 4936224fc543734e35bc42238960df797d2509617e8c55116d71803fdab52637 | 49661f6119408f921db9a13de26ceee1887d8d1e3be1627d273c67fccd32c73c | ef7ae7fcad49e5802aec26323e7d19a8d0c80af54a7862deafbee820525b47c3 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/alcubierre_control-york-topology-normalized-3p1-fixed-global-topology.png |
| natario_control | canonical_control | york-surface-3p1 | 3.0000285034962945e-32 | 106 | 66 | 2132 | null | 3.5762483130904186 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | c1441cf63340dc441cbf378d19fd7cafdaef36bc557327a507e4409be306da30 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_control-york-surface-3p1-fixed-global-raw.png |
| natario_control | canonical_control | york-surface-rho-3p1 | 6.432953078960448e-33 | 131 | 151 | 2022 | null | 4.588394062078272 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 09956be8813bab416c4028a2e1eee01642f871feb3821eecdc0b9990800691e8 | 487fd3d712a5b45081a3a47225a62e43ba8db4c8a52210e6bad257ba26166820 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_control-york-surface-rho-3p1-fixed-global-raw.png |
| natario_control | canonical_control | york-topology-normalized-3p1 | 1 | 106 | 66 | 2132 | null | 3.5762483130904186 | 756e95104436a3bc9c52157a29b111be0eba1a94e76609f9fbb8d74b7c051fe9 | 8002d0c2188738f990c90fac95418f2f3cbf2be7451dd2d20269f78795a554d0 | c1441cf63340dc441cbf378d19fd7cafdaef36bc557327a507e4409be306da30 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_control-york-topology-normalized-3p1-fixed-global-topology.png |
| nhm2_certified | nhm2_current | york-surface-3p1 | 2.9210517400419483e-32 | 106 | 66 | 2132 | null | 3.5762483130904186 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 49ed86846c5b381a9cf2d06eb6c5b78e6f2ef890181014b047a8ffc7496d867b | 5fa3303573f25e9b94e2fde1058d51730b6a97b3352fbdf7c5c7757042c32b7c | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_certified-york-surface-3p1-fixed-global-raw.png |
| nhm2_certified | nhm2_current | york-surface-rho-3p1 | 6.636569271674008e-33 | 131 | 152 | 2021 | null | 4.554655870445344 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | d47e9945d76dfe0a9aa7747653e12ef50afafac521c041ba458b525d855ba116 | 1477812181cb089bb5d7eda5240b96414f7d30ef5e28b083fe9f69ecb14a63ae | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_certified-york-surface-rho-3p1-fixed-global-raw.png |
| nhm2_certified | nhm2_current | york-topology-normalized-3p1 | 1 | 106 | 66 | 2132 | null | 3.5762483130904186 | 5d2f88acb8449d9614b4ddcda7895579540156354a02cb87236867a04d2f5b20 | c52dd696dbf18a4589ebd8d5931ccbfa1be082decbdcf6b7af2b1ed32a831447 | d0ee825a9f3b57cd2a4ac2c85b2e8083b2849b46fc5b1f34416faf83842bf2f8 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_certified-york-topology-normalized-3p1-fixed-global-topology.png |

## Pairwise Metrics
| pair_id | view_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage | diff_png_path |
|---|---|---:|---:|---:|---:|---:|---|---|
| flat_vs_alcubierre | york-surface-3p1 | 0.7764518019567034 | 0.013247999281701723 | 0.00035038467217121753 | 0.011493055555555555 | 2.7487295579359796e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| flat_vs_alcubierre | york-surface-rho-3p1 | 0.7764518019567034 | 0.01676092325066626 | 0.0008425701632432768 | 0.03480902777777778 | 7.114586253487799e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_alcubierre | york-topology-normalized-3p1 | 0.7764518019567034 | 0.014270625344887121 | 0.0003774327013555098 | 0.011493055555555555 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| flat_vs_natario | york-surface-3p1 | 0.7765797642253518 | 0.014275268008031746 | 0.00037802080949111164 | 0.0109375 | 3.0000285034962945e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_natario-york-surface-3p1-diff-amplified.png |
| flat_vs_natario | york-surface-rho-3p1 | 0.7765797642253518 | 0.016761850062469576 | 0.000852374879552628 | 0.03480902777777778 | 6.432953078960448e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_natario | york-topology-normalized-3p1 | 0.7765797642253518 | 0.014275268008031746 | 0.00037802080949111164 | 0.0109375 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-surface-3p1 | 0.7764875062193409 | 0.013951578948218416 | 0.0003690269053290721 | 0.0109375 | 2.9210517400419483e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_nhm2-york-surface-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-surface-rho-3p1 | 0.7764875062193409 | 0.01680545629090338 | 0.0008481510092147537 | 0.03480902777777778 | 6.636569271674008e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_nhm2-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-topology-normalized-3p1 | 0.7764875062193409 | 0.014271485571712206 | 0.0003774978700948603 | 0.0109375 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_vs_nhm2-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-3p1 | 0.0012469161139296696 | 0.0003245026921436903 | 0.00000899390416203951 | 0.008628472222222221 | 7.89767634543462e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_natario-york-surface-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-rho-3p1 | 0.0012469161139296696 | 0.0004018944636779556 | 0.000019659148066201548 | 0.023385416666666665 | 2.036161927135596e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_natario | york-topology-normalized-3p1 | 0.0012469161139296696 | 0.000023546710710167155 | 5.22939396251367e-7 | 0.0027951388888888887 | 0.0015414506196975708 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-3p1 | 0.13559288214795065 | 0.0007036011734714586 | 0.000018693803000375824 | 0.010642361111111111 | 1.7232218210596865e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-rho-3p1 | 0.13559288214795065 | 0.0008348071372539716 | 0.00003845026265297876 | 0.02486111111111111 | 4.78016981813791e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-topology-normalized-3p1 | 0.13559288214795065 | 0.000005671279308556868 | 1.5735866330968186e-7 | 0.002309027777777778 | 0.00035528838634490967 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/nhm2_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-3p1 | 0.1368366108420511 | 0.0010276397123231476 | 0.00002765591753346388 | 0.011006944444444444 | 2.5129894556031486e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-rho-3p1 | 0.1368366108420511 | 0.0010879414840749221 | 0.00004996773352661428 | 0.02779513888888889 | 6.816331745273506e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-topology-normalized-3p1 | 0.1368366108420511 | 0.000028955029950726357 | 6.46035903913374e-7 | 0.0029861111111111113 | 0.0018967390060424805 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/natario_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |

## Flat Zero Checks
| view_id | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | metric_source_stage | diff_png_path |
|---|---:|---:|---:|---|---|
| york-surface-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-vs-zero_expectation-york-surface-3p1-diff-amplified.png |
| york-surface-rho-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-vs-zero_expectation-york-surface-rho-3p1-diff-amplified.png |
| york-topology-normalized-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-03-31/flat_space_zero_theta-vs-zero_expectation-york-topology-normalized-3p1-diff-amplified.png |

## Decision Gate
| field | value |
|---|---|
| calibration_verdict | canonical_controls_validated_nhm2_natario_like |
| control_validation_status | validated |
| nhm2_current_class | natario_like_low_expansion |
| recommended_next_debug_target | nhm2_solve_or_coupling |
| scope_note | Primary comparator = canonical controls rendered through the repo's own Lane A contract. Literature figures remain secondary comparators after convention alignment and do not override this calibration ladder. |

## Control Validation
| control | status | note |
|---|---|---|
| flat_space_zero_theta | validated | Synthetic zero baseline stays zero under the shared Lane A render contract. |
| alcubierre_control | validated | Alcubierre control retains the expected strong signed lobe class under the shared contract. |
| natario_control | validated | Natario control retains the expected low-expansion class under the shared contract. |
| overall | validated | primary comparator = repo-local canonical controls |

## Notes
- mechanism_chain_ready=true
- diagnostic_authority_closed=true
- raw_distance_to_natario=0.0012469161139296696
- raw_distance_to_alcubierre=0.13559288214795065
- Future strange York graphs should first be checked against this ladder before reopening renderer or convention debugging.
- If flat or canonical controls fail, blame the render/convention contract first. If they pass and NHM2 still differs, debug NHM2 solve/coupling or source design next.

