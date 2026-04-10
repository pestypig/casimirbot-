# NHM2 Observer Audit (2026-04-10)

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
| reasonCodes | metric_audit_incomplete, tile_audit_incomplete, observer_condition_failed, surrogate_model_limited |
| observerBlockingAssessmentStatus | same_surface_violation_confirmed |
| observerPromotionBlockingSurface | both |
| observerPromotionBlockingCondition | mixed |
| observerMetricPrimaryDriver | wec |
| observerTilePrimaryDriver | wec |
| observerPrimaryDriverAgreement | aligned |
| observerPrimaryDriverNote | metric_required first localizes to WEC (eulerian_native) at metric_required.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. tile_effective first localizes to WEC (eulerian_native) at tile_effective.conditions.wec. WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. NEC/SEC remain secondary search-driven failures on the tile-effective surface. |
| observerMetricFirstInspectionTarget | metric_required.conditions.wec |
| observerTileFirstInspectionTarget | tile_effective.conditions.wec |
| observerSharedRootDriverStatus | shared_root_driver_confirmed |
| observerSharedRootDriverNote | metric_required and tile_effective both trace back to the same negative-energy-density root driver; downstream DEC/secondary co-failures should be remediated through the emitted WEC surface first. |
| observerSharedUpstreamDriverStatus | surface_specific_upstream_refs |
| observerSharedUpstreamDriverNote | metric_required traces upstream to warp.metric.T00.nhm2.shift_lapse, while tile_effective traces upstream to gr.matter.stressEnergy.tensorSampledSummaries.global.nhm2_shift_lapse.diagonal_proxy; they share the same negative-energy root class but not the same emitted upstream driver. |
| observerWecPropagationStatus | tile_proxy_independent |
| observerWecPropagationNote | 50% metric-side WEC probe relaxes metric_required WEC/DEC but leaves the tile_effective proxy effectively unchanged, so the tile proxy remains a separate remediation lane. |
| observerRemediationSequenceStatus | metric_then_tile_proxy |
| observerBlockingAssessmentNote | metric_required and tile_effective tensors emit concrete failing mixed WEC and DEC conditions with missedViolationFraction=0 and non-positive maxRobustMinusEulerian. Policy review remains required because surrogate-model limitations are still present. |
| metricBlockingSummary | WEC=-57110812.99010783; DEC=-114221625.98021565 |
| tileBlockingSummary | WEC=-0.11480523685564506; NEC=-0.05740261842782253; DEC=-0.22961047371129012; SEC=-0.05740261842782253 |

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
| completeness | incomplete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json |
| sampleCount | 0 |
| reasonCodes | tile_audit_incomplete, observer_condition_failed, surrogate_model_limited |
| primaryBlockingCondition | wec |
| primaryBlockingMode | eulerian_native |
| primaryBlockingValue | -0.11480523685564506 |
| primaryBlockingReference | tile_effective.conditions.wec |
| primaryBlockingWhy | WEC is already negative on the Eulerian sample and robust search does not deepen the minimum. DEC co-fails downstream of the same negative energy density. NEC/SEC remain secondary search-driven failures on the tile-effective surface. |
| rootCauseClass | negative_energy_density |
| blockingDependencyStatus | dec_downstream_of_wec |
| blockingDependencyNote | DEC fails on the same surface and is treated as downstream of the emitted WEC negativity. NEC and SEC remain secondary robust-only co-failures and are not treated as independent primary blockers. |
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
| wecProbeBaseline | -0.11480523685564506 |
| wecProbeResult | -0.11480523685564506 |
| wecProbeDelta | 0 |
| decProbeBaseline | -0.22961047371129012 |
| decProbeResult | -0.22961047371129012 |
| decProbeDelta | 0 |
| wecProbeInterpretation | Metric-side WEC probe does not automatically lift this tile proxy surface because it depends on a separate proxy-derived upstream ref. |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 1 |
| typeI.fraction | 1 |
| typeI.tolerance | 0 |
| conditions.nec.status | fail |
| conditions.nec.robustMin | -0.05740261842782253 |
| conditions.wec.status | fail |
| conditions.wec.robustMin | -0.11480523685564506 |
| conditions.sec.status | fail |
| conditions.sec.robustMin | -0.05740261842782253 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -0.22961047371129012 |
| fluxDiagnostics.status | unavailable |
| fluxDiagnostics.meanMagnitude | 0 |
| fluxDiagnostics.maxMagnitude | 0 |
| fluxDiagnostics.netMagnitude | 0 |
| fluxDiagnostics.netDirection | null |
| fluxDiagnostics.note | Tile-effective tensor fell back to diagonal-only observer audit; flux direction diagnostics were unavailable because S_i channels were not emitted. |
| consistency.robustNotGreaterThanEulerian | true |
| consistency.maxRobustMinusEulerian | 0 |
| model.pressureModel | diagonal_tensor_components |
| model.fluxHandling | missing_t0i_flux_channels |
| model.shearHandling | assumed_zero_from_missing_tij |
| model.limitationNotes | Tile-effective tensor fell back to a diagonal-only observer audit because GR brick flux diagnostics were unavailable.; This fallback does not supply flux magnitude search over T0i terms. |
| model.note | Tile-effective tensor source: pipeline |
| missingInputs | tile_t0i_flux_channels_missing |


