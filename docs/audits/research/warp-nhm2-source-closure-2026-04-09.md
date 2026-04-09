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

## Regional Comparisons (Summary)
| regionId | basis | status | sampleCount | relLInf | dominantComponent | dominantRel | accounting | note |
|---|---|---|---|---|---|---|---|---|
| hull | same_basis | fail | 1096760 | 0.9771894650674532 | T00 | 0.9771894650674532 | accounting_clean | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| wall | same_basis | fail | 3352 | 14.950679233985802 | T00 | 14.950679233985802 | accounting_clean | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| exterior_shell | same_basis | fail | 2504 | 2.0213853465619396 | T00 | 2.0213853465619396 | accounting_clean | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

## Regional Component Details
### Region: hull
| field | value |
|---|---|
| comparisonBasisStatus | same_basis |
| status | fail |
| residualNorms.relLInf | 0.9771894650674532 |
| metricDiagonal | T00=-733553902.6786809, T11=733553902.6786809, T22=733553902.6786809, T33=733553902.6786809 |
| tileDiagonal | T00=-16732756.921958108, T11=16732756.921958108, T22=16732756.921958108, T33=16732756.921958108 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 0.9771894650674532 |
| dominantResidualAbs | 716821145.7567228 |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json |
| accountingStatus | accounting_clean |
| accountingMismatches | none |
| note | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -733553902.6786809 | -16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T11 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T22 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T33 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 1096760 | 1096760 |
| maskVoxelCount | 1096760 | 1096760 |
| weightSum | 1096760 | 1096760 |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

### Region: wall
| field | value |
|---|---|
| comparisonBasisStatus | same_basis |
| status | fail |
| residualNorms.relLInf | 14.950679233985802 |
| metricDiagonal | T00=-1699539201.2526472, T11=1699539201.2526472, T22=1699539201.2526472, T33=1699539201.2526472 |
| tileDiagonal | T00=-27108804644.765415, T11=27108804644.765415, T22=27108804644.765415, T33=27108804644.765415 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 14.950679233985802 |
| dominantResidualAbs | 25409265443.512768 |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json |
| accountingStatus | accounting_clean |
| accountingMismatches | none |
| note | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699539201.2526472 | -27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T11 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T22 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T33 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 3352 | 3352 |
| maskVoxelCount | 3352 | 3352 |
| weightSum | 3352 | 3352 |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

### Region: exterior_shell
| field | value |
|---|---|
| comparisonBasisStatus | same_basis |
| status | fail |
| residualNorms.relLInf | 2.0213853465619396 |
| metricDiagonal | T00=-1699157799.1011546, T11=1699157799.1011546, T22=1699157799.1011546, T33=1699157799.1011546 |
| tileDiagonal | T00=-5133810475.7006645, T11=5133810475.7006645, T22=5133810475.7006645, T33=5133810475.7006645 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 2.0213853465619396 |
| dominantResidualAbs | 3434652676.59951 |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json |
| accountingStatus | accounting_clean |
| accountingMismatches | none |
| note | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699157799.1011546 | -5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T11 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T22 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T33 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 2504 | 2504 |
| maskVoxelCount | 2504 | 2504 |
| weightSum | 2504 | 2504 |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

