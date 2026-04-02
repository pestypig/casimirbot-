# Warp York Canonical Calibration (2026-04-02)

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
| outputSize | 1280x720 |
| requiredViews | york-surface-3p1, york-surface-rho-3p1, york-topology-normalized-3p1 |

## Canonical Cases
| case_id | case_role | view_id | theta_abs_max | positive_count | negative_count | near_zero_count | signed_lobe_summary | support_overlap_pct | slice_hash | display_buffer_hash | color_buffer_hash | png_path |
|---|---|---|---:|---:|---:|---:|---|---:|---|---|---|---|
| flat_space_zero_theta | zero_baseline | york-surface-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 5c2129991e69eee0bd17a144db27e2829615f739e6f96746c68617f90cfebdb3 | aa2cf9ec6cd5a8e4ea43302ff0c0c4dcdeb589edc47761a0aa07ccd764a7f372 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-york-surface-3p1-fixed-global-raw.png |
| flat_space_zero_theta | zero_baseline | york-surface-rho-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 5c2129991e69eee0bd17a144db27e2829615f739e6f96746c68617f90cfebdb3 | aa2cf9ec6cd5a8e4ea43302ff0c0c4dcdeb589edc47761a0aa07ccd764a7f372 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-york-surface-rho-3p1-fixed-global-raw.png |
| flat_space_zero_theta | zero_baseline | york-topology-normalized-3p1 | 0 | 0 | 0 | 2304 | mixed_or_flat | 1 | 2d07a41ae992770085117e9815300bfd0730745883e60b24aaad5e69dfc087ae | 5c2129991e69eee0bd17a144db27e2829615f739e6f96746c68617f90cfebdb3 | aa2cf9ec6cd5a8e4ea43302ff0c0c4dcdeb589edc47761a0aa07ccd764a7f372 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-york-topology-normalized-3p1-fixed-global-topology.png |
| alcubierre_control | canonical_control | york-surface-3p1 | 1.7817745171052893e-32 | 106 | 66 | 2132 | fore+/aft- | 3.582995951417004 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 9e108353359002224d8b0d79efa9b79f4fa0d8fc5cf6c1f70f0ad26eb5f47152 | 7197c35010765f5e28d0f22e64b682a1e67ab826c7cfbd607288f3754a1ddf1d | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/alcubierre_control-york-surface-3p1-fixed-global-raw.png |
| alcubierre_control | canonical_control | york-surface-rho-3p1 | 4.6117989868238336e-33 | 131 | 150 | 2023 | null | 4.527665317139001 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 229db68cf149c7d9bad37f646c74570ee8bbc3789d74dc5e93646f19159bcd1c | 4b68f667d258b7d6082f867852cb53560fcc47d365521eef402c02b78be7d806 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/alcubierre_control-york-surface-rho-3p1-fixed-global-raw.png |
| alcubierre_control | canonical_control | york-topology-normalized-3p1 | 1 | 106 | 66 | 2132 | fore+/aft- | 3.582995951417004 | 20ba7be7ae71d327e3a00f520f1ed876a42fc22244cc0d51442790457c9bc0f0 | 729750d050a77964710655b2f09eb8fc62b846043356f6984867693bc7644027 | 04dac0848591901dc3bff54377649396208fd3a413f79874ecb9e526483c5bb6 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/alcubierre_control-york-topology-normalized-3p1-fixed-global-topology.png |
| natario_control | canonical_control | york-surface-3p1 | 1.9446711446959833e-32 | 106 | 66 | 2132 | null | 3.5762483130904186 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 9939de49501b95a00dacc84bf55bf65c2e518ba7fb0830be5180da1674f15ca0 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_control-york-surface-3p1-fixed-global-raw.png |
| natario_control | canonical_control | york-surface-rho-3p1 | 4.169953068210798e-33 | 130 | 149 | 2025 | null | 4.588394062078272 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 71d572b11a573f3d933dce71511c00b6f37afb0590ef3fa9b0e794ee218fdd49 | 127e71a860f478b70f968abe817a60a45bc0fbef37402ad628c0ccab08aaaaac | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_control-york-surface-rho-3p1-fixed-global-raw.png |
| natario_control | canonical_control | york-topology-normalized-3p1 | 1 | 106 | 66 | 2132 | null | 3.5762483130904186 | 1a7ebdca41dba7aa2db2172ed6fcf90a00f247d88f0f6f3b0a06f2cb404932fa | 46bbb301184de58d1a54e82a06274576b90d4d5e4b713ea8831e6a8ebf0a8161 | 9939de49501b95a00dacc84bf55bf65c2e518ba7fb0830be5180da1674f15ca0 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_control-york-topology-normalized-3p1-fixed-global-topology.png |
| nhm2_certified | nhm2_current | york-surface-3p1 | 1.8934768963497341e-32 | 106 | 66 | 2132 | null | 3.5762483130904186 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 801495cdd3d0dd273e8d40f3329d1587ab124296eee7dfa5fc8ea86c677b7cc8 | 20bb0b984cf12a2f8dc8c2041cc7ac787628f7d663862377ac7e58f622c26c02 | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_certified-york-surface-3p1-fixed-global-raw.png |
| nhm2_certified | nhm2_current | york-surface-rho-3p1 | 4.301940512657002e-33 | 131 | 150 | 2023 | null | 4.554655870445344 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 6cd7756b5f5ea97fae92ff7f625e5de6a375bd4f1e7844b66d8aeac6330fe246 | f67c2ce5bb3444001850f64a8ef6dc181bf413acb700e1fd0b2b91b019bca0dc | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_certified-york-surface-rho-3p1-fixed-global-raw.png |
| nhm2_certified | nhm2_current | york-topology-normalized-3p1 | 1 | 106 | 66 | 2132 | null | 3.5762483130904186 | acfcdf19c9d405166491bc7654a30b72c375edc935f7d5246594fa0a405f81d4 | dfefaa5b447bc9cb6d67b372e29005928bde869ee0e68d5fe61c6b2f1094f3be | 2bb93d8c9c35a0f3f04a3e2c4a8e52955ec932697600c032ca78990e860ad53e | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_certified-york-topology-normalized-3p1-fixed-global-topology.png |

## Pairwise Metrics
| pair_id | view_id | raw_control_distance | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | diff_abs_max | metric_source_stage | diff_png_path |
|---|---|---:|---:|---:|---:|---:|---|---|
| flat_vs_alcubierre | york-surface-3p1 | 0.7761387753726 | 0.012660367682187966 | 0.00032734009419267056 | 0.011496310763888889 | 1.7817745171052893e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| flat_vs_alcubierre | york-surface-rho-3p1 | 0.7761387753726 | 0.017076176135733843 | 0.0008500161497937913 | 0.035137803819444445 | 4.6117989868238336e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_alcubierre | york-topology-normalized-3p1 | 0.7761387753726 | 0.013637636272586972 | 0.0003526118337070381 | 0.011496310763888889 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| flat_vs_natario | york-surface-3p1 | 0.7762967054031266 | 0.013643014670862109 | 0.0003532685986107226 | 0.011008029513888889 | 1.9446711446959833e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_natario-york-surface-3p1-diff-amplified.png |
| flat_vs_natario | york-surface-rho-3p1 | 0.7762967054031266 | 0.01698304646712295 | 0.0008578031849764333 | 0.035137803819444445 | 4.169953068210798e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_natario | york-topology-normalized-3p1 | 0.7762967054031266 | 0.013643014670862109 | 0.0003532685986107226 | 0.011008029513888889 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-surface-3p1 | 0.7761954920053937 | 0.013332913240758542 | 0.0003447801274728799 | 0.011008029513888889 | 1.8934768963497341e-32 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_nhm2-york-surface-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-surface-rho-3p1 | 0.7761954920053937 | 0.017056511868434925 | 0.0008545067273919223 | 0.035137803819444445 | 4.301940512657002e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_nhm2-york-surface-rho-3p1-diff-amplified.png |
| flat_vs_nhm2 | york-topology-normalized-3p1 | 0.7761954920053937 | 0.013638633296445596 | 0.000352694453628115 | 0.011008029513888889 | 1 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_vs_nhm2-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-3p1 | 0.0020422635435102315 | 0.0003110357906100846 | 0.000008488471137842656 | 0.008501519097222222 | 5.119424834624915e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_natario-york-surface-3p1-diff-amplified.png |
| nhm2_vs_natario | york-surface-rho-3p1 | 0.0020422635435102315 | 0.00040604845471451056 | 0.000019619250978060918 | 0.023544921875 | 1.319874444462035e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_natario-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_natario | york-topology-normalized-3p1 | 0.0020422635435102315 | 0.000024772624613186523 | 5.741449826075408e-7 | 0.002883029513888889 | 0.001541420817375183 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_natario-york-topology-normalized-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-3p1 | 0.12547084479018483 | 0.0006725696250388191 | 0.00001748159159722399 | 0.010519748263888889 | 1.1170237924444484e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-surface-rho-3p1 | 0.12547084479018483 | 0.0008554154641668251 | 0.00003900347394416046 | 0.025321180555555555 | 3.0985847416683183e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| nhm2_vs_alcubierre | york-topology-normalized-3p1 | 0.12547084479018483 | 0.000005894869338489697 | 1.6374970329679646e-7 | 0.0023122829861111113 | 0.0003552734851837158 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/nhm2_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-3p1 | 0.1275099245102431 | 0.0009830737323783462 | 0.000025944730374495958 | 0.011008029513888889 | 1.62896627590694e-33 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_vs_alcubierre-york-surface-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-surface-rho-3p1 | 0.1275099245102431 | 0.0011245043609558688 | 0.00005100165809406339 | 0.028414713541666668 | 4.418459186130353e-34 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_vs_alcubierre-york-surface-rho-3p1-diff-amplified.png |
| natario_vs_alcubierre | york-topology-normalized-3p1 | 0.1275099245102431 | 0.000030460033295028186 | 7.05773914984642e-7 | 0.002883029513888889 | 0.001896694302558899 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/natario_vs_alcubierre-york-topology-normalized-3p1-diff-amplified.png |

## Flat Zero Checks
| view_id | pixel_rms | mean_absolute_pixel_difference | changed_pixel_fraction | metric_source_stage | diff_png_path |
|---|---:|---:|---:|---|---|
| york-surface-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-vs-zero_expectation-york-surface-3p1-diff-amplified.png |
| york-surface-rho-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-vs-zero_expectation-york-surface-rho-3p1-diff-amplified.png |
| york-topology-normalized-3p1 | 0 | 0 | 0 | pre_png_color_buffer | artifacts/research/full-solve/rendered-york-calibration-panel-2026-04-02/flat_space_zero_theta-vs-zero_expectation-york-topology-normalized-3p1-diff-amplified.png |

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
- raw_distance_to_natario=0.0020422635435102315
- raw_distance_to_alcubierre=0.12547084479018483
- Future strange York graphs should first be checked against this ladder before reopening renderer or convention debugging.
- If flat or canonical controls fail, blame the render/convention contract first. If they pass and NHM2 still differs, debug NHM2 solve/coupling or source design next.

