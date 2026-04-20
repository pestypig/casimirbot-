# NHM2 Observer Audit (2026-04-17)

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
| observerMetricCoverageBlockerNote | Metric-required full tensor families are emitted on the producer path, but model-term semantic admission evidence still rejects selected-route closure (decision=do_not_admit; selected_path_blockers=finite_difference_convergence_failed, independent_cross_check_missing, full_einstein_tensor_route_not_admitted; closure_path=full_einstein_tensor; next_patch=einstein_semantic_closure_patch; route_hint=einstein_route_metadata; selected_path_non_blocking_reasons=support_field_route_not_admitted), so observer admission remains blocked at semantic-contract closure. |
| observerMetricFirstMissingStage | semantic_contract |
| observerMetricEmissionAdmissionStatus | not_admitted |
| observerMetricEmissionAdmissionNote | Admission failed: emitted same-chart flux/shear families are present but remain tied to a non-admitted model-term route pending semantic validation and closure-path execution. |
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
| modelTermSemanticAdmissionEvidence | available |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metricBlockingSummary | WEC=-58267450.989558905; DEC=-116534901.97911781 |
| tileBlockingSummary | WEC=-42531360768; DEC=-85062721536 |

## Metric Producer Admission Evidence
| field | value |
|---|---|
| semanticsRef | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| chartRef | comoving_cartesian |
| producerModuleRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyFromShiftField<br>modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField<br>modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField<br>server/energy-pipeline.ts::buildDiagonalMetricObserverAuditTensorInput |
| currentEmissionShape | full_tensor |
| currentOutputFamilies | T00, T11, T22, T33, T01, T02, T03, T12, T21, T13, T31, T23, T32 |
| supportFieldEvidence.alpha | present_admitted |
| supportFieldEvidence.beta_i | present_but_not_admitted |
| supportFieldEvidence.gamma_ij | present_admitted |
| supportFieldEvidence.K_ij | present_but_not_admitted |
| supportFieldEvidence.D_j_Kj_i_minus_D_i_K_route | present_but_not_admitted |
| supportFieldEvidence.time_derivative_or_Kij_evolution_route | present_but_not_admitted |
| supportFieldEvidence.full_einstein_tensor_route | present_but_not_admitted |
| t0iAdmissionBranch | requires_new_model_term |
| offDiagonalTijAdmissionBranch | requires_new_model_term |
| modelTermRoute | einstein_tensor_geometry_fd4_v1 |
| modelTermAdmission | experimental_not_admitted |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| nextInspectionTarget | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| notes | metricRequired.tensorRef=warp.metric.T00.nhm2.shift_lapse<br>metricRequired.model.fluxHandling=same_chart_metric_t0i_emitted_experimental<br>metricRequired.model.shearHandling=same_chart_metric_tij_off_diagonal_emitted_experimental<br>modelTermRoute=einstein_tensor_geometry_fd4_v1<br>modelTermAdmission=experimental_not_admitted<br>hasShiftVectorEvaluator=false<br>hasExpectedRouteMetadata=true<br>inferredShiftVectorSupport=true<br>einsteinTensorRouteStatus=available<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>researchBasisRef=docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>currentEmissionShape=full_tensor<br>familyEmissionAdmission=experimental_not_admitted<br>modelTermRoute=einstein_tensor_geometry_fd4_v1<br>support.alpha=present_admitted<br>support.beta_i=present_but_not_admitted<br>support.gamma_ij=present_admitted<br>support.K_ij=present_but_not_admitted<br>support.D_j_Kj_i_minus_D_i_K_route=present_but_not_admitted<br>support.time_derivative_or_Kij_evolution_route=present_but_not_admitted<br>support.full_einstein_tensor_route=present_but_not_admitted |

## Model-Term Semantic Admission Evidence
| field | value |
|---|---|
| semanticsRef | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| chartRef | comoving_cartesian |
| routeId | einstein_tensor_geometry_fd4_v1 |
| routeAdmission | experimental_not_admitted |
| decision | do_not_admit |
| reasonCodes | support_field_route_not_admitted, full_einstein_tensor_route_not_admitted, finite_difference_convergence_failed, independent_cross_check_missing |
| checks.routeMetadata | pass |
| checks.chart | pass |
| checks.finiteTensorComponents | pass |
| checks.t0iSymmetry | pass |
| checks.offDiagonalTijSymmetry | pass |
| checks.supportFieldRouteAdmission | fail |
| checks.fullEinsteinTensorRouteAdmission | fail |
| checks.citationBasis | pass |
| checks.finiteDifferenceConvergence | fail |
| checks.independentCrossCheck | fail |
| checks.dtGammaAssumptionBounded | pass |
| checks.citationCoverage | pass |
| einsteinTensorRouteEvidence.status | available |
| einsteinTensorRouteEvidence.routeId | einstein_tensor_geometry_fd4_v1 |
| einsteinTensorRouteEvidence.tensorSource | geometry_first_einstein_tensor |
| einsteinTensorRouteEvidence.comparedSampleCount | 9 |
| einsteinTensorRouteEvidence.maxRelativeResidual | 0 |
| einsteinTensorRouteEvidence.note | Geometry-first Einstein-tensor FD4 cross-check is available over 9 sample points (max relative residual 0.000000e+0 against emitted T0i/off-diagonal Tij). |
| einsteinResidualAttributionEvidence.status | available |
| einsteinResidualAttributionEvidence.sampleCount | 9 |
| einsteinResidualAttributionEvidence.maxRelativeResidual | 0 |
| einsteinResidualAttributionEvidence.componentResiduals | T01:0 | T02:0 | T03:0 | T12:0 | T13:0 | T23:0 |
| einsteinResidualAttributionEvidence.conventionSweep | raw_geometry_fd4:available:0<br>sign_flip:available:2<br>scale_8pi:available:0.9602112642270263<br>scale_inv_8pi:available:0.9602112642270262 |
| einsteinResidualAttributionEvidence.bestCandidateId | raw_geometry_fd4 |
| einsteinResidualAttributionEvidence.bestCandidateResidual | 0 |
| einsteinResidualAttributionEvidence.diagnosisClass | discretization_mismatch |
| einsteinResidualAttributionEvidence.note | Residual attribution over 9 samples selected raw_geometry_fd4 with max residual 0.000000e+0; diagnosis=discretization_mismatch. |
| einsteinEvaluatorClosureEvidence.status | available |
| einsteinEvaluatorClosureEvidence.chartRef | comoving_cartesian |
| einsteinEvaluatorClosureEvidence.routeId | einstein_tensor_geometry_fd4_v1 |
| einsteinEvaluatorClosureEvidence.unitConvention | si_from_geometry_via_inv8pi_and_geom_to_si_stress |
| einsteinEvaluatorClosureEvidence.signConvention | T_munu_equals_plus_G_munu_over_8pi |
| einsteinEvaluatorClosureEvidence.resolutionSweep.coarse | step_m:3.5828324597676766 | samples:9 | t0i:0 | offdiag:0 |
| einsteinEvaluatorClosureEvidence.resolutionSweep.refined | step_m:1.7914162298838383 | samples:9 | t0i:0 | offdiag:0 |
| einsteinEvaluatorClosureEvidence.resolutionSweep.superRefined | step_m:0.8957081149419192 | samples:9 | t0i:0 | offdiag:0 |
| einsteinEvaluatorClosureEvidence.observedConvergenceOrder | t0i:0 | offdiag:0 |
| einsteinEvaluatorClosureEvidence.richardsonExtrapolatedResidual | t0i:0 | offdiag:0 |
| einsteinEvaluatorClosureEvidence.conventionSweep | raw_geometry_fd4:available:0<br>sign_flip:available:2<br>scale_8pi:available:0.9602112642270263<br>scale_inv_8pi:available:0.9602112642270262 |
| einsteinEvaluatorClosureEvidence.bestCandidateId | raw_geometry_fd4 |
| einsteinEvaluatorClosureEvidence.diagnosisClass | discretization_mismatch |
| einsteinEvaluatorClosureEvidence.note | Evaluator closure diagnostics use h=3.583e+0, h/2, h/4 Einstein residual sweeps with observed orders t0i=unknown, offdiag=unknown and Richardson residual estimates t0i=unknown, offdiag=unknown. |
| einsteinEvaluatorClosureEvidence.citationRefs | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| closurePathDecision.selectedPath | full_einstein_tensor |
| closurePathDecision.admPathStatus | fail |
| closurePathDecision.fullEinsteinPathStatus | fail |
| closurePathDecision.routeHint | einstein_route_metadata |
| closurePathDecision.nextPatchClass | einstein_semantic_closure_patch |
| closurePathDecision.patchBriefRef | docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| closurePathDecision.rationale | Route metadata points to geometry-first Einstein routing; keep the full Einstein semantic-closure path while independent cross-check and convergence blockers are unresolved. |
| closurePathDecision.blockerCodes | full_einstein_tensor_route_not_admitted, finite_difference_convergence_failed, independent_cross_check_missing |
| closurePathDecision.nonBlockingCodes | support_field_route_not_admitted |
| closurePathDecision.citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023 |
| closurePathDecision.notes | routeId=einstein_tensor_geometry_fd4_v1<br>routeHint=einstein_route_metadata<br>admPathStatus=fail<br>fullEinsteinPathStatus=fail<br>einsteinCrossCheckStatus=missing<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>selectedPath=full_einstein_tensor<br>nextPatchClass=einstein_semantic_closure_patch<br>selectedPath.blockerCodes=finite_difference_convergence_failed,independent_cross_check_missing,full_einstein_tensor_route_not_admitted<br>selectedPath.nonBlockingCodes=support_field_route_not_admitted |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023 |
| notes | metricRequired.tensorRef=warp.metric.T00.nhm2.shift_lapse<br>metricRequired.model.fluxHandling=same_chart_metric_t0i_emitted_experimental<br>metricRequired.model.shearHandling=same_chart_metric_tij_off_diagonal_emitted_experimental<br>routeId=einstein_tensor_geometry_fd4_v1<br>routeAdmission=experimental_not_admitted<br>chartRef=comoving_cartesian<br>finiteDifferenceStatus=fail<br>finiteDifferenceComparedSampleCount=9<br>finiteDifferenceTripletComparedSampleCount=9<br>finiteDifferenceThreshold=0.25<br>finiteDifferenceT0iDriftMax=1.5333333333333334<br>finiteDifferenceT0iDriftRefinedMax=1.0000000000000004<br>finiteDifferenceT0iConvergenceOrderMean=6.916529870315608<br>finiteDifferenceOffDiagonalDriftMax=1.25<br>finiteDifferenceOffDiagonalDriftRefinedMax=0.75<br>finiteDifferenceOffDiagonalConvergenceOrderMean=-0.11001330247846197<br>independentCrossCheckStatus=fail<br>independentCrossCheckRef=same_route:einstein_tensor_geometry_fd4_v1<br>independentCrossCheckSameRoute=true<br>einsteinTensorRouteStatus=available<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>einsteinTensorTensorSource=geometry_first_einstein_tensor<br>einsteinTensorComparedSampleCount=9<br>einsteinTensorMaxRelativeResidual=0<br>fullEinsteinRouteAdmissionStatus=fail<br>einsteinResidualAttributionStatus=available<br>einsteinResidualAttributionSampleCount=9<br>einsteinResidualAttributionMaxRelativeResidual=0<br>einsteinResidualAttributionDiagnosisClass=discretization_mismatch<br>einsteinResidualAttributionBestCandidateId=raw_geometry_fd4<br>einsteinResidualAttributionBestCandidateResidual=0<br>einsteinResidualAttributionComponents=T01:0|T02:0|T03:0|T12:0|T13:0|T23:0<br>einsteinEvaluatorClosureStatus=available<br>einsteinEvaluatorClosureChartRef=comoving_cartesian<br>einsteinEvaluatorClosureRouteId=einstein_tensor_geometry_fd4_v1<br>einsteinEvaluatorClosureUnitConvention=si_from_geometry_via_inv8pi_and_geom_to_si_stress<br>einsteinEvaluatorClosureSignConvention=T_munu_equals_plus_G_munu_over_8pi<br>einsteinEvaluatorClosureCoarseStep=3.5828324597676766<br>einsteinEvaluatorClosureRefinedStep=1.7914162298838383<br>einsteinEvaluatorClosureSuperRefinedStep=0.8957081149419192<br>einsteinEvaluatorClosureCoarseSampleCount=9<br>einsteinEvaluatorClosureRefinedSampleCount=9<br>einsteinEvaluatorClosureSuperRefinedSampleCount=9<br>einsteinEvaluatorClosureCoarseT0iResidual=0<br>einsteinEvaluatorClosureCoarseOffDiagonalResidual=0<br>einsteinEvaluatorClosureRefinedT0iResidual=0<br>einsteinEvaluatorClosureRefinedOffDiagonalResidual=0<br>einsteinEvaluatorClosureSuperRefinedT0iResidual=0<br>einsteinEvaluatorClosureSuperRefinedOffDiagonalResidual=0<br>einsteinEvaluatorClosureObservedOrderT0i=0<br>einsteinEvaluatorClosureObservedOrderOffDiagonal=0<br>einsteinEvaluatorClosureRichardsonT0i=0<br>einsteinEvaluatorClosureRichardsonOffDiagonal=0<br>einsteinEvaluatorClosureDiagnosisClass=discretization_mismatch<br>einsteinEvaluatorClosureBestCandidateId=raw_geometry_fd4<br>einsteinEvaluatorClosureCitationRefs=docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md,https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf,https://arxiv.org/abs/gr-qc/0703035,https://arxiv.org/abs/gr-qc/0110086,https://arxiv.org/abs/gr-qc/0507004,https://arxiv.org/abs/1306.6052,https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html,https://arxiv.org/abs/2404.03095,https://arxiv.org/abs/2404.10855,https://arxiv.org/abs/2602.18023,docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>dtGammaPolicy=assumed_zero<br>dtGammaClosureMode=static_euclidean_gamma<br>dtGammaStaticEuclideanGamma=true<br>dtGammaExpectedRoute=true<br>dtGammaThetaMax=0.002403637625309827<br>dtGammaThetaThreshold=0.000001<br>citationCoverageStatus=pass<br>citationCoverageMissingRefs=none<br>structuralPass=false<br>derivationRoutePass=false<br>closurePath.selected=full_einstein_tensor<br>closurePath.nextPatchClass=einstein_semantic_closure_patch<br>closurePath.rationale=Route metadata points to geometry-first Einstein routing; keep the full Einstein semantic-closure path while independent cross-check and convergence blockers are unresolved.<br>closurePath.patchBriefRef=docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |

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
| fluxDiagnostics.meanMagnitude | 1.1677651628435561e+22 |
| fluxDiagnostics.maxMagnitude | 1.1677651628435561e+22 |
| fluxDiagnostics.netMagnitude | 1.1677651628435561e+22 |
| fluxDiagnostics.netDirection | [3.713061442270511e-14, -1, 1.3182508710792328e-13] |
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
| primaryBlockingValue | -42531360768 |
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
| wecProbeBaseline | -42531360768 |
| wecProbeResult | -42531360768 |
| wecProbeDelta | 0 |
| decProbeBaseline | -85062721536 |
| decProbeResult | -85062721536 |
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
| conditions.wec.robustMin | -42531360768 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 0 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -85062721536 |
| fluxDiagnostics.status | available |
| fluxDiagnostics.meanMagnitude | 2.2413878350675543e-16 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 1.7256289535413818e-16 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Flux diagnostics come from the tile-effective brick S_i channels. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 1.766726413603148e-12 |
| model.pressureModel | isotropic_pressure_proxy |
| model.fluxHandling | voxel_flux_field |
| model.shearHandling | not_modeled_in_proxy |
| model.limitationNotes | Tile-effective observer audit uses the brick isotropic-pressure proxy (p = pressureFactor * rho).; Voxel flux S_i is resolved, but anisotropic pressure/shear terms are not promoted as full tensor truth in this artifact. |
| model.note | Tile-effective tensor source: pipeline |
| missingInputs | none |


