# NHM2 Source-Formula Audit (2026-04-02)

"This source-formula artifact compares canonical vs recovery metricT00Si derivation paths; it does not retune NHM2."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- firstDivergenceArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-first-divergence-2026-04-01.json`
- canonicalPath: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/qi-forensics.json`
- recoveryPath: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-recovery-search-2026-02-27.json`
- recoveryCaseId: `case_0001`

## Policy
| field | value |
|---|---|
| authoritative_formula_path_id | canonical_qi_forensics.metricT00Si_Jm3 |
| comparison_formula_path_id | recovery_search_case.metricT00Si_Jm3 |
| comparison_path_policy | canonical_authoritative_recovery_comparison_only |
| comparison_path_role | reconstruction_only |
| comparison_path_expected_equivalence | false |
| comparison_path_blocks_readiness | false |
| comparison_mismatch_disposition | advisory |
| authoritativeFormulaPathId | canonical_qi_forensics.metricT00Si_Jm3 |
| comparisonFormulaPathId | recovery_search_case.metricT00Si_Jm3 |
| comparisonPathRole | reconstruction_only |
| comparisonPathExpectedEquivalence | false |
| comparisonPathBlocksReadiness | false |
| comparisonMismatchDisposition | advisory |
| comparison_requires_formula_equivalence | false |

## Interpretation Policy
| field | value |
|---|---|
| policyId | expected_proxy_vs_metric_gap_non_promotable |
| parityExpected | false |
| promotionBlockedByMismatch | true |
| laneAUnaffectedByMismatch | true |
| interpretationStatus | advisory |
| note | Authoritative direct metric and reconstructed proxy paths are not expected to satisfy parity in reconstruction-only comparison mode; mismatch remains non-promotable for parity claims. |

## Canonical Formula Path
| field | value |
|---|---|
| authority_id | canonical_qi_forensics |
| formula_path_id | canonical_qi_forensics.metricT00Si_Jm3 |
| formula_class | direct_metric_pipeline |
| source_field_path | canonical.metricT00Si_Jm3 |
| final_metricT00Si_Jm3 | -14690028178.574236 |
| unit_contract | SI_inferred_jm3 |
| normalization_contract | unit_integral |
| derivation_mode | direct |
| readiness_authoritative | true |

### Canonical Code Paths
| path | symbol |
|---|---|
| scripts/warp-full-solve-campaign.ts | buildQiForensicsArtifact |
| server/energy-pipeline.ts | buildMetricT00Contract |

## Comparison Formula Path
| field | value |
|---|---|
| authority_id | recovery_search_case |
| formula_path_id | recovery_search_case.metricT00Si_Jm3 |
| formula_class | forward_shift_to_K_to_rho_E |
| source_field_path | recovery.bestCandidate.metricT00Si_Jm3 |
| final_metricT00Si_Jm3 | -89888730.09553961 |
| unit_contract | SI_inferred_jm3 |
| normalization_contract | unit_integral |
| derivation_mode | reconstructed |
| readiness_authoritative | false |

### Comparison Code Paths
| path | symbol |
|---|---|
| scripts/warp-g4-recovery-search.ts | extractMetricDecomposition |
| scripts/warp-g4-recovery-search.ts | buildCandidateSummary |

## Formula Comparison
| field | value |
|---|---|
| directFormulaId | canonical_qi_forensics.metricT00Si_Jm3 |
| reconstructedFormulaId | recovery_search_case.metricT00Si_Jm3 |
| comparisonMode | authoritative_direct_vs_reconstructed_proxy |
| formula_class_match | false |
| unit_contract_match | true |
| normalization_contract_match | true |
| derivation_mode_match | false |
| mismatchReason | proxy_vs_metric_term_gap |
| additionalMismatchReasons | duty_definition_mismatch,timing_source_mismatch,missing_term_mapping |
| final_metric_delta_abs | 14600139448.478697 |
| final_metric_delta_rel | 0.9938809695255286 |
| formulaEquivalent | false |
| reconstructionOnlyComparison | true |
| formulaMismatchClass | direct_vs_reconstructed |

### Tolerance Policy
| field | value |
|---|---|
| relTol | 1e-9 |
| absTol | 1e-12 |
| numericParityRule | final_metric_numeric_parity requires delta <= max(absTol, relTol * max(|direct|, |reconstructed|, 1)). |
| formulaEquivalenceRequires | formula_class_match,unit_contract_match,normalization_contract_match,derivation_mode_match,final_metric_numeric_parity |

### Resolved Inputs
| inputId | directValue | reconstructedValue | delta | relativeDelta | units | status | note |
|---|---|---|---|---|---|---|---|
| rhoSource | "warp.metric.T00.natario_sdf.shift" | "warp.metric.T00.natario_sdf.shift" | null | null | null | matched | Metric source selector carried into the formula path. |
| metricT00Ref | "warp.metric.T00.natario_sdf.shift" | "warp.metric.T00.natario_sdf.shift" | null | null | null | matched | Metric T00 provenance reference used by each path. |
| metricT00Derivation | null | "forward_shift_to_K_to_rho_E" | null | null | null | missing_direct_input | Direct path uses authoritative metric output; comparison path reconstructs through forward shift -> K -> rho_E. |
| metricT00GeomSource | "direct_metric_pipeline" | null | null | null | null | missing_reconstructed_input | Metric geometry provenance class. |
| qeiSamplingNormalization | "unit_integral" | "unit_integral" | null | null | null | matched | null |
| qeiRenormalizationScheme | "point_splitting" | "point_splitting" | null | null | null | matched | null |
| dutyEffective_FR | null | 0.12 | 0.12 | 0.12 | fraction | missing_direct_input | Recovery path emits duty-effective input; canonical direct artifact does not serialize an equivalent duty selector. |
| sectorCount | null | 80 | 80 | 1 | count | missing_direct_input | Sector-strobing inputs are present on the reconstructed path only in current artifacts. |
| concurrentSectors | null | 2 | 2 | 1 | count | missing_direct_input | Concurrent-sector selector is present on the reconstructed path only in current artifacts. |
| gammaGeo | null | 1 | 1 | 1 | dimensionless | missing_direct_input | Geometry amplification selector is present on the reconstructed path only in current artifacts. |
| gammaVanDenBroeck | null | 500 | 500 | 1 | dimensionless | missing_direct_input | VdB amplification selector is present on the reconstructed path only in current artifacts. |
| qCavity | null | 100000 | 100000 | 1 | quality_factor | missing_direct_input | Q cavity selector used by the reconstructed path. |
| qSpoilingFactor | null | 3 | 3 | 1 | dimensionless | missing_direct_input | Q spoiling selector used by the reconstructed path. |
| selected_tau_s | 0.00002 | 0.00002 | 0 | 0 | s | matched | Canonical selected QEI timescale vs reconstructed candidate tau input. |
| tauLC_s | 0.000003358990438645391 | null | -0.000003358990438645391 | -0.000003358990438645391 | s | missing_reconstructed_input | Canonical lower-bound timescale is not serialized on the reconstructed path. |
| tauPulse_s | 6.717980877290783e-8 | null | -6.717980877290783e-8 | -6.717980877290783e-8 | s | missing_reconstructed_input | Canonical pulse timescale is not serialized on the reconstructed path. |

### Term Comparisons
| termId | directValue | reconstructedValue | delta | relativeDelta | units | status | note |
|---|---|---|---|---|---|---|---|
| final_metricT00Si_Jm3 | -14690028178.574236 | -89888730.09553961 | 14600139448.478697 | 0.9938809695255286 | J/m^3 | mismatched | Direct canonical metric T00 and reconstructed recovery metric T00 diverge materially. |
| rhoMetric_Jm3 | -89888730.09553961 | -89888730.09553961 | 0 | 0 | J/m^3 | matched | Shared rhoMetric term is numerically aligned across direct and reconstructed paths. |
| metricStressRhoSiMean_Jm3 | null | -89888730.09553961 | -89888730.09553961 | -1 | J/m^3 | missing_direct_input | Reconstructed path emits stress-density mean explicitly; canonical direct artifact does not serialize it as a separate intermediate. |
| couplingAlpha | 0.5 | 0.5 | 0 | 0 | dimensionless | matched | null |
| metricT00SiRelError | 0 | 0 | 0 | 0 | dimensionless | matched | null |
| qeiSamplingNormalization | "unit_integral" | "unit_integral" | null | null | null | matched | null |
| qeiRenormalizationScheme | "point_splitting" | "point_splitting" | null | null | null | matched | null |

### Intermediate Terms (Legacy Alias)
| term | canonical_value | comparison_value | equal |
|---|---|---|---|
| rhoMetric_Jm3 | -89888730.09553961 | -89888730.09553961 | true |
| metricStressRhoSiMean_Jm3 | null | -89888730.09553961 | false |
| couplingAlpha | 0.5 | 0.5 | true |
| metricT00SiRelError | 0 | 0 | true |
| qeiSamplingNormalization | "unit_integral" | "unit_integral" | true |
| qeiRenormalizationScheme | "point_splitting" | "point_splitting" | true |

## Stage
| field | value |
|---|---|
| formulaEquivalent | false |
| reconstructionOnlyComparison | true |
| formulaMismatchClass | direct_vs_reconstructed |
| mismatchReason | proxy_vs_metric_term_gap |
| sourceFormulaInterpretationPolicy | expected_proxy_vs_metric_gap_non_promotable |
| summary | source formula mismatch class=direct_vs_reconstructed; mismatch_reason=proxy_vs_metric_term_gap; interpretation_policy=expected_proxy_vs_metric_gap_non_promotable |

## Notes
- comparison_path_role=reconstruction_only; expected_equivalence=false; blocks_readiness=false; mismatch_disposition=advisory.
- interpretation_policy=expected_proxy_vs_metric_gap_non_promotable; parity_expected=false; promotion_blocked=true; lane_a_unaffected=true.
- final_metric_delta_abs=14600139448.478697
- final_metric_delta_rel=0.9938809695255286

