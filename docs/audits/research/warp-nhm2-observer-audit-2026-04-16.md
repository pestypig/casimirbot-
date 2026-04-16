# NHM2 Observer Audit (2026-04-16)

"This checklist records the currently selected nhm2_shift_lapse profile's published observer-audit evidence only. It does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_observer_audit |
| schemaVersion | nhm2_observer_audit/v1 |
| status | fail |
| completeness | complete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-observer-audit |
| familyId | nhm2_shift_lapse |
| shiftLapseProfileId | stage1_centerline_alpha_0p995_v1 |
| reasonCodes | observer_condition_failed, surrogate_model_limited |
| observerBlockingAssessmentStatus | same_surface_violation_confirmed |
| observerPromotionBlockingSurface | both |
| observerPromotionBlockingCondition | mixed |
| observerMetricPrimaryDriver | wec |
| observerTilePrimaryDriver | wec |
| observerPrimaryDriverAgreement | aligned |
| observerPrimaryDriverNote | metric_required first localizes to WEC (eulerian_native) at metric_required.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. tile_effective first localizes to WEC (eulerian_native) at tile_effective.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. |
| observerMetricFirstInspectionTarget | metric_required.conditions.wec |
| observerTileFirstInspectionTarget | tile_effective.conditions.wec |
| observerSharedRootDriverStatus | shared_root_driver_confirmed |
| observerSharedRootDriverNote | metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first. |
| observerSharedUpstreamDriverStatus | surface_specific_upstream_refs |
| observerSharedUpstreamDriverNote | metric_required traces upstream to warp.metric.T00.nhm2.shift_lapse, while tile_effective traces upstream to gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy; they share the same negative-energy root class but not the same emitted upstream driver. |
| observerWecPropagationStatus | tile_proxy_independent |
| observerWecPropagationNote | 50% metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane. |
| observerRemediationSequenceStatus | metric_then_tile_proxy |
| observerTileDiminishingReturnStatus | likely_stop_territory |
| observerTileDiminishingReturnNote | April 11, 2026 exception-only reassessment found no admissible new aft-local single-contributor mechanism distinct from the retired shell-bias path, the support-width branch, and the failed shell-taper family with a credible >=2% lift path. Residual tile WEC remains the primary blocker and the tile remediation lane stays in likely stop territory under the hard 2% rule. |
| observerMetricCompletenessStatus | complete |
| observerMetricCompletenessNote | Metric-required observer audit has no declared missing observer inputs. |
| observerMetricCoverageBlockerStatus | semantics_ambiguous |
| observerMetricCoverageBlockerNote | Metric-required full tensor families are emitted on the producer path, but the active model-term route is still experimental/not admitted, so observer admission remains blocked at semantic-contract closure. |
| observerMetricFirstMissingStage | semantic_contract |
| observerMetricEmissionAdmissionStatus | not_admitted |
| observerMetricEmissionAdmissionNote | Admission failed: emitted same-chart flux/shear families are present but remain tied to a non-admitted model-term route pending semantic validation. |
| observerMetricT0iAdmissionStatus | requires_new_model_term |
| observerMetricT0iAdmissionNote | Same-chart T0i is emitted through an experimental model-term route and remains not admitted until metric tensor semantics/evaluator validation closes. |
| observerMetricOffDiagonalTijAdmissionStatus | requires_new_model_term |
| observerMetricOffDiagonalTijAdmissionNote | Same-chart off-diagonal Tij is emitted through an experimental model-term route and remains not admitted until the route is semantically validated. |
| observerTileAuthorityStatus | proxy_limited |
| observerTileAuthorityNote | Tile-effective observer audit remains proxy-limited: fluxHandling=voxel_flux_field, shearHandling=not_modeled_in_proxy. |
| observerLeadReadinessWorkstream | observer_completeness_and_authority |
| observerLeadReadinessReason | Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited. Certificate/policy readiness remains a separate parallel full-loop lane. |
| observerNextTechnicalAction | resolve_metric_tensor_semantics |
| metricProducerAdmissionEvidence | available |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metricBlockingSummary | WEC=-58267450.989558905; DEC=-116534901.97911781 |
| tileBlockingSummary | WEC=-43392729088; DEC=-86785458176 |

## Metric Producer Admission Evidence
| field | value |
|---|---|
| semanticsRef | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| chartRef | comoving_cartesian |
| producerModuleRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyFromShiftField<br>modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField<br>modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField<br>server/energy-pipeline.ts::buildDiagonalMetricObserverAuditTensorInput |
| currentEmissionShape | full_tensor |
| currentOutputFamilies | T00, T11, T22, T33, T01, T02, T03, T12, T21, T13, T31, T23, T32 |
| supportFieldEvidence.alpha | present_admitted |
| supportFieldEvidence.beta_i | missing |
| supportFieldEvidence.gamma_ij | present_admitted |
| supportFieldEvidence.K_ij | missing |
| supportFieldEvidence.D_j_Kj_i_minus_D_i_K_route | missing |
| supportFieldEvidence.time_derivative_or_Kij_evolution_route | missing |
| supportFieldEvidence.full_einstein_tensor_route | missing |
| t0iAdmissionBranch | requires_new_model_term |
| offDiagonalTijAdmissionBranch | requires_new_model_term |
| modelTermRoute | adm_quasi_stationary_recovery_v1 |
| modelTermAdmission | experimental_not_admitted |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| nextInspectionTarget | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| notes | metricRequired.tensorRef=warp.metric.T00.nhm2.shift_lapse<br>metricRequired.model.fluxHandling=same_chart_metric_t0i_emitted_experimental<br>metricRequired.model.shearHandling=same_chart_metric_tij_off_diagonal_emitted_experimental<br>modelTermRoute=adm_quasi_stationary_recovery_v1<br>modelTermAdmission=experimental_not_admitted<br>researchBasisRef=docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>currentEmissionShape=full_tensor<br>familyEmissionAdmission=experimental_not_admitted<br>modelTermRoute=adm_quasi_stationary_recovery_v1<br>support.alpha=present_admitted<br>support.beta_i=missing<br>support.gamma_ij=present_admitted<br>support.K_ij=missing<br>support.D_j_Kj_i_minus_D_i_K_route=missing<br>support.time_derivative_or_Kij_evolution_route=missing<br>support.full_einstein_tensor_route=missing |

## Metric Required Tensor
| field | value |
|---|---|
| tensorId | metric_required |
| status | fail |
| completeness | complete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| sampleCount | 1 |
| reasonCodes | observer_condition_failed, surrogate_model_limited |
| primaryBlockingCondition | wec |
| primaryBlockingMode | eulerian_native |
| primaryBlockingValue | -58267450.989558905 |
| primaryBlockingReference | metric_required.conditions.wec |
| primaryBlockingWhy | WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. |
| rootCauseClass | negative_energy_density |
| blockingDependencyStatus | dec_downstream_of_wec |
| blockingDependencyNote | DEC fails on the same surface and is treated as downstream of the emitted WEC negativity. |
| firstRemediationTarget | metric_required.conditions.wec |
| firstRemediationWhy | Start at the emitted WEC surface because DEC is downstream of the same negative energy density. |
| upstreamDriverRef | warp.metric.T00.nhm2.shift_lapse |
| upstreamDriverClass | metric_t00_density |
| upstreamDriverDependencyStatus | direct_same_surface_driver |
| upstreamDriverNote | metric_required WEC traces directly to the emitted metric T00 density surface. |
| firstUpstreamRemediationTarget | warp.metric.T00.nhm2.shift_lapse |
| firstUpstreamRemediationWhy | Inspect the emitted metric T00 density because metric_required WEC reduces directly to rho on this surface. |
| wecProbeApplied | true |
| wecProbeScale | 0.5 |
| wecProbeBaseline | -58267450.989558905 |
| wecProbeResult | -29133725.494779453 |
| wecProbeDelta | 29133725.494779453 |
| decProbeBaseline | -116534901.97911781 |
| decProbeResult | -58267450.989558905 |
| decProbeDelta | 58267450.989558905 |
| wecProbeInterpretation | Metric-side probe directly relaxes emitted WEC and downstream DEC because this surface depends on the same emitted density ref. |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 1 |
| typeI.fraction | 1 |
| typeI.tolerance | 0 |
| conditions.nec.status | pass |
| conditions.nec.robustMin | 0 |
| conditions.wec.status | fail |
| conditions.wec.robustMin | -58267450.989558905 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 0 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -116534901.97911781 |
| fluxDiagnostics.status | available |
| fluxDiagnostics.meanMagnitude | 1.3019178058112196e+22 |
| fluxDiagnostics.maxMagnitude | 1.3019178058112196e+22 |
| fluxDiagnostics.netMagnitude | 1.3019178058112196e+22 |
| fluxDiagnostics.netDirection | [0, 1, -4.832514873350764e-14] |
| fluxDiagnostics.note | Flux diagnostics use emitted same-chart T0i channels from the metric producer model-term route. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 0 |
| model.pressureModel | diagonal_tensor_components |
| model.fluxHandling | same_chart_metric_t0i_emitted_experimental |
| model.shearHandling | same_chart_metric_tij_off_diagonal_emitted_experimental |
| model.limitationNotes | Metric-required tensor now emits same-chart T0i channels from a model-term route; observer minima are still computed with the diagonal algebraic closure until anisotropic observer search admission is complete.; Off-diagonal same-chart Tij channels are emitted from a reduced-order model-term route and remain semantically not admitted pending tensor-route closure. |
| model.note | Diagonal observer conditions remain algebraic, while same-chart flux/shear channels are emitted through an experimental model-term route pending semantic admission. |
| missingInputs | none |

## Tile Effective Tensor
| field | value |
|---|---|
| tensorId | tile_effective |
| status | fail |
| completeness | complete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json |
| sampleCount | 2097152 |
| reasonCodes | observer_condition_failed, surrogate_model_limited |
| primaryBlockingCondition | wec |
| primaryBlockingMode | eulerian_native |
| primaryBlockingValue | -43392729088 |
| primaryBlockingReference | tile_effective.conditions.wec |
| primaryBlockingWhy | WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. |
| rootCauseClass | negative_energy_density |
| blockingDependencyStatus | dec_downstream_of_wec |
| blockingDependencyNote | DEC fails on the same surface and is treated as downstream of the emitted WEC negativity. |
| firstRemediationTarget | tile_effective.conditions.wec |
| firstRemediationWhy | Start at the emitted WEC surface because DEC is downstream of the same negative energy density. |
| upstreamDriverRef | gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy |
| upstreamDriverClass | tile_energy_density_proxy |
| upstreamDriverDependencyStatus | proxy_derived_driver |
| upstreamDriverNote | tile_effective WEC traces to the emitted tile energy-density proxy surface rather than a full flux/shear-resolved tensor. |
| firstUpstreamRemediationTarget | gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy |
| firstUpstreamRemediationWhy | Inspect the emitted tile energy-density proxy because tile_effective WEC negativity is inherited from that published proxy surface. |
| wecProbeApplied | true |
| wecProbeScale | 0.5 |
| wecProbeBaseline | -43392729088 |
| wecProbeResult | -43392729088 |
| wecProbeDelta | 0 |
| decProbeBaseline | -86785458176 |
| decProbeResult | -86785458176 |
| decProbeDelta | 0 |
| wecProbeInterpretation | Metric-side WEC probe does not automatically lift this tile proxy surface because it depends on a separate proxy-derived upstream ref. |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 2097152 |
| typeI.fraction | 1 |
| typeI.tolerance | 1e-9 |
| conditions.nec.status | pass |
| conditions.nec.robustMin | 0 |
| conditions.wec.status | fail |
| conditions.wec.robustMin | -43392729088 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 0 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -86785458176 |
| fluxDiagnostics.status | available |
| fluxDiagnostics.meanMagnitude | 2.238500057168674e-16 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 1.7248445728410155e-16 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Flux diagnostics come from the tile-effective brick S_i channels. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 1.7643612265638708e-12 |
| model.pressureModel | isotropic_pressure_proxy |
| model.fluxHandling | voxel_flux_field |
| model.shearHandling | not_modeled_in_proxy |
| model.limitationNotes | Tile-effective observer audit uses the brick isotropic-pressure proxy (p = pressureFactor * rho).; Voxel flux S_i is resolved, but anisotropic pressure/shear terms are not promoted as full tensor truth in this artifact. |
| model.note | Tile-effective tensor source: pipeline |
| missingInputs | none |


