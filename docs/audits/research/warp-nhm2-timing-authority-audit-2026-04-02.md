# NHM2 Timing Authority Audit (2026-04-02)

"This timing-authority artifact audits timing ownership/policy for readiness; it does not retune physics."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`

## Timing Policy
| field | value |
|---|---|
| authoritativeTauLcAuthorityId | geometry_derived |
| authoritativeTauPulseAuthorityId | hardware_reported |
| authoritativeTsAuthorityId | autoscale_prev |
| authoritativeHomogenizationAuthorityId | autoscale_prev |
| fallbackTimingBlocksReadiness | false |
| simulatedTimingBlocksReadiness | false |
| autoscaleTimingBlocksReadiness | false |
| derivedOnlyTimingBlocksReadiness | false |
| requiredTimingFieldsForReadiness | tauLC_ms,tauPulse_ms,TS_ratio |

## Timing Authorities
| authority_id | role | source_path | runtime_surface | owned_fields | readiness_eligible | active_in_current_run |
|---|---|---|---|---|---|---|
| geometry_derived | authoritative | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | tauLC geometry-derived timing chain | tauLC_ms | true | true |
| hardware_reported | authoritative | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | hardware pulse telemetry timing chain | tauPulse_ms | true | true |
| autoscale_prev | authoritative | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | autoscale previous-state timing chain (TS/epsilon/homogenization) | TS,TS_ratio,epsilon,isHomogenized | true | true |
| duty_fallback | fallback | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | duty fallback timing mode | tauLC_ms,tauPulse_ms,TS,TS_ratio,epsilon,isHomogenized | false | false |
| simulated_profile | simulated_only | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | configured/simulated timing profile fallback | tauLC_ms,tauPulse_ms,TS,TS_ratio,epsilon,isHomogenized | false | true |

## Timing Field Ownership
| field | authority_owner | value | source_path | source_kind | source_hash | status |
|---|---|---|---|---|---|---|
| tauLC_ms | geometry_derived | 3.34 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | authoritative |
| tauPulse_ms | hardware_reported | 0.00006717980877290782 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | authoritative |
| TS | autoscale_prev | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |
| TS_ratio | autoscale_prev | 50 | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | authoritative |
| epsilon | autoscale_prev | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |
| isHomogenized | autoscale_prev | null | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/run-1-raw-output.json | artifact_json | eca5446e2acdeb6b1519a6a1379e76333815186b0603c9a4310c4a76697bfbd2 | missing |

## Timing Readiness
| field | value |
|---|---|
| timingAuthorityClosed | true |
| activeAuthorities | geometry_derived,hardware_reported,autoscale_prev,simulated_profile |
| blockingFindings | none |
| advisoryFindings | timing_ts_ratio_policy_split,timing_simulated_profile_active,timing_autoscale_source_active,timing_authority_closed |

## Blocking Findings
- none

## Advisory Findings
- timing_ts_ratio_policy_split
- timing_simulated_profile_active
- timing_autoscale_source_active
- timing_authority_closed

## Notes
- timing_authority_policy authoritativeTauLc=geometry_derived authoritativeTauPulse=hardware_reported authoritativeTs=autoscale_prev authoritativeHomogenization=autoscale_prev
- timing_modes=geometry-derived,hardware-derived,autoscale-derived,simulated-fallback active_authorities=geometry_derived,hardware_reported,autoscale_prev,simulated_profile
- timing_authority_closed; advisory_findings=timing_ts_ratio_policy_split,timing_simulated_profile_active,timing_autoscale_source_active,timing_authority_closed.

