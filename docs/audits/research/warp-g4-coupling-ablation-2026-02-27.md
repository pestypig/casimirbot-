# G4 Coupling Ablation (2026-02-27)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

- analysisMode: canonical_comparable
- diagnosticFallbackUsed: false
- diagnosticFallbackSource: n/a
- baselineCaseId: case_0001
- baselineApplicabilityStatus: UNKNOWN
- baselineMarginRatioRawComputed: 1498141.138779572
- candidatePassFoundCounterfactual: false
- bestCounterfactualMarginRatioRawComputed: 1498141.138779572

## Counterfactual Term Ablations

| field | mode | slope | baseline | reference | counterfactual margin | improvement rel | blockedReason |
|---|---|---:|---:|---:|---:|---:|---|
| metricStressRhoSiMean_Jm3 | linear_slope_reference_substitution | -0.02312724942928119 | -89888730.09553961 | -89888730.09553961 | 1498141.138779572 | 0 |  |
| metricT00Si_Jm3 | linear_slope_reference_substitution | -0.02312724942928119 | -89888730.09553961 | -89888730.09553961 | 1498141.138779572 | 0 |  |
| rhoCoupledShadow_Jm3 | linear_slope_reference_substitution | -0.04625449885856238 | -44944366.32338355 | -44944366.32338355 | 1498141.138779572 | 0 |  |
| rhoMetric_Jm3 | linear_slope_reference_substitution | -0.02312724942928119 | -89888730.09553961 | -89888730.09553961 | 1498141.138779572 | 0 |  |
| couplingResidualRel | blocked_missing_slope | null | 0.9999999716179383 | 0.9999999716179383 | null | null | missing_term_slope |
| metricStressKSquaredMean | blocked_missing_slope | null | 8.104627668767766e-35 | 8.104627668767766e-35 | null | null | missing_term_slope |
| metricStressKTraceMean | blocked_missing_slope | null | 2.474459600646483e-18 | 2.474459600646483e-18 | null | null | missing_term_slope |
| metricStressRhoGeomMean_Geom | blocked_missing_slope | null | -7.42725195770471e-37 | -7.42725195770471e-37 | null | null | missing_term_slope |
| metricStressScale_m | blocked_missing_slope | null | 179.14162298838383 | 179.14162298838383 | null | null | missing_term_slope |
| metricStressStep_m | blocked_missing_slope | null | 3.5828324597676766 | 3.582832459767677 | null | null | missing_term_slope |

