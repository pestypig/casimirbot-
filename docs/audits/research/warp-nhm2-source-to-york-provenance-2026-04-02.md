# NHM2 Source-to-York Provenance (2026-04-02)

"This source-to-York bridge artifact is a reduced-order provenance audit; it does not claim physical feasibility."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- nhm2Contract: `configs/needle-hull-mark2-cavity-contract.v1.json`
- promotedProfile: `shared/warp-promoted-profile.ts`
- timingAuthorityArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json`
- proofPackArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- nhm2SnapshotEvidence: `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`

## NHM2 Contract Inputs
| field | value |
|---|---|
| warpFieldType | natario_sdf |
| sectorCount | 80 |
| concurrentSectors | 2 |
| dutyCycle | 0.12 |
| dutyShip | 0.12 |
| qCavity | 100000 |
| qSpoilingFactor | 3 |
| gammaGeo | 1 |
| gammaVanDenBroeck | 500 |
| modulationFreq_GHz | 15 |
| zeta | 5 |
| reducedOrderReference.radius_m | 2 |
| reducedOrderReference.tauLC_ms | 3.34 |
| fullHull.Lx_m | 1007 |
| fullHull.Ly_m | 264 |
| fullHull.Lz_m | 173 |

## Promoted Profile Defaults
| field | value |
|---|---|
| warpFieldType | natario_sdf |
| sectorCount | 80 |
| concurrentSectors | 2 |
| dutyCycle | 0.12 |
| dutyShip | 0.12 |
| qCavity | 100000 |
| qSpoilingFactor | 3 |
| gammaGeo | 1 |
| gammaVanDenBroeck | 500 |
| modulationFreq_GHz | 15 |
| zeta | null |
| reducedOrderReference.radius_m | 2 |
| reducedOrderReference.tauLC_ms | 3.34 |

## Live Timing Authority
| field | value |
|---|---|
| tauLC_ms | 3.34 |
| tauPulse_ms | 0.00006717980877290782 |
| TS | null |
| TS_ratio | 50 |
| epsilon | null |
| isHomogenized | null |
| timingSource | configured |
| timingAuthority | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json |

## Reduced-Order Pipeline Payload (Handoff)
| field | value |
|---|---|
| wave | A |
| proposalLabel | wave-a-promoted-profile-NHM2-2026-03-01-iter-1 |
| params | `{"concurrentSectors":2,"dutyCycle":0.12,"dutyEffective_FR":0.12,"dutyShip":0.12,"dynamicConfig":{"cavityQ":100000,"concurrentSectors":2,"dutyCycle":0.12,"sectorCount":80,"warpFieldType":"natario_sdf"},"gammaGeo":1,"gammaVanDenBroeck":500,"gap_nm":8,"modulationFreq_GHz":15,"qCavity":100000,"qSpoilingFactor":3,"qi":{"fieldType":"em","sampler":"hann","tau_s_ms":0.02},"sectorCount":80,"shipRadius_m":2,"tauLC_ms":3.34,"warpFieldType":"natario_sdf"}` |
| grRequest | `{"N_tiles":1966954176,"P_avg_W":1702.6173539290805,"TS_ratio":50,"dutyEffectiveFR":0.0015,"gammaGeo":1,"gammaVdB":500,"hull":{"Lx_m":1007,"Ly_m":264,"Lz_m":173,"wallThickness_m":0.019986163866666667},"hullArea_m2":558793.8017464621,"qSpoil":3,"tilesPerSector":24586927,"warp":{"metricAdapter":{"chart":{"label":"comoving_cartesian"}},"metricT00Contract":{"normalization":"si_stress","observer":"eulerian_n","unitSystem":"SI"}}}` |

## Proof-Pack Brick Request
| field | value |
|---|---|
| metricT00Ref | warp.metric.T00.natario_sdf.shift |
| metricT00Source | metric |
| dutyFR | 0.0015 |
| q | 3 |
| gammaGeo | 26 |
| gammaVdB | 500 |
| zeta | 0.84 |
| dims | 48x48x48 |
| requireCongruentSolve | true |
| requireNhm2CongruentFullSolve | true |
| brickUrl | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 |

## Proof-Pack Snapshot References
| field | value |
|---|---|
| metric_ref_hash | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d |
| theta_channel_hash | bf23aab7315d9737a5a45417a9445bb0a0d723c06e66f36c02d0d4c81d6be624 |
| k_trace_hash | f42f5895782a043e9d5c500561963b284e12a898500d90330931d3a81571f1d9 |
| snapshot_brick_url | http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1 |
| york_verdict | nhm2_low_expansion_family |
| cross_lane_status | lane_stable_low_expansion_like |

## Parameter Mapping
| field | source_value | target_value | mapping_type | mapping_formula | mapping_note | status |
|---|---|---|---|---|---|---|
| warpFieldType -> metricT00Ref | "natario_sdf" | "warp.metric.T00.natario_sdf.shift" | derived_transform | metricT00Ref selects reduced-order stress family: warp.metric.T00.<family>.shift | Proof-pack uses metricT00Ref as reduced-order family selector. | closed |
| sectorCount | 80 | 80 | direct_copy | sectorCount is forwarded through reducedOrderPipelinePayload.params before the fixed proof-pack brick selector stage | Proof-pack brick requests do not repeat sectorCount, but the reduced-order handoff keeps the canonical sectorCount value explicit. | closed |
| concurrentSectors | 2 | 2 | direct_copy | concurrentSectors is forwarded through reducedOrderPipelinePayload.params before the fixed proof-pack brick selector stage | Proof-pack brick requests do not repeat concurrentSectors, but the reduced-order handoff keeps the live concurrent-sector count explicit. | closed |
| dutyCycle | 0.12 | 0.12 | direct_copy | dutyCycle is forwarded through reducedOrderPipelinePayload.params; later proof-pack brick requests intentionally use dutyFR override for York control comparability | The dutyCycle handoff is explicit in reduced-order payloads even though the final brick request carries dutyFR instead. | closed |
| dutyShip -> dutyFR | 0.12 | 0.0015 | audit_harness_override | null | Proof-pack harness intentionally sets dutyFR=0.0015 for control comparability. | closed |
| qCavity -> q | 100000 | 3 | audit_harness_override | null | Proof-pack brick uses reduced q selector (q=3), not cavity-Q magnitude. | closed |
| qSpoilingFactor -> q | 3 | 3 | policy_override | reduced-order q selector = qSpoilingFactor policy lane | q equals spoiling factor in proof-pack brick request, while qCavity remains out-of-band. | closed |
| gammaGeo | 1 | 26 | audit_harness_override | null | Proof-pack brick request currently pins gammaGeo=26 as harness setting. | closed |
| gammaVanDenBroeck -> gammaVdB | 500 | 500 | direct_copy | gammaVdB = gammaVanDenBroeck | null | closed |
| modulationFreq_GHz | 15 | 15 | direct_copy | modulationFreq_GHz is forwarded through reducedOrderPipelinePayload.params before the fixed proof-pack brick selector stage | Proof-pack brick requests do not repeat modulationFreq_GHz, but the reduced-order handoff preserves the canonical modulation frequency. | closed |
| zeta | 5 | 0.84 | audit_harness_override | null | Proof-pack brick request pins zeta=0.84 for reduced-order York audit lane. | closed |
| reducedOrderReference.radius_m | 2 | 2 | derived_transform | reducedOrderReference.radius_m is serialized as reducedOrderPipelinePayload.params.shipRadius_m for reduced-order handoff compatibility | The fixed proof-pack brick query does not repeat radius, but the reduced-order handoff keeps the promoted/reference ship radius explicit. | closed |
| reducedOrderReference.tauLC_ms | 3.34 | 3.34 | derived_transform | tauLC_ms sourced from promoted/reduced-order timing authority artifacts | null | closed |
| fullHull.Lx_m/Ly_m/Lz_m -> dims | {"Lx_m":1007,"Ly_m":264,"Lz_m":173} | "48x48x48" | audit_harness_override | null | Proof-pack brick request uses fixed reduced-order grid dims=48x48x48. | closed |

## Bridge Readiness
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

### Legacy Bridge Gaps
- none

### Residual Advisory Reasons
- bridge_timing_authority_optional_fields_partial

### Open Bridge Fields
- none

### Closed Bridge Fields
- sourceContract
- timingAuthority.required_fields
- reducedOrderPipelinePayload
- proofPackBrickRequest
- metricRefProvenance
- warpFieldType -> metricT00Ref
- sectorCount
- concurrentSectors
- dutyCycle
- dutyShip -> dutyFR
- qCavity -> q
- qSpoilingFactor -> q
- gammaGeo
- gammaVanDenBroeck -> gammaVdB
- modulationFreq_GHz
- zeta
- reducedOrderReference.radius_m
- reducedOrderReference.tauLC_ms
- fullHull.Lx_m/Ly_m/Lz_m -> dims

## Notes
- York morphology classification and the legacy source-to-York provenance bridge are tracked separately; the bridge audit is advisory-only and does not gate the closed mechanism chain.
- Legacy bridge completeness is closed under the current serialization/readiness policy; the closed mechanism chain still remains the authoritative readiness surface.

