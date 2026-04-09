# NHM2 Observer Audit (2026-04-09)

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

## Metric Required Tensor
| field | value |
|---|---|
| tensorId | metric_required |
| status | fail |
| completeness | incomplete |
| tensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| sampleCount | 1 |
| reasonCodes | metric_audit_incomplete, observer_condition_failed, surrogate_model_limited |
| rapidityCap | 2.5 |
| rapidityCapBeta | 0.9866142981514303 |
| typeI.count | 1 |
| typeI.fraction | 1 |
| typeI.tolerance | 0 |
| conditions.nec.status | pass |
| conditions.nec.robustMin | 0 |
| conditions.wec.status | fail |
| conditions.wec.robustMin | -58267450.98955891 |
| conditions.sec.status | pass |
| conditions.sec.robustMin | 0 |
| conditions.dec.status | fail |
| conditions.dec.robustMin | -116534901.97911783 |
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


