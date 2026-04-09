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
| regionId | basis | status | sampleCount | relLInf | dominantComponent | dominantRel | scaleSide | scaleRatio | signStatus | accounting | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hull | same_basis | fail | 1096760 | 0.9771894650674532 | T00 | 0.9771894650674532 | metric | 0.02281053493254683 | match | accounting_unknown | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| wall | same_basis | fail | 3352 | 14.950679233985802 | T00 | 14.950679233985802 | tile | 15.950679233985802 | match | accounting_unknown | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |
| exterior_shell | same_basis | fail | 2504 | 2.0213853465619396 | T00 | 2.0213853465619396 | tile | 3.0213853465619396 | match | accounting_unknown | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

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
| diagonalMeanMetric | 366776951.33934045 |
| diagonalMeanTile | 8366378.460979054 |
| diagonalMeanSignedRatio | 0.02281053493254683 |
| diagonalMeanMetricAbs | 733553902.6786809 |
| diagonalMeanTileAbs | 16732756.921958108 |
| diagonalMeanRatio | 0.02281053493254683 |
| diagonalMeanSide | metric |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 43.83939276115646 |
| dominantScaleSide | metric |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-hull-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-hull-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field) at warp.metric.T00.nhm2.shift_lapse.region.hull.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick) at gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| note | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -733553902.6786809 | -16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T11 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T22 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |
| T33 | 733553902.6786809 | 16732756.921958108 | 716821145.7567228 | 0.9771894650674532 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 733553902.6786809 | 16732756.921958108 | 0.02281053493254683 | 0.02281053493254683 | true | 716821145.7567228 | 716821145.7567228 |
| T11 | 733553902.6786809 | 16732756.921958108 | 0.02281053493254683 | 0.02281053493254683 | true | -716821145.7567228 | 716821145.7567228 |
| T22 | 733553902.6786809 | 16732756.921958108 | 0.02281053493254683 | 0.02281053493254683 | true | -716821145.7567228 | 716821145.7567228 |
| T33 | 733553902.6786809 | 16732756.921958108 | 0.02281053493254683 | 0.02281053493254683 | true | -716821145.7567228 | 716821145.7567228 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 16732756.921958108 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 16732756.921958108 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 16732756.921958108 | 0 | 0 | inferred |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 1096760 | 1096760 |
| maskVoxelCount | 1096760 | 1096760 |
| weightSum | null | 1096760 |
| aggregationMode | unknown | mean |
| normalizationBasis | null | sample_count |
| evidenceStatus | unknown | measured |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

| t00 diagnostic field | metric | tile |
|---|---|---|
| sampleCount | 1096760 | 1096760 |
| includedCount | null | 1096760 |
| skippedCount | null | null |
| nonFiniteCount | null | null |
| meanT00 | -733553902.6786809 | -16732756.921958108 |
| sumT00 | null | -18351818481726.773 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.hull.T00 | gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask |
| trace.sampleCount | 1096760 | 1096760 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.hull.T00 | gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.hull | gr.matter.stressEnergy.tensorSampledSummaries.hull.nhm2_shift_lapse.diagonal_proxy |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

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
| diagonalMeanMetric | 849769600.6263236 |
| diagonalMeanTile | 13554402322.382708 |
| diagonalMeanSignedRatio | 15.950679233985802 |
| diagonalMeanMetricAbs | 1699539201.2526472 |
| diagonalMeanTileAbs | 27108804644.765415 |
| diagonalMeanRatio | 15.950679233985802 |
| diagonalMeanSide | tile |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 15.950679233985802 |
| dominantScaleSide | tile |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-wall-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-wall-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field) at warp.metric.T00.nhm2.shift_lapse.region.wall.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick) at gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| note | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699539201.2526472 | -27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T11 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T22 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |
| T33 | 1699539201.2526472 | 27108804644.765415 | 25409265443.512768 | 14.950679233985802 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 1699539201.2526472 | 27108804644.765415 | 15.950679233985802 | 15.950679233985802 | true | -25409265443.512768 | 25409265443.512768 |
| T11 | 1699539201.2526472 | 27108804644.765415 | 15.950679233985802 | 15.950679233985802 | true | 25409265443.512768 | 25409265443.512768 |
| T22 | 1699539201.2526472 | 27108804644.765415 | 15.950679233985802 | 15.950679233985802 | true | 25409265443.512768 | 25409265443.512768 |
| T33 | 1699539201.2526472 | 27108804644.765415 | 15.950679233985802 | 15.950679233985802 | true | 25409265443.512768 | 25409265443.512768 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 27108804644.765415 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 27108804644.765415 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 27108804644.765415 | 0 | 0 | inferred |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 3352 | 3352 |
| maskVoxelCount | 3352 | 3352 |
| weightSum | null | 3352 |
| aggregationMode | unknown | mean |
| normalizationBasis | null | sample_count |
| evidenceStatus | unknown | measured |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

| t00 diagnostic field | metric | tile |
|---|---|---|
| sampleCount | 3352 | 3352 |
| includedCount | null | 3352 |
| skippedCount | null | null |
| nonFiniteCount | null | null |
| meanT00 | -1699539201.2526472 | -27108804644.765415 |
| sumT00 | null | -90868713169253.67 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.wall.T00 | gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask |
| trace.sampleCount | 3352 | 3352 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.wall.T00 | gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.wall | gr.matter.stressEnergy.tensorSampledSummaries.wall.nhm2_shift_lapse.diagonal_proxy |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

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
| diagonalMeanMetric | 849578899.5505773 |
| diagonalMeanTile | 2566905237.8503323 |
| diagonalMeanSignedRatio | 3.0213853465619396 |
| diagonalMeanMetricAbs | 1699157799.1011546 |
| diagonalMeanTileAbs | 5133810475.7006645 |
| diagonalMeanRatio | 3.0213853465619396 |
| diagonalMeanSide | tile |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 3.0213853465619396 |
| dominantScaleSide | tile |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json |
| tileTensorRef | artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field) at warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick) at gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| note | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy Same-basis regional closure compares runtime-integrated metric-required and tile-effective diagonal tensors over the shared GR matter brick region mask. |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699157799.1011546 | -5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T11 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T22 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |
| T33 | 1699157799.1011546 | 5133810475.7006645 | 3434652676.59951 | 2.0213853465619396 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 1699157799.1011546 | 5133810475.7006645 | 3.0213853465619396 | 3.0213853465619396 | true | -3434652676.59951 | 3434652676.59951 |
| T11 | 1699157799.1011546 | 5133810475.7006645 | 3.0213853465619396 | 3.0213853465619396 | true | 3434652676.59951 | 3434652676.59951 |
| T22 | 1699157799.1011546 | 5133810475.7006645 | 3.0213853465619396 | 3.0213853465619396 | true | 3434652676.59951 | 3434652676.59951 |
| T33 | 1699157799.1011546 | 5133810475.7006645 | 3.0213853465619396 | 3.0213853465619396 | true | 3434652676.59951 | 3434652676.59951 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 5133810475.7006645 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 5133810475.7006645 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 5133810475.7006645 | 0 | 0 | inferred |

| accounting field | metric | tile |
|---|---|---|
| sampleCount | 2504 | 2504 |
| maskVoxelCount | 2504 | 2504 |
| weightSum | null | 2504 |
| aggregationMode | unknown | mean |
| normalizationBasis | null | sample_count |
| evidenceStatus | unknown | measured |
| regionMaskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |

| t00 diagnostic field | metric | tile |
|---|---|---|
| sampleCount | 2504 | 2504 |
| includedCount | null | 2504 |
| skippedCount | null | null |
| nonFiniteCount | null | null |
| meanT00 | -1699157799.1011546 | -5133810475.7006645 |
| sumT00 | null | -12855061431154.463 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask |
| trace.sampleCount | 2504 | 2504 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.nhm2_shift_lapse.diagonal_proxy |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

