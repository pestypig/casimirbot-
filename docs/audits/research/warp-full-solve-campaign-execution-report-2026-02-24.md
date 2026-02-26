# Warp Full-Solve Campaign Execution Report (2026-02-24)

## Executive verdict
**INADMISSIBLE**

## Required companion
- Executive translation: `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`

## Lane provenance
- sourceArtifactRoot: **artifacts/research/full-solve**
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-24064720231109177000; bound_Jm3=-24064720231109177000; boundComputed_Jm3=-18; boundFloor_Jm3=-24064720231109177000; boundPolicyFloor_Jm3=-24064720231109177000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=24064720231109177000; boundUsed_Jm3=-24064720231109177000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=1336928901728287700; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-4.971001885261129e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-60161826919729955000; metricT00SiFromGeom=-60161826919729955000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=2.41126348155575 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_MARGIN_EXCEEDED
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-37601125453291720000; bound_Jm3=-37601125453291720000; boundComputed_Jm3=-18; boundFloor_Jm3=-37601125453291720000; boundPolicyFloor_Jm3=-37601125453291720000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=37601125453291720000; boundUsed_Jm3=-37601125453291720000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=2088951414071762000; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-7.767190464762731e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-94002854792537540000; metricT00SiFromGeom=-94002854792537540000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=1.7253504350554831 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_MARGIN_EXCEEDED
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-66846445350679880000; bound_Jm3=-66846445350679880000; boundComputed_Jm3=-18; boundFloor_Jm3=-66846445350679880000; boundPolicyFloor_Jm3=-66846445350679880000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=66846445350679880000; boundUsed_Jm3=-66846445350679880000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=3713691408371104300; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-1.3808338624758585e-24; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-167116186548802520000; metricT00SiFromGeom=-167116186548802520000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=1.1206379531178468 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_MARGIN_EXCEEDED
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-12277918379371434000; bound_Jm3=-12277918379371434000; boundComputed_Jm3=-18; boundFloor_Jm3=-12277918379371434000; boundPolicyFloor_Jm3=-12277918379371434000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=12277918379371434000; boundUsed_Jm3=-12277918379371434000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=682106576631746300; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-2.536225429790692e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-30694809388202440000; metricT00SiFromGeom=-30694809388202440000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=3.9942881057551096 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: PASS

## Per-wave G4 evidence table
| Wave | lhs_Jm3 | boundComputed_Jm3 | boundFloor_Jm3 | boundPolicyFloor_Jm3 | boundEnvFloor_Jm3 | boundDefaultFloor_Jm3 | boundUsed_Jm3 | boundFloorApplied | marginRatioRaw | marginRatioRawComputed | rhoSource | applicabilityStatus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- |
| A | -24064720231109177000 | -18 | -24064720231109177000 | -24064720231109177000 | n/a | -18 | -24064720231109177000 | true | 1 | 1336928901728287700 | warp.metric.T00.natario.shift | PASS |
| B | -37601125453291720000 | -18 | -37601125453291720000 | -37601125453291720000 | n/a | -18 | -37601125453291720000 | true | 1 | 2088951414071762000 | warp.metric.T00.natario.shift | PASS |
| C | -66846445350679880000 | -18 | -66846445350679880000 | -66846445350679880000 | n/a | -18 | -66846445350679880000 | true | 1 | 3713691408371104300 | warp.metric.T00.natario.shift | PASS |
| D | -12277918379371434000 | -18 | -12277918379371434000 | -12277918379371434000 | n/a | -18 | -12277918379371434000 | true | 1 | 682106576631746300 | warp.metric.T00.natario.shift | PASS |

## Best-case G4 summary
- classification: margin_limited
- wave: A
- lhs_Jm3: -24064720231109177000
- boundComputed_Jm3: -18
- boundFloor_Jm3: -24064720231109177000
- boundUsed_Jm3: -24064720231109177000
- boundFloorApplied: true
- marginRatioRaw: 1
- marginRatioRawComputed: 1336928901728287700
- applicabilityStatus: PASS
- rhoSource: warp.metric.T00.natario.shift
- metricT00Ref: warp.metric.T00.natario.shift
- metricT00Geom: -4.971001885261129e-25
- metricT00GeomSource: direct_metric_pipeline
- metricT00Si: -60161826919729955000
- metricT00SiFromGeom: -60161826919729955000
- metricT00SiRelError: 0

## Operator translation
- What failed: G4 (Aggregated from waves: A,B,C,D)
- Why it failed: hard gate and/or required signal deficits are fail-closed; see per-wave reason codes and missing-signal maps.
- What changed in this run: lane=readiness; timeout_budget=0; missing_required_signals=0.
- Can code fixes alone resolve it?: only if failures are signal/contract/scaling defects; true margin exceedance requires physics-side improvement.

## Decision output
- Final decision label: **INADMISSIBLE**
- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
