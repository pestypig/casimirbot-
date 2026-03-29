# Warp York Control-Family Proof Pack (2026-03-29)

"This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim."

## Inputs
- baseUrl: `http://127.0.0.1:5050`
- frameEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/frame`
- proxyFrameEndpoint: `null`
- compareDirectAndProxy: `false`
- frameSize: `320x180`
- nhm2SnapshotPath: `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`
- yorkViews: `york-surface-3p1, york-surface-rho-3p1, york-topology-normalized-3p1, york-shell-map-3p1`

## Runtime Status Provenance
- statusEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/status`
- reachable: `true`
- serviceVersion: `casimirbot.hull-optix-service@1.0.0`
- buildHash: `git-c03f7e9bd607`
- commitSha: `c03f7e9bd6071267c73516e6e37a705e4cf680b7`
- processStartedAtMs: `1774827426205`
- runtimeInstanceId: `b3ec6327a94edcd9`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alcubierre_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 | warp.metric.T00.alcubierre.analytic | metric | true | false | null | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | bb4350f5564cfe60cfc3168cb897ae330f72962dfa493f3daa2923afe193c90b | metric | comoving_cartesian | alcubierre_control | warp.metric.T00.alcubierre.analytic | alcubierre | metric_t00_ref | alcubierre_longitudinal_shell_v1 |
| natario_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 | warp.metric.T00.natario.shift | metric | true | false | null | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | warp.metric.T00.natario_sdf.shift | metric | true | true | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | metric | comoving_cartesian | nhm2_certified | warp.metric.T00.natario_sdf.shift | natario_sdf | metric_t00_ref | nhm2_natario_sdf_shell_v1 |

## Per-View Lane Failure Trace
| case | view | lane | endpoint | ok | http_status | error_code | response_message | preflight_branch | requirement |
|---|---|---|---|---|---:|---|---|---|---|
| alcubierre_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| alcubierre_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| natario_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |
| nhm2_certified | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | true | 200 | null | null | null | null |

## Per-Case Per-View York Evidence
| case | view | ok | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent | theta_channel_hash | slice_array_hash | normalized_slice_hash | support_mask_slice_hash | shell_masked_slice_hash |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| alcubierre_control | york-surface-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 0 | 0 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | true | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | -6.077930310998365e-36 | 6.077930310998365e-36 | 6.077930310998365e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 0 | 0 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 3ae52f2e738ca07a16114aa4060393d98142ed06aef8647e4c7ae82b61570f45 | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 0 | 0 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | 0d8916a450a916952264c51d9fb2793e24172827be17bfe29acfebf4acf42f3e | null | null |
| alcubierre_control | york-shell-map-3p1 | true | -2.7487295579359796e-32 | 2.5014000914944986e-34 | 2.7487295579359796e-32 | -2.0718284675547209e-38 | 2.0718284675547209e-38 | 2.0718284675547209e-38 | x-z-midplane | x-z midplane | 3.582995951417004 | 0 | 0 | true | d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d | 6e696fcd1e7dda9704135312d4dcdbf86fafbc96c019c8c700de1b1aeaab44fd | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 306b0d8b06626dba32a3a263b3aec3f7d048ba748f4712c18c494215cfed9ce3 |
| natario_control | york-surface-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | true | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | -6.270497544145466e-36 | 6.270497544145466e-36 | 6.270497544145466e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | null | null | null | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 2280724ce476a83fe95f2699cbd61ba60e626c8ecc0c673c3652407ab3568a89 | null | null | null |
| natario_control | york-topology-normalized-3p1 | true | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | -2.2445172035460968e-38 | 2.2445172035460968e-38 | 2.2445172035460968e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | null | null | null | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | 14adbde7171680da0d9b7ef3b1e5af42e1ba7692c605aec757ef9fdd1f867653 | null | null |
| natario_control | york-shell-map-3p1 | true | -3.0000285034962945e-32 | 2.730087466494686e-34 | 3.0000285034962945e-32 | -2.2445172035460968e-38 | 2.2445172035460968e-38 | 2.2445172035460968e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | null | null | null | f424ae7b6c9e4a551f4d9d181396e3d1d428ff0055280758a0e5be00a29f93f7 | 8e30159c50538c8cc60a058d4fbbb7636c9be763cc2e4e150f8dedbaf7ecc4e4 | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 640acd46aea8f307981079cf78ac4ef36e21afc46f1765ddc6c37772fce27fc9 |
| nhm2_certified | york-surface-3p1 | false | null | null | null | null | null | null | null | null | null | 0 | 0 | true | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | true | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 7a908511e94aaba381c923b1174913691c538002506c9c34edd14c523edfa1d0 | null | null |
| nhm2_certified | york-shell-map-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 55a3cee234383066ecb3637bf9682ad95847a29e35169bed4dad8da35434475f |

## Case Summary (primary York = york-surface-rho-3p1)
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
| alcubierre_control | alcubierre-like-control | -7.114586253487799e-33 | 5.064018183905395e-35 | 7.114586253487799e-33 | -6.077930310998365e-36 | 6.077930310998365e-36 | 6.077930310998365e-36 | x-rho | x-rho cylindrical remap | 4.527665317139001 | 0 | 0 | true |
| natario_control | natario-like-control | -6.432953078960448e-33 | 4.6373183263317124e-35 | 6.432953078960448e-33 | -6.270497544145466e-36 | 6.270497544145466e-36 | 6.270497544145466e-36 | x-rho | x-rho cylindrical remap | 4.588394062078272 | null | null | null |
| nhm2_certified | nhm2-certified | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true |

## Preconditions
| precondition | pass | policy |
|---|---|---|
| controlsIndependent | false | control families must not share the same theta channel hash |
| allRequiredViewsRendered | false | all required York views must render without fallback |
| provenanceHashesPresent | true | strict York provenance hashes must be present for each requested view |
| runtimeStatusProvenancePresent | true | runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId |
| readyForFamilyVerdict | false | family verdict is allowed only when all preconditions pass |

## Guard Failures
| code | detail |
|---|---|
| proof_pack_required_view_render_failed | natario_control:york-surface-3p1:lane=single:status=null:error=null:message=This operation was aborted:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | nhm2_certified:york-surface-3p1:lane=single:status=null:error=null:message=This operation was aborted:branch=unknown:requirement=unknown |
| proof_pack_controls_collapsed_source_branch_missing | alc_source=metric nat_source=null alc_source_branch=metric_t00_ref nat_source_branch=null |
| proof_pack_controls_not_independent | alc_theta_hash=d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d nat_theta_hash=null alc_k_trace_hash=bb4350f5564cfe60cfc3168cb897ae330f72962dfa493f3daa2923afe193c90b nat_k_trace_hash=null |

## Decision Table
| id | condition | status | interpretation |
|---|---|---|---|
| preconditions_ready_for_family_verdict | Controls independent, required views rendered, provenance hashes present, and runtime status provenance present | false | Evidence prerequisites failed; verdict must remain inconclusive. |
| renderer_or_conversion_wrong_if_alc_control_fails | Alcubierre control fails to show expected fore/aft York numerically (signed non-near-zero) | false | Skipped because preconditions failed. |
| renderer_fine_if_alc_works_nat_low | Alcubierre control works and Natario control remains near-zero expansion | false | Skipped because preconditions failed. |
| nhm2_not_wrong_if_matches_nat_low_expansion | NHM2 matches Natario-like low-expansion behavior under same York pipeline | false | Skipped because preconditions failed. |
| solve_family_mismatch_if_nhm2_intended_alcubierre | NHM2 was intended Alcubierre-like but numerically matches Natario-like low-expansion behavior | false | Skipped because preconditions failed. |

## Verdict
- `inconclusive`

## Notes
- Family verdict forced to inconclusive because proof-pack preconditions are not satisfied.
- Guard failures: proof_pack_required_view_render_failed:natario_control:york-surface-3p1:lane=single:status=null:error=null:message=This operation was aborted:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:nhm2_certified:york-surface-3p1:lane=single:status=null:error=null:message=This operation was aborted:branch=unknown:requirement=unknown; proof_pack_controls_collapsed_source_branch_missing:alc_source=metric nat_source=null alc_source_branch=metric_t00_ref nat_source_branch=null; proof_pack_controls_not_independent:alc_theta_hash=d1d4c080b91cb42131b4b9f68ce746b08e7f05d0a044b45771696fd11fdd099d nat_theta_hash=null alc_k_trace_hash=bb4350f5564cfe60cfc3168cb897ae330f72962dfa493f3daa2923afe193c90b nat_k_trace_hash=null
- Alcubierre control did not present a strong signed fore/aft York lane in primary view; renderer/conversion suspicion is raised by policy.
- NHM2 primary York behavior aligns with low-expansion Natario-like control in this run.

