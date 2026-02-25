# Warp Full-Solve Campaign Execution Report (2026-02-24)

## Executive verdict
**INADMISSIBLE**

## Required companion
- Executive translation: `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`

## Lane provenance
- Artifact lane: **readiness**
- Budget-stress lane can legitimately emit timeout-driven NOT_READY outcomes due to strict runtime budgets.
- Readiness lane (`--ci-fast-path`) is the source of gate evaluability and canonical campaign artifacts.

## Gate scoreboard (G0..G8)
- PASS: 7
- FAIL: 1
- UNKNOWN: 0
- NOT_READY: 0
- NOT_APPLICABLE: 1
- Total gates: 9
- Reconciled: true

## NOT_READY cause classes
- timeout_budget: 0
- missing_required_signals: 0
- policy_not_applicable_misuse: 0
- other: 0

Cross-wave aggregate gate status:
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: PASS
- G7: PASS
- G8: PASS

Per-wave gate status snapshots:
### Wave A
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: PASS
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=fail, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: reasonCode=G4_QI_APPLICABILITY_NOT_PASS;reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-321623359840581200; bound_Jm3=-18; marginRatio=1; marginRatioRaw=17867964435587844; rhoSource=warp.metric.T00.natario.shift; metricContractStatus=ok; applicabilityStatus=UNKNOWN; curvatureOk=unknown; curvatureRatio=n/a; curvatureEnforced=true; tau_s=0.005; K=n/a; safetySigma_Jm3=n/a; curvature=unknown; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=61.34470445000966 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_APPLICABILITY_NOT_PASS | G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: NOT_READY

### Wave B
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: PASS
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=fail, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: reasonCode=G4_QI_APPLICABILITY_NOT_PASS;reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-321623359840581200; bound_Jm3=-18; marginRatio=1; marginRatioRaw=17867964435587844; rhoSource=warp.metric.T00.natario.shift; metricContractStatus=ok; applicabilityStatus=UNKNOWN; curvatureOk=unknown; curvatureRatio=n/a; curvatureEnforced=true; tau_s=0.005; K=n/a; safetySigma_Jm3=n/a; curvature=unknown; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=61.34470445000966 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_APPLICABILITY_NOT_PASS | G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: NOT_READY

### Wave C
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: PASS
- G7: PASS
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=fail, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: reasonCode=G4_QI_APPLICABILITY_NOT_PASS;reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-321623359840581200; bound_Jm3=-18; marginRatio=1; marginRatioRaw=17867964435587844; rhoSource=warp.metric.T00.natario.shift; metricContractStatus=ok; applicabilityStatus=UNKNOWN; curvatureOk=unknown; curvatureRatio=n/a; curvatureEnforced=true; tau_s=0.005; K=n/a; safetySigma_Jm3=n/a; curvature=unknown; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=61.34470445000966 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_APPLICABILITY_NOT_PASS | G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: PASS

### Wave D
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: PASS
- G7: PASS
- G8: PASS
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=fail, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: reasonCode=G4_QI_APPLICABILITY_NOT_PASS;reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-321623359840581200; bound_Jm3=-18; marginRatio=1; marginRatioRaw=17867964435587844; rhoSource=warp.metric.T00.natario.shift; metricContractStatus=ok; applicabilityStatus=UNKNOWN; curvatureOk=unknown; curvatureRatio=n/a; curvatureEnforced=true; tau_s=0.005; K=n/a; safetySigma_Jm3=n/a; curvature=unknown; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=61.34470445000966 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_APPLICABILITY_NOT_PASS | G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: PASS

## Decision output
- Final decision label: **INADMISSIBLE**
- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
