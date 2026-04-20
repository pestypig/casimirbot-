# NHM2 Observer Audit (2026-04-19)

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
| observerPromotionBlockingSurface | tile_effective |
| observerPromotionBlockingCondition | mixed |
| observerMetricPrimaryDriver | dec |
| observerTilePrimaryDriver | wec |
| observerPrimaryDriverAgreement | diverged |
| observerPrimaryDriverNote | metric_required first localizes to DEC (robust_only) at metric_required.conditions.dec. DEC is Eulerian-clean on the emitted sample but turns negative under the robust observer search. tile_effective first localizes to WEC (eulerian_native) at tile_effective.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. |
| observerMetricFirstInspectionTarget | metric_required.conditions.dec |
| observerTileFirstInspectionTarget | tile_effective.conditions.wec |
| observerSharedRootDriverStatus | mixed |
| observerSharedRootDriverNote | At least one emitted observer surface still presents mixed independent blockers, so a single shared remediation path is not yet justified. |
| observerSharedUpstreamDriverStatus | unknown |
| observerSharedUpstreamDriverNote | null |
| observerWecPropagationStatus | unknown |
| observerWecPropagationNote | null |
| observerRemediationSequenceStatus | unknown |
| observerTileDiminishingReturnStatus | likely_stop_territory |
| observerTileDiminishingReturnNote | April 11, 2026 exception-only reassessment found no admissible new aft-local single-contributor mechanism distinct from the retired shell-bias path, the support-width branch, and the failed shell-taper family with a credible >=2% lift path. Residual tile WEC remains the primary blocker and the tile remediation lane stays in likely stop territory under the hard 2% rule. |
| observerMetricCompletenessStatus | complete |
| observerMetricCompletenessNote | Metric-required observer audit has no declared missing observer inputs. |
| observerMetricCoverageBlockerStatus | unknown |
| observerMetricCoverageBlockerNote | Metric-required same-chart full tensor families are emitted and selected-route semantic blockers are cleared for the active Einstein-path closure. |
| observerMetricFirstMissingStage | unknown |
| observerMetricEmissionAdmissionStatus | admitted |
| observerMetricEmissionAdmissionNote | Admission is accepted on the selected same-chart full-tensor route; ADM support-field-route gaps remain tracked as non-blocking diagnostics for this closure path. |
| observerMetricT00AdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricT00RouteId | einstein_tensor_geometry_fd4_v1 |
| observerMetricT00ComparabilityStatus | pass |
| observerMetricT00AdmissionNote | Metric-required observer rho/T00 is admitted via the Einstein-route policy bridge: full_einstein_tensor closure, comparable T00 residuals, independent cross-check, finite-difference convergence, and citation coverage all pass. |
| observerMetricT0iAdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricT0iAdmissionNote | Same-chart T0i is derivable from currently admitted producer state without introducing a new physics term. |
| observerMetricOffDiagonalTijAdmissionStatus | derivable_same_chart_from_existing_state |
| observerMetricOffDiagonalTijAdmissionNote | Same-chart off-diagonal Tij is derivable from currently admitted producer state without introducing a new physics term. |
| observerTileAuthorityStatus | full_tensor_authority |
| observerTileAuthorityNote | Tile-effective observer authority is admitted via the same-chart Einstein projection route with pass-level route admission, full-tensor component coverage, comparability, and citation checks. |
| observerLeadReadinessWorkstream | observer_completeness_and_authority |
| observerLeadReadinessReason | Observer completeness and tile authority are admitted on the selected route; certificate/policy readiness remains the parallel full-loop lane. |
| observerNextTechnicalAction | unknown |
| metricProducerAdmissionEvidence | available |
| modelTermSemanticAdmissionEvidence | available |
| t00PolicyAdmissionBridgeEvidence | available |
| tileAuthorityEvidence | available |
| tileComparableCrossCheckEvidence | available |
| tileSurfaceReconstitutionEvidence | available |
| observerBlockingAssessmentNote | tile_effective tensor emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metricBlockingSummary | DEC=-58267450.989558905 |
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
| supportFieldEvidence.beta_i | present_but_not_admitted |
| supportFieldEvidence.gamma_ij | present_admitted |
| supportFieldEvidence.K_ij | present_but_not_admitted |
| supportFieldEvidence.D_j_Kj_i_minus_D_i_K_route | present_but_not_admitted |
| supportFieldEvidence.time_derivative_or_Kij_evolution_route | present_but_not_admitted |
| supportFieldEvidence.full_einstein_tensor_route | present_but_not_admitted |
| t0iAdmissionBranch | derivable_same_chart_from_existing_state |
| offDiagonalTijAdmissionBranch | derivable_same_chart_from_existing_state |
| modelTermRoute | einstein_tensor_geometry_fd4_v1 |
| modelTermAdmission | experimental_not_admitted |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| nextInspectionTarget | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| notes | metricRequired.tensorRef=warp.metric.T00.nhm2.shift_lapse<br>metricRequired.model.fluxHandling=same_chart_metric_t0i_emitted_experimental<br>metricRequired.model.shearHandling=same_chart_metric_tij_off_diagonal_emitted_experimental<br>modelTermRoute=einstein_tensor_geometry_fd4_v1<br>modelTermAdmission=experimental_not_admitted<br>modelTermAdmissionEffective=admitted<br>hasShiftVectorEvaluator=false<br>hasExpectedRouteMetadata=true<br>inferredShiftVectorSupport=true<br>einsteinTensorRouteStatus=available<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>researchBasisRef=docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>currentEmissionShape=full_tensor<br>familyEmissionAdmission=experimental_not_admitted<br>modelTermRoute=einstein_tensor_geometry_fd4_v1<br>support.alpha=present_admitted<br>support.beta_i=present_but_not_admitted<br>support.gamma_ij=present_admitted<br>support.K_ij=present_but_not_admitted<br>support.D_j_Kj_i_minus_D_i_K_route=present_but_not_admitted<br>support.time_derivative_or_Kij_evolution_route=present_but_not_admitted<br>support.full_einstein_tensor_route=present_but_not_admitted |

## Model-Term Semantic Admission Evidence
| field | value |
|---|---|
| semanticsRef | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| researchBasisRef | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md |
| chartRef | comoving_cartesian |
| routeId | einstein_tensor_geometry_fd4_v1 |
| routeAdmissionRaw | experimental_not_admitted |
| routeAdmissionEffective | admitted |
| routeAdmissionPromotionBasis | evidence_gate_promoted_full_einstein |
| routeAdmission | admitted |
| decision | admit |
| reasonCodes | none |
| checks.routeMetadata | pass |
| checks.chart | pass |
| checks.finiteTensorComponents | pass |
| checks.t0iSymmetry | pass |
| checks.offDiagonalTijSymmetry | pass |
| checks.supportFieldRouteAdmission | fail |
| checks.fullEinsteinTensorRouteAdmission | pass |
| checks.citationBasis | pass |
| checks.finiteDifferenceConvergence | pass |
| checks.independentCrossCheck | pass |
| checks.einsteinT00Comparability | pass |
| checks.dtGammaAssumptionBounded | pass |
| checks.citationCoverage | pass |
| einsteinTensorRouteEvidence.status | available |
| einsteinTensorRouteEvidence.routeId | einstein_tensor_geometry_fd4_v1 |
| einsteinTensorRouteEvidence.tensorSource | geometry_first_einstein_tensor |
| einsteinTensorRouteEvidence.comparedSampleCount | 9 |
| einsteinTensorRouteEvidence.maxRelativeResidual | 0 |
| einsteinTensorRouteEvidence.t00ComparedSampleCount | 9 |
| einsteinTensorRouteEvidence.t00MaxRelativeResidual | 0 |
| einsteinTensorRouteEvidence.t00RelativeResidualThreshold | 0.25 |
| einsteinTensorRouteEvidence.note | Geometry-first Einstein-tensor FD4 cross-check is available over 9 sample points (max relative residual 0.000000e+0 against emitted T0i/off-diagonal Tij; T00 max residual 0.000000e+0). |
| einsteinResidualAttributionEvidence.status | available |
| einsteinResidualAttributionEvidence.sampleCount | 9 |
| einsteinResidualAttributionEvidence.maxRelativeResidual | 0 |
| einsteinResidualAttributionEvidence.componentResiduals | T01:0 | T02:0 | T03:0 | T12:0 | T13:0 | T23:0 |
| einsteinResidualAttributionEvidence.conventionSweep | raw_geometry_fd4:available:0<br>sign_flip:available:0<br>scale_8pi:available:0<br>scale_inv_8pi:available:0 |
| einsteinResidualAttributionEvidence.bestCandidateId | raw_geometry_fd4 |
| einsteinResidualAttributionEvidence.bestCandidateResidual | 0 |
| einsteinResidualAttributionEvidence.diagnosisClass | mixed |
| einsteinResidualAttributionEvidence.note | Residual attribution over 9 samples selected raw_geometry_fd4 with max residual 0.000000e+0; diagnosis=mixed. |
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
| einsteinEvaluatorClosureEvidence.conventionSweep | raw_geometry_fd4:available:0<br>sign_flip:available:0<br>scale_8pi:available:0<br>scale_inv_8pi:available:0 |
| einsteinEvaluatorClosureEvidence.bestCandidateId | raw_geometry_fd4 |
| einsteinEvaluatorClosureEvidence.diagnosisClass | mixed |
| einsteinEvaluatorClosureEvidence.note | Evaluator closure diagnostics use h=3.583e+0, h/2, h/4 Einstein residual sweeps with observed orders t0i=unknown, offdiag=unknown and Richardson residual estimates t0i=unknown, offdiag=unknown. |
| einsteinEvaluatorClosureEvidence.citationRefs | docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md |
| einsteinRouteValidationSuite.status | pass |
| einsteinRouteValidationSuite.admittedForRoutePass | true |
| einsteinRouteValidationSuite.residualThreshold | 1e-9 |
| einsteinRouteValidationSuite.evaluatedCaseCount | 2 |
| einsteinRouteValidationSuite.passedCaseCount | 2 |
| einsteinRouteValidationSuite.cases | minkowski_zero_shift:pass:0<br>constant_shift_flat_space:pass:0 |
| einsteinRouteValidationSuite.note | Independent Einstein-route near-zero sanity suite passed for flat-space control cases. |
| einsteinRouteValidationSuite.citationRefs | https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023 |
| closurePathDecision.selectedPath | full_einstein_tensor |
| closurePathDecision.admPathStatus | fail |
| closurePathDecision.fullEinsteinPathStatus | pass |
| closurePathDecision.routeHint | einstein_route_metadata |
| closurePathDecision.nextPatchClass | einstein_semantic_closure_patch |
| closurePathDecision.patchBriefRef | docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| closurePathDecision.rationale | Full Einstein-tensor route is admitted while ADM support-field route is not admitted; continue with Einstein-route semantic closure. |
| closurePathDecision.blockerCodes | none |
| closurePathDecision.nonBlockingCodes | support_field_route_not_admitted |
| closurePathDecision.citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023 |
| closurePathDecision.notes | routeId=einstein_tensor_geometry_fd4_v1<br>routeHint=einstein_route_metadata<br>admPathStatus=fail<br>fullEinsteinPathStatus=pass<br>einsteinCrossCheckStatus=available<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>selectedPath=full_einstein_tensor<br>nextPatchClass=einstein_semantic_closure_patch<br>selectedPath.blockerCodes=none<br>selectedPath.nonBlockingCodes=support_field_route_not_admitted |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023 |
| notes | metricRequired.tensorRef=warp.metric.T00.nhm2.shift_lapse<br>metricRequired.model.fluxHandling=same_chart_metric_t0i_emitted_experimental<br>metricRequired.model.shearHandling=same_chart_metric_tij_off_diagonal_emitted_experimental<br>routeId=einstein_tensor_geometry_fd4_v1<br>routeAdmissionRaw=experimental_not_admitted<br>routeAdmissionEffective=admitted<br>routeAdmissionPromotionBasis=evidence_gate_promoted_full_einstein<br>chartRef=comoving_cartesian<br>finiteDifferenceStatus=pass<br>finiteDifferenceComparedSampleCount=0<br>finiteDifferenceRouteLocalComparedSampleCount=0<br>finiteDifferenceRouteSuppressedSampleCount=0<br>finiteDifferenceNumericalFloorSuppressedSampleCount=18<br>finiteDifferenceTripletComparedSampleCount=0<br>finiteDifferenceFailureMode=numerical_floor_insufficient_signal<br>finiteDifferenceSignificanceFloorRelativeToT00=1e-12<br>finiteDifferenceThreshold=0.25<br>finiteDifferenceT0iDriftMax=0<br>finiteDifferenceT0iDriftRefinedMax=0<br>finiteDifferenceT0iConvergenceOrderMean=0<br>finiteDifferenceOffDiagonalDriftMax=0<br>finiteDifferenceOffDiagonalDriftRefinedMax=0<br>finiteDifferenceOffDiagonalConvergenceOrderMean=0<br>finiteDifferenceFallbackComparable=true<br>finiteDifferenceFallbackComparedSampleCount=9<br>finiteDifferenceFallbackResidualThreshold=0.25<br>finiteDifferenceFallbackFinestT0iResidual=0<br>finiteDifferenceFallbackFinestOffDiagonalResidual=0<br>finiteDifferenceFallbackResidualThresholdPass=true<br>finiteDifferenceFallbackMonotonicPass=true<br>finiteDifferenceFallbackHasComparablePair=true<br>finiteDifferenceFallbackHasComparableTriplet=true<br>finiteDifferenceFallbackFailureMode=none<br>independentCrossCheckStatus=pass<br>independentCrossCheckEvidencePresent=true<br>independentCrossCheckEvidenceStatus=available<br>independentCrossCheckAdmissionStatus=pass<br>independentCrossCheckAdmissionFailureMode=none<br>independentCrossCheckFailureMode=none<br>independentCrossCheckFailureModeRaw=none<br>independentCrossCheckRef=einstein_tensor_geometry_fd2_independent_v1<br>independentCrossCheckReferenceRouteId=einstein_tensor_geometry_fd2_independent_v1<br>independentCrossCheckSameRoute=false<br>independentCrossCheckComparedSampleCount=9<br>independentCrossCheckReferenceRouteSuppressedSampleCount=0<br>independentCrossCheckMaxRelativeResidual=0<br>independentCrossCheckRelativeResidualThreshold=0.25<br>independentCrossCheckResidualPass=true<br>independentCrossCheckThresholdFailed=false<br>independentCrossCheckRouteIndependent=true<br>independentCrossCheckReferenceComparable=true<br>independentCrossCheckT00ComparedSampleCount=9<br>independentCrossCheckT00MaxRelativeResidual=0<br>independentCrossCheckT00ResidualPass=true<br>independentCrossCheckT00ReferenceComparable=true<br>einsteinTensorRouteStatus=available<br>einsteinTensorRouteId=einstein_tensor_geometry_fd4_v1<br>einsteinTensorTensorSource=geometry_first_einstein_tensor<br>einsteinTensorComparedSampleCount=9<br>einsteinTensorMaxRelativeResidual=0<br>einsteinTensorT00ComparedSampleCount=9<br>einsteinTensorT00MaxRelativeResidual=0<br>einsteinTensorT00RelativeResidualThreshold=0.25<br>einsteinT00ComparabilityStatus=pass<br>fullEinsteinRouteAdmissionStatus=pass<br>fullEinsteinEvidenceAdmissionPass=true<br>fullEinsteinPolicyAdmissionPass=false<br>einsteinResidualAttributionStatus=available<br>einsteinResidualAttributionSampleCount=9<br>einsteinResidualAttributionMaxRelativeResidual=0<br>einsteinResidualAttributionDiagnosisClass=mixed<br>einsteinResidualAttributionBestCandidateId=raw_geometry_fd4<br>einsteinResidualAttributionBestCandidateResidual=0<br>einsteinResidualAttributionComponents=T01:0|T02:0|T03:0|T12:0|T13:0|T23:0<br>einsteinEvaluatorClosureStatus=available<br>einsteinEvaluatorClosureChartRef=comoving_cartesian<br>einsteinEvaluatorClosureRouteId=einstein_tensor_geometry_fd4_v1<br>einsteinEvaluatorClosureUnitConvention=si_from_geometry_via_inv8pi_and_geom_to_si_stress<br>einsteinEvaluatorClosureSignConvention=T_munu_equals_plus_G_munu_over_8pi<br>einsteinEvaluatorClosureCoarseStep=3.5828324597676766<br>einsteinEvaluatorClosureRefinedStep=1.7914162298838383<br>einsteinEvaluatorClosureSuperRefinedStep=0.8957081149419192<br>einsteinEvaluatorClosureCoarseSampleCount=9<br>einsteinEvaluatorClosureRefinedSampleCount=9<br>einsteinEvaluatorClosureSuperRefinedSampleCount=9<br>einsteinEvaluatorClosureCoarseT0iResidual=0<br>einsteinEvaluatorClosureCoarseOffDiagonalResidual=0<br>einsteinEvaluatorClosureRefinedT0iResidual=0<br>einsteinEvaluatorClosureRefinedOffDiagonalResidual=0<br>einsteinEvaluatorClosureSuperRefinedT0iResidual=0<br>einsteinEvaluatorClosureSuperRefinedOffDiagonalResidual=0<br>einsteinEvaluatorClosureObservedOrderT0i=0<br>einsteinEvaluatorClosureObservedOrderOffDiagonal=0<br>einsteinEvaluatorClosureRichardsonT0i=0<br>einsteinEvaluatorClosureRichardsonOffDiagonal=0<br>einsteinEvaluatorClosureDiagnosisClass=mixed<br>einsteinEvaluatorClosureBestCandidateId=raw_geometry_fd4<br>einsteinEvaluatorClosureCitationRefs=docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md,https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf,https://arxiv.org/abs/gr-qc/0703035,https://arxiv.org/abs/gr-qc/0110086,https://arxiv.org/abs/gr-qc/0507004,https://arxiv.org/abs/1306.6052,https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html,https://arxiv.org/abs/2404.03095,https://arxiv.org/abs/2404.10855,https://arxiv.org/abs/2602.18023,docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>dtGammaPolicy=assumed_zero<br>dtGammaClosureMode=static_euclidean_gamma<br>dtGammaStaticEuclideanGamma=true<br>dtGammaExpectedRoute=true<br>dtGammaThetaMax=0.002403637625309827<br>dtGammaThetaThreshold=0.000001<br>citationCoverageStatus=pass<br>citationCoverageMissingRefs=none<br>einsteinValidationSuite.status=pass<br>einsteinValidationSuite.admittedForRoutePass=true<br>einsteinValidationSuite.evaluatedCaseCount=2<br>einsteinValidationSuite.passedCaseCount=2<br>einsteinValidationSuite.residualThreshold=1e-9<br>einsteinValidationSuite.caseResults=minkowski_zero_shift:pass:0|constant_shift_flat_space:pass:0<br>structuralPass=true<br>derivationRoutePass=true<br>closurePath.selected=full_einstein_tensor<br>closurePath.nextPatchClass=einstein_semantic_closure_patch<br>closurePath.rationale=Full Einstein-tensor route is admitted while ADM support-field route is not admitted; continue with Einstein-route semantic closure.<br>closurePath.patchBriefRef=docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md<br>reasonCodes.blocking=none<br>reasonCodes.nonBlocking=support_field_route_not_admitted |

## T00 Policy Admission Bridge Evidence
| field | value |
|---|---|
| status | pass |
| routeId | einstein_tensor_geometry_fd4_v1 |
| chartRef | comoving_cartesian |
| selectedPath | full_einstein_tensor |
| routeAdmissionRaw | experimental_not_admitted |
| routeAdmissionEffective | admitted |
| routeAdmissionPromotionBasis | evidence_gate_promoted_full_einstein |
| checks.fullEinsteinTensorRouteAdmission | pass |
| checks.einsteinT00Comparability | pass |
| checks.independentCrossCheck | pass |
| checks.finiteDifferenceConvergence | pass |
| checks.citationCoverage | pass |
| pass | true |
| rationale | Observer-local T00 policy bridge passes on the selected full_einstein_tensor path with admitted Einstein-route closure, T00 comparability, finite-difference convergence, independent cross-check, and citation coverage. |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| notes | selectedPath=full_einstein_tensor<br>routeId=einstein_tensor_geometry_fd4_v1<br>routeAdmissionRaw=experimental_not_admitted<br>routeAdmissionEffective=admitted<br>routeAdmissionPromotionBasis=evidence_gate_promoted_full_einstein<br>fullEinsteinTensorRouteAdmission=pass<br>einsteinT00Comparability=pass<br>independentCrossCheck=pass<br>finiteDifferenceConvergence=pass<br>citationCoverage=pass<br>bridgeStatus=pass<br>bridgePass=true |

## Tile Authority Evidence
| field | value |
|---|---|
| status | pass |
| chartRef | comoving_cartesian |
| routeId | einstein_tensor_geometry_fd4_v1 |
| selectedPath | full_einstein_tensor |
| tileRoute | metric_einstein_tensor_projection |
| checks.routeAdmission | pass |
| checks.fullTensorComponents | pass |
| checks.comparability | pass |
| checks.citationCoverage | pass |
| pass | true |
| rationale | Tile-effective observer authority is admitted on the same-chart Einstein projection route with matched full-tensor components, commensurate comparability checks, and citation coverage. |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| notes | selectedPath=full_einstein_tensor<br>routeId=einstein_tensor_geometry_fd4_v1<br>routeAdmission=pass<br>fullTensorComponents=pass<br>comparability=pass<br>citationCoverage=pass<br>tileSurfaceReconstitution.status=pass<br>tileSurfaceReconstitution.comparabilityStatus=pass<br>tileSurfaceReconstitution.localizationResult=proxy_artifact_suspected<br>tileSurfaceReconstitution.componentCoverage.t00=present_admitted<br>tileSurfaceReconstitution.componentCoverage.t0i=present_admitted<br>tileSurfaceReconstitution.componentCoverage.offDiagonalTij=present_admitted<br>metricEmissionAdmissionStatus=admitted<br>metricT0iAdmissionStatus=derivable_same_chart_from_existing_state<br>metricOffDiagonalAdmissionStatus=derivable_same_chart_from_existing_state<br>tileModel.pressureModel=isotropic_pressure_proxy<br>tileModel.fluxHandling=voxel_flux_field<br>tileModel.shearHandling=not_modeled_in_proxy<br>tileProxyDeclared=true<br>tileComparableLocalization=proxy_artifact_suspected<br>tileComparableNextPatchClass=tile_surface_reconstitution_patch<br>authorityStatus=pass<br>authorityPass=true |

## Tile Comparable Cross-Check Evidence
| field | value |
|---|---|
| status | pass |
| chartRef | comoving_cartesian |
| routeId | einstein_tensor_geometry_fd4_v1 |
| selectedPath | full_einstein_tensor |
| referenceRouteId | einstein_tensor_geometry_fd2_independent_v1 |
| aggregationMethod | same_profile_global_minimum_compare(wec.eulerianMin, wec.robustMin) |
| metricTensorRef | warp.metric.T00.nhm2.shift_lapse |
| tileTensorRef | warp.tileEffectiveStressEnergy |
| metricWecEulerianMin | 0 |
| metricWecRobustMin | 0 |
| tileWecEulerianMin | -43392729088 |
| tileWecRobustMin | -43392729088 |
| eulerianMinDelta | -43392729088 |
| robustMinDelta | -43392729088 |
| eulerianSignAgreement | false |
| robustSignAgreement | false |
| independentCrossCheckStatus | pass |
| comparabilityStatus | pass |
| localizationResult | proxy_artifact_suspected |
| nextPatchClass | tile_surface_reconstitution_patch |
| rationale | Comparable Einstein-path cross-check keeps metric-side WEC minima non-negative while tile-side proxy minima remain negative; localize blocker as likely proxy artifact pending tile-surface reconstitution. |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| notes | selectedPath=full_einstein_tensor<br>routeId=einstein_tensor_geometry_fd4_v1<br>referenceRouteId=einstein_tensor_geometry_fd2_independent_v1<br>routeAdmissionComparable=true<br>independentCrossCheckStatus=pass<br>comparabilityStatus=pass<br>tileProxyDeclared=true<br>metricWecEulerianMin=0<br>metricWecRobustMin=0<br>tileWecEulerianMin=-43392729088<br>tileWecRobustMin=-43392729088<br>eulerianSignAgreement=false<br>robustSignAgreement=false<br>localizationResult=proxy_artifact_suspected<br>nextPatchClass=tile_surface_reconstitution_patch |

## Tile Surface Reconstitution Evidence
| field | value |
|---|---|
| status | pass |
| chartRef | comoving_cartesian |
| routeId | einstein_tensor_geometry_fd4_v1 |
| selectedPath | full_einstein_tensor |
| sourceTensorRef | warp.metric.T00.nhm2.shift_lapse |
| reconstitutedTileTensorRef | warp.tileEffectiveStressEnergy |
| aggregationMethod | same_profile_global_minimum_compare(wec.eulerianMin, wec.robustMin)+component_coverage_gate |
| sampleDomainRef | nhm2_shift_lapse/global_region |
| componentCoverage.t00 | present_admitted |
| componentCoverage.t0i | present_admitted |
| componentCoverage.offDiagonalTij | present_admitted |
| independentCrossCheckRouteRef | einstein_tensor_geometry_fd2_independent_v1 |
| independentCrossCheckStatus | pass |
| comparabilityStatus | pass |
| localizationResult | proxy_artifact_suspected |
| rationale | Tile surface reconstitution evidence is admitted: same-chart Einstein-route components are present/admitted and commensurate cross-check localization points to tile-proxy artifact rather than metric-route incompleteness. |
| citationRefs | docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md<br>docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md<br>https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf<br>https://arxiv.org/abs/gr-qc/0703035<br>https://arxiv.org/abs/gr-qc/0110086<br>https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html<br>https://arxiv.org/abs/gr-qc/0507004<br>https://arxiv.org/abs/1306.6052<br>https://arxiv.org/abs/2404.03095<br>https://arxiv.org/abs/2404.10855<br>https://arxiv.org/abs/2602.18023<br>docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md |
| notes | selectedPath=full_einstein_tensor<br>routeId=einstein_tensor_geometry_fd4_v1<br>routeComparable=true<br>componentCoverage.t00=present_admitted<br>componentCoverage.t0i=present_admitted<br>componentCoverage.offDiagonalTij=present_admitted<br>independentCrossCheckRouteRef=einstein_tensor_geometry_fd2_independent_v1<br>comparabilityStatus=pass<br>localizationResult=proxy_artifact_suspected<br>reconstitutionStatus=pass |

## Metric Required Tensor
| field | value |
|---|---|
| tensorId | metric_required |
| status | fail |
| completeness | complete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| sampleCount | 1 |
| reasonCodes | observer_condition_failed, surrogate_model_limited |
| primaryBlockingCondition | dec |
| primaryBlockingMode | robust_only |
| primaryBlockingValue | -58267450.989558905 |
| primaryBlockingReference | metric_required.conditions.dec |
| primaryBlockingWhy | DEC is Eulerian-clean on the emitted sample but turns negative under the robust observer search. |
| rootCauseClass | mixed_independent |
| blockingDependencyStatus | primary_only |
| blockingDependencyNote | DEC is the first emitted blocker on this surface and no upstream WEC failure is present. |
| firstRemediationTarget | metric_required.conditions.dec |
| firstRemediationWhy | Start at the emitted DEC surface because no upstream WEC blocker is present on this tensor. |
| upstreamDriverRef | null |
| upstreamDriverClass | unknown |
| upstreamDriverDependencyStatus | unknown |
| upstreamDriverNote | null |
| firstUpstreamRemediationTarget | null |
| firstUpstreamRemediationWhy | null |
| wecProbeApplied | false |
| wecProbeScale | null |
| wecProbeBaseline | null |
| wecProbeResult | null |
| wecProbeDelta | null |
| decProbeBaseline | null |
| decProbeResult | null |
| decProbeDelta | null |
| wecProbeInterpretation | null |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 1 |
| typeI.fraction | 1 |
| typeI.tolerance | 0 |
| conditions.nec.status | pass |
| conditions.nec.robustMin | 58267450.989558905 |
| conditions.wec.status | pass |
| conditions.wec.robustMin | 0 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 58267450.989558905 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -58267450.989558905 |
| fluxDiagnostics.status | available |
| fluxDiagnostics.meanMagnitude | 0 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 0 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Flux diagnostics use emitted same-chart T0i channels from the metric producer model-term route. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 0 |
| model.pressureModel | diagonal_tensor_components |
| model.fluxHandling | same_chart_metric_t0i_emitted_experimental |
| model.shearHandling | same_chart_metric_tij_off_diagonal_emitted_experimental |
| model.limitationNotes | Metric-required tensor now emits same-chart T0i channels from a model-term route; observer minima are still computed with the diagonal algebraic closure until anisotropic observer search admission is complete.; Off-diagonal same-chart Tij channels are emitted from a reduced-order model-term route and remain semantically not admitted pending tensor-route closure.; Observer rho uses admitted Einstein-route T00 channel (route=einstein_tensor_geometry_fd4_v1, comparability=pass). |
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
| reasonCodes | observer_condition_failed |
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
| model.pressureModel | same_chart_metric_tensor_projection |
| model.fluxHandling | same_chart_metric_t0i_projection |
| model.shearHandling | same_chart_metric_tij_projection |
| model.limitationNotes | none |
| model.note | Tile-effective observer authority is promoted to same-chart Einstein projection (route=einstein_tensor_geometry_fd4_v1) while preserving emitted tile observer condition values. |
| missingInputs | none |


