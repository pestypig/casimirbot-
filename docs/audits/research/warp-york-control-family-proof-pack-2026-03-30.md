# Warp York Control-Family Proof Pack (2026-03-30)

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
- reachable: `false`
- serviceVersion: `null`
- buildHash: `null`
- commitSha: `null`
- processStartedAtMs: `null`
- runtimeInstanceId: `null`

## Control Debug (pre-render brick audit)
| case | request_url | metricT00Ref | metricT00Source | requireCongruentSolve | requireNhm2CongruentFullSolve | warpFieldType | request_metric_ref_hash | resolved_metric_ref_hash | theta_hash | K_trace_hash | brick_source | chart | family_id | branch_metricT00Ref | branch_warpFieldType | source_branch | shape_function_id |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alcubierre_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.alcubierre.analytic&format=raw&requireCongruentSolve=1 | warp.metric.T00.alcubierre.analytic | metric | true | false | null | 81d66be7faa9543e7dcc032ac96fd910f6143e394d84f8478ee7f1a25aa60a30 | null | null | null | null | null | null | null | null | null | null |
| natario_control | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario.shift&format=raw&requireCongruentSolve=1 | warp.metric.T00.natario.shift | metric | true | false | null | ddc11d79143310536e8fbc289c6661e9fef913c20afcc17a3635036527c62f15 | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | warp.metric.T00.natario_sdf.shift | metric | true | true | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | null | null | null | null | null | null | null | null | null | null |

## Per-View Lane Failure Trace
| case | view | lane | endpoint | ok | http_status | error_code | response_message | preflight_branch | requirement |
|---|---|---|---|---|---:|---|---|---|---|
| alcubierre_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| alcubierre_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| natario_control | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| natario_control | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| natario_control | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| nhm2_certified | york-surface-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |
| nhm2_certified | york-shell-map-3p1 | single | http://127.0.0.1:6062/api/helix/hull-render/frame | false | null | null | null | null | null |

## Per-Case Per-View York Evidence
| case | view | ok | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent | theta_channel_hash | slice_array_hash | normalized_slice_hash | support_mask_slice_hash | shell_masked_slice_hash |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|---|---|---|---|---|
| alcubierre_control | york-surface-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| alcubierre_control | york-surface-rho-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| alcubierre_control | york-topology-normalized-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| alcubierre_control | york-shell-map-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | york-surface-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | york-surface-rho-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | york-topology-normalized-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | york-shell-map-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | york-surface-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | york-surface-rho-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | york-topology-normalized-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | york-shell-map-3p1 | false | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null | null |

## Offline York slice audit (numeric)
| case | view | coordinate_mode | sampling_choice | theta_min_raw | theta_max_raw | theta_abs_max_raw | positive_cells | negative_cells | zero_or_near_zero_cells | offline_slice_hash | fore_pos_total | fore_neg_total | aft_pos_total | aft_neg_total | signed_lobe_summary |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|


## Case Summary (primary York = york-surface-rho-3p1)
| case | expectation | theta_min_raw | theta_max_raw | theta_abs_max_raw | theta_min_display | theta_max_display | theta_abs_max_display | coordinate_mode | sampling_choice | support_overlap_pct | theta+K maxAbs | theta+K rms | theta+K consistent |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---|
| alcubierre_control | alcubierre-like-control | null | null | null | null | null | null | null | null | null | null | null | null |
| natario_control | natario-like-control | null | null | null | null | null | null | null | null | null | null | null | null |
| nhm2_certified | nhm2-certified | null | null | null | null | null | null | null | null | null | null | null | null |

## Preconditions
| precondition | pass | policy |
|---|---|---|
| controlsIndependent | false | control families must not share the same theta channel hash |
| allRequiredViewsRendered | false | all required York views must render without fallback |
| provenanceHashesPresent | true | strict York provenance hashes must be present for each requested view |
| runtimeStatusProvenancePresent | false | runtime status endpoint must expose serviceVersion/buildHash/commitSha/processStartedAtMs/runtimeInstanceId |
| readyForFamilyVerdict | false | family verdict is allowed only when all preconditions pass |

## Guard Failures
| code | detail |
|---|---|
| proof_pack_required_view_render_failed | alcubierre_control:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | alcubierre_control:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | alcubierre_control:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | alcubierre_control:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | natario_control:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | natario_control:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | natario_control:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | natario_control:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | nhm2_certified:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | nhm2_certified:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | nhm2_certified:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_required_view_render_failed | nhm2_certified:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown |
| proof_pack_controls_collapsed_source_branch_missing | alc_source=null nat_source=null alc_source_branch=null nat_source_branch=null |
| proof_pack_controls_not_independent | alc_theta_hash=null nat_theta_hash=null alc_k_trace_hash=null nat_k_trace_hash=null |
| proof_pack_runtime_status_provenance_missing | statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status |
| proof_pack_runtime_status_build_hash_missing | statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status |
| proof_pack_runtime_status_commit_sha_missing | statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status |

## Decision Table
| id | condition | status | interpretation |
|---|---|---|---|
| preconditions_ready_for_family_verdict | Controls independent, required views rendered, provenance hashes present, and runtime status provenance present | false | Evidence prerequisites failed; verdict must remain inconclusive. |
| offline_raw_slice_matches_rendered_slice_hashes | Offline York slice hash matches rendered slice_array_hash for x-z and x-rho views | false | Skipped because preconditions failed. |
| xz_matches_but_xrho_differs_isolate_rho_remap | x-z York slice congruent while x-rho York slice diverges from offline remap | false | Skipped because preconditions failed. |
| raw_structure_nontrivial_but_near_zero_flattened | Offline raw York structure is nontrivial but rendered diagnostics report near-zero flattening | false | Skipped because preconditions failed. |
| hash_match_but_downstream_render_or_display_issue | Offline and rendered hashes match but extrema/semantics disagree (downstream display/render issue) | false | Skipped because preconditions failed. |
| renderer_or_conversion_wrong_if_alc_control_fails | Alcubierre control fails to show expected fore/aft York numerically (signed non-near-zero) | false | Skipped because preconditions failed. |
| renderer_fine_if_alc_works_nat_low | Alcubierre control works and Natario control remains near-zero expansion | false | Skipped because preconditions failed. |
| nhm2_not_wrong_if_matches_nat_low_expansion | NHM2 matches Natario-like low-expansion behavior under same York pipeline | false | Skipped because preconditions failed. |
| solve_family_mismatch_if_nhm2_intended_alcubierre | NHM2 was intended Alcubierre-like but numerically matches Natario-like low-expansion behavior | false | Skipped because preconditions failed. |

## Verdict
- `inconclusive`

## Notes
- Family verdict forced to inconclusive because proof-pack preconditions are not satisfied.
- Guard failures: proof_pack_required_view_render_failed:alcubierre_control:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:alcubierre_control:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:alcubierre_control:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:alcubierre_control:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:natario_control:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:natario_control:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:natario_control:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:natario_control:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:nhm2_certified:york-surface-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:nhm2_certified:york-surface-rho-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:nhm2_certified:york-topology-normalized-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_required_view_render_failed:nhm2_certified:york-shell-map-3p1:lane=single:status=null:error=null:message=fetch failed:branch=unknown:requirement=unknown; proof_pack_controls_collapsed_source_branch_missing:alc_source=null nat_source=null alc_source_branch=null nat_source_branch=null; proof_pack_controls_not_independent:alc_theta_hash=null nat_theta_hash=null alc_k_trace_hash=null nat_k_trace_hash=null; proof_pack_runtime_status_provenance_missing:statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status; proof_pack_runtime_status_build_hash_missing:statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status; proof_pack_runtime_status_commit_sha_missing:statusEndpoint=http://127.0.0.1:6062/api/helix/hull-render/status
- Alcubierre control did not present a strong signed fore/aft York lane in primary view; renderer/conversion suspicion is raised by policy.

