# NHM2 Source Closure (2026-04-09)

"This checklist records tensor-first NHM2 source-closure evidence for the currently selected nhm2_shift_lapse profile only. It does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_source_closure |
| schemaVersion | nhm2_source_closure/v2 |
| status | fail |
| completeness | complete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-source-closure |
| reasonCodes | tensor_residual_exceeded |
| tensorRefs.metricRequired | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| tensorRefs.tileEffective | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json |
| residualNorms.relL2 | 9.228761628158325e-10 |
| residualNorms.relLInf | 4.6143808140791624e-10 |
| residualNorms.toleranceRelLInf | 0.1 |
| regional.status | available |
| regional.regionIds | hull, wall, exterior_shell |
| assumptionsDrifted | false |
| scalarCl3RhoDeltaRel | 0 |
| scalarCongruenceSecondary | true |
| scalarSurfaceId | CL3_RhoDelta |

## Global Tensor Comparison
| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -58267450.98955891 | -58267450.96267209 | 0.026886820793151855 | 4.6143808140791624e-10 |
| T11 | 58267450.98955891 | 58267450.96267209 | 0.026886820793151855 | 4.6143808140791624e-10 |
| T22 | 58267450.98955891 | 58267450.96267209 | 0.026886820793151855 | 4.6143808140791624e-10 |
| T33 | 58267450.98955891 | 58267450.96267209 | 0.026886820793151855 | 4.6143808140791624e-10 |

## Regional Comparisons
| regionId | basis | status | sampleCount | relLInf | metricT00 | tileT00 | metricTensorRef | tileTensorRef | note |
|---|---|---|---|---|---|---|---|---|---|
| hull | same_basis | fail | 1096760 | 0.9999254433955457 | -733553902.6786809 | -54691.28816794322 | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares selected-profile integral metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| wall | same_basis | fail | 3352 | 0.9478649454761662 | -1699539201.2526472 | -88605568.92269962 | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares selected-profile integral metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| exterior_shell | same_basis | fail | 2504 | 0.9901245528500822 | -1699157799.1011546 | -16779943.04439419 | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares selected-profile integral metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

