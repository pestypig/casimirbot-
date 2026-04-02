# NHM2 Source / Mechanism Parity-Route Feasibility (2026-04-02)

"This artifact evaluates whether the direct_proxy_parity_route is realistically closable in the current architecture; it does not itself promote the source/mechanism lane or alter Lane A."

| field | value |
|---|---|
| routeId | direct_proxy_parity_route |
| routeStatus | available_but_unmet |
| feasibilityStatus | blocked_by_derivation_class_difference |
| routeBlockingClass | direct_metric_vs_reconstructed_proxy_derivation_gap |
| dominantMismatchTerm | final_metricT00Si_Jm3 |
| matchedTerms | rhoMetric_Jm3,couplingAlpha,metricT00SiRelError,qeiSamplingNormalization,qeiRenormalizationScheme |
| unmatchedTerms | final_metricT00Si_Jm3,metricStressRhoSiMean_Jm3 |
| sharedContributors | rhoMetric_Jm3 |
| sharedSupportingTerms | couplingAlpha,metricT00SiRelError,qeiSamplingNormalization,qeiRenormalizationScheme |
| directOnlyContributors | direct_metric_closure_term_set_beyond_rhoMetric |
| reconstructedOnlyContributors | metricStressRhoSiMean_Jm3 |
| unmatchedContributors | direct_metric_closure_term_set_beyond_rhoMetric,metricStressRhoSiMean_Jm3 |
| missingProxyTerms | direct_metric_closure_term_set_beyond_rhoMetric |
| missingDirectTerms | authoritative_direct_metric_additive_decomposition_for_final_metricT00Si_Jm3 |
| nextClosureAction | emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract |
| proofOfClosureArtifact | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| routeSummary | Parity route is not realistically closable in current architecture without a derivation-class upgrade: the reconstructed path already matches rhoMetric_Jm3 but does not carry a mapped direct-metric closure term beyond rhoMetric, and the authoritative direct path emits final_metricT00Si_Jm3 only as an aggregate. |

## Direct Path Decomposition
| field | value |
|---|---|
| pathRole | authoritative_direct_metric |
| formulaClass | direct_metric_pipeline |
| derivationMode | direct |
| decompositionStatus | aggregate_authoritative_metric_term_only |
| finalMetricTermId | final_metricT00Si_Jm3 |
| contributorTerms | rhoMetric_Jm3 |
| sharedContributorTerms | rhoMetric_Jm3 |
| supportingMatchedTerms | couplingAlpha,metricT00SiRelError,qeiSamplingNormalization,qeiRenormalizationScheme |
| unavailableContributorTerms | authoritative_direct_metric_additive_decomposition_for_final_metricT00Si_Jm3 |
| missingAdditiveBreakdown | true |
| note | Canonical direct path exposes rhoMetric-scale agreement but serializes final_metricT00Si_Jm3 as an authoritative aggregate, so the residual direct-only closure contribution is not additively decomposed in current artifacts. |

## Reconstructed Path Decomposition
| field | value |
|---|---|
| pathRole | reconstructed_proxy |
| formulaClass | forward_shift_to_K_to_rho_E |
| derivationMode | reconstructed |
| decompositionStatus | proxy_reconstruction_terms_available |
| finalMetricTermId | final_metricT00Si_Jm3 |
| contributorTerms | rhoMetric_Jm3 |
| sharedContributorTerms | rhoMetric_Jm3 |
| supportingMatchedTerms | couplingAlpha,metricT00SiRelError,qeiSamplingNormalization,qeiRenormalizationScheme |
| unavailableContributorTerms | direct_metric_closure_term_set_beyond_rhoMetric |
| missingAdditiveBreakdown | false |
| note | Reconstructed path closes at the rhoMetric-scale proxy term and emits metricStressRhoSiMean_Jm3, but does not expose a mapped direct-metric closure term beyond rhoMetric_Jm3 for final-metric parity. |

## Closure Work Items
- Serialize an additive authoritative direct-metric decomposition for final_metricT00Si_Jm3 instead of exposing only the aggregate final metric term.
- Define a mapped proxy closure term set beyond rhoMetric_Jm3, or upgrade the reconstructed path to a direct-metric derivation class.
- Re-emit the source-formula audit to show whether final_metricT00Si_Jm3 becomes term-closable or remains architecture-level non-equivalent.

## Inputs
- sourceFormulaArtifact: `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`
- sourceMechanismPromotionContractArtifact: `artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json`
- sourceMechanismMaturityArtifact: `artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json`

## Notes
- route_status=available_but_unmet; feasibility_status=blocked_by_derivation_class_difference; blocking_class=direct_metric_vs_reconstructed_proxy_derivation_gap.
- dominant_mismatch_term=final_metricT00Si_Jm3; matched_terms=rhoMetric_Jm3,couplingAlpha,metricT00SiRelError,qeiSamplingNormalization,qeiRenormalizationScheme; unmatched_terms=final_metricT00Si_Jm3,metricStressRhoSiMean_Jm3.
- missing_proxy_terms=direct_metric_closure_term_set_beyond_rhoMetric; missing_direct_terms=authoritative_direct_metric_additive_decomposition_for_final_metricT00Si_Jm3.
