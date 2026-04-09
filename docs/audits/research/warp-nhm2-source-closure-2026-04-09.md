# NHM2 Source Closure (2026-04-09)

"This checklist records tensor-first NHM2 source-closure evidence for the currently selected nhm2_shift_lapse profile only. It does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_source_closure |
| schemaVersion | nhm2_source_closure/v1 |
| status | fail |
| completeness | complete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-source-closure |
| reasonCodes | tensor_residual_exceeded, assumption_drift |
| tensorRefs.metricRequired | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-latest.json |
| tensorRefs.tileEffective | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-latest.json |
| residualNorms.relL2 | 1.9999999965519486 |
| residualNorms.relLInf | 0.9999999990148425 |
| residualNorms.toleranceRelLInf | 0.1 |
| sampledSummaries.status | available |
| sampledSummaries.regionIds | hull, wall, exterior_shell |
| assumptionsDrifted | true |
| scalarCl3RhoDeltaRel | 0 |
| scalarCongruenceSecondary | true |
| scalarSurfaceId | CL3_RhoDelta |

## Global Tensor Comparison
| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -58267450.98955891 | -0.11480523685564506 | 58267450.87475368 | 0.999999998029685 |
| T11 | 58267450.98955891 | 0.11480523685564506 | 58267450.87475368 | 0.999999998029685 |
| T22 | 58267450.98955891 | 0.05740261842782253 | 58267450.932156295 | 0.9999999990148425 |
| T33 | 58267450.98955891 | 0.11480523685564506 | 58267450.87475368 | 0.999999998029685 |

## Regional Sampled Summaries
| regionId | sampleCount | relLInf | tileT00 | tileT11 | tileT22 | tileT33 | note |
|---|---|---|---|---|---|---|---|
| hull | 1096760 | 0.7128284035463214 | -16732756.921958108 | 16732756.921958108 | 16732756.921958108 | 16732756.921958108 | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Compared against the selected profile's global metric-required diagonal tensor because region-specific metric-required tensors are not presently published. |
| wall | 3352 | 464.24782162897617 | -27108804644.765415 | 27108804644.765415 | 27108804644.765415 | 27108804644.765415 | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Compared against the selected profile's global metric-required diagonal tensor because region-specific metric-required tensors are not presently published. |
| exterior_shell | 2504 | 87.1076894305983 | -5133810475.7006645 | 5133810475.7006645 | 5133810475.7006645 | 5133810475.7006645 | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Compared against the selected profile's global metric-required diagonal tensor because region-specific metric-required tensors are not presently published. |

