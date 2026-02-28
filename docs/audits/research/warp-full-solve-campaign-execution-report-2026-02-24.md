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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-24064720231109177000; bound_Jm3=-24064720231109177000; boundComputed_Jm3=-18; boundFloor_Jm3=-24064720231109177000; boundPolicyFloor_Jm3=-24064720231109177000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=24064720231109177000; boundUsed_Jm3=-24064720231109177000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=1336928901728287700; g4FloorDominated=true; g4PolicyExceeded=true; g4ComputedExceeded=true; g4DualFailMode=both; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-60161826919729955000; rhoMetricSource=warp.metric.T00.natario.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-30080913459864977000; couplingResidualRel=1; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=diagnostic_only_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=classical_proxy_from_curvature; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=false; quantitySemanticReason=semantic_mismatch:classical_proxy_from_curvature:timelike; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=false; quantitySemanticBridgeMissing=coupling_semantics_diagnostic_only|qei_state_class_not_hadamard|qei_renormalization_not_point_splitting|qei_sampling_normalization_not_unit_integral|qei_operator_mapping_not_t_munu_uu_ren; qeiStateClass=n/a; qeiRenormalizationScheme=n/a; qeiSamplingNormalization=n/a; qeiOperatorMapping=n/a; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-4.971001885261129e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-60161826919729955000; metricT00SiFromGeom=-60161826919729955000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=2.41126348155575 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-37601125453291720000; bound_Jm3=-37601125453291720000; boundComputed_Jm3=-18; boundFloor_Jm3=-37601125453291720000; boundPolicyFloor_Jm3=-37601125453291720000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=37601125453291720000; boundUsed_Jm3=-37601125453291720000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=2088951414071762000; g4FloorDominated=true; g4PolicyExceeded=true; g4ComputedExceeded=true; g4DualFailMode=both; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-94002854792537540000; rhoMetricSource=warp.metric.T00.natario.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-47001427396268770000; couplingResidualRel=1; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=diagnostic_only_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=classical_proxy_from_curvature; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=false; quantitySemanticReason=semantic_mismatch:classical_proxy_from_curvature:timelike; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=false; quantitySemanticBridgeMissing=coupling_semantics_diagnostic_only|qei_state_class_not_hadamard|qei_renormalization_not_point_splitting|qei_sampling_normalization_not_unit_integral|qei_operator_mapping_not_t_munu_uu_ren; qeiStateClass=n/a; qeiRenormalizationScheme=n/a; qeiSamplingNormalization=n/a; qeiOperatorMapping=n/a; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-7.767190464762731e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-94002854792537540000; metricT00SiFromGeom=-94002854792537540000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=1.7253504350554831 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-66846445350679880000; bound_Jm3=-66846445350679880000; boundComputed_Jm3=-18; boundFloor_Jm3=-66846445350679880000; boundPolicyFloor_Jm3=-66846445350679880000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=66846445350679880000; boundUsed_Jm3=-66846445350679880000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=3713691408371104300; g4FloorDominated=true; g4PolicyExceeded=true; g4ComputedExceeded=true; g4DualFailMode=both; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-167116186548802520000; rhoMetricSource=warp.metric.T00.natario.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-83558093274401260000; couplingResidualRel=1; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=diagnostic_only_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=classical_proxy_from_curvature; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=false; quantitySemanticReason=semantic_mismatch:classical_proxy_from_curvature:timelike; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=false; quantitySemanticBridgeMissing=coupling_semantics_diagnostic_only|qei_state_class_not_hadamard|qei_renormalization_not_point_splitting|qei_sampling_normalization_not_unit_integral|qei_operator_mapping_not_t_munu_uu_ren; qeiStateClass=n/a; qeiRenormalizationScheme=n/a; qeiSamplingNormalization=n/a; qeiOperatorMapping=n/a; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-1.3808338624758585e-24; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-167116186548802520000; metricT00SiFromGeom=-167116186548802520000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=1.1206379531178468 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
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
- g4Reasons: reasonCode=G4_QI_MARGIN_EXCEEDED; lhs_Jm3=-12277918379371434000; bound_Jm3=-12277918379371434000; boundComputed_Jm3=-18; boundFloor_Jm3=-12277918379371434000; boundPolicyFloor_Jm3=-12277918379371434000; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18; boundFallbackAbs_Jm3=12277918379371434000; boundUsed_Jm3=-12277918379371434000; boundFloorApplied=true; marginRatio=1; marginRatioRaw=1; marginRatioRawComputed=682106576631746300; g4FloorDominated=true; g4PolicyExceeded=true; g4ComputedExceeded=true; g4DualFailMode=both; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-30694809388202440000; rhoMetricSource=warp.metric.T00.natario.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-15347404694101220000; couplingResidualRel=1; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=diagnostic_only_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=classical_proxy_from_curvature; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=false; quantitySemanticReason=semantic_mismatch:classical_proxy_from_curvature:timelike; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=false; quantitySemanticBridgeMissing=coupling_semantics_diagnostic_only|qei_state_class_not_hadamard|qei_renormalization_not_point_splitting|qei_sampling_normalization_not_unit_integral|qei_operator_mapping_not_t_munu_uu_ren; qeiStateClass=n/a; qeiRenormalizationScheme=n/a; qeiSamplingNormalization=n/a; qeiOperatorMapping=n/a; rhoSource=warp.metric.T00.natario.shift; metricT00Ref=warp.metric.T00.natario.shift; metricT00Geom=-2.536225429790692e-25; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-30694809388202440000; metricT00SiFromGeom=-30694809388202440000; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.005; K=2.9e-30; KNullReason=none; safetySigma_Jm3=18; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=3.9942881057551096 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: G4_QI_MARGIN_EXCEEDED
- reproducibility.gateAgreement: PASS

## Per-wave G4 evidence table
| Wave | lhs_Jm3 | boundComputed_Jm3 | boundFloor_Jm3 | boundPolicyFloor_Jm3 | boundEnvFloor_Jm3 | boundDefaultFloor_Jm3 | boundUsed_Jm3 | boundFloorApplied | marginRatioRaw | marginRatioRawComputed | g4FloorDominated | g4PolicyExceeded | g4ComputedExceeded | g4DualFailMode | rhoSource | applicabilityStatus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| A | -24064720231109177000 | -18 | -24064720231109177000 | -24064720231109177000 | n/a | -18 | -24064720231109177000 | true | 1 | 1336928901728287700 | true | true | true | both | warp.metric.T00.natario.shift | PASS |
| B | -37601125453291720000 | -18 | -37601125453291720000 | -37601125453291720000 | n/a | -18 | -37601125453291720000 | true | 1 | 2088951414071762000 | true | true | true | both | warp.metric.T00.natario.shift | PASS |
| C | -66846445350679880000 | -18 | -66846445350679880000 | -66846445350679880000 | n/a | -18 | -66846445350679880000 | true | 1 | 3713691408371104300 | true | true | true | both | warp.metric.T00.natario.shift | PASS |
| D | -12277918379371434000 | -18 | -12277918379371434000 | -12277918379371434000 | n/a | -18 | -12277918379371434000 | true | 1 | 682106576631746300 | true | true | true | both | warp.metric.T00.natario.shift | PASS |

## G4 governance decomposition
- canonical authoritative class: both
- governance artifact freshness: fresh
- governance freshness reason: none
- governance artifact commit: 824729a7e26126c3b6f6bacc6971809f471102a3
- current head commit: 824729a7e26126c3b6f6bacc6971809f471102a3
- policy floor dominated: true
- policy exceeded (marginRatioRaw >= 1): true
- computed exceeded (marginRatioRawComputed >= 1): true

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


## G4 recovery-search summary
- recovery artifact: artifacts/research/full-solve/g4-recovery-search-2026-02-27.json
- candidate found (backward-compatible canonical alias): no
- candidate found canonical/policy semantics: no
- candidate found computed-only counterfactual semantics: no
- blocked reason (fail-closed): none
- case count: 160
- attempted case universe: 8709120
- executed case count: 160
- min marginRatioRaw among applicability PASS: n/a
- min marginRatioRawComputed among applicability PASS: n/a
- best candidate id: case_0001
- best candidate marginRatioRawComputed: 1498141.138779572
- best candidate marginRatioRaw: 1
- best candidate applicabilityStatus: UNKNOWN
- best candidate canonical-pass eligible: false
- best candidate counterfactual-pass eligible: false
- best candidate semantics class: no_pass_signal
- recovery provenance commit: 824729a7e26126c3b6f6bacc6971809f471102a3
- recovery provenance freshness vs HEAD: fresh

## G4 recovery parity summary
- candidate count checked: 5
- anyCanonicalPassCandidate: false
- anyComputedOnlyPassCandidate: false
- dominantFailureMode: applicability_limited
- selectionPolicy: comparable_structural_semantic_gap
- parity artifact: artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json
- parity provenance commit: 824729a7e26126c3b6f6bacc6971809f471102a3
- parity provenance freshness vs HEAD: fresh
- canonical decision remains authoritative until wave profiles are promoted and rerun.

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
