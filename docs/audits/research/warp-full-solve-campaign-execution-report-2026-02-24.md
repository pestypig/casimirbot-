# Warp Full-Solve Campaign Execution Report (2026-02-24)

## Executive verdict
**NOT_READY**

## Required companion
- Executive translation: `docs/audits/research/warp-gates-executive-translation-2026-02-24.md`

## Lane provenance
- sourceArtifactRoot: **artifacts/research/full-solve**
- Artifact lane: **readiness**
- Budget-stress lane can legitimately emit timeout-driven NOT_READY outcomes due to strict runtime budgets.
- Readiness lane (`--ci-fast-path`) is the source of gate evaluability and canonical campaign artifacts.

## Gate scoreboard (G0..G8)
- PASS: 0
- FAIL: 0
- UNKNOWN: 0
- NOT_READY: 8
- NOT_APPLICABLE: 1
- Total gates: 9
- Reconciled: true

## NOT_READY cause classes
- timeout_budget: 27
- missing_required_signals: 0
- policy_not_applicable_misuse: 0
- other: 0

Cross-wave aggregate gate status:
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: NOT_READY
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: NOT_READY
- G8: NOT_READY

Per-wave gate status snapshots:
### Wave A
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: NOT_READY
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system
- notReadyClassCounts: timeout_budget=6, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=missing, ThetaAudit=missing, source=synthesized_unknown
- g4Reasons: source=synthesized_unknown;reasonCode=G4_QI_SIGNAL_MISSING;G4 hard-source payload incomplete in evaluation constraints.
- g4ReasonCodes: G4_QI_SIGNAL_MISSING
- reproducibility.gateAgreement: NOT_READY

### Wave B
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: NOT_READY
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: NOT_APPLICABLE
- G8: NOT_APPLICABLE
- missingSignals: certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system
- notReadyClassCounts: timeout_budget=6, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=missing, ThetaAudit=missing, source=synthesized_unknown
- g4Reasons: source=synthesized_unknown;reasonCode=G4_QI_SIGNAL_MISSING;G4 hard-source payload incomplete in evaluation constraints.
- g4ReasonCodes: G4_QI_SIGNAL_MISSING
- reproducibility.gateAgreement: NOT_READY

### Wave C
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: NOT_READY
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: NOT_READY
- G8: NOT_APPLICABLE
- missingSignals: certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system
- notReadyClassCounts: timeout_budget=7, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=missing, ThetaAudit=missing, source=synthesized_unknown
- g4Reasons: source=synthesized_unknown;reasonCode=G4_QI_SIGNAL_MISSING;G4 hard-source payload incomplete in evaluation constraints.
- g4ReasonCodes: G4_QI_SIGNAL_MISSING
- reproducibility.gateAgreement: NOT_READY

### Wave D
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: NOT_READY
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: NOT_READY
- G8: NOT_READY
- missingSignals: certificate_hash, certificate_integrity, evaluation_gate_status, hard_constraint_ford_roman_qi, hard_constraint_theta_audit, initial_solver_status, provenance_chart, provenance_normalization, provenance_observer, provenance_unit_system
- notReadyClassCounts: timeout_budget=8, missing_required_signals=0, policy_not_applicable_misuse=0, other=0
- g4Diagnostics: FordRomanQI=missing, ThetaAudit=missing, source=synthesized_unknown
- g4Reasons: source=synthesized_unknown;reasonCode=G4_QI_SIGNAL_MISSING;G4 hard-source payload incomplete in evaluation constraints.
- g4ReasonCodes: G4_QI_SIGNAL_MISSING
- reproducibility.gateAgreement: NOT_READY

## Per-wave G4 evidence table
| Wave | lhs_Jm3 | boundComputed_Jm3 | boundFloor_Jm3 | boundPolicyFloor_Jm3 | boundEnvFloor_Jm3 | boundDefaultFloor_Jm3 | boundUsed_Jm3 | boundFloorApplied | marginRatioRaw | rhoSource | applicabilityStatus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| A | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | unknown | UNKNOWN |
| B | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | unknown | UNKNOWN |
| C | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | unknown | UNKNOWN |
| D | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | unknown | UNKNOWN |

## Best-case G4 summary
- classification: applicability_limited
- wave: A
- lhs_Jm3: n/a
- boundComputed_Jm3: n/a
- boundFloor_Jm3: n/a
- boundUsed_Jm3: n/a
- boundFloorApplied: n/a
- marginRatioRaw: n/a
- applicabilityStatus: UNKNOWN
- rhoSource: unknown

## Operator translation
- What failed: G0 (Aggregated from waves: A,B,C,D)
- Why it failed: hard gate and/or required signal deficits are fail-closed; see per-wave reason codes and missing-signal maps.
- What changed in this run: lane=readiness; timeout_budget=27; missing_required_signals=0.
- Can code fixes alone resolve it?: only if failures are signal/contract/scaling defects; true margin exceedance requires physics-side improvement.

## Decision output
- Final decision label: **NOT_READY**
- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
