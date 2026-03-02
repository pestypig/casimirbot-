# Warp Full-Solve Campaign Execution Report (2026-02-24)

## Executive verdict
**REDUCED_ORDER_ADMISSIBLE**

## Required companion
- Executive translation: `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`

## Lane provenance
- sourceArtifactRoot: **artifacts/research/full-solve**
- Artifact lane: **readiness**
- Budget-stress lane can legitimately emit timeout-driven NOT_READY outcomes due to strict runtime budgets.
- Readiness lane (`--ci-fast-path`) is the source of gate evaluability and canonical campaign artifacts.

## Gate scoreboard (G0..G8)
- PASS: 8
- FAIL: 0
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
- G4: PASS
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
- G4: PASS
- G5: NOT_APPLICABLE
- G6: PASS
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=pass, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: ; lhs_Jm3=-3.0937631287227165; bound_Jm3=-24.00000000002375; boundComputed_Jm3=-24.00000000002375; boundFloor_Jm3=-18.000000000018126; boundPolicyFloor_Jm3=-3.0937631287227165; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18.000000000018126; boundFallbackAbs_Jm3=18.000000000018126; boundUsed_Jm3=-24.00000000002375; boundFloorApplied=false; marginRatio=0.12890679702998561; marginRatioRaw=0.12890679702998561; marginRatioRawComputed=0.12890679702998561; g4FloorDominated=false; g4PolicyExceeded=false; g4ComputedExceeded=false; g4DualFailMode=neither; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-89888730.09553961; rhoMetricSource=warp.metric.T00.natario_sdf.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-44944366.32338355; couplingResidualRel=0.9999999716179383; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=bridge_ready_evidence_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=ren_expectation_timelike_energy_density; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=true; quantitySemanticReason=semantic_parity_qei_timelike_ren; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=true; quantitySemanticBridgeMissing=; qeiStateClass=hadamard; qeiRenormalizationScheme=point_splitting; qeiSamplingNormalization=unit_integral; qeiOperatorMapping=t_munu_uu_ren; congruentSolvePolicyMarginPass=true; congruentSolveComputedMarginPass=true; congruentSolveApplicabilityPass=true; congruentSolveMetricPass=true; congruentSolveSemanticPass=true; congruentSolvePass=true; congruentSolveFailReasons=; rhoSource=warp.metric.T00.natario_sdf.shift; metricT00Ref=warp.metric.T00.natario_sdf.shift; metricT00Geom=-1.2137955495876657e-34; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-14690028178.574236; metricT00SiFromGeom=-14690028178.574236; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.00002; tauConfigured_s=0.00002; tauWindow_s=0.001; tauPulse_s=6.717980877290783e-8; tauLC_s=0.000003358990438645391; tauSelected_s=0.00002; tauSelectedSource=configured; tauSelectorPolicy=configured; tauSelectorFallbackApplied=false; tauProvenanceReady=true; tauProvenanceMissing=; K=3.8e-30; KNullReason=none; safetySigma_Jm3=24; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario_sdf.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=0.0024036376253098683 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: none
- reproducibility.gateAgreement: NOT_READY

### Wave B
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: PASS
- G5: NOT_APPLICABLE
- G6: PASS
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=pass, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: ; lhs_Jm3=-3.0937631287227165; bound_Jm3=-24.00000000002375; boundComputed_Jm3=-24.00000000002375; boundFloor_Jm3=-18.000000000018126; boundPolicyFloor_Jm3=-3.0937631287227165; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18.000000000018126; boundFallbackAbs_Jm3=18.000000000018126; boundUsed_Jm3=-24.00000000002375; boundFloorApplied=false; marginRatio=0.12890679702998561; marginRatioRaw=0.12890679702998561; marginRatioRawComputed=0.12890679702998561; g4FloorDominated=false; g4PolicyExceeded=false; g4ComputedExceeded=false; g4DualFailMode=neither; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-89888730.09553961; rhoMetricSource=warp.metric.T00.natario_sdf.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-44944366.32338355; couplingResidualRel=0.9999999716179383; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=bridge_ready_evidence_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=ren_expectation_timelike_energy_density; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=true; quantitySemanticReason=semantic_parity_qei_timelike_ren; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=true; quantitySemanticBridgeMissing=; qeiStateClass=hadamard; qeiRenormalizationScheme=point_splitting; qeiSamplingNormalization=unit_integral; qeiOperatorMapping=t_munu_uu_ren; congruentSolvePolicyMarginPass=true; congruentSolveComputedMarginPass=true; congruentSolveApplicabilityPass=true; congruentSolveMetricPass=true; congruentSolveSemanticPass=true; congruentSolvePass=true; congruentSolveFailReasons=; rhoSource=warp.metric.T00.natario_sdf.shift; metricT00Ref=warp.metric.T00.natario_sdf.shift; metricT00Geom=-1.2137955495876657e-34; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-14690028178.574236; metricT00SiFromGeom=-14690028178.574236; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.00002; tauConfigured_s=0.00002; tauWindow_s=0.001; tauPulse_s=6.717980877290783e-8; tauLC_s=0.000003358990438645391; tauSelected_s=0.00002; tauSelectedSource=configured; tauSelectorPolicy=configured; tauSelectorFallbackApplied=false; tauProvenanceReady=true; tauProvenanceMissing=; K=3.8e-30; KNullReason=none; safetySigma_Jm3=24; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario_sdf.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=0.0024036376253098683 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: none
- reproducibility.gateAgreement: NOT_READY

### Wave C
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: PASS
- G5: NOT_APPLICABLE
- G6: PASS
- G7: PASS
- G8: NOT_APPLICABLE
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=pass, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: ; lhs_Jm3=-3.0937631287227165; bound_Jm3=-24.00000000002375; boundComputed_Jm3=-24.00000000002375; boundFloor_Jm3=-18.000000000018126; boundPolicyFloor_Jm3=-3.0937631287227165; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18.000000000018126; boundFallbackAbs_Jm3=18.000000000018126; boundUsed_Jm3=-24.00000000002375; boundFloorApplied=false; marginRatio=0.12890679702998561; marginRatioRaw=0.12890679702998561; marginRatioRawComputed=0.12890679702998561; g4FloorDominated=false; g4PolicyExceeded=false; g4ComputedExceeded=false; g4DualFailMode=neither; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-89888730.09553961; rhoMetricSource=warp.metric.T00.natario_sdf.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-44944366.32338355; couplingResidualRel=0.9999999716179383; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=bridge_ready_evidence_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=ren_expectation_timelike_energy_density; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=true; quantitySemanticReason=semantic_parity_qei_timelike_ren; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=true; quantitySemanticBridgeMissing=; qeiStateClass=hadamard; qeiRenormalizationScheme=point_splitting; qeiSamplingNormalization=unit_integral; qeiOperatorMapping=t_munu_uu_ren; congruentSolvePolicyMarginPass=true; congruentSolveComputedMarginPass=true; congruentSolveApplicabilityPass=true; congruentSolveMetricPass=true; congruentSolveSemanticPass=true; congruentSolvePass=true; congruentSolveFailReasons=; rhoSource=warp.metric.T00.natario_sdf.shift; metricT00Ref=warp.metric.T00.natario_sdf.shift; metricT00Geom=-1.2137955495876657e-34; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-14690028178.574236; metricT00SiFromGeom=-14690028178.574236; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.00002; tauConfigured_s=0.00002; tauWindow_s=0.001; tauPulse_s=6.717980877290783e-8; tauLC_s=0.000003358990438645391; tauSelected_s=0.00002; tauSelectedSource=configured; tauSelectorPolicy=configured; tauSelectorFallbackApplied=false; tauProvenanceReady=true; tauProvenanceMissing=; K=3.8e-30; KNullReason=none; safetySigma_Jm3=24; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario_sdf.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=0.0024036376253098683 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: none
- reproducibility.gateAgreement: PASS

### Wave D
- G0: PASS
- G1: PASS
- G2: PASS
- G3: PASS
- G4: PASS
- G5: NOT_APPLICABLE
- G6: PASS
- G7: PASS
- G8: PASS
- missingSignals: none
- notReadyClassCounts: timeout_budget=0, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=pass, ThetaAudit=pass, source=evaluator_constraints
- g4Reasons: ; lhs_Jm3=-3.0937631287227165; bound_Jm3=-24.00000000002375; boundComputed_Jm3=-24.00000000002375; boundFloor_Jm3=-18.000000000018126; boundPolicyFloor_Jm3=-3.0937631287227165; boundEnvFloor_Jm3=n/a; boundDefaultFloor_Jm3=-18.000000000018126; boundFallbackAbs_Jm3=18.000000000018126; boundUsed_Jm3=-24.00000000002375; boundFloorApplied=false; marginRatio=0.12890679702998561; marginRatioRaw=0.12890679702998561; marginRatioRawComputed=0.12890679702998561; g4FloorDominated=false; g4PolicyExceeded=false; g4ComputedExceeded=false; g4DualFailMode=neither; couplingMode=shadow; couplingAlpha=0.5; rhoMetric_Jm3=-89888730.09553961; rhoMetricSource=warp.metric.T00.natario_sdf.shift; rhoProxy_Jm3=-2.5512274856810015; rhoProxySource=pipeline.rho_static; rhoCoupledShadow_Jm3=-44944366.32338355; couplingResidualRel=0.9999999716179383; couplingComparable=true; couplingEquationRef=semiclassical_coupling+atomic_energy_to_energy_density_proxy; couplingSemantics=bridge_ready_evidence_no_gate_override; quantitySemanticBaseType=classical_proxy_from_curvature; quantitySemanticType=ren_expectation_timelike_energy_density; quantitySemanticTargetType=ren_expectation_timelike_energy_density; quantityWorldlineClass=timelike; quantitySemanticComparable=true; quantitySemanticReason=semantic_parity_qei_timelike_ren; quantitySemanticBridgeMode=strict_evidence_gated; quantitySemanticBridgeReady=true; quantitySemanticBridgeMissing=; qeiStateClass=hadamard; qeiRenormalizationScheme=point_splitting; qeiSamplingNormalization=unit_integral; qeiOperatorMapping=t_munu_uu_ren; congruentSolvePolicyMarginPass=true; congruentSolveComputedMarginPass=true; congruentSolveApplicabilityPass=true; congruentSolveMetricPass=true; congruentSolveSemanticPass=true; congruentSolvePass=true; congruentSolveFailReasons=; rhoSource=warp.metric.T00.natario_sdf.shift; metricT00Ref=warp.metric.T00.natario_sdf.shift; metricT00Geom=-1.2137955495876657e-34; metricT00GeomSource=direct_metric_pipeline; metricT00Si=-14690028178.574236; metricT00SiFromGeom=-14690028178.574236; metricT00SiRelError=0; metricContractStatus=ok; applicabilityStatus=PASS; applicabilityReasonCode=none; curvatureOk=true; curvatureRatio=0; curvatureEnforced=true; tau_s=0.00002; tauConfigured_s=0.00002; tauWindow_s=0.001; tauPulse_s=6.717980877290783e-8; tauLC_s=0.000003358990438645391; tauSelected_s=0.00002; tauSelectedSource=configured; tauSelectorPolicy=configured; tauSelectorFallbackApplied=false; tauProvenanceReady=true; tauProvenanceMissing=; K=3.8e-30; KNullReason=none; safetySigma_Jm3=24; safetySigmaNullReason=none; curvature_ok=true; curvature_ratio=0; rho_source=warp.metric.T00.natario_sdf.shift; metric_source=true; metric_contract=true; metric_contract_status=ok; curvature_enforced | |theta|=0.0024036376253098683 max=1000000000000 source=warp.metricAdapter.betaDiagnostics.thetaMax strict=true geometryTheta=true chartContract=ok metricReason=metric_adapter_divergence
- g4ReasonCodes: none
- reproducibility.gateAgreement: PASS

## Per-wave G4 evidence table
| Wave | lhs_Jm3 | boundComputed_Jm3 | boundFloor_Jm3 | boundPolicyFloor_Jm3 | boundEnvFloor_Jm3 | boundDefaultFloor_Jm3 | boundUsed_Jm3 | boundFloorApplied | marginRatioRaw | marginRatioRawComputed | g4FloorDominated | g4PolicyExceeded | g4ComputedExceeded | g4DualFailMode | rhoSource | applicabilityStatus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| A | -3.0937631287227165 | -24.00000000002375 | -18.000000000018126 | -3.0937631287227165 | n/a | -18.000000000018126 | -24.00000000002375 | false | 0.12890679702998561 | 0.12890679702998561 | false | false | false | neither | warp.metric.T00.natario_sdf.shift | PASS |
| B | -3.0937631287227165 | -24.00000000002375 | -18.000000000018126 | -3.0937631287227165 | n/a | -18.000000000018126 | -24.00000000002375 | false | 0.12890679702998561 | 0.12890679702998561 | false | false | false | neither | warp.metric.T00.natario_sdf.shift | PASS |
| C | -3.0937631287227165 | -24.00000000002375 | -18.000000000018126 | -3.0937631287227165 | n/a | -18.000000000018126 | -24.00000000002375 | false | 0.12890679702998561 | 0.12890679702998561 | false | false | false | neither | warp.metric.T00.natario_sdf.shift | PASS |
| D | -3.0937631287227165 | -24.00000000002375 | -18.000000000018126 | -3.0937631287227165 | n/a | -18.000000000018126 | -24.00000000002375 | false | 0.12890679702998561 | 0.12890679702998561 | false | false | false | neither | warp.metric.T00.natario_sdf.shift | PASS |

## G4 governance decomposition
- canonical authoritative class: neither
- governance artifact freshness: fresh
- governance freshness reason: none
- governance artifact commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- current head commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- policy floor dominated: false
- policy exceeded (marginRatioRaw >= 1): false
- computed exceeded (marginRatioRawComputed >= 1): false

## Best-case G4 summary
- classification: candidate_pass_found
- wave: A
- lhs_Jm3: -3.0937631287227165
- boundComputed_Jm3: -24.00000000002375
- boundFloor_Jm3: -18.000000000018126
- boundUsed_Jm3: -24.00000000002375
- boundFloorApplied: false
- marginRatioRaw: 0.12890679702998561
- marginRatioRawComputed: 0.12890679702998561
- applicabilityStatus: PASS
- congruentSolvePolicyMarginPass: true
- congruentSolveComputedMarginPass: true
- congruentSolveApplicabilityPass: true
- congruentSolveMetricPass: true
- congruentSolveSemanticPass: true
- congruentSolvePass: true
- congruentSolveFailReasons: none
- rhoSource: warp.metric.T00.natario_sdf.shift
- metricT00Ref: warp.metric.T00.natario_sdf.shift
- metricT00Geom: -1.2137955495876657e-34
- metricT00GeomSource: direct_metric_pipeline
- metricT00Si: -14690028178.574236
- metricT00SiFromGeom: -14690028178.574236
- metricT00SiRelError: 0


## G4 recovery-search summary
- recovery artifact: artifacts/research/full-solve/g4-recovery-search-2026-02-27.json
- candidate found (backward-compatible canonical alias): yes
- candidate found canonical/policy semantics: yes
- candidate found computed-only counterfactual semantics: yes
- blocked reason (fail-closed): none
- case count: 160
- attempted case universe: 16174080
- executed case count: 160
- min marginRatioRaw among applicability PASS: 0.12890679702998561
- min marginRatioRawComputed among applicability PASS: 0.12890679702998561
- best candidate id: case_0001
- best candidate marginRatioRawComputed: 0.12890679702998561
- best candidate marginRatioRaw: 0.12890679702998561
- best candidate applicabilityStatus: PASS
- best candidate canonical-pass eligible: true
- best candidate counterfactual-pass eligible: true
- best candidate semantics class: canonical_pass_eligible
- recovery provenance commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- recovery provenance freshness vs HEAD: fresh

## G4 recovery parity summary
- candidate count checked: 5
- anyCanonicalPassCandidate: true
- anyComputedOnlyPassCandidate: true
- dominantFailureMode: evidence_path_blocked
- selectionPolicy: comparable_canonical
- parity artifact: artifacts/research/full-solve/g4-recovery-parity-2026-02-27.json
- parity provenance commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- parity provenance freshness vs HEAD: fresh
- canonical decision remains authoritative until wave profiles are promoted and rerun.

## G4 semantic bridge matrix summary
- semantic bridge matrix artifact: artifacts/research/full-solve/g4-semantic-bridge-matrix-2026-02-27.json
- blocked reason: none
- canonical comparable count: 4
- canonical structural comparable count: 4
- recovery structural comparable count: 0
- dominant blocker token: n/a
- dominant blocker score: n/a
- semantic bridge matrix provenance commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- semantic bridge matrix provenance freshness vs HEAD: fresh


## G4 operator-mapping summary
- operator mapping artifact: artifacts/research/full-solve/g4-operator-mapping-audit-2026-03-02.json
- operator evidence status: pass
- blocked reason (fail-closed): none
- canonical missing waves: none
- mapping comparable all waves: true
- mapping bridge ready all waves: true
- mapping missing field counts: none
- operator mapping provenance commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- operator mapping provenance freshness vs HEAD: fresh
- canonical-authoritative statement: canonical campaign decision remains authoritative; operator-mapping evidence is fail-closed.

## G4 sampling/K provenance summary
- sampling/K provenance artifact: artifacts/research/full-solve/g4-kernel-provenance-audit-2026-03-02.json
- sampling/K evidence status: pass
- blocked reason (fail-closed): none
- canonical missing waves: none
- normalization pass all waves: true
- units pass all waves: true
- derivation pass all waves: true
- provenance commit valid all waves: true
- replay pass all waves: true
- missing field counts: none
- sampling/K provenance commit: 75557ef5a98ab1a4d1c57c87a1e2c4b4f12c48be
- sampling/K provenance freshness vs HEAD: fresh
- wave[1] A: kernel=gaussian; normalization=unit_integral; tau_s=0.00002; replayKernelScale=1010526315790.474; blockedTokens=none
- wave[2] B: kernel=gaussian; normalization=unit_integral; tau_s=0.00002; replayKernelScale=1010526315790.474; blockedTokens=none
- wave[3] C: kernel=gaussian; normalization=unit_integral; tau_s=0.00002; replayKernelScale=1010526315790.474; blockedTokens=none
- wave[4] D: kernel=gaussian; normalization=unit_integral; tau_s=0.00002; replayKernelScale=1010526315790.474; blockedTokens=none
- canonical-authoritative statement: canonical campaign decision remains authoritative; sampling/K provenance evidence is fail-closed.

## Operator translation
- What failed: none (No FAIL/NOT_READY/UNKNOWN gate found.)
- Why it failed: hard gate and/or required signal deficits are fail-closed; see per-wave reason codes and missing-signal maps.
- What changed in this run: lane=readiness; timeout_budget=0; missing_required_signals=0.
- Can code fixes alone resolve it?: only if failures are signal/contract/scaling defects; true margin exceedance requires physics-side improvement.

## Decision output
- Final decision label: **REDUCED_ORDER_ADMISSIBLE**
- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
