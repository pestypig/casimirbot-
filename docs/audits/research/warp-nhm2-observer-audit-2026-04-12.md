# NHM2 Observer Audit (2026-04-12)

"This checklist records the currently selected nhm2_shift_lapse profile's published observer-audit evidence only. It does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_observer_audit |
| schemaVersion | nhm2_observer_audit/v1 |
| status | fail |
| completeness | incomplete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-observer-audit |
| familyId | nhm2_shift_lapse |
| shiftLapseProfileId | stage1_centerline_alpha_0p995_v1 |
| reasonCodes | metric_audit_incomplete, observer_condition_failed, surrogate_model_limited |
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
| observerMetricCompletenessStatus | incomplete_missing_inputs |
| observerMetricCompletenessNote | Metric-required observer audit remains diagonal-only because T0i flux terms and off-diagonal spatial shear terms were not supplied; missing inputs: metric_t0i_missing, metric_tij_off_diagonal_missing |
| observerMetricCoverageBlockerStatus | producer_not_emitted |
| observerMetricCoverageBlockerNote | Metric-required observer completeness stops at metric tensor emission: the emitted same-chart observer tensor is diagonal-only and does not supply T0i flux terms or off-diagonal Tij shear terms, so completeness cannot close without new tensor emission semantics. |
| observerMetricFirstMissingStage | metric_tensor_emission |
| observerMetricEmissionAdmissionStatus | not_admitted |
| observerMetricEmissionAdmissionNote | Admission failed: the current metric-required branch emits a reduced-order diagonal tensor only. Closing T0i and off-diagonal Tij would require a new same-chart full-tensor emission semantics rather than simple serialization or consumer wiring. |
| observerMetricT0iAdmissionStatus | basis_or_semantics_ambiguous |
| observerMetricT0iAdmissionNote | T0i is not carried as an emitted same-chart quantity. The current branch would need a new momentum-density emission semantics, not a serialization of an existing tensor component. |
| observerMetricOffDiagonalTijAdmissionStatus | basis_or_semantics_ambiguous |
| observerMetricOffDiagonalTijAdmissionNote | Off-diagonal Tij is not emitted and the current diagonal pressures are reduced-order placeholders. Closing shear terms would require a new same-chart full-tensor stress semantics, not a publication-only fix. |
| observerTileAuthorityStatus | proxy_limited |
| observerTileAuthorityNote | Tile-effective observer audit remains proxy-limited: fluxHandling=voxel_flux_field, shearHandling=not_modeled_in_proxy. |
| observerLeadReadinessWorkstream | observer_completeness_and_authority |
| observerLeadReadinessReason | Observer fail remains mixed: same-surface negativity is real, metric-required coverage still misses T0i/off-diagonal inputs, and tile-effective authority remains proxy-limited. Certificate/policy readiness remains a separate parallel full-loop lane. |
| observerNextTechnicalAction | emit_same_chart_metric_flux_and_shear_terms |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metricBlockingSummary | WEC=-57110812.99010783; DEC=-114221625.98021565 |
| tileBlockingSummary | WEC=-42531360768; DEC=-85062721536 |

## Metric Required Tensor
| field | value |
|---|---|
| tensorId | metric_required |
| status | fail |
| completeness | incomplete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| sampleCount | 1 |
| reasonCodes | metric_audit_incomplete, observer_condition_failed, surrogate_model_limited |
| primaryBlockingCondition | wec |
| primaryBlockingMode | eulerian_native |
| primaryBlockingValue | -57110812.99010783 |
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
| wecProbeBaseline | -57110812.99010783 |
| wecProbeResult | -28555406.495053913 |
| wecProbeDelta | 28555406.495053913 |
| decProbeBaseline | -114221625.98021565 |
| decProbeResult | -57110812.99010783 |
| decProbeDelta | 57110812.99010783 |
| wecProbeInterpretation | Metric-side probe directly relaxes emitted WEC and downstream DEC because this surface depends on the same emitted density ref. |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 1 |
| typeI.fraction | 1 |
| typeI.tolerance | 0 |
| conditions.nec.status | pass |
| conditions.nec.robustMin | 0 |
| conditions.wec.status | fail |
| conditions.wec.robustMin | -57110812.99010783 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 0 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -114221625.98021565 |
| fluxDiagnostics.status | assumed_zero |
| fluxDiagnostics.meanMagnitude | 0 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 0 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Flux magnitude was assumed zero because T0i terms were not supplied on the metric-required tensor path. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 0 |
| model.pressureModel | diagonal_tensor_components |
| model.fluxHandling | assumed_zero_from_missing_t0i |
| model.shearHandling | assumed_zero_from_missing_tij |
| model.limitationNotes | Metric-required observer audit uses diagonal T_ab components only; T0i flux terms were not supplied and were treated as zero.; Off-diagonal spatial shear terms were unavailable, so this path is not a full anisotropic observer search. |
| model.note | Diagonal metric tensor components were audited algebraically. This is explicit diagonal-only coverage, not a full anisotropic flux/shear observer sweep. |
| missingInputs | metric_t0i_missing, metric_tij_off_diagonal_missing |

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
| fluxDiagnostics.meanMagnitude | 2.23850040723635e-16 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 1.7248447748291345e-16 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Flux diagnostics come from the tile-effective brick S_i channels. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 1.7643614434043053e-12 |
| model.pressureModel | isotropic_pressure_proxy |
| model.fluxHandling | voxel_flux_field |
| model.shearHandling | not_modeled_in_proxy |
| model.limitationNotes | Tile-effective observer audit uses the brick isotropic-pressure proxy (p = pressureFactor * rho).; Voxel flux S_i is resolved, but anisotropic pressure/shear terms are not promoted as full tensor truth in this artifact. |
| model.note | Tile-effective tensor source: pipeline |
| missingInputs | none |


