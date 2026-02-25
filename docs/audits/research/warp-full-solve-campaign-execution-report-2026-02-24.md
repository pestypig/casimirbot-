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
- PASS: 2
- FAIL: 1
- UNKNOWN: 0
- NOT_READY: 5
- NOT_APPLICABLE: 1
- Total gates: 9
- Reconciled: true

## NOT_READY cause classes
- timeout_budget: 6
- missing_required_signals: 0
- policy_not_applicable_misuse: 0
- other: 0

Cross-wave aggregate gate status:
- G0: NOT_READY
- G1: NOT_READY
- G2: NOT_READY
- G3: NOT_READY
- G4: FAIL
- G5: NOT_APPLICABLE
- G6: NOT_READY
- G7: PASS
- G8: PASS

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
- g4Reasons: FordRomanQI and ThetaAudit constraint entries are missing from evaluator constraints; synthesized unknown diagnostics.
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
- g4Diagnostics: FordRomanQI=unknown, ThetaAudit=unknown, source=evaluator_constraints
- g4Reasons: FordRomanQI missing from evaluator output; defaulted to unknown for deterministic payload completeness. | ThetaAudit missing from evaluator output; defaulted to unknown for deterministic payload completeness.
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
- g4Diagnostics: FordRomanQI=unknown, ThetaAudit=unknown, source=evaluator_constraints
- g4Reasons: FordRomanQI missing from evaluator output; defaulted to unknown for deterministic payload completeness. | ThetaAudit missing from evaluator output; defaulted to unknown for deterministic payload completeness.
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
- g4Diagnostics: FordRomanQI=unknown, ThetaAudit=unknown, source=evaluator_constraints
- g4Reasons: FordRomanQI missing from evaluator output; defaulted to unknown for deterministic payload completeness. | ThetaAudit missing from evaluator output; defaulted to unknown for deterministic payload completeness.
- reproducibility.gateAgreement: PASS

## Decision output
- Final decision label: **INADMISSIBLE**
- Claim posture: diagnostic/reduced-order (fail-closed on hard evidence gaps).

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
