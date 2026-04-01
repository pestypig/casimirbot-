# NHM2 Source-Formula Audit (2026-03-31)

"This source-formula artifact compares canonical vs recovery metricT00Si derivation paths; it does not retune NHM2."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- firstDivergenceArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-first-divergence-2026-03-31.json`
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
| formula_class_match | false |
| unit_contract_match | true |
| normalization_contract_match | true |
| derivation_mode_match | false |
| final_metric_delta_abs | 14600139448.478697 |
| final_metric_delta_rel | 0.9938809695255286 |
| formulaEquivalent | false |
| reconstructionOnlyComparison | true |
| formulaMismatchClass | direct_vs_reconstructed |

### Intermediate Terms
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
| summary | source formula mismatch class=direct_vs_reconstructed |

## Notes
- comparison_path_role=reconstruction_only; expected_equivalence=false; blocks_readiness=false; mismatch_disposition=advisory.
- final_metric_delta_abs=14600139448.478697
- final_metric_delta_rel=0.9938809695255286

