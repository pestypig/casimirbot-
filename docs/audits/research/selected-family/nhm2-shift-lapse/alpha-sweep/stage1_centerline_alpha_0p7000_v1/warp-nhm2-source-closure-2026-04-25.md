# NHM2 Source Closure (2026-04-25)

"This checklist records tensor-first NHM2 source-closure evidence for the currently selected nhm2_shift_lapse profile only. It does not widen route ETA, transport, gravity, or viability claims."

## Summary
| field | value |
|---|---|
| artifactId | nhm2_source_closure |
| schemaVersion | nhm2_source_closure/v2 |
| status | fail |
| completeness | complete |
| publicationCommand | npm run warp:full-solve:nhm2-shift-lapse:publish-source-closure |
| reasonCodes | tensor_residual_exceeded, region_basis_diagnostic_only, assumption_drift |
| tensorRefs.metricRequired | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-metric-required-tensor-latest.json |
| tensorRefs.tileEffective | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-tile-effective-tensor-latest.json |
| residualNorms.relL2 | 1.5198000001360386 |
| residualNorms.relLInf | 0.7599000000680193 |
| residualNorms.toleranceRelLInf | 0.1 |
| regional.status | available |
| regional.regionIds | hull, wall, exterior_shell |
| assumptionsDrifted | true |
| scalarCl3RhoDeltaRel | 4.814474951530828e-25 |
| scalarCongruenceSecondary | true |
| scalarSurfaceId | CL3_RhoDelta |

## Global Tensor Comparison
| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -58267450.989558905 | -13990014.97862978 | 44277436.01092912 | 0.7599000000680193 |
| T11 | 58267450.989558905 | 13990014.97862978 | 44277436.01092912 | 0.7599000000680193 |
| T22 | 58267450.989558905 | 13990014.97862978 | 44277436.01092912 | 0.7599000000680193 |
| T33 | 58267450.989558905 | 13990014.97862978 | 44277436.01092912 | 0.7599000000680193 |

## Regional Comparisons (Summary)
| regionId | basis | status | sampleCount | relLInf | dominantComponent | dominantRel | scaleSide | scaleRatio | signStatus | accounting | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hull | diagnostic_only | review | 1096760 | 0.9869428457864148 | T00 | 0.9869428457864148 | metric | 0.013057154213585212 | match | accounting_unknown | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |
| wall | diagnostic_only | review | 3352 | 0.7453860295515933 | T00 | 0.7453860295515933 | tile | 1.7453860295515933 | match | accounting_unknown | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |
| exterior_shell | diagnostic_only | review | 2504 | 0.6715309110765871 | T00 | 0.6715309110765871 | tile | 1.6715309110765872 | match | accounting_unknown | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |

## Regional Component Details
### Region: hull
| field | value |
|---|---|
| comparisonBasisStatus | diagnostic_only |
| comparisonBasisAuthorityStatus | counterpart_missing |
| comparisonBasisAuthorityReason | metric direct T00 expects tile_effective_counterpart, but resolved tile direct T00 publishes gr_matter_channel_observation |
| metricExpectedCounterpartRole | tile_effective_counterpart |
| resolvedTileCounterpartRef | null |
| counterpartResolutionStatus | missing |
| counterpartResolutionNote | no tile-side tile_effective_counterpart surface is currently published; current direct T00 resolves to gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| regionalComparisonContractStatus | narrowed_to_observation_only |
| regionalComparisonContractNote | regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |
| regionalComparisonPolicyStatus | not_required_for_same_basis_promotion |
| regionalComparisonPolicyNote | regional direct T00 remains observation-only diagnostics on current runtime surfaces and is not treated as an authoritative same-basis promotion requirement until a dedicated regional tile_effective_counterpart surface is defined |
| comparisonContractNote | current tile direct T00 at gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 is an observation path, not the expected same-basis counterpart |
| status | review |
| residualNorms.relLInf | 0.9869428457864148 |
| metricDiagonal | T00=-733553902.6786809, T11=733553902.6786809, T22=733553902.6786809, T33=733553902.6786809 |
| tileDiagonal | T00=-9578126.431252815, T11=9578126.431252815, T22=9578126.431252815, T33=9578126.431252815 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 0.9869428457864148 |
| dominantResidualAbs | 723975776.247428 |
| diagonalMeanMetric | 366776951.33934045 |
| diagonalMeanTile | 4789063.215626407 |
| diagonalMeanSignedRatio | 0.013057154213585212 |
| diagonalMeanMetricAbs | 733553902.6786809 |
| diagonalMeanTileAbs | 9578126.431252815 |
| diagonalMeanRatio | 0.013057154213585212 |
| diagonalMeanSide | metric |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 76.58636664944632 |
| dominantScaleSide | metric |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-metric-required-tensor-hull-latest.json |
| tileTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-tile-effective-tensor-hull-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| t00TraceUpstreamMismatchClass | input_field_mismatch |
| t00TraceSemanticMismatchClass | semantic_quantity_mismatch |
| t00TraceComparisonContractStatus | semantically_misaligned |
| t00TraceContractMismatchClass | comparison_contract_mismatch |
| t00TraceFirstSemanticBoundary | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| t00TraceNextInspectionTarget | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field; metric_required_t00) at warp.metric.T00.nhm2.shift_lapse.region.hull.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick; gr_matter_channel_t00) at gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00; contract=semantically_misaligned/comparison_contract_mismatch; basisAuthority=counterpart_missing; first semantic boundary=modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary; inspect modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| note | inside-hull sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -733553902.6786809 | -9578126.431252815 | 723975776.247428 | 0.9869428457864148 |
| T11 | 733553902.6786809 | 9578126.431252815 | 723975776.247428 | 0.9869428457864148 |
| T22 | 733553902.6786809 | 9578126.431252815 | 723975776.247428 | 0.9869428457864148 |
| T33 | 733553902.6786809 | 9578126.431252815 | 723975776.247428 | 0.9869428457864148 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 733553902.6786809 | 9578126.431252815 | 0.013057154213585212 | 0.013057154213585212 | true | 723975776.247428 | 723975776.247428 |
| T11 | 733553902.6786809 | 9578126.431252815 | 0.013057154213585212 | 0.013057154213585212 | true | -723975776.247428 | 723975776.247428 |
| T22 | 733553902.6786809 | 9578126.431252815 | 0.013057154213585212 | 0.013057154213585212 | true | -723975776.247428 | 723975776.247428 |
| T33 | 733553902.6786809 | 9578126.431252815 | 0.013057154213585212 | 0.013057154213585212 | true | -723975776.247428 | 723975776.247428 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 9578126.431252815 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 9578126.431252815 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 9578126.431252815 | 0 | 0 | inferred |

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
| meanT00 | -733553902.6786809 | -9578126.431252815 |
| sumT00 | null | -10504905944740.838 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.hull.T00 | gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask |
| trace.sampleCount | 1096760 | 1096760 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.hull.T00 | gr.matter.stressEnergy.tensorSampledSummaries.hull.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.hull | gr.matter.stressEnergy.tensorSampledSummaries.hull.nhm2_shift_lapse.diagonal_proxy |
| trace.boundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| trace.pathFacts.producerModule | modules/warp/natario-warp.ts | server/stress-energy-brick.ts |
| trace.pathFacts.producerFunction | calculateMetricStressEnergyTensorRegionMeansFromShiftField | buildTensorRegionSummary |
| trace.pathFacts.inputFieldRef | warp.shiftVectorField.evaluateShiftVector | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.semanticQuantityRef | warp.metric.required_t00.shift_field_eulerian | gr.matter.brick.channel_t00.region_mean |
| trace.pathFacts.semanticQuantityKind | metric_required_t00 | gr_matter_channel_t00 |
| trace.pathFacts.physicalMeaningRef | warp.metric.required_t00.eulerian_energy_density | gr.matter.channel_t00.sampled_region_mean |
| trace.pathFacts.comparisonRole | metric_required_reference | gr_matter_channel_observation |
| trace.pathFacts.expectedCounterpartRole | tile_effective_counterpart | metric_required_reference |
| trace.pathFacts.semanticEquivalenceExpected | true | false |
| trace.pathFacts.reconstructionLayer | shift_field_metric_tensor_reconstruction | gr_matter_channel_sampling |
| trace.pathFacts.assumptionBoundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.pathFacts.semanticAlignmentNote | Metric direct T00 is the reference-side metric-required quantity for same-basis source-closure comparison. | Tile direct T00 is a sampled GR matter brick channel mean, not a tile-effective counterpart to the metric-required reference quantity. |
| trace.pathFacts.upstreamValueType | derived_metric_tensor_component | sampled_brick_channel_component |
| trace.pathFacts.constructionDomain | brick_grid_metric_derivative_domain | brick_grid_matter_channel_domain |
| trace.pathFacts.constructionStage | pre_aggregation_shift_field_tensorization | pre_aggregation_channel_sampling |
| trace.pathFacts.unitsRef | J/m^3 | J/m^3 |
| trace.pathFacts.preAggregationValueRef | warp.metric.required_t00.samples | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.upstreamAssumptionNote | Metric direct T00 is reconstructed from brick-grid shift-field derivatives before regional averaging. | Tile direct T00 is the region mean of sampled GR matter brick t00 channel values before pressure proxy reconstruction. |
| trace.pathFacts.maskClassifierRef | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.hull.brick_mask |
| trace.pathFacts.voxelAveragingMode | unweighted_voxel_mean | unweighted_voxel_mean |
| trace.pathFacts.derivativeSource | shift_field_eulerian_t00 | direct_region_voxel_t00_mean |
| trace.pathFacts.pressureProxyApplied | false | false |
| trace.pathFacts.finiteDifferenceSource | brick_grid_central_difference | null |
| trace.pathFacts.samplingDomain | brick_grid.region.hull | brick_grid.region.hull |
| trace.pathFacts.supportExclusionMode | skip_nonfinite_derivative_cells | region_mask_voxel_mean |
| trace.pathFacts.normalizationRef | sample_count | sample_count |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

### Region: wall
| field | value |
|---|---|
| comparisonBasisStatus | diagnostic_only |
| comparisonBasisAuthorityStatus | counterpart_missing |
| comparisonBasisAuthorityReason | metric direct T00 expects tile_effective_counterpart, but resolved tile direct T00 publishes gr_matter_channel_observation |
| metricExpectedCounterpartRole | tile_effective_counterpart |
| resolvedTileCounterpartRef | null |
| counterpartResolutionStatus | missing |
| counterpartResolutionNote | no tile-side tile_effective_counterpart surface is currently published; current direct T00 resolves to gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| regionalComparisonContractStatus | narrowed_to_observation_only |
| regionalComparisonContractNote | regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |
| regionalComparisonPolicyStatus | not_required_for_same_basis_promotion |
| regionalComparisonPolicyNote | regional direct T00 remains observation-only diagnostics on current runtime surfaces and is not treated as an authoritative same-basis promotion requirement until a dedicated regional tile_effective_counterpart surface is defined |
| comparisonContractNote | current tile direct T00 at gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 is an observation path, not the expected same-basis counterpart |
| status | review |
| residualNorms.relLInf | 0.7453860295515933 |
| metricDiagonal | T00=-1699539201.2526472, T11=1699539201.2526472, T22=1699539201.2526472, T33=1699539201.2526472 |
| tileDiagonal | T00=-2966351978.541644, T11=2966351978.541644, T22=2966351978.541644, T33=2966351978.541644 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 0.7453860295515933 |
| dominantResidualAbs | 1266812777.288997 |
| diagonalMeanMetric | 849769600.6263236 |
| diagonalMeanTile | 1483175989.270822 |
| diagonalMeanSignedRatio | 1.7453860295515933 |
| diagonalMeanMetricAbs | 1699539201.2526472 |
| diagonalMeanTileAbs | 2966351978.541644 |
| diagonalMeanRatio | 1.7453860295515933 |
| diagonalMeanSide | tile |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 1.7453860295515933 |
| dominantScaleSide | tile |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-metric-required-tensor-wall-latest.json |
| tileTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-tile-effective-tensor-wall-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| t00TraceUpstreamMismatchClass | input_field_mismatch |
| t00TraceSemanticMismatchClass | semantic_quantity_mismatch |
| t00TraceComparisonContractStatus | semantically_misaligned |
| t00TraceContractMismatchClass | comparison_contract_mismatch |
| t00TraceFirstSemanticBoundary | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| t00TraceNextInspectionTarget | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field; metric_required_t00) at warp.metric.T00.nhm2.shift_lapse.region.wall.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick; gr_matter_channel_t00) at gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00; contract=semantically_misaligned/comparison_contract_mismatch; basisAuthority=counterpart_missing; first semantic boundary=modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary; inspect modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| note | wall-band sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699539201.2526472 | -2966351978.541644 | 1266812777.288997 | 0.7453860295515933 |
| T11 | 1699539201.2526472 | 2966351978.541644 | 1266812777.288997 | 0.7453860295515933 |
| T22 | 1699539201.2526472 | 2966351978.541644 | 1266812777.288997 | 0.7453860295515933 |
| T33 | 1699539201.2526472 | 2966351978.541644 | 1266812777.288997 | 0.7453860295515933 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 1699539201.2526472 | 2966351978.541644 | 1.7453860295515933 | 1.7453860295515933 | true | -1266812777.288997 | 1266812777.288997 |
| T11 | 1699539201.2526472 | 2966351978.541644 | 1.7453860295515933 | 1.7453860295515933 | true | 1266812777.288997 | 1266812777.288997 |
| T22 | 1699539201.2526472 | 2966351978.541644 | 1.7453860295515933 | 1.7453860295515933 | true | 1266812777.288997 | 1266812777.288997 |
| T33 | 1699539201.2526472 | 2966351978.541644 | 1.7453860295515933 | 1.7453860295515933 | true | 1266812777.288997 | 1266812777.288997 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2966351978.541644 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2966351978.541644 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2966351978.541644 | 0 | 0 | inferred |

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
| meanT00 | -1699539201.2526472 | -2966351978.541644 |
| sumT00 | null | -9943211832071.592 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.wall.T00 | gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask |
| trace.sampleCount | 3352 | 3352 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.wall.T00 | gr.matter.stressEnergy.tensorSampledSummaries.wall.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.wall | gr.matter.stressEnergy.tensorSampledSummaries.wall.nhm2_shift_lapse.diagonal_proxy |
| trace.boundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| trace.pathFacts.producerModule | modules/warp/natario-warp.ts | server/stress-energy-brick.ts |
| trace.pathFacts.producerFunction | calculateMetricStressEnergyTensorRegionMeansFromShiftField | buildTensorRegionSummary |
| trace.pathFacts.inputFieldRef | warp.shiftVectorField.evaluateShiftVector | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.semanticQuantityRef | warp.metric.required_t00.shift_field_eulerian | gr.matter.brick.channel_t00.region_mean |
| trace.pathFacts.semanticQuantityKind | metric_required_t00 | gr_matter_channel_t00 |
| trace.pathFacts.physicalMeaningRef | warp.metric.required_t00.eulerian_energy_density | gr.matter.channel_t00.sampled_region_mean |
| trace.pathFacts.comparisonRole | metric_required_reference | gr_matter_channel_observation |
| trace.pathFacts.expectedCounterpartRole | tile_effective_counterpart | metric_required_reference |
| trace.pathFacts.semanticEquivalenceExpected | true | false |
| trace.pathFacts.reconstructionLayer | shift_field_metric_tensor_reconstruction | gr_matter_channel_sampling |
| trace.pathFacts.assumptionBoundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.pathFacts.semanticAlignmentNote | Metric direct T00 is the reference-side metric-required quantity for same-basis source-closure comparison. | Tile direct T00 is a sampled GR matter brick channel mean, not a tile-effective counterpart to the metric-required reference quantity. |
| trace.pathFacts.upstreamValueType | derived_metric_tensor_component | sampled_brick_channel_component |
| trace.pathFacts.constructionDomain | brick_grid_metric_derivative_domain | brick_grid_matter_channel_domain |
| trace.pathFacts.constructionStage | pre_aggregation_shift_field_tensorization | pre_aggregation_channel_sampling |
| trace.pathFacts.unitsRef | J/m^3 | J/m^3 |
| trace.pathFacts.preAggregationValueRef | warp.metric.required_t00.samples | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.upstreamAssumptionNote | Metric direct T00 is reconstructed from brick-grid shift-field derivatives before regional averaging. | Tile direct T00 is the region mean of sampled GR matter brick t00 channel values before pressure proxy reconstruction. |
| trace.pathFacts.maskClassifierRef | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.wall.brick_mask |
| trace.pathFacts.voxelAveragingMode | unweighted_voxel_mean | unweighted_voxel_mean |
| trace.pathFacts.derivativeSource | shift_field_eulerian_t00 | direct_region_voxel_t00_mean |
| trace.pathFacts.pressureProxyApplied | false | false |
| trace.pathFacts.finiteDifferenceSource | brick_grid_central_difference | null |
| trace.pathFacts.samplingDomain | brick_grid.region.wall | brick_grid.region.wall |
| trace.pathFacts.supportExclusionMode | skip_nonfinite_derivative_cells | region_mask_voxel_mean |
| trace.pathFacts.normalizationRef | sample_count | sample_count |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

### Region: exterior_shell
| field | value |
|---|---|
| comparisonBasisStatus | diagnostic_only |
| comparisonBasisAuthorityStatus | counterpart_missing |
| comparisonBasisAuthorityReason | metric direct T00 expects tile_effective_counterpart, but resolved tile direct T00 publishes gr_matter_channel_observation |
| metricExpectedCounterpartRole | tile_effective_counterpart |
| resolvedTileCounterpartRef | null |
| counterpartResolutionStatus | missing |
| counterpartResolutionNote | no tile-side tile_effective_counterpart surface is currently published; current direct T00 resolves to gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| regionalComparisonContractStatus | narrowed_to_observation_only |
| regionalComparisonContractNote | regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |
| regionalComparisonPolicyStatus | not_required_for_same_basis_promotion |
| regionalComparisonPolicyNote | regional direct T00 remains observation-only diagnostics on current runtime surfaces and is not treated as an authoritative same-basis promotion requirement until a dedicated regional tile_effective_counterpart surface is defined |
| comparisonContractNote | current tile direct T00 at gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 is an observation path, not the expected same-basis counterpart |
| status | review |
| residualNorms.relLInf | 0.6715309110765871 |
| metricDiagonal | T00=-1699157799.1011546, T11=1699157799.1011546, T22=1699157799.1011546, T33=1699157799.1011546 |
| tileDiagonal | T00=-2840194783.9944415, T11=2840194783.9944415, T22=2840194783.9944415, T33=2840194783.9944415 |
| dominantResidualComponent | T00 |
| dominantResidualRel | 0.6715309110765871 |
| dominantResidualAbs | 1141036984.893287 |
| diagonalMeanMetric | 849578899.5505773 |
| diagonalMeanTile | 1420097391.9972208 |
| diagonalMeanSignedRatio | 1.6715309110765872 |
| diagonalMeanMetricAbs | 1699157799.1011546 |
| diagonalMeanTileAbs | 2840194783.9944415 |
| diagonalMeanRatio | 1.6715309110765872 |
| diagonalMeanSide | tile |
| diagonalSignStatus | match |
| signFlipComponents | none |
| dominantScaleComponent | T00 |
| dominantScaleRatio | 1.6715309110765872 |
| dominantScaleSide | tile |
| tileProxy.pressureModel | isotropic_pressure_proxy |
| tileProxy.pressureFactor | -1 |
| tileProxy.pressureSource | proxy |
| tileProxy.proxyMode | proxy |
| tileProxy.brickProxyMode | metric |
| metricTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-metric-required-tensor-exterior-shell-latest.json |
| tileTensorRef | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/nhm2-source-closure-tile-effective-tensor-exterior-shell-latest.json |
| accountingStatus | accounting_unknown |
| accountingMismatches | unknown:weightSum, aggregationMode, normalizationBasis |
| t00MismatchMechanism | t00_mismatch_present |
| t00MismatchMechanismEvidenceStatus | inferred |
| t00MismatchMechanismNextStep | direct_t00_source_model_mapping |
| t00TraceDivergenceStage | source_path_mismatch |
| t00TraceUpstreamMismatchClass | input_field_mismatch |
| t00TraceSemanticMismatchClass | semantic_quantity_mismatch |
| t00TraceComparisonContractStatus | semantically_misaligned |
| t00TraceContractMismatchClass | comparison_contract_mismatch |
| t00TraceFirstSemanticBoundary | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| t00TraceNextInspectionTarget | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| directT00LocalizationNote | direct T00 compares runtime_integrated_metric_region_mean (region_mean_from_shift_field; metric_required_t00) at warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 against gr_matter_brick_region_mean (region_mean_from_gr_matter_brick; gr_matter_channel_t00) at gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00; contract=semantically_misaligned/comparison_contract_mismatch; basisAuthority=counterpart_missing; first semantic boundary=modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary; inspect modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField vs server/stress-energy-brick.ts::buildTensorRegionSummary |
| note | exterior-shell sampled mean; T11/T22/T33 follow the brick pressure proxy regional direct T00 same-basis closure is intentionally narrowed to diagnostic observation only because no regional tile_effective_counterpart surface is currently published |

| component | metricRequired | tileEffective | absResidual | relResidual |
|---|---|---|---|---|
| T00 | -1699157799.1011546 | -2840194783.9944415 | 1141036984.893287 | 0.6715309110765871 |
| T11 | 1699157799.1011546 | 2840194783.9944415 | 1141036984.893287 | 0.6715309110765871 |
| T22 | 1699157799.1011546 | 2840194783.9944415 | 1141036984.893287 | 0.6715309110765871 |
| T33 | 1699157799.1011546 | 2840194783.9944415 | 1141036984.893287 | 0.6715309110765871 |

| component | metricAbs | tileAbs | ratioTileToMetric | signedRatioTileToMetric | signMatch | signedDelta | absDelta |
|---|---|---|---|---|---|---|---|
| T00 | 1699157799.1011546 | 2840194783.9944415 | 1.6715309110765872 | 1.6715309110765872 | true | -1141036984.893287 | 1141036984.893287 |
| T11 | 1699157799.1011546 | 2840194783.9944415 | 1.6715309110765872 | 1.6715309110765872 | true | 1141036984.893287 | 1141036984.893287 |
| T22 | 1699157799.1011546 | 2840194783.9944415 | 1.6715309110765872 | 1.6715309110765872 | true | 1141036984.893287 | 1141036984.893287 |
| T33 | 1699157799.1011546 | 2840194783.9944415 | 1.6715309110765872 | 1.6715309110765872 | true | 1141036984.893287 | 1141036984.893287 |

| component | constructionMode | sourceComponent | proxyFactor | proxyReconstructedValue | proxyReconstructionAbsError | proxyReconstructionRelError | evidenceStatus |
|---|---|---|---|---|---|---|---|
| T00 | direct_region_mean_t00 | null | null | null | null | null | measured |
| T11 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2840194783.9944415 | 0 | 0 | inferred |
| T22 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2840194783.9944415 | 0 | 0 | inferred |
| T33 | proxy_scaled_from_region_mean_t00 | T00 | -1 | 2840194783.9944415 | 0 | 0 | inferred |

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
| meanT00 | -1699157799.1011546 | -2840194783.9944415 |
| sumT00 | null | -7111847739122.082 |
| sourceRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| derivationMode | runtime_integrated_metric_region_mean | gr_matter_brick_region_mean |
| traceStage | region_mean_from_shift_field | region_mean_from_gr_matter_brick |
| trace.regionMaskRef | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask |
| trace.sampleCount | 2504 | 2504 |
| trace.valueRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell.T00 | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.t00Diagnostics.meanT00 |
| trace.tensorRef | warp.metric.T00.nhm2.shift_lapse.region.exterior_shell | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.nhm2_shift_lapse.diagonal_proxy |
| trace.boundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorRegionMeansFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.maskNote | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 | brick_mask=ellipsoid_axes_m(503.500000,132.000000,86.500000); wall_sigma_m=0.100000; exterior_shell_limit_m=0.300000; dims=128x128x128; cell_volume_m3=2.193055e+1 |
| trace.supportInclusionNote | metric_required uses shift-field finite-difference derivatives on the brick grid; unweighted voxel mean; non-finite derivative cells are skipped. | tile_effective uses GR matter brick region means; unweighted voxel mean; T11/T22/T33 follow the brick pressure proxy. |
| trace.normalizationBasis | sample_count | sample_count |
| trace.aggregationMode | mean | mean |
| trace.pathFacts.producerModule | modules/warp/natario-warp.ts | server/stress-energy-brick.ts |
| trace.pathFacts.producerFunction | calculateMetricStressEnergyTensorRegionMeansFromShiftField | buildTensorRegionSummary |
| trace.pathFacts.inputFieldRef | warp.shiftVectorField.evaluateShiftVector | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.semanticQuantityRef | warp.metric.required_t00.shift_field_eulerian | gr.matter.brick.channel_t00.region_mean |
| trace.pathFacts.semanticQuantityKind | metric_required_t00 | gr_matter_channel_t00 |
| trace.pathFacts.physicalMeaningRef | warp.metric.required_t00.eulerian_energy_density | gr.matter.channel_t00.sampled_region_mean |
| trace.pathFacts.comparisonRole | metric_required_reference | gr_matter_channel_observation |
| trace.pathFacts.expectedCounterpartRole | tile_effective_counterpart | metric_required_reference |
| trace.pathFacts.semanticEquivalenceExpected | true | false |
| trace.pathFacts.reconstructionLayer | shift_field_metric_tensor_reconstruction | gr_matter_channel_sampling |
| trace.pathFacts.assumptionBoundaryRef | modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField | server/stress-energy-brick.ts::buildTensorRegionSummary |
| trace.pathFacts.semanticAlignmentNote | Metric direct T00 is the reference-side metric-required quantity for same-basis source-closure comparison. | Tile direct T00 is a sampled GR matter brick channel mean, not a tile-effective counterpart to the metric-required reference quantity. |
| trace.pathFacts.upstreamValueType | derived_metric_tensor_component | sampled_brick_channel_component |
| trace.pathFacts.constructionDomain | brick_grid_metric_derivative_domain | brick_grid_matter_channel_domain |
| trace.pathFacts.constructionStage | pre_aggregation_shift_field_tensorization | pre_aggregation_channel_sampling |
| trace.pathFacts.unitsRef | J/m^3 | J/m^3 |
| trace.pathFacts.preAggregationValueRef | warp.metric.required_t00.samples | gr.matter.stressEnergy.channels.t00 |
| trace.pathFacts.upstreamAssumptionNote | Metric direct T00 is reconstructed from brick-grid shift-field derivatives before regional averaging. | Tile direct T00 is the region mean of sampled GR matter brick t00 channel values before pressure proxy reconstruction. |
| trace.pathFacts.maskClassifierRef | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask | gr.matter.stressEnergy.tensorSampledSummaries.exterior_shell.brick_mask |
| trace.pathFacts.voxelAveragingMode | unweighted_voxel_mean | unweighted_voxel_mean |
| trace.pathFacts.derivativeSource | shift_field_eulerian_t00 | direct_region_voxel_t00_mean |
| trace.pathFacts.pressureProxyApplied | false | false |
| trace.pathFacts.finiteDifferenceSource | brick_grid_central_difference | null |
| trace.pathFacts.samplingDomain | brick_grid.region.exterior_shell | brick_grid.region.exterior_shell |
| trace.pathFacts.supportExclusionMode | skip_nonfinite_derivative_cells | region_mask_voxel_mean |
| trace.pathFacts.normalizationRef | sample_count | sample_count |
| aggregationMode | mean | mean |
| normalizationBasis | sample_count | sample_count |
| evidenceStatus | inferred | inferred |

