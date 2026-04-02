# NHM2 Solve Authority Audit (2026-04-01)

"This solve-authority artifact audits ownership/splits across the NHM2 reduced-order chain; it does not retune physics."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- timingAuthorityAuditPath: `artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json`
- brickAuthorityAuditPath: `artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json`
- snapshotAuthorityAuditPath: `artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json`
- diagnosticSemanticAuditPath: `artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json`
- sourceFormulaAuditPath: `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`
- sourceFormulaMismatchClass: `direct_vs_reconstructed`
- sourceFormulaEquivalent: `false`
- sourceFormulaReconstructionOnlyComparison: `true`
- sourceStageAuditPath: `artifacts/research/full-solve/nhm2-source-stage-audit-latest.json`
- sourceStageCause: `none`
- sourceStageReady: `true`
- nhm2Contract: `configs/needle-hull-mark2-cavity-contract.v1.json`
- promotedProfile: `shared/warp-promoted-profile.ts`
- timingAuthorityArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json`
- timingAuthorityAudit: `artifacts/research/full-solve/nhm2-timing-authority-audit-latest.json`
- brickAuthorityAudit: `artifacts/research/full-solve/nhm2-brick-authority-audit-latest.json`
- snapshotAuthorityAudit: `artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json`
- diagnosticSemanticAudit: `artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json`
- sourceFormulaAudit: `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`
- nhm2SnapshotEvidence: `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`
- g4FirstDivergenceArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-first-divergence-2026-04-01.json`

## Authority Domains
| authority | source_path | source_kind | runtime_surface | source_hash | notes |
|---|---|---|---|---|---|
| contract_authority | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | NHM2 cavity contract + promoted profile defaults | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | Mechanism-level contract defaults and promoted profile values. |
| timing_authority | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | Wave-A timing authority (tau/TS/epsilon/isHomogenized) | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | Timing chain modes observed: geometry-derived, hardware-derived, autoscale-derived, simulated-fallback; timing_authority_closed=true. |
| source_authority | artifacts/research/full-solve/nhm2-source-stage-audit-latest.json | source_stage_audit_artifact | G4 first-divergence source stage and metric family selector | a3a9e41fd0222f1ad7199052559a7e768bee7d894e65a0b2133904b190f732c9 | Tracks source-stage divergence and metric family reference fields. cause=none. |
| reduced_order_payload_authority | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | Reduced-order Wave-A proposal/grRequest handoff payload | f683af95e06eed64de9ebe3654e28de119ff1304665ad6c645903cbd69bbea11 | Proposal params + grRequest values prior to proof-pack render requests. |
| brick_authority | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | gr-evolve-brick request params used by York proof-pack rendering | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | Query params classified/rendered by proof-pack brick pipeline. brick_authority_closed=true. |
| snapshot_authority | artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json | snapshot_authority_audit_artifact | Snapshot-vs-live authority policy/readiness and field comparison | 36484f0dc0688f8c6bdc1ba860847083349f1a657bf2bd5b1ce29dab1bb59d7b | Snapshot authority readiness=true blocking=none advisory=snapshot_missing_live_equivalent,snapshot_authority_closed. |
| diagnostic_authority | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json | diagnostic_semantic_audit_artifact | York lane authority/promotion policy audit for mechanism readiness | a6621ee788c25cfe7b702d82bc86176f49288a20eeb7c05a486b2ac115e7fcfd | Diagnostic authority readiness=true blocking=none advisory=diagnostic_proxy_lane_active,diagnostic_cross_lane_reference_only,diagnostic_cross_lane_requires_normalized_observer,diagnostic_semantics_closed contract_hash=4dd2fa705f064a2cf4f622e9a53bf99acc3840488d54ff8e233fceeaab4bba87. |

## Field Ownership
| field | authority_owner | value | source_path | source_kind | source_hash | status |
|---|---|---|---|---|---|---|
| warpFieldType | contract_authority | "natario_sdf" | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | derived |
| sectorCount | contract_authority | 80 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | split_authority |
| concurrentSectors | contract_authority | 2 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | split_authority |
| dutyCycle | contract_authority | 0.12 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | split_authority |
| dutyShip | contract_authority | 0.12 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | derived |
| qCavity | contract_authority | 100000 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | authoritative |
| qSpoilingFactor | contract_authority | 3 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | derived |
| gammaGeo | contract_authority | 1 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | authoritative |
| gammaVanDenBroeck | contract_authority | 500 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | derived |
| modulationFreq_GHz | contract_authority | 15 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | split_authority |
| zeta | contract_authority | 5 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | authoritative |
| tauLC_ms | contract_authority | 3.34 | configs/needle-hull-mark2-cavity-contract.v1.json | json_contract | 8e2a67f17dde512de893a694d116cd7d5903b6a133801eb0e0230d79c367d19e | derived |
| tauLC_ms | timing_authority | 3.34 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | split_authority |
| tauPulse_ms | timing_authority | 0.00006717980877290782 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | split_authority |
| TS | timing_authority | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |
| TS_ratio | timing_authority | 50 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | split_authority |
| epsilon | timing_authority | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |
| isHomogenized | timing_authority | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |
| metricT00Ref | brick_authority | "warp.metric.T00.natario_sdf.shift" | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | forwarded |
| metricT00Source | brick_authority | "metric" | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | forwarded |
| metricT00Si_Jm3 | source_authority | null | artifacts/research/full-solve/nhm2-source-stage-audit-latest.json | source_stage_audit_artifact | a3a9e41fd0222f1ad7199052559a7e768bee7d894e65a0b2133904b190f732c9 | missing |
| dutyFR | brick_authority | 0.0015 | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| q | brick_authority | 3 | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| gammaGeo | brick_authority | 26 | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| gammaVdB | brick_authority | 500 | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| zeta | brick_authority | 0.84 | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| dims | brick_authority | "48x48x48" | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | authoritative |
| requireCongruentSolve | brick_authority | true | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | forwarded |
| requireNhm2CongruentFullSolve | brick_authority | true | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 | http_query | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e | forwarded |
| metric_ref_hash | snapshot_authority | "a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d" | artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json | snapshot_authority_audit_artifact | 36484f0dc0688f8c6bdc1ba860847083349f1a657bf2bd5b1ce29dab1bb59d7b | snapshot_loaded |
| theta_channel_hash | snapshot_authority | "acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197" | artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json | snapshot_authority_audit_artifact | 36484f0dc0688f8c6bdc1ba860847083349f1a657bf2bd5b1ce29dab1bb59d7b | snapshot_loaded |
| k_trace_hash | snapshot_authority | "c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc" | artifacts/research/full-solve/nhm2-snapshot-authority-audit-latest.json | snapshot_authority_audit_artifact | 36484f0dc0688f8c6bdc1ba860847083349f1a657bf2bd5b1ce29dab1bb59d7b | snapshot_loaded |
| lane_ids | diagnostic_authority | ["lane_a_eulerian_comoving_theta_minus_trk","lane_b_shift_drift_theta_plus_div_beta_over_alpha"] | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json | diagnostic_semantic_audit_artifact | a6621ee788c25cfe7b702d82bc86176f49288a20eeb7c05a486b2ac115e7fcfd | authoritative |
| lane_semantic_mode | diagnostic_authority | "observer_proxy" | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json | diagnostic_semantic_audit_artifact | a6621ee788c25cfe7b702d82bc86176f49288a20eeb7c05a486b2ac115e7fcfd | authoritative |
| observer_definition | diagnostic_authority | "obs.shift_drift_beta_over_alpha_covariant_divergence_v1" | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json | diagnostic_semantic_audit_artifact | a6621ee788c25cfe7b702d82bc86176f49288a20eeb7c05a486b2ac115e7fcfd | authoritative |
| foliation_definition | diagnostic_authority | "Diagnostic-local observer-drift proxy evaluated on the same fixed comoving Cartesian 3+1 foliation as Lane A." | artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json | diagnostic_semantic_audit_artifact | a6621ee788c25cfe7b702d82bc86176f49288a20eeb7c05a486b2ac115e7fcfd | authoritative |
| classification_outcome | diagnostic_authority | "nhm2_low_expansion_family" | artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json | proof_pack_payload | c06c5776968c066aff47f4419215392995e31bdd3c892eb3050466abb763f46e | authoritative |
| cross_lane_status | diagnostic_authority | "lane_stable_low_expansion_like" | artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json | proof_pack_payload | 64cb575d8dd9c13525eb7682b5be77403afb8b371493b6a7676a3c0707a163ce | authoritative |

## Detected Splits
| split_id | severity | fields | authorities_involved | blocks | recommended_next_patch |
|---|---|---|---|---|---|
| none | low | none | none | none | none |

## Split Evidence
none

## First-Divergence Linkage
| field | value |
|---|---|
| stage_id | S0_source |
| stage_label | Source |
| differing_fields | metricT00Si_Jm3 |
| source_stage | true |
| before_qi_sampling | true |
| before_policy_floor | true |
| before_final_gate | true |
| summary | S0_source diverged on: metricT00Si_Jm3 |

## Readiness
| field | value |
|---|---|
| yorkClassificationReady | true |
| sourceAuthorityClosed | true |
| timingAuthorityClosed | true |
| brickAuthorityClosed | true |
| snapshotAuthorityClosed | true |
| diagnosticAuthorityClosed | true |
| mechanismChainReady | true |
| mechanismClaimBlockReasons | none |

## Notes
- York classification readiness and mechanism-chain readiness are intentionally separate.

