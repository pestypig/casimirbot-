# Warp York Control-Family Proof Pack (2026-04-03)

"This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim."

## Inputs
- baseUrl: `http://127.0.0.1:5050`
- frameEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/frame`
- proxyFrameEndpoint: `null`
- compareDirectAndProxy: `false`
- frameSize: `1280x720`
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
- buildHash: `git-8eb45c63aaec`
- commitSha: `8eb45c63aaec0f6c84bccdd5b909703182c7aee1`
- processStartedAtMs: `1775098305938`
- runtimeInstanceId: `634289663b204efc`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alcubierre_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 | warp.metric.T00.alcubierre.analytic | metric | true | false | null | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | 1991ab78e6dabb124b1192f169a1ca5ffaac16064a324155b0db10c55ad53975 | metric | comoving_cartesian | alcubierre_control | warp.metric.T00.alcubierre.analytic | alcubierre | metric_t00_ref | alcubierre_longitudinal_shell_v1 |
| natario_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 | warp.metric.T00.natario.shift | metric | true | false | null | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | f4237afe4ed25a3e207beed268abe1bd0b416db4b1124b399d03f7b72855b5b9 | metric | comoving_cartesian | natario_control | warp.metric.T00.natario.shift | natario | metric_t00_ref | natario_shift_shell_v1 |
| nhm2_certified | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | warp.metric.T00.natario_sdf.shift | metric | true | true | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9 | metric | comoving_cartesian | nhm2_certified | warp.metric.T00.natario_sdf.shift | natario_sdf | metric_t00_ref | nhm2_natario_sdf_shell_v1 |

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
| alcubierre_control | york-surface-3p1 | true | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | -1.3429953397688866e-38 | 1.3429953397688866e-38 | 1.3429953397688866e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 1.6429942140666303e-31 | 1.622265744871608e-33 | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | true | -4.6117989868238336e-33 | 3.282585480812693e-35 | 4.6117989868238336e-33 | -3.9398210677636645e-36 | 3.9398210677636645e-36 | 3.9398210677636645e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 1.6429942140666303e-31 | 1.622265744871608e-33 | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | true | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | -1.3429953397688866e-38 | 1.3429953397688866e-38 | 1.3429953397688866e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 1.6429942140666303e-31 | 1.622265744871608e-33 | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 0e150065cfcaed6ad7a76224658f06e8f07b1b0eacdeb38ee5f1d397ba26c0df | null | null |
| alcubierre_control | york-shell-map-3p1 | true | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | -1.3429953397688866e-38 | 1.3429953397688866e-38 | 1.3429953397688866e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 1.6429942140666303e-31 | 1.622265744871608e-33 | true | be14ae2be79dfc0daf3744abbdb11dd528120d0ff933a2e94399c699d859e4d2 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 3e992dccd92fa90f1a447032caeec8d8fa5de38de167c95fedc085dc4d44dc74 |
| natario_control | york-surface-3p1 | true | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | -1.4549344242154673e-38 | 1.4549344242154673e-38 | 1.4549344242154673e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.4884214089109028e-31 | 1.58345288387813e-33 | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | null | null | null |
| natario_control | york-surface-rho-3p1 | true | -4.169953068210798e-33 | 3.005990741709247e-35 | 4.169953068210798e-33 | -4.06464696641494e-36 | 4.06464696641494e-36 | 4.06464696641494e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | 1.4884214089109028e-31 | 1.58345288387813e-33 | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | null | null | null |
| natario_control | york-topology-normalized-3p1 | true | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | -1.4549344242154673e-38 | 1.4549344242154673e-38 | 1.4549344242154673e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.4884214089109028e-31 | 1.58345288387813e-33 | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | ef49ed822e92d8fd53d9aba95e24e3c40ad31cf1a7fd20297503395e6f339c45 | null | null |
| natario_control | york-shell-map-3p1 | true | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | -1.4549344242154673e-38 | 1.4549344242154673e-38 | 1.4549344242154673e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.4884214089109028e-31 | 1.58345288387813e-33 | true | eb52edc62314a15486e9450739542e7a02b1a1308c3098de9eeea15242d2da91 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 69cec6c7fa02075d7ae1923e7a4e985e274e277801d4b10f8c36348aeb46f9b5 |
| nhm2_certified | york-surface-3p1 | true | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | -1.409760345231489e-38 | 1.409760345231489e-38 | 1.409760345231489e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.5591646572837844e-31 | 1.6074751290615296e-33 | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | true | -4.301940512657002e-33 | 3.1046137419910904e-35 | 4.301940512657002e-33 | -4.104406850315978e-36 | 4.104406850315978e-36 | 4.104406850315978e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 1.5591646572837844e-31 | 1.6074751290615296e-33 | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | true | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | -1.409760345231489e-38 | 1.409760345231489e-38 | 1.409760345231489e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.5591646572837844e-31 | 1.6074751290615296e-33 | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 868083c62cd8fd82711a117469cf3d40e9a64166ad245b693d6cf85c810f1db4 | null | null |
| nhm2_certified | york-shell-map-3p1 | true | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | -1.409760345231489e-38 | 1.409760345231489e-38 | 1.409760345231489e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 1.5591646572837844e-31 | 1.6074751290615296e-33 | true | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 3f2ca6fc9c70e49d1a5b34bc398352548a2cd7cb1181d93680b27816d6a74e8b |

## Offline York slice audit (numeric)
| case | view | coordinate_mode | sampling_choice | theta_min_raw | theta_max_raw | theta_abs_max_raw | positive_cells | negative_cells | zero_or_near_zero_cells | offline_slice_hash | fore_pos_total | fore_neg_total | aft_pos_total | aft_neg_total | signed_lobe_summary |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|
| alcubierre_control | york-surface-3p1 | x-z-midplane | x-z midplane | -1.7817745171052893e-32 | 1.6214514231740795e-34 | 1.7817745171052893e-32 | 106 | 66 | 2132 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 6.858192344625204e-38 | -5.5746966477241904e-36 | 5.338961891869647e-32 | -2.2244409879252395e-30 | fore+/aft- |
| alcubierre_control | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -4.6117989868238336e-33 | 3.282585480812693e-35 | 4.6117989868238336e-33 | 131 | 150 | 2023 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 6.858192344625204e-38 | -5.5746966477241904e-36 | 5.338961891869647e-32 | -2.2244409879252395e-30 | fore+/aft- |
| natario_control | york-surface-3p1 | x-z-midplane | x-z midplane | -1.9446711446959833e-32 | 1.7696904443623858e-34 | 1.9446711446959833e-32 | 106 | 66 | 2132 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -4.169953068210798e-33 | 3.005990741709247e-35 | 4.169953068210798e-33 | 130 | 149 | 2025 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | null | null | null | null | null |
| nhm2_certified | york-surface-3p1 | x-z-midplane | x-z midplane | -1.8934768963497341e-32 | 1.7231026415445475e-34 | 1.8934768963497341e-32 | 106 | 66 | 2132 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | x-rho | x-rho cylindrical remap | -4.301940512657002e-33 | 3.1046137419910904e-35 | 4.301940512657002e-33 | 131 | 150 | 2023 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | null | null | null | null | null |

## Lane A Offline-vs-Render Parity
| case | view | offline_theta_hash | offline_neg_ktrace_hash | render_theta_hash | theta_vs_render_max_abs_residual | theta_vs_ktrace_max_abs_residual | sign_delta_render_pos | sign_delta_render_neg | sign_delta_ktrace_pos | sign_delta_ktrace_neg | support_overlap_offline_pct | support_overlap_render_pct | support_overlap_delta_pct | extrema_delta_theta_render_absmax | extrema_delta_theta_ktrace_absmax | identity_complete | status | cause_code |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| alcubierre_control | york-surface-3p1 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| alcubierre_control | york-surface-rho-3p1 | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 8d00dab23c6b35556685b49bca9fb320e0c1490e94b16fe7f4df0a3cc5f11aec | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 4.527665317139001 | 45.472334682860996 | 0 | 0 | true | pass | null |
| alcubierre_control | york-topology-normalized-3p1 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| alcubierre_control | york-shell-map-3p1 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | e25023be05ebd64c5c0e3e7ca6207e96e2cdcd44d17e54276bd6ba5d71a3eef8 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.582995951417004 | 13.083670715249664 | 0 | 0 | true | pass | null |
| natario_control | york-surface-3p1 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| natario_control | york-surface-rho-3p1 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 50fecc9d515e4999fbfe04f93fea00f00c16c61b2d996a5c7bd6171dd9df7eb5 | 0 | 0 | 0 | 0 | 0 | 0 | 52.94117647058823 | 4.588394062078272 | 48.35278240850996 | 0 | 0 | true | pass | null |
| natario_control | york-topology-normalized-3p1 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| natario_control | york-shell-map-3p1 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | c82865f3bc90e7bfabd1b68940d042a071d58c5b9888c908b7cd68d62599a832 | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-surface-3p1 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-surface-rho-3p1 | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 9570cbd075d37efc277627c03528b5c36dfbafd7b806bb286542756784bd489d | 0 | 0 | 0 | 0 | 0 | 0 | 50 | 4.554655870445344 | 45.445344129554655 | 0 | 0 | true | pass | null |
| nhm2_certified | york-topology-normalized-3p1 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |
| nhm2_certified | york-shell-map-3p1 | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | e57803f51bc35788f4b9a8469f4f74667b71a6d816ff4e06c62c979301dbf18c | 0 | 0 | 0 | 0 | 0 | 0 | 16.666666666666668 | 3.5762483130904186 | 13.090418353576249 | 0 | 0 | true | pass | null |

## Case Summary (primary York = york-surface-rho-3p1)
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
| alcubierre_control | alcubierre-like-control | -4.6117989868238336e-33 | 3.282585480812693e-35 | 4.6117989868238336e-33 | -3.9398210677636645e-36 | 3.9398210677636645e-36 | 3.9398210677636645e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 1.6429942140666303e-31 | 1.622265744871608e-33 | true |
| natario_control | natario-like-control | -4.169953068210798e-33 | 3.005990741709247e-35 | 4.169953068210798e-33 | -4.06464696641494e-36 | 4.06464696641494e-36 | 4.06464696641494e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | 1.4884214089109028e-31 | 1.58345288387813e-33 | true |
| nhm2_certified | nhm2-certified | -4.301940512657002e-33 | 3.1046137419910904e-35 | 4.301940512657002e-33 | -4.104406850315978e-36 | 4.104406850315978e-36 | 4.104406850315978e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 1.5591646572837844e-31 | 1.6074751290615296e-33 | true |

## Classification Features
| case | theta_abs_max_raw | theta_abs_max_display | positive_count_xz | negative_count_xz | positive_count_xrho | negative_count_xrho | support_overlap_pct | near_zero_theta | signed_lobe_summary | shell_map_activity |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| alcubierre_control | 4.6117989868238336e-33 | 3.9398210677636645e-36 | 106 | 66 | 131 | 150 | 4.527665317139001 | false | fore+/aft- | 0.16666666666666666 |
| natario_control | 4.169953068210798e-33 | 4.06464696641494e-36 | 106 | 66 | 130 | 149 | 4.588394062078272 | false | null | 0.16666666666666666 |
| nhm2_certified | 4.301940512657002e-33 | 4.104406850315978e-36 | 106 | 66 | 131 | 150 | 4.554655870445344 | false | null | 0.16666666666666666 |

## Classification Scoring
| metric | value |
|---|---|
| distance_to_alcubierre_reference | 0.12547084479018483 |
| distance_to_low_expansion_reference | 0.0020422635435102315 |
| reference_margin | 0.1234285812466746 |
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
| baseline | baseline | null | null | null | null | none | nhm2_low_expansion_family | natario_control | 0.1234285812466746 | true |
| weight:theta_abs_max_raw:plus | weight_perturbation | theta_abs_max_raw | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12190696754029245 | true |
| weight:theta_abs_max_raw:minus | weight_perturbation | theta_abs_max_raw | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1249887168190411 | true |
| weight:theta_abs_max_display:plus | weight_perturbation | theta_abs_max_display | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1224085113588996 | true |
| weight:theta_abs_max_display:minus | weight_perturbation | theta_abs_max_display | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12446579516617694 | true |
| weight:positive_count_xz:plus | weight_perturbation | positive_count_xz | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12215612164619342 | true |
| weight:positive_count_xz:minus | weight_perturbation | positive_count_xz | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12472782947032379 | true |
| weight:negative_count_xz:plus | weight_perturbation | negative_count_xz | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12215612164619342 | true |
| weight:negative_count_xz:minus | weight_perturbation | negative_count_xz | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12472782947032379 | true |
| weight:positive_count_xrho:plus | weight_perturbation | positive_count_xrho | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12207742486489177 | true |
| weight:positive_count_xrho:minus | weight_perturbation | positive_count_xrho | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12480818302596862 | true |
| weight:negative_count_xrho:plus | weight_perturbation | negative_count_xrho | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12208739312385665 | true |
| weight:negative_count_xrho:minus | weight_perturbation | negative_count_xrho | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12479800490892028 | true |
| weight:support_overlap_pct:plus | weight_perturbation | support_overlap_pct | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12252476617378884 | true |
| weight:support_overlap_pct:minus | weight_perturbation | support_overlap_pct | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12434567377078848 | true |
| weight:near_zero_theta:plus | weight_perturbation | near_zero_theta | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12240851032728059 | true |
| weight:near_zero_theta:minus | weight_perturbation | near_zero_theta | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12446579621513405 | true |
| weight:signed_lobe_summary:plus | weight_perturbation | signed_lobe_summary | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1342504506139996 | true |
| weight:signed_lobe_summary:minus | weight_perturbation | signed_lobe_summary | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.11233274050296162 | true |
| weight:shell_map_activity:plus | weight_perturbation | shell_map_activity | 1.1 | null | null | none | nhm2_low_expansion_family | natario_control | 0.1222821857552194 | true |
| weight:shell_map_activity:minus | weight_perturbation | shell_map_activity | 0.9 | null | null | none | nhm2_low_expansion_family | natario_control | 0.12459667507550748 | true |
| margin:0.05 | margin_variant | null | null | 0.05 | null | none | nhm2_low_expansion_family | natario_control | 0.1234285812466746 | true |
| margin:0.12 | margin_variant | null | null | 0.12 | null | none | nhm2_low_expansion_family | natario_control | 0.1234285812466746 | true |
| threshold:0.4 | threshold_variant | null | null | null | 0.4 | none | nhm2_low_expansion_family | natario_control | 0.1234285812466746 | true |
| threshold:0.6 | threshold_variant | null | null | null | 0.6 | none | nhm2_low_expansion_family | natario_control | 0.1234285812466746 | true |
| drop:drop_shell_map_activity | feature_drop | null | null | null | null | shell_map_activity | nhm2_low_expansion_family | natario_control | 0.1361970551687444 | true |
| drop:drop_xrho_counts | feature_drop | null | null | null | null | positive_count_xrho,negative_count_xrho | nhm2_low_expansion_family | natario_control | 0.15779139926592134 | true |
| drop:drop_display_amplitude | feature_drop | null | null | null | null | theta_abs_max_display | nhm2_low_expansion_family | natario_control | 0.13464935001219966 | true |

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
| statusNote | Legacy source-to-York bridge is closed under the current serialization/readiness policy; optional timing-authority fields remain advisory-only and do not reopen the mechanism chain. |
| sourceContractPresent | true |
| timingAuthorityPresent | true |
| timingAuthorityStatus | recognized_required_fields_present_optional_fields_partial |
| timingAuthorityArtifactRecognized | true |
| timingAuthorityRequiredFields | tauLC_ms,tauPulse_ms,TS_ratio |
| timingAuthorityOptionalMissingFields | TS,epsilon,isHomogenized |
| reducedOrderPayloadPresent | true |
| proofPackBrickPresent | true |
| parameterMappingsComplete | true |
| parameterMappingsExplained | true |
| metricRefProvenanceClosed | true |
| bridgeReady | true |
| bridgeOpenFieldCount | 0 |
| bridgeClosedFieldCount | 19 |
| closureCandidateStatus | closed_with_current_serialization |
| bridgeClosurePolicy | close_with_current_serialization |
| artifactPath | artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-to-york-provenance-latest.md |

### Source-To-York Legacy Gaps
- none

### Source-To-York Advisory Reasons
- bridge_timing_authority_optional_fields_partial

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
| comparisonMode | authoritative_direct_vs_reconstructed_proxy |
| mismatchReason | proxy_vs_metric_term_gap |
| additionalMismatchReasons | duty_definition_mismatch,timing_source_mismatch,missing_term_mapping |
| sourceFormulaInterpretationPolicy | expected_proxy_vs_metric_gap_non_promotable |
| parityExpected | false |
| promotionBlockedByMismatch | true |
| laneAUnaffectedByMismatch | true |
| tolerancePolicySummary | relTol=1e-9; absTol=1e-12; rule=final_metric_numeric_parity |
| directFormulaId | canonical_qi_forensics.metricT00Si_Jm3 |
| reconstructedFormulaId | recovery_search_case.metricT00Si_Jm3 |
| termMismatchCount | 1 |
| artifactPath | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-formula-audit-latest.md |

## Source / Mechanism Maturity
| field | value |
|---|---|
| maturityTier | reduced_order_advisory |
| claimBoundaryPolicy | bounded_advisory_non_promotable_until_explicit_promotion_contract |
| authoritativeStatus | non_authoritative |
| promotionEligibility | blocked |
| promotionBlockers | proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,timing_authority_optional_fields_partial,reference_only_cross_lane_scope |
| sourceFormulaInterpretationPolicy | expected_proxy_vs_metric_gap_non_promotable |
| sourceToYorkBridgeClosurePolicy | close_with_current_serialization |
| timingAuthorityStatus | recognized_required_fields_present_optional_fields_partial |
| bridgeReady | true |
| bridgeGatingStatus | legacy_advisory_non_gating |
| parityExpected | false |
| promotionBlocked | true |
| laneAUnaffected | true |
| laneAAuthoritative | true |
| referenceOnlyCrossLaneScope | true |
| promotionContractId | nhm2_source_mechanism_promotion_contract.v1 |
| promotionContractStatus | active_for_bounded_claims_only |
| selectedPromotionRoute | formal_exemption_route |
| promotionSummary | Promotion contract keeps the parity route blocked by a derivation-class gap and activates the formal exemption route only for three bounded non-authoritative advisory claim subsets; broader promotion remains blocked. |
| summary | Source/mechanism layer is reduced-order advisory only: the formal exemption route is active for bounded source annotation, mechanism context, and reduced-order comparison claims, while promotion beyond that remains blocked by direct-vs-proxy non-parity, proxy-vs-metric term gap, partial optional timing authority, and reference-only cross-lane scope. |
| artifactPath | artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-mechanism-maturity-latest.md |

### Allowed Claims
- source_to_york_provenance_closed_under_current_serialization_policy
- reduced_order_source_selectors_serialized_and_explained
- reconstructed_proxy_path_usable_for_advisory_comparison
- lane_a_classification_unaffected_by_source_mechanism_advisories
- bounded_non_authoritative_source_annotation
- bounded_non_authoritative_mechanism_context
- bounded_non_authoritative_reduced_order_comparison

### Disallowed Claims
- reconstructed_proxy_path_formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_is_authoritative
- unbounded_non_authoritative_source_mechanism_promotion_claim
- source_mechanism_layer_closes_physical_viability
- shift_plus_lapse_branch_is_proof_promoted

### Required For Promotion
- direct_proxy_parity_route_for_equivalence_or_cross_lane_claims
- promotion_grade_timing_authority_contract_if_optional_fields_required
- first_principles_or_authoritative_source_realization_contract
- explicit_cross_lane_promotion_contract_beyond_reference_only_scope

## Source / Mechanism Promotion Contract
| field | value |
|---|---|
| contractId | nhm2_source_mechanism_promotion_contract.v1 |
| contractStatus | active_for_bounded_claims_only |
| selectedPromotionRoute | formal_exemption_route |
| promotionDecisionPolicy | parity_required_for_equivalence_or_cross_lane_promotion_exemption_limited_to_bounded_non_authoritative_claims |
| claimsRequiringParityCount | 3 |
| claimsEligibleUnderExemptionCount | 3 |
| claimsBlockedEvenWithExemptionCount | 5 |
| exemptionEligibleClaimCount | 3 |
| exemptionBlockedClaimCount | 5 |
| exemptionRouteActivated | true |
| activeClaimSetCount | 3 |
| inactiveClaimSetCount | 5 |
| sourceMechanismActiveClaimSet | bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison |
| sourceMechanismBlockedClaimSet | source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |
| sourceMechanismForbiddenPromotions | formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope,nhm2_shift_lapse_proof_promotion |
| sourceMechanismReferenceOnlyScope | true |
| sourceMechanismNonAuthoritative | true |
| sourceMechanismFormulaEquivalent | false |
| nhm2ShiftLapseFamilyAuthorityStatus | candidate_authoritative_solve_family |
| nhm2ShiftLapseTransportCertificationStatus | bounded_transport_fail_closed_reference_only |
| nhm2ShiftLapseStatusSummary | Distinct full-solve family candidate in provenance/model-selection; bounded transport proof surfaces remain fail-closed and reference-only until later promotion gates land. |
| sourceMechanismConsumerSummary | Only the bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims are active; formula equivalence remains false, the parity route remains blocked, viability and cross-lane promotions remain blocked, the source/mechanism lane remains non-authoritative, warp.metric.T00.nhm2_shift_lapse is treated as a candidate authoritative solve family in provenance/model-selection, and its bounded transport proof-bearing surfaces remain fail-closed and reference_only. |
| exemptionRouteStatus | satisfied |
| activationScope | bounded_non_authoritative_advisory_only_reference_only_cross_lane |
| activationSummary | Formal exemption route is active only for the three bounded advisory claim subsets; warp.metric.T00.nhm2_shift_lapse is treated as a candidate authoritative solve family in provenance/model-selection, bounded transport proof-bearing surfaces remain fail-closed/reference-only, stronger claims remain blocked, and Lane A remains authoritative. |
| routeFeasibilityStatus | blocked_by_derivation_class_difference |
| routeBlockingClass | direct_metric_vs_reconstructed_proxy_derivation_gap |
| dominantMismatchTerm | final_metricT00Si_Jm3 |
| nextClosureAction | emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract |
| exemptionRouteSummary | Exemption route is active only for bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims; it cannot grant broad non-authoritative promotion, formula equivalence, authority, viability promotion, or cross-lane scope expansion. |
| promotionSummary | Promotion contract keeps the parity route blocked by a derivation-class gap and activates the formal exemption route only for three bounded non-authoritative advisory claim subsets; broader promotion remains blocked. |
| artifactPath | artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-mechanism-promotion-contract-latest.md |

## Source / Mechanism Parity-Route Feasibility
| field | value |
|---|---|
| routeId | direct_proxy_parity_route |
| routeStatus | available_but_unmet |
| routeFeasibilityStatus | blocked_by_derivation_class_difference |
| routeBlockingClass | direct_metric_vs_reconstructed_proxy_derivation_gap |
| dominantMismatchTerm | final_metricT00Si_Jm3 |
| matchedTermsCount | 5 |
| unmatchedTermsCount | 2 |
| nextClosureAction | emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract |
| parityRouteSummary | Parity route is not realistically closable in current architecture without a derivation-class upgrade: the reconstructed path already matches rhoMetric_Jm3 but does not carry a mapped direct-metric closure term beyond rhoMetric, and the authoritative direct path emits final_metricT00Si_Jm3 only as an aggregate. |
| artifactPath | artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json |
| reportPath | docs/audits/research/warp-nhm2-source-mechanism-parity-route-feasibility-latest.md |

## Presentation Render Layer
| field | value |
|---|---|
| presentationRenderLayerStatus | available |
| fieldSuiteRealizationStatus | collapsed |
| fieldSuiteReadabilityStatus | flat |
| optixScientificRenderAvailable | true |
| presentationRenderQuality | failed |
| presentationReadinessVerdict | field_realized_but_presentation_flat |
| presentationRenderQualityReasons | presentation_distinct_fields_collapsed |
| presentationRenderBackedByAuthoritativeMetric | true |
| artifactPath | artifacts/research/full-solve/nhm2-york-optix-render-latest.json |
| reportPath | docs/audits/research/warp-nhm2-york-optix-render-latest.md |

## Shift Geometry Visualization
| field | value |
|---|---|
| shiftGeometryStatus | available |
| mandatoryFirstPassFields |  |
| mandatoryResidualComparisons |  |
| directionOverlayStatus | available |
| directionOverlayCaseDistinctness | mixed |
| directionOverlayInterpretationPolicy | normalize_non_material_internal_variance_after_sampled_field_match |
| directionOverlayWarnings | none |
| constraintContextStatus | deferred_units_and_policy_unresolved |
| artifactPath | artifacts/research/full-solve/nhm2-shift-geometry-visualization-latest.json |
| reportPath | docs/audits/research/warp-nhm2-shift-geometry-visualization-latest.md |

## Curvature Invariant Visualization
| field | value |
|---|---|
| artifactType | nhm2_curvature_invariant_visualization/v1 |
| suiteStatus | available |
| surfacedFields | kretschmann,ricci4,ricci2,weylI |
| slicePlanes | x-z-midplane |
| invariantCrosscheckStatus | unpopulated |
| momentumDensityStatus | deferred_not_yet_first_class |
| artifactPath | artifacts/research/full-solve/nhm2-curvature-invariant-visualization-latest.json |
| reportPath | docs/audits/research/warp-nhm2-curvature-invariant-visualization-latest.md |

## Warp Worldline Contract
| field | value |
|---|---|
| artifactType | nhm2_warp_worldline_proof/v1 |
| contractVersion | warp_worldline_contract/v1 |
| status | bounded_solve_backed |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| metricT00Ref | warp.metric.T00.natario_sdf.shift |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_local_comoving_shell_cross |
| representativeSampleId | centerline_center |
| sampleGeometryFamilyId | nhm2_centerline_shell_cross |
| sampleCount | 9 |
| dtau_dt_representative | 1 |
| dtau_dt_min | 1 |
| dtau_dt_max | 1 |
| normalizationResidualMaxAbs | 0 |
| transportVariationStatus | descriptor_varied_dtau_flat |
| transportInformativenessStatus | descriptor_informative_local_only |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| flatnessInterpretation | The bounded local-comoving family exposes solve-backed local shift variation, but the low-g bounded regime keeps dtau_dt numerically flat. This is informative for bounded transport differentiation only, not for route-time or speed claims. |
| certifiedTransportMeaning | bounded_local_shift_descriptor_gradient_only |
| eligibleNextProducts | bounded_cruise_envelope_preflight |
| routeTimeStatus | deferred |
| transportInterpretation | bounded_local_comoving_descriptor_not_speed |
| nonClaims | not route-time certified,not mission-time certified,not max-speed certified,not full worldline physics closure,not Lane A proof replacement |
| artifactPath | artifacts/research/full-solve/nhm2-warp-worldline-proof-latest.json |
| reportPath | docs/audits/research/warp-nhm2-warp-worldline-proof-latest.md |

## Cruise Envelope Preflight
| field | value |
|---|---|
| artifactType | nhm2_cruise_envelope_preflight/v1 |
| contractVersion | warp_cruise_envelope_preflight/v1 |
| cruisePreflightStatus | bounded_preflight_ready |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_cruise_preflight |
| preflightQuantityId | bounded_local_transport_descriptor_norm |
| preflightQuantityMeaning | Dimensionless norm ||beta_eff|| of the certified local-comoving effective transport descriptor across the shell-cross family. This is fixed-chart local descriptor support only, not a ship speed. |
| candidateCount | 10 |
| admissibleCount | 9 |
| rejectedCount | 1 |
| boundedCruisePreflightBand.min | 3.6531425984160347e-16 |
| boundedCruisePreflightBand.max | 1.9546804721038186e-15 |
| boundedCruisePreflightBand.units | dimensionless |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| transportVariationStatus | descriptor_varied_dtau_flat |
| routeTimeStatus | deferred |
| eligibleNextProducts | route_time_worldline_extension |
| nonClaims | not max-speed certified,not route-time certified,not mission-time certified,not relativistic-advantage certified,not viability-promotion evidence |
| artifactPath | artifacts/research/full-solve/nhm2-cruise-envelope-preflight-latest.json |
| reportPath | docs/audits/research/warp-nhm2-cruise-envelope-preflight-latest.md |

## Route-Time Worldline
| field | value |
|---|---|
| artifactType | nhm2_route_time_worldline/v1 |
| contractVersion | warp_route_time_worldline/v1 |
| routeTimeWorldlineStatus | bounded_route_time_ready |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_route_time_local_probe |
| routeModelId | nhm2_bounded_local_probe_lambda |
| routeParameterName | lambda |
| progressionSampleCount | 5 |
| coordinateTimeSummary.start | 0 |
| coordinateTimeSummary.end | 0.0000033587237719787246 |
| coordinateTimeSummary.span | 0.0000033587237719787246 |
| properTimeSummary.start | 0 |
| properTimeSummary.end | 0.0000033587237719787246 |
| properTimeSummary.span | 0.0000033587237719787246 |
| sampleFamilyAdequacy | adequate_for_bounded_cruise_preflight |
| transportVariationStatus | descriptor_varied_dtau_flat |
| routeTimeStatus | bounded_local_segment_certified |
| nextEligibleProducts | mission_time_estimator |
| nonClaims | not mission-time certified,not max-speed certified,not route ETA to a real target,not relativistic-advantage certified,not viability-promotion evidence |
| artifactPath | artifacts/research/full-solve/nhm2-route-time-worldline-latest.json |
| reportPath | docs/audits/research/warp-nhm2-route-time-worldline-latest.md |

## Mission-Time Estimator
| field | value |
|---|---|
| artifactType | nhm2_mission_time_estimator/v1 |
| contractVersion | warp_mission_time_estimator/v1 |
| missionTimeEstimatorStatus | bounded_target_coupled_estimate_ready |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| validityRegimeId | nhm2_bounded_target_coupled_mission_estimator |
| estimatorModelId | nhm2_repeated_local_probe_segment_estimator |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| targetFrame | heliocentric-icrs |
| coordinateTimeEstimate.seconds | 137755965.9171795 |
| coordinateTimeEstimate.years | 4.3652231448899625 |
| properTimeEstimate.seconds | 137755965.9171795 |
| properTimeEstimate.years | 4.3652231448899625 |
| routeTimeStatus | bounded_local_segment_certified |
| nextEligibleProducts | relativistic_vs_nonrelativistic_comparison,cruise_envelope_semantics_upgrade |
| nonClaims | not max-speed certified,not viability-promotion evidence,not full route dynamic certified,not unconstrained ETA for arbitrary targets,not relativistic-advantage certified |
| artifactPath | artifacts/research/full-solve/nhm2-mission-time-estimator-latest.json |
| reportPath | docs/audits/research/warp-nhm2-mission-time-estimator-latest.md |

## Mission-Time Comparison
| field | value |
|---|---|
| artifactType | nhm2_mission_time_comparison/v1 |
| contractVersion | warp_mission_time_comparison/v1 |
| missionTimeComparisonStatus | bounded_target_coupled_comparison_ready |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| comparisonModelId | nhm2_classical_no_time_dilation_reference |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| targetFrame | heliocentric-icrs |
| warpCoordinateYears | 4.3652231448899625 |
| warpProperYears | 4.3652231448899625 |
| classicalReferenceYears | 4.3652231448899625 |
| properMinusCoordinateSeconds | 0 |
| properMinusClassicalSeconds | 0 |
| comparisonInterpretationStatus | no_certified_relativistic_differential_detected |
| comparisonReadiness | paired_classical_reference_certified_speed_comparators_deferred |
| deferredComparators | speed_based_nonrelativistic_reference,speed_based_flat_sr_reference,route_map_eta_surface,broad_relativistic_advantage_certification |
| nonClaims | not max-speed certified,not viability-promotion evidence,not full route dynamic certified,not unconstrained ETA for arbitrary targets,not a speed-based relativistic or nonrelativistic comparator |
| artifactPath | artifacts/research/full-solve/nhm2-mission-time-comparison-latest.json |
| reportPath | docs/audits/research/warp-nhm2-mission-time-comparison-latest.md |

## Cruise Envelope
| field | value |
|---|---|
| artifactType | nhm2_cruise_envelope/v1 |
| contractVersion | warp_cruise_envelope/v1 |
| cruiseEnvelopeStatus | bounded_cruise_envelope_certified |
| certified | true |
| sourceSurface | nhm2_metric_local_comoving_transport_cross |
| chart | comoving_cartesian |
| observerFamily | ship_centerline_local_comoving |
| cruiseEnvelopeModelId | nhm2_route_consistent_descriptor_band |
| envelopeQuantityId | bounded_local_transport_descriptor_norm |
| targetId | alpha-cen-a |
| targetName | Alpha Centauri A |
| admissibleBand.min | 3.6531425984160347e-16 |
| admissibleBand.max | 1.9546804721038186e-15 |
| admissibleBand.units | dimensionless |
| representativeValue | 1.9546804721038186e-15 |
| comparisonConsistencyStatus | consistent_with_zero_differential_comparison |
| routeTimeStatus | bounded_local_segment_certified |
| missionTimeStatus | bounded_target_coupled_estimate_ready |
| nonClaims | not max-speed certified,not viability-promotion evidence,not a route-map ETA surface,not unconstrained relativistic advantage certified,not full route dynamic certified |
| artifactPath | artifacts/research/full-solve/nhm2-cruise-envelope-latest.json |
| reportPath | docs/audits/research/warp-nhm2-cruise-envelope-latest.md |

## In-Hull Proper Acceleration
| field | value |
|---|---|
| artifactType | nhm2_in_hull_proper_acceleration/v1 |
| contractVersion | warp_in_hull_proper_acceleration/v1 |
| inHullProperAccelerationStatus | bounded_in_hull_profile_certified |
| certified | true |
| sourceSurface | nhm2_metric_in_hull_proper_acceleration_profile |
| chart | comoving_cartesian |
| observerFamily | eulerian_comoving_cabin |
| accelerationQuantityId | experienced_proper_acceleration_magnitude |
| sampleCount | 7 |
| representative_mps2 | 0 |
| representative_g | 0 |
| min_mps2 | 0 |
| max_mps2 | 0 |
| resolutionAdequacy | adequate_constant_lapse_zero_profile |
| fallbackUsed | false |
| nonClaims | not curvature-gravity certified,not comfort-certified,not safety-certified,not viability-promotion evidence,not source-mechanism promotion |
| artifactPath | artifacts/research/full-solve/nhm2-in-hull-proper-acceleration-latest.json |
| reportPath | docs/audits/research/warp-nhm2-in-hull-proper-acceleration-latest.md |

## Proof Surface Manifest
| field | value |
|---|---|
| artifactType | nhm2_proof_surface_manifest/v1 |
| contractVersion | warp_proof_surface_manifest/v1 |
| proofSurfaceManifestStatus | bounded_stack_publication_hardened |
| certified | true |
| publicationMode | bounded_stack_latest_sequential_single_writer |
| proofSurfaceCount | 8 |
| trackedRepoEvidenceStatus | repo_tracked_latest_evidence |
| proofPackChecksum | 1100d08a297b1034bacf09ed2f0f999240e286076ae1af40de9d49b4b0b3b694 |
| manifestPath | artifacts/research/full-solve/nhm2-proof-surface-manifest-latest.json |
| manifestReportPath | docs/audits/research/warp-nhm2-proof-surface-manifest-latest.md |

## Render Taxonomy
| field | value |
|---|---|
| authoritativeRenderCategory | diagnostic_lane_a |
| presentationRenderCategory | scientific_3p1_field |
| comparisonRenderCategory | comparison_panel |
| repoOrientationConvention | x_ship_y_port_z_zenith |
| artifactPath | artifacts/research/full-solve/render-taxonomy-latest.json |
| reportPath | docs/audits/research/warp-render-taxonomy-latest.md |
| standardPath | docs/research/render-taxonomy-and-labeling-standard-2026-04-02.md |

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
| memoPath | docs/research/nhm2-canonical-visual-comparison-decision-memo-2026-04-02.md |
| exportDirectory | artifacts/research/full-solve/rendered-york-final-comparison-panel-2026-04-02 |

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
| nhm2_distance_to_alcubierre_reference | Distance from NHM2 morphology feature vector to Alcubierre reference under the York diagnostic contract | true | distance=0.12547084479018483 |
| nhm2_distance_to_low_expansion_reference | Distance from NHM2 morphology feature vector to low-expansion reference under the York diagnostic contract | true | distance=0.0020422635435102315 |
| nhm2_reference_margin_sufficient | Winning reference distance exceeds configured margin and threshold policy | true | margin=0.1234285812466746 min=0.08 threshold=0.5 |
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
- source_to_york_bridge_status=legacy_advisory_non_gating gating_blocks_mechanism_chain=false legacy_bridge_ready=true closure_policy=close_with_current_serialization closure_candidate_status=closed_with_current_serialization blocking=none advisory=bridge_timing_authority_optional_fields_partial
- timing_authority_closed=true blocking=none advisory=timing_ts_ratio_policy_split,timing_simulated_profile_active,timing_autoscale_source_active,timing_authority_closed
- brick_authority_closed=true blocking=none advisory=brick_audit_harness_override_active,brick_payload_to_request_mismatch,brick_authority_closed
- snapshot_authority_closed=true blocking=none advisory=snapshot_missing_live_equivalent,snapshot_authority_closed
- diagnostic_authority_closed=true blocking=none advisory=diagnostic_proxy_lane_active,diagnostic_cross_lane_reference_only,diagnostic_cross_lane_requires_normalized_observer,diagnostic_semantics_closed
- source_formula_mismatch_class=direct_vs_reconstructed formula_equivalent=false reconstruction_only_comparison=true
- source_stage_ready=true cause=none
- solve_authority_chain_ready=true reasons=none
- york_render_debug_verdict=render_matches_authoritative_geometry paper_comparison_verdict=paper_match_after_convention_alignment dominant_difference_cause=real_nhm2_morphology_difference
- york_fixed_scale_render_verdict=shared_scale_preserves_natario_like_class figure1_overlay_verdict=real_nhm2_vs_alcubierre_morphology_difference is_nhm2_close_to_nasa_fig1=no
- york_calibration_verdict=canonical_controls_validated_nhm2_natario_like nhm2_current_class=natario_like_low_expansion ablation_decision=no_single_ablation_explains_morphology parameter_sweep_verdict=alcubierre_like_not_found source_coupling_redesign_verdict=source_coupling_redesign_still_natario_locked authoritative_morphology_change_observed=yes best_redesign_variant=nhm2_redesign_source_profile_simplified_signed redesign_first_drop_stage=none redesign_next_action=use_realized_lane_a_redesign_evidence
- deeper_reformulation_verdict=deeper_reformulation_still_natario_locked authoritative_reformulation_change_observed=yes best_reformulation_variant=nhm2_reform_fore_aft_antisymmetric_driver reformulation_next_action=use_realized_reformulation_evidence
- source_mechanism_parity_route_feasibility=blocked_by_derivation_class_difference blocking_class=direct_metric_vs_reconstructed_proxy_derivation_gap dominant_mismatch_term=final_metricT00Si_Jm3
- source_mechanism_maturity=reduced_order_advisory claim_boundary_policy=bounded_advisory_non_promotable_until_explicit_promotion_contract promotion_blockers=proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,timing_authority_optional_fields_partial,reference_only_cross_lane_scope lane_a_authoritative=true
- source_mechanism_promotion_contract_status=active_for_bounded_claims_only selected_route=formal_exemption_route policy=parity_required_for_equivalence_or_cross_lane_promotion_exemption_limited_to_bounded_non_authoritative_claims exemption_route_status=satisfied exemption_route_activated=true active_claim_set=bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison
- source_mechanism_consumer_scope=active_claims:bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison blocked_claims:source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope reference_only_scope=true formula_equivalence=false parity_route=blocked_by_derivation_class_difference nhm2_shift_lapse_family_status=candidate_authoritative_solve_family nhm2_shift_lapse_transport_status=bounded_transport_fail_closed_reference_only
- presentation_render_layer_status=available field_suite_realization_status=collapsed field_suite_readability_status=flat optix_scientific_render_available=true presentation_render_quality=failed presentation_readiness_verdict=field_realized_but_presentation_flat presentation_render_backed_by_authoritative_metric=true
- shift_geometry_status=available case_count=4 residual_count=2 direction_overlay_status=available direction_overlay_case_distinctness=mixed constraint_context_status=deferred_units_and_policy_unresolved
- curvature_invariant_suite_status=available surfaced_fields=kretschmann,ricci4,ricci2,weylI invariant_crosscheck_status=unpopulated momentum_density_status=deferred_not_yet_first_class
- render_taxonomy authoritative=diagnostic_lane_a presentation=scientific_3p1_field comparison=comparison_panel
- warp_worldline_status=bounded_solve_backed certified=true source_surface=nhm2_metric_local_comoving_transport_cross sample_count=9 route_time=deferred
- cruise_preflight_status=bounded_preflight_ready quantity=bounded_local_transport_descriptor_norm candidate_count=10 admissible_count=9 route_time=deferred
- route_time_worldline_status=bounded_route_time_ready route_model=nhm2_bounded_local_probe_lambda progression_samples=5 route_time=bounded_local_segment_certified
- mission_time_estimator_status=bounded_target_coupled_estimate_ready target=alpha-cen-a route_time=bounded_local_segment_certified coordinate_years=4.3652231448899625
- mission_time_comparison_status=bounded_target_coupled_comparison_ready target=alpha-cen-a interpretation=no_certified_relativistic_differential_detected proper_minus_coordinate_seconds=0
- cruise_envelope_status=bounded_cruise_envelope_certified quantity=bounded_local_transport_descriptor_norm representative_value=1.9546804721038186e-15 comparison_consistency=consistent_with_zero_differential_comparison
- in_hull_proper_acceleration_status=bounded_in_hull_profile_certified observer=eulerian_comoving_cabin representative_mps2=0 resolution=adequate_constant_lapse_zero_profile
- proof_surface_manifest_status=bounded_stack_publication_hardened publication_mode=bounded_stack_latest_sequential_single_writer proof_surface_count=8 tracked_repo_evidence=repo_tracked_latest_evidence
