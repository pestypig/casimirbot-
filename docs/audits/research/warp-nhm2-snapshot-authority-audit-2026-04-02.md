# NHM2 Snapshot Authority Audit (2026-04-02)

"This snapshot-authority artifact audits snapshot-vs-live provenance policy/readiness; it does not retune physics."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`

## Snapshot Policy
| field | value |
|---|---|
| authoritativeSnapshotSourceId | proof_pack_snapshot_refs |
| snapshotMustMatchLiveBrick | true |
| snapshotMustMatchCurrentContract | true |
| snapshotOnlyAllowedForReference | false |
| snapshotDriftBlocksReadiness | true |
| missingLiveEquivalentBlocksReadiness | true |
| requiredSnapshotFieldsForReadiness | metric_ref_hash,theta_channel_hash,k_trace_hash,snapshot_brick_url |

## Snapshot Sources
| source_id | source_path | source_kind | runtime_surface | role | active_in_current_run |
|---|---|---|---|---|---|
| snapshot_artifact | artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json | snapshot_artifact | NHM2 snapshot-congruence evidence artifact | reference | true |
| proof_pack_snapshot_refs | artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json | source_to_york_artifact | Snapshot refs consumed by proof-pack NHM2 lane | authoritative | true |
| live_brick_request | artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json | proof_pack_payload | Live-derived NHM2 brick request/metrics in proof-pack run | live_derived | true |

## Live-Derived Refs
| field | value |
|---|---|
| metric_ref_hash | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" |
| theta_channel_hash | "bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624" |
| k_trace_hash | "f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9" |
| snapshot_brick_url | "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1" |
| metricT00Ref | "warp.metric.T00.natario_sdf.shift" |
| metricT00Source | "metric" |
| contract_warpFieldType | "natario_sdf" |
| proof_pack_verdict | "nhm2_low_expansion_family" |
| cross_lane_status | "lane_stable_low_expansion_like" |

## Snapshot Refs
| field | value |
|---|---|
| snapshot_artifact_path | "artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json" |
| snapshot_artifact_hash | "be9b6ff11187e85c85b486f5d1e6352b52989d2479add1a840eed1a32ed6e8be" |
| metric_ref_hash | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" |
| metric_ref_hash_raw | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" |
| theta_channel_hash | "bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624" |
| k_trace_hash | "f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9" |
| snapshot_brick_url | "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1" |
| snapshot_brick_url_raw | "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1" |
| metricT00Ref | "warp.metric.T00.natario_sdf.shift" |
| metricT00Source | "metric" |
| snapshot_generated_at_ms | 1774637121887 |
| snapshot_run_id | null |

## Snapshot Comparison
| field | snapshot_value | live_value | authority_owner | comparison_status | note |
|---|---|---|---|---|---|
| metric_ref_hash | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" | snapshot_authority | matched | Snapshot metric ref hash must align with live NHM2 case metric ref hash. |
| theta_channel_hash | "bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624" | "bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624" | snapshot_authority | matched | Snapshot theta hash compared against live NHM2 theta channel hash. |
| k_trace_hash | "f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9" | "f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9" | snapshot_authority | matched | Snapshot K-trace hash compared against live NHM2 K-trace channel hash. |
| snapshot_brick_url | "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1" | "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1" | snapshot_authority | matched | Snapshot brick URL must trace to the live proof-pack NHM2 brick request. |
| metricT00Ref | "warp.metric.T00.natario_sdf.shift" | "warp.metric.T00.natario_sdf.shift" | contract_authority | matched | Snapshot metricT00Ref selector compared against live brick selector. |
| metricT00Source | "metric" | "metric" | contract_authority | matched | Snapshot metricT00Source selector compared against live brick selector. |
| snapshot_generated_at_ms | 1774637121887 | null | snapshot_authority | snapshot_only | Snapshot generation timestamp is snapshot-scoped metadata. |
| snapshot_run_id | null | null | snapshot_authority | missing_snapshot | Snapshot run/trace id is snapshot-scoped metadata. |

## Snapshot Readiness
| field | value |
|---|---|
| snapshotAuthorityClosed | true |
| authoritativeSnapshotSourceId | proof_pack_snapshot_refs |
| blockingFindings | none |
| advisoryFindings | snapshot_missing_live_equivalent,snapshot_authority_closed |

## Blocking Findings
- none

## Advisory Findings
- snapshot_missing_live_equivalent
- snapshot_authority_closed

## Notes
- snapshot_policy authoritative=proof_pack_snapshot_refs must_match_live_brick=true must_match_current_contract=true snapshot_only_reference=false.
- snapshot_authority_closed blocking=none advisory=snapshot_missing_live_equivalent,snapshot_authority_closed.

