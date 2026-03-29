# Warp York Control-Family Proof Pack (2026-03-29)

"This control-family proof pack is a render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim."

## Inputs
- baseUrl: `http://127.0.0.1:5050`
- frameEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/frame`
- proxyFrameEndpoint: `null`
- compareDirectAndProxy: `false`
- frameSize: `1280x720`
- nhm2SnapshotPath: `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`
- yorkViews: `york-surface-3p1, york-surface-rho-3p1, york-topology-normalized-3p1, york-shell-map-3p1`

## Runtime Status Provenance
- statusEndpoint: `http://127.0.0.1:6062/api/helix/hull-render/status`
- reachable: `true`
- serviceVersion: `casimirbot.hull-optix-service@1.0.0`
- buildHash: `git-9275a6c16b8e`
- commitSha: `9275a6c16b8e4c2f858cc70dff7199c0b57e1dce`
- processStartedAtMs: `1774816014258`
- runtimeInstanceId: `b3862ae1ff792fde`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alcubierre_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 | warp.metric.T00.alcubierre.analytic | metric | true | false | null | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | york-control.warp.metric.T00.alcubierre.analytic | comoving_cartesian | null | null | null | null | null |
| natario_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 | warp.metric.T00.natario.shift | metric | true | false | null | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | york-control.warp.metric.T00.natario.shift | comoving_cartesian | null | null | null | null | null |
| nhm2_certified | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | warp.metric.T00.natario_sdf.shift | metric | true | true | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | york-control.nhm2-certified | comoving_cartesian | null | null | null | null | null |

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
| alcubierre_control | york-surface-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | true | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 7a908511e94aaba381c923b1174913691c538002506c9c34edd14c523edfa1d0 | null | null |
| alcubierre_control | york-shell-map-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 55a3cee234383066ecb3637bf9682ad95847a29e35169bed4dad8da35434475f |
| natario_control | york-surface-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | null | null |
| natario_control | york-surface-rho-3p1 | true | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null |
| natario_control | york-topology-normalized-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 7a908511e94aaba381c923b1174913691c538002506c9c34edd14c523edfa1d0 | null | null |
| natario_control | york-shell-map-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 55a3cee234383066ecb3637bf9682ad95847a29e35169bed4dad8da35434475f |
| nhm2_certified | york-surface-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | true | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | 7a908511e94aaba381c923b1174913691c538002506c9c34edd14c523edfa1d0 | null | null |
| nhm2_certified | york-shell-map-3p1 | true | -2.9210517400419483e-32 | 2.6582167776127016e-34 | 2.9210517400419483e-32 | -2.1748244652019806e-38 | 2.1748244652019806e-38 | 2.1748244652019806e-38 | x-z-midplane | x-z midplane | 3.5762483130904186 | 0 | 0 | true | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | null | 1bdc2c3e3e226a14f07428e02a0ccfd35842e43e18eee10f07c1e42c341e0f12 | 55a3cee234383066ecb3637bf9682ad95847a29e35169bed4dad8da35434475f |

## Case Summary (primary York = york-surface-rho-3p1)
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
| alcubierre_control | alcubierre-like-control | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true |
| natario_control | natario-like-control | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true |
| nhm2_certified | nhm2-certified | -6.636569271674008e-33 | 4.789462479802582e-35 | 6.636569271674008e-33 | -6.331835691719585e-36 | 6.331835691719585e-36 | 6.331835691719585e-36 | x-rho | x-rho cylindrical remap | 4.554655870445344 | 0 | 0 | true |

## Preconditions
| precondition | pass | policy |
|---|---|---|
| controlsIndependent | false | control families must not share the same theta channel hash |
| allRequiredViewsRendered | true | all required York views must render without fallback |
| provenanceHashesPresent | true | strict York provenance hashes must be present for each requested view |
| runtimeStatusProvenancePresent | true | runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId |
| readyForFamilyVerdict | false | family verdict is allowed only when all preconditions pass |

## Guard Failures
| code | detail |
|---|---|
| proof_pack_control_theta_hash_collision | alc_url=http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 nat_url=http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 |
| proof_pack_controls_not_independent | alc_theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 nat_theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 |

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
- Guard failures: proof_pack_control_theta_hash_collision:alc_url=http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 nat_url=http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197; proof_pack_controls_not_independent:alc_theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 nat_theta_hash=acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197
- Collapse-point hint: gr-evolve-brick forwards metricT00Ref in sourceParams, but stress-energy field construction in buildStressEnergyBrick is driven by metricT00 scalar and warpFieldType, so differing metricT00Ref alone may not diverge theta.
- Alcubierre control did not present a strong signed fore/aft York lane in primary view; renderer/conversion suspicion is raised by policy.
- NHM2 primary York behavior aligns with low-expansion Natario-like control in this run.

