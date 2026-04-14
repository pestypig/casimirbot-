# NHM2 Current-Lane Baseline Convergence (2026-04-13)

"This memo audits whether the current repo can truthfully converge to the locked 0p9925 NHM2 current-lane baseline in a bounded patch. It does not claim successor-lane progress."

## Gate
| field | value |
|---|---|
| assessmentId | nhm2_current_lane_baseline_convergence |
| laneId | nhm2_shift_lapse_current_lane |
| selectedProfileLocked | stage1_centerline_alpha_0p9925_v1 |
| publicationCommand | `node --import tsx -e "import('./scripts/warp-york-control-family-proof-pack.ts').then(async (m) => { await m.publishNhm2CurrentLaneBaselineConvergence({ selectedProfileId: 'stage1_centerline_alpha_0p9925_v1' }); process.exit(0); }).catch((error) => { console.error(error); process.exit(1); });"` |
| decision | STOP_ON_CURRENT_LANE_CONVERGENCE_BLOCKER |
| gateVerdict | current_lane_baseline_convergence_blocked |

## Current Published State
| field | value |
|---|---|
| currentPublishedProfileId | stage1_centerline_alpha_0p995_v1 |
| observerMetricCoverageBlockerStatus | producer_not_emitted |
| observerMetricEmissionAdmissionStatus | not_admitted |
| observerMetricT0iAdmissionStatus | basis_or_semantics_ambiguous |
| observerMetricOffDiagonalTijAdmissionStatus | basis_or_semantics_ambiguous |
| observerNextTechnicalAction | emit_same_chart_metric_flux_and_shear_terms |
| currentLaneDisposition | current_lane_prerequisites_not_landed |
| nextTechnicalAction | port_same_chart_metric_tensor_emission_and_recharter_prerequisites |
| overallStateSnapshot | fail |
| claimTierSnapshot | diagnostic |
| sourceClosureStatus | review |

## Runtime Evidence
| field | value |
|---|---|
| metricFluxPresent | false |
| metricOffDiagonalPresent | false |
| metricFluxHandling | assumed_zero_from_missing_t0i |
| metricShearHandling | assumed_zero_from_missing_tij |
| tileFluxHandling | voxel_flux_field |
| tileShearHandling | not_modeled_in_proxy |
| metricWec | -57110812.99010783 |
| metricDec | -114221625.98021565 |
| tileWec | -42531360768 |
| tileDec | -85062721536 |

## Blocking Reasons
- current_repo_published_profile_mismatch
- observer_metric_blocker_still_producer_not_emitted
- observer_metric_emission_not_admitted
- observer_metric_t0i_not_same_chart_derivable
- observer_metric_off_diagonal_tij_not_same_chart_derivable
- metric_runtime_flux_terms_not_emitted
- metric_runtime_off_diagonal_tij_not_emitted
- metric_observer_still_assumes_zero_flux
- metric_observer_still_assumes_zero_shear
- rechartered_lane_status_artifact_missing
- current_repo_divergence_too_large_for_single_patch

## Artifact Refs
| label | path |
|---|---|
| observer_audit_latest | artifacts/research/full-solve/nhm2-observer-audit-latest.json |
| full_loop_audit_latest | artifacts/research/full-solve/nhm2-full-loop-audit-latest.json |
| source_closure_latest | artifacts/research/full-solve/nhm2-source-closure-latest.json |
| observer_audit_latest_markdown | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-observer-audit-latest.md |
| expected_rechartered_lane_status | artifacts/research/full-solve/nhm2-rechartered-lane-status-latest.json |
| natario_warp_source | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts |
| energy_pipeline_source | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts |

