# Warp York Control-Family Proof Pack (2026-04-01)

"This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim."

## Inputs
- baseUrl: `http://127.0.0.1:5050`
- frameEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/frame`
- proxyFrameEndpoint: `null`
- compareDirectAndProxy: `false`
- frameSize: `320x180`
- nhm2SnapshotPath: `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`
- yorkViews: `york-surface-3p1, york-surface-rho-3p1, york-topology-normalized-3p1, york-shell-map-3p1`

## Diagnostic Contract
- diagnosticContractId: `york_diagnostic_contract`
- version: `1`
- observer: `eulerian_n`
- foliation: `comoving_cartesian_3p1`
- theta_definition: `theta=-trK`
- kij_sign_convention: `ADM`
- classificationScope: `diagnostic_local_only`
- reference alcubierre_control: Expected strong signed fore/aft York morphology under this diagnostic lane.
- reference natario_control: Expected low-expansion York morphology under this diagnostic lane.
- feature_set: `theta_abs_max_raw, theta_abs_max_display, positive_count_xz, negative_count_xz, positive_count_xrho, negative_count_xrho, support_overlap_pct, near_zero_theta, signed_lobe_summary, shell_map_activity`
- robustness.enabled: `true`
- robustness.weight_perturbation_pct: `0.1`
- robustness.margin_variants: `0.05, 0.08, 0.12`
- robustness.threshold_variants: `0.4, 0.5, 0.6`
- robustness.feature_drop_sets: `drop_shell_map_activity:shell_map_activity; drop_xrho_counts:positive_count_xrho+negative_count_xrho; drop_display_amplitude:theta_abs_max_display`
- robustness.stability_policy: `stable>=0.8, marginal>=0.6`

## Diagnostic Lanes
| lane_id | active | supported | observer | foliation | theta_definition | kij_sign_convention | semantics_closed | cross_lane_claim_ready | reference_comparison_ready | lane_ready_for_reference_comparison | ready_for_verdict | controls_calibrated | verdict | cause_code |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lane_a_eulerian_comoving_theta_minus_trk | true | true | eulerian_n | comoving_cartesian_3p1 | theta=-trK | ADM | true | true | true | true | true | true | nhm2_low_expansion_family | lane_a_family_congruent |
| lane_b_shift_drift_theta_plus_div_beta_over_alpha | true | true | shift_drift_u(beta_over_alpha) | comoving_cartesian_3p1 | theta=-trK+div(beta/alpha) | K_ij=-1/2*L_n(gamma_ij) | true | false | true | true | true | true | nhm2_low_expansion_family | lane_b_family_congruent |

## Lane Causes
- baselineLaneId: `lane_a_eulerian_comoving_theta_minus_trk`
- baselineLaneCauseCode: `lane_a_family_congruent`
- alternateLaneId: `lane_b_shift_drift_theta_plus_div_beta_over_alpha`
- alternateLaneCauseCode: `lane_b_family_congruent`
- baselineLaneParityStatus: `closed`
- baselineLaneParityCause: `null`

## Lane A Parity (Case Summary)
| case | parity_computed | theta_ktrace_parity_computed | snapshot_identity_complete | render_parity_pass | theta_ktrace_contract_pass | status | cause_code |
|---|---|---|---|---|---|---|---|
| alcubierre_control | true | true | true | true | true | pass | null |
| natario_control | true | true | true | true | true | pass | null |
| nhm2_certified | true | true | true | true | true | pass | null |

## Per-Lane Guard Failures
| lane_id | code | detail |
|---|---|---|
| none | none | none |

## Cross-Lane Comparison
| metric | value |
|---|---|
| baseline_lane_id | lane_a_eulerian_comoving_theta_minus_trk |
| alternate_lane_id | lane_b_shift_drift_theta_plus_div_beta_over_alpha |
| baseline_verdict | nhm2_low_expansion_family |
| alternate_verdict | nhm2_low_expansion_family |
| same_classification | true |
| cross_lane_status | lane_stable_low_expansion_like |
| baseline_controls_calibrated | true |
| alternate_controls_calibrated | true |
| baseline_supported | true |
| alternate_supported | true |
| lane_b_semantics_closed | true |
| lane_b_observer_defined | true |
| lane_b_tensor_inputs_present | true |
| lane_b_geometry_ready | true |
| lane_b_controls_calibrated | true |
| lane_b_parity_closed | true |
| lane_b_cross_lane_claim_ready | false |
| lane_b_reference_comparison_ready | true |

### Cross-Lane Notes
- Both lanes calibrate and agree on NHM2 classification.
- Lane B remains reference-only for advisory comparison; cross-lane claim promotion is disabled by policy.

### Cross-Lane Mechanism Scope
- mechanism_readiness_authoritative_lanes=lane_a_eulerian_comoving_theta_minus_trk
- proxy_reference_lanes=lane_b_shift_drift_theta_plus_div_beta_over_alpha
- cross_lane_mechanism_scope=advisory_only
- lane_b_claim_ready=false
- lane_b_reference_comparison_ready=true

## Runtime Status Provenance
- statusEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/status`
- reachable: `true`
- serviceVersion: `casimirbot.hull-optix-service@1.0.0`
- buildHash: `git-3efe3cf94cd6`
- commitSha: `3efe3cf94cd63d4057f7cb352c665fb48beb6896`
- processStartedAtMs: `1775072269864`
- runtimeInstanceId: `3667d7bd15f5e7b0`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alcubierre_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 | warp.metric.T00.alcubierre.analytic | metric | true | false | null | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | bb4350f5564cfe60cfc3168cb897ae330f72962dfa493f3daa2923afe193c90b | metric | comoving_cartesian | alcubierre_control | warp.metric.T00.alcubierre.analytic | alcubierre | metric_t00_ref | alcubierre_longitudinal_shell_v1 |
| natario_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 | warp.metric.T00.natario.shift | metric | true | false | null | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 0156e60a8f411b065c04c976240bd49221e36d8847971a43148b5077829c6264 | metric | comoving_cartesian | natario_control | warp.metric.T00.natario.shift | natario | metric_t00_ref | natario_shift_shell_v1 |
| nhm2_certified | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | warp.metric.T00.natario_sdf.shift | metric | true | true | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | metric | comoving_cartesian | nhm2_certified | warp.metric.T00.natario_sdf.shift | natario_sdf | metric_t00_ref | nhm2_natario_sdf_shell_v1 |

## Per-View Lane Failure Trace
| case | view | lane | endpoint | ok | http_status | error_code | response_message | preflight_branch | requirement |
|---|---|---|---|---|---:|---|---|---|---|
| alcubierre_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |

## Per-Case Per-View York Evidence
| case | view | ok | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent | theta_channel_hash | slice_array_hash | normalized_slice_hash | support_mask_slice_hash | shell_masked_slice_hash |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| alcubierre_control | york-surface-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 2.5346343032825797e-31 | 2.502656508431406e-33 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | true | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | -6.077930310998365e-36 | 6.077930310998365e-36 | 6.077930310998365e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 2.5346343032825797e-31 | 2.502656508431406e-33 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 2.5346343032825797e-31 | 2.502656508431406e-33 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 0d8916a450a916952264c51d9fb2793e24172827be17bfe29acfebf4acf42f3e | null | null |
| alcubierre_control | york-shell-map-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 2.5346343032825797e-31 | 2.502656508431406e-33 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 306b0d8b06626dba32a3a263b3aec3f7d048ba748f4712c18c494215cfed9ce3 |
| natario_control | york-surface-3p1 | true | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | -2.2445172035460968e-38 | 2.2445172035460968e-38 | 2.2445172035460968e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.296175870263472e-31 | 2.4427801517608084e-33 | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | null | null | null |
| natario_control | york-surface-rho-3p1 | true | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | -6.270497544145466e-36 | 6.270497544145466e-36 | 6.270497544145466e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | 2.296175870263472e-31 | 2.4427801517608084e-33 | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | null | null | null |
| natario_control | york-topology-normalized-3p1 | true | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | -2.2445172035460968e-38 | 2.2445172035460968e-38 | 2.2445172035460968e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.296175870263472e-31 | 2.4427801517608084e-33 | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 14adbde7171680da0d9b7ef3b1e5af42e1ba7692c605aec757ef9fdd1f867653 | null | null |
| natario_control | york-shell-map-3p1 | true | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | -2.2445172035460968e-38 | 2.2445172035460968e-38 | 2.2445172035460968e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.296175870263472e-31 | 2.4427801517608084e-33 | true | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 640acd46aea8f307981079cf78ac4ef36e21afc46f1765ddc6c37772fce27fc9 |
| nhm2_certified | york-surface-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.4053108816836447e-31 | 2.479838998012319e-33 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | true | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 2.4053108816836447e-31 | 2.479838998012319e-33 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.4053108816836447e-31 | 2.479838998012319e-33 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 7a908511e94aaba381c923b1174913691c538002506c9c34edd14c523edfa1d0 | null | null |
| nhm2_certified | york-shell-map-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 2.4053108816836447e-31 | 2.479838998012319e-33 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 55a3cee234383066ecb3637bf9682ad95847a29e35169bed4dad8da35434475f |

## Offline York slice audit (numeric)
| case | view | coordinate_mode | sampling_choice | theta_min_raw | theta_max_raw | theta_abs_max_raw | positive_cells | negative_cells | zero_or_near_zero_cells | offline_slice_hash | fore_pos_total | fore_neg_total | aft_pos_total | aft_neg_total | signed_lobe_summary |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|
| alcubierre_control | york-surface-3p1 | x-z-midplane | x-z midplane | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | 110 | 62 | 2132 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 1.0580088710019705e-37 | -8.60004247246575e-36 | 8.236373698413555e-32 | -3.431627388265291e-30 | fore+/aft- |
| alcubierre_control | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | 131 | 152 | 2021 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | 1.0580088710019705e-37 | -8.60004247246575e-36 | 8.236373698413555e-32 | -3.431627388265291e-30 | fore+/aft- |
| natario_control | york-surface-3p1 | x-z-midplane | x-z midplane | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | 106 | 66 | 2132 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | 131 | 151 | 2022 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | null | null | null | null | null |
| nhm2_certified | york-surface-3p1 | x-z-midplane | x-z midplane | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | 106 | 66 | 2132 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | 131 | 152 | 2021 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null | null | null |

## Lane A Offline-vs-Render Parity
| case | view | offline_theta_hash | offline_neg_ktrace_hash | render_theta_hash | theta_vs_render_max_abs_residual | theta_vs_ktrace_max_abs_residual | sign_delta_render_pos | sign_delta_render_neg | sign_delta_ktrace_pos | sign_delta_ktrace_neg | support_overlap_offline_pct | support_overlap_render_pct | support_overlap_delta_pct | extrema_delta_theta_render_absmax | extrema_delta_theta_ktrace_absmax | identity_complete | status | cause_code |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| alcubierre_control | york-surface-3p1 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| alcubierre_control | york-surface-rho-3p1 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 4.527665317139001 | 45.472334682860996 | 0 | 0 | true | pass | null |
| alcubierre_control | york-topology-normalized-3p1 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| alcubierre_control | york-shell-map-3p1 | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| natario_control | york-surface-3p1 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| natario_control | york-surface-rho-3p1 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | 0 | 0 | 0 | 0 | 0 | 0 | 52.94117647058823 | 4.588394062078272 | 48.35278240850996 | 0 | 0 | true | pass | null |
| natario_control | york-topology-normalized-3p1 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| natario_control | york-shell-map-3p1 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-surface-3p1 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-surface-rho-3p1 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 4.554655870445344 | 45.445344129554655 | 0 | 0 | true | pass | null |
| nhm2_certified | york-topology-normalized-3p1 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-shell-map-3p1 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |

## Case Summary (primary York = york-surface-rho-3p1)
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
| alcubierre_control | alcubierre-like-control | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | -6.077930310998365e-36 | 6.077930310998365e-36 | 6.077930310998365e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 2.5346343032825797e-31 | 2.502656508431406e-33 | true |
| natario_control | natario-like-control | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | -6.270497544145466e-36 | 6.270497544145466e-36 | 6.270497544145466e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | 2.296175870263472e-31 | 2.4427801517608084e-33 | true |
| nhm2_certified | nhm2-certified | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 2.4053108816836447e-31 | 2.479838998012319e-33 | true |

## Classification Features
| case | theta_abs_max_raw | theta_abs_max_display | positive_count_xz | negative_count_xz | positive_count_xrho | negative_count_xrho | support_overlap_pct | near_zero_theta | signed_lobe_summary | shell_map_activity |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| alcubierre_control | 7.114586253487799e-33 | 6.077930310998365e-36 | 110 | 62 | 131 | 152 | 4.527665317139001 | false | fore+/aft- | 0.16666666666666666 |
| natario_control | 6.432953078960448e-33 | 6.270497544145466e-36 | 106 | 66 | 131 | 151 | 4.588394062078272 | false | null | 0.16666666666666666 |
| nhm2_certified | 6.636569271674008e-33 | 6.331835691719585e-36 | 106 | 66 | 131 | 152 | 4.554655870445344 | false | null | 0.16666666666666666 |

## Classification Scoring
| metric | value |
|---|---|
| distance_to_alcubierre_reference | 0.13559288214795065 |
| distance_to_low_expansion_reference | 0.0012469161139296696 |
| reference_margin | 0.134345966034021 |
| winning_reference | natario_control |
| margin_sufficient | true |
| winning_reference_within_threshold | true |
| distinct_by_policy | false |
| margin_min | 0.08 |
| reference_match_threshold | 0.5 |
| distinctness_threshold | 0.5 |
| distance_metric | weighted_normalized_l1 |
| normalization_method | max_abs_reference_target_with_floor |

## Classification Robustness Summary
| metric | value |
|---|---|
| baselineVerdict | nhm2_low_expansion_family |
| stabilityStatus | stable_low_expansion_like |
| dominantVerdict | nhm2_low_expansion_family |
| dominantFraction | 1 |
| stableVerdict | nhm2_low_expansion_family |
| totalVariants | 28 |
| evaluatedVariants | 28 |
| stable_fraction_min | 0.8 |
| marginal_fraction_min | 0.6 |
| count_nhm2_alcubierre_like_family | 0 |
| count_nhm2_low_expansion_family | 28 |
| count_nhm2_distinct_family | 0 |
| count_inconclusive | 0 |

## Classification Robustness Variants
| variant_id | variant_type | weight_feature | weight_scale | margin_override | threshold_override | dropped_features | verdict | winning_reference | reference_margin | margin_sufficient |
|---|---|---|---:|---:|---:|---|---|---|---:|---|
| baseline | baseline | null | null | null | null | none | nhm2_low_expansion_family | natario_control | 0.134345966034021 | true |
| weight:theta_abs_max_raw:plus | weight_perturbation | theta_abs_max_raw | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13269076152482442 | true |
| weight:theta_abs_max_raw:minus | weight_perturbation | theta_abs_max_raw | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13604307445484276 | true |
| weight:theta_abs_max_display:plus | weight_perturbation | theta_abs_max_display | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13323567038553513 | true |
| weight:theta_abs_max_display:minus | weight_perturbation | theta_abs_max_display | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13547492211357381 | true |
| weight:positive_count_xz:plus | weight_perturbation | positive_count_xz | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.133335838924017 | true |
| weight:positive_count_xz:minus | weight_perturbation | positive_count_xz | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13537735897791978 | true |
| weight:negative_count_xz:plus | weight_perturbation | negative_count_xz | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13358576082342344 | true |
| weight:negative_count_xz:minus | weight_perturbation | negative_count_xz | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13512217556484163 | true |
| weight:positive_count_xrho:plus | weight_perturbation | positive_count_xrho | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13296095607490735 | true |
| weight:positive_count_xrho:minus | weight_perturbation | positive_count_xrho | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13576013409753698 | true |
| weight:negative_count_xrho:plus | weight_perturbation | negative_count_xrho | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1328931318752329 | true |
| weight:negative_count_xrho:minus | weight_perturbation | negative_count_xrho | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1358293861750993 | true |
| weight:support_overlap_pct:plus | weight_perturbation | support_overlap_pct | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13336312128842434 | true |
| weight:support_overlap_pct:minus | weight_perturbation | support_overlap_pct | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1353432492123966 | true |
| weight:near_zero_theta:plus | weight_perturbation | near_zero_theta | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1332356687940704 | true |
| weight:near_zero_theta:minus | weight_perturbation | near_zero_theta | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13547492373178585 | true |
| weight:signed_lobe_summary:plus | weight_perturbation | signed_lobe_summary | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1450330528731071 | true |
| weight:signed_lobe_summary:minus | weight_perturbation | signed_lobe_summary | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12338832003445163 | true |
| weight:shell_map_activity:plus | weight_perturbation | shell_map_activity | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1330981706838598 | true |
| weight:shell_map_activity:minus | weight_perturbation | shell_map_activity | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.13561737896178774 | true |
| margin:0.05 | margin_variant | null | null | 0.05 | null | none | nhm2_low_expansion_family | natario_control | 0.134345966034021 | true |
| margin:0.12 | margin_variant | null | null | 0.12 | null | none | nhm2_low_expansion_family | natario_control | 0.134345966034021 | true |
| threshold:0.4 | threshold_variant | null | null | null | 0.4 | none | nhm2_low_expansion_family | natario_control | 0.134345966034021 | true |
| threshold:0.6 | threshold_variant | null | null | null | 0.6 | none | nhm2_low_expansion_family | natario_control | 0.134345966034021 | true |
| drop:drop_shell_map_activity | feature_drop | null | null | null | null | shell_map_activity | nhm2_low_expansion_family | natario_control | 0.14824382458926452 | true |
| drop:drop_xrho_counts | feature_drop | null | null | null | null | positive_count_xrho,negative_count_xrho | nhm2_low_expansion_family | natario_control | 0.17056581859145029 | true |
| drop:drop_display_amplitude | feature_drop | null | null | null | null | theta_abs_max_display | nhm2_low_expansion_family | natario_control | 0.1465592181673653 | true |

## Preconditions
| precondition | pass | policy |
|---|---|---|
| controlsIndependent | true | control families must not share the same theta channel hash |
| allRequiredViewsRendered | true | all required York views must render without fallback |
| provenanceHashesPresent | true | strict York provenance hashes must be present for each requested view |
| runtimeStatusProvenancePresent | true | runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId |
| offlineRenderParityComputed | true | offline vs rendered parity metrics must be computed on the same snapshot |
| thetaKTraceParityComputed | true | offline theta vs offline -K_trace parity metrics must be computed on the same snapshot |
| snapshotIdentityComplete | true | metric_ref_hash/theta hash/K_trace hash/chart/observer/theta_definition/kij_sign_convention/lane_id/timestamp identity must be complete |
| diagnosticParityClosed | true | Diagnostic-lane parity must pass before family verdict is allowed |
| readyForFamilyVerdict | true | family verdict is allowed only when all preconditions pass |

## Source-To-York Bridge
| field | value |
|---|---|
| gatingStatus | legacy_advisory_non_gating |
| gatingBlocksMechanismChain | false |
| statusNote | Legacy source-to-York bridge completeness remains open, but it is advisory-only and does not reopen the closed mechanism chain. |
| sourceContractPresent | true |
| timingAuthorityPresent | false |
| reducedOrderPayloadPresent | true |
| proofPackBrickPresent | true |
| parameterMappingsComplete | false |
| parameterMappingsExplained | false |
| metricRefProvenanceClosed | true |
| bridgeReady | false |
| artifactPath | artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-to-york-provenance-latest.md |

### Source-To-York Legacy Gaps
- bridge_timing_authority_missing
- bridge_param_mapping_missing
- bridge_contract_to_brick_drift_unexplained

## Timing-Authority Audit
| field | value |
|---|---|
| timingAuthorityClosed | true |
| blockingFindings | none |
| advisoryFindings | timing_ts_ratio_policy_split,timing_simulated_profile_active,timing_autoscale_source_active,timing_authority_closed |
| artifactPath | artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-timing-authority-audit-latest.md |

### Timing-Authority Blocking Findings
- none

### Timing-Authority Advisory Findings
- timing_ts_ratio_policy_split
- timing_simulated_profile_active
- timing_autoscale_source_active
- timing_authority_closed

## Brick-Authority Audit
| field | value |
|---|---|
| brickAuthorityClosed | true |
| blockingFindings | none |
| advisoryFindings | brick_audit_harness_override_active,brick_payload_to_request_mismatch,brick_authority_closed |
| artifactPath | artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-brick-authority-audit-latest.md |

### Brick-Authority Blocking Findings
- none

### Brick-Authority Advisory Findings
- brick_audit_harness_override_active
- brick_payload_to_request_mismatch
- brick_authority_closed

## Snapshot-Authority Audit
| field | value |
|---|---|
| snapshotAuthorityClosed | true |
| blockingFindings | none |
| advisoryFindings | snapshot_missing_live_equivalent,snapshot_authority_closed |
| artifactPath | artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-snapshot-authority-audit-latest.md |

### Snapshot-Authority Blocking Findings
- none

### Snapshot-Authority Advisory Findings
- snapshot_missing_live_equivalent
- snapshot_authority_closed

## Diagnostic-Semantic Audit
| field | value |
|---|---|
| diagnosticAuthorityClosed | true |
| blockingFindings | none |
| advisoryFindings | diagnostic_proxy_lane_active,diagnostic_cross_lane_reference_only,diagnostic_cross_lane_requires_normalized_observer,diagnostic_semantics_closed |
| artifactPath | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-diagnostic-semantic-audit-latest.md |

### Diagnostic-Semantic Blocking Findings
- none

### Diagnostic-Semantic Advisory Findings
- diagnostic_proxy_lane_active
- diagnostic_cross_lane_reference_only
- diagnostic_cross_lane_requires_normalized_observer
- diagnostic_semantics_closed

## Source-Stage Audit
| field | value |
|---|---|
| sourceStageReady | true |
| sourceStageCause | none |
| sourceFormulaMismatchClass | direct_vs_reconstructed |
| artifactPath | artifacts/research/full-solve/nhm2-source-stage-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-stage-audit-latest.md |

## Source-Formula Audit
| field | value |
|---|---|
| formulaEquivalent | false |
| reconstructionOnlyComparison | true |
| formulaMismatchClass | direct_vs_reconstructed |
| artifactPath | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-formula-audit-latest.md |

## Presentation Render Layer
| field | value |
|---|---|
| presentationRenderLayerStatus | available |
| fieldSuiteRealizationStatus | realized |
| fieldSuiteReadabilityStatus | flat |
| optixScientificRenderAvailable | true |
| presentationRenderQuality | warning |
| presentationReadinessVerdict | field_realized_but_presentation_flat |
| presentationRenderQualityReasons | presentation_image_low_non_background_fraction,presentation_image_low_contrast,presentation_image_near_uniform |
| presentationRenderBackedByAuthoritativeMetric | true |
| artifactPath | artifacts/research/full-solve/nhm2-york-optix-render-latest.json |
| reportPath | docs/audits/research/warp-nhm2-york-optix-render-latest.md |

## Shift Geometry Visualization
| field | value |
|---|---|
| shiftGeometryStatus | available |
| mandatoryFirstPassFields | beta_magnitude,beta_x,beta_direction_xz |
| mandatoryResidualComparisons | nhm2_minus_natario_beta_residual,nhm2_minus_alcubierre_beta_residual |
| directionOverlayStatus | available |
| directionOverlayCaseDistinctness | mixed |
| directionOverlayWarnings | none |
| constraintContextStatus | deferred_units_and_policy_unresolved |
| artifactPath | artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json |
| reportPath | docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md |

## Render Taxonomy
| field | value |
|---|---|
| authoritativeRenderCategory | diagnostic_lane_a |
| presentationRenderCategory | scientific_3p1_field |
| comparisonRenderCategory | comparison_panel |
| repoOrientationConvention | x_ship_y_port_z_zenith |
| artifactPath | artifacts/research/full-solve/render-taxonomy-latest.json |
| reportPath | docs/audits/research/warp-render-taxonomy-latest.md |
| standardPath | docs/research/render-taxonomy-and-labeling-standard-2026-04-01.md |

## Final Canonical Visual Comparison
| field | value |
|---|---|
| finalComparisonVerdict | canonical_controls_validated_nhm2_natario_like |
| diagnosticVerdict | shared_scale_preserves_natario_like_class |
| presentationVerdict | presentation_layer_has_advisories |
| nhm2ClosestCanonicalFamily | natario_like_low_expansion |
| alcubierreLikeTransitionObserved | no |
| artifactPath | artifacts/research/full-solve/nhm2-canonical-visual-comparison-latest.json |
| reportPath | docs/audits/research/warp-nhm2-canonical-visual-comparison-latest.md |
| memoPath | docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-04-01.md |
| exportDirectory | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-01 |

## Solve-Authority Audit
| field | value |
|---|---|
| yorkClassificationReady | true |
| sourceAuthorityClosed | true |
| timingAuthorityClosed | true |
| brickAuthorityClosed | true |
| snapshotAuthorityClosed | true |
| diagnosticAuthorityClosed | true |
| mechanismChainReady | true |
| artifactPath | artifacts/research/full-solve/nhm2-solve-authority-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-solve-authority-audit-latest.md |

### Solve-Authority Block Reasons
- none

## Guard Failures
| code | detail |
|---|---|
| none | none |

## Decision Table
| id | condition | status | interpretation |
|---|---|---|---|
| preconditions_ready_for_family_verdict | Controls independent, required views rendered, provenance hashes present, runtime status provenance present, diagnostic-lane parity computed/closed, and snapshot identity complete | true | Evidence integrity prerequisites satisfied. |
| offline_render_parity_computed | Offline-vs-render York parity metrics are computed for all required views | true | Offline/render parity metrics are present. |
| theta_ktrace_parity_computed | Offline theta vs -K_trace parity metrics are computed for all required views | true | Theta/K-trace parity metrics are present. |
| snapshot_identity_complete | Solve->brick->render identity fields are complete and consistent for required views | true | Snapshot identity closure is complete. |
| diagnostic_parity_closed | Lane A parity checks pass (render parity + theta_ktrace contract) for required views | true | Lane A parity is closed. |
| renderer_calibrated_by_controls | Controls act as calibration references: Alcubierre strong signed lane + Natario low-expansion lane with stable congruence | true | Control references calibrate this diagnostic lane; NHM2 can be classified relative to them. |
| nhm2_distance_to_alcubierre_reference | Distance from NHM2 morphology feature vector to Alcubierre reference under the York diagnostic contract | true | distance=0.13559288214795065 |
| nhm2_distance_to_low_expansion_reference | Distance from NHM2 morphology feature vector to low-expansion reference under the York diagnostic contract | true | distance=0.0012469161139296696 |
| nhm2_reference_margin_sufficient | Winning reference distance exceeds configured margin and threshold policy | true | margin=0.134345966034021 min=0.08 threshold=0.5 |
| nhm2_distinct_under_current_york_diagnostic | Renderer is calibrated and NHM2 has no clear winning reference by configured margin policy | false | NHM2 has a clear winning reference under configured distance policy, or calibration is not ready. |
| classification_robustness_evaluated | Classification robustness sweep executed over nearby policy choices defined in the contract | true | variants=28 evaluated=28 |
| nhm2_classification_stable_under_contract_perturbations | Current NHM2 family verdict remains dominant across nearby weight/threshold/feature-drop policy variants | true | status=stable_low_expansion_like dominant=nhm2_low_expansion_family fraction=1 |
| nhm2_classification_marginal_under_contract_perturbations | Current NHM2 family verdict remains preferred but with weak dominance under nearby policy variants | false | status=stable_low_expansion_like stable_min=0.8 marginal_min=0.6 |
| nhm2_classification_unstable_under_contract_perturbations | Current NHM2 family verdict is sensitive to nearby policy choices and does not maintain a dominant class | false | status=stable_low_expansion_like counts={"nhm2_alcubierre_like_family":0,"nhm2_low_expansion_family":28,"nhm2_distinct_family":0,"inconclusive":0} |
| renderer_or_conversion_path_clear | Offline-vs-rendered York slice congruence has no hash/remap/suppression/downstream mismatch | true | Renderer/conversion congruence checks pass in this lane. |

## Verdict
- `nhm2_low_expansion_family`

## Notes
- Controls are calibration references in this proof-pack; NHM2 classification is diagnostic-local and not a full theory identity claim.
- lane=lane_a_eulerian_comoving_theta_minus_trk observer=eulerian_n foliation=comoving_cartesian_3p1 theta_definition=theta=-trK
- Control behavior is separated: Alcubierre-like strong signed lane vs Natario-like near-zero lane.
- NHM2 primary York behavior aligns with low-expansion Natario-like control in this run.
- Robustness status=stable_low_expansion_like dominant=nhm2_low_expansion_family fraction=1.
- lane_a_eulerian_comoving_theta_minus_trk parity status=closed cause=null.
- Support-overlap parity deltas are currently advisory diagnostics and do not gate Lane A pass/fail.
- Baseline lane cause code=lane_a_family_congruent.
- Classification contract york_diagnostic_contract@v1 uses weighted_normalized_l1 with margin=0.08.
- cross-lane status=lane_stable_low_expansion_like baseline=nhm2_low_expansion_family alternate=nhm2_low_expansion_family
- Alternate lane cause code=lane_b_family_congruent.
- Both lanes calibrate and agree on NHM2 classification.
- Lane B remains reference-only for advisory comparison; cross-lane claim promotion is disabled by policy.
- source_to_york_bridge_status=legacy_advisory_non_gating gating_blocks_mechanism_chain=false legacy_bridge_ready=false reasons=bridge_timing_authority_missing,bridge_param_mapping_missing,bridge_contract_to_brick_drift_unexplained
- timing_authority_closed=true blocking=none advisory=timing_ts_ratio_policy_split,timing_simulated_profile_active,timing_autoscale_source_active,timing_authority_closed
- brick_authority_closed=true blocking=none advisory=brick_audit_harness_override_active,brick_payload_to_request_mismatch,brick_authority_closed
- snapshot_authority_closed=true blocking=none advisory=snapshot_missing_live_equivalent,snapshot_authority_closed
- diagnostic_authority_closed=true blocking=none advisory=diagnostic_proxy_lane_active,diagnostic_cross_lane_reference_only,diagnostic_cross_lane_requires_normalized_observer,diagnostic_semantics_closed
- source_formula_mismatch_class=direct_vs_reconstructed formula_equivalent=false reconstruction_only_comparison=true
- source_stage_ready=true cause=none
- solve_authority_chain_ready=true reasons=none
- york_render_debug_verdict=render_matches_authoritative_geometry paper_comparison_verdict=paper_match_after_convention_alignment dominant_difference_cause=real_nhm2_morphology_difference
- york_fixed_scale_render_verdict=shared_scale_preserves_natario_like_class figure1_overlay_verdict=real_nhm2_vs_alcubierre_morphology_difference is_nhm2_close_to_nasa_fig1=no
- presentation_render_layer_status=available field_suite_realization_status=realized field_suite_readability_status=flat optix_scientific_render_available=true presentation_render_quality=warning presentation_readiness_verdict=field_realized_but_presentation_flat presentation_render_backed_by_authoritative_metric=true
- shift_geometry_status=available case_count=4 residual_count=2 direction_overlay_status=available direction_overlay_case_distinctness=mixed constraint_context_status=deferred_units_and_policy_unresolved
- york_calibration_verdict=canonical_controls_validated_nhm2_natario_like nhm2_current_class=natario_like_low_expansion ablation_decision=no_single_ablation_explains_morphology parameter_sweep_verdict=alcubierre_like_not_found source_coupling_redesign_verdict=source_coupling_redesign_still_natario_locked authoritative_morphology_change_observed=yes best_redesign_variant=nhm2_redesign_source_profile_simplified_signed redesign_first_drop_stage=none redesign_next_action=use_realized_lane_a_redesign_evidence
- deeper_reformulation_verdict=deeper_reformulation_still_natario_locked authoritative_reformulation_change_observed=yes best_reformulation_variant=nhm2_reform_fore_aft_antisymmetric_driver reformulation_next_action=use_realized_reformulation_evidence
- render_taxonomy authoritative=diagnostic_lane_a presentation=scientific_3p1_field comparison=comparison_panel

