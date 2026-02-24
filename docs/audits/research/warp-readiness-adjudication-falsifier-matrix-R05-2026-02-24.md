# Warp Readiness Adjudication Falsifier Matrix R05 (2026-02-24)

Boundary statement:
"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Decision target
- READY iff decision is `REDUCED_ORDER_ADMISSIBLE` and `FAIL=0`, `UNKNOWN=0`, `NOT_READY=0`.
- Observed campaign decision: `NOT_READY`.

## Falsifier matrix

| Gate | Expected ready signal | Observed status | Falsifier condition hit? | Missing signals / blocker |
|---|---|---:|---:|---|
| G0 | Wave has GR loop run artifact | NOT_READY | YES | No GR loop run artifacts found |
| G1 | `attempt.initial.status` present and admissible | NOT_READY | YES | `initial_solver_status` missing |
| G2 | `attempt.evaluation.gate.status` emitted | NOT_READY | YES | `evaluation_gate_status` missing |
| G3 | `attempt.evaluation.certificate` hash + integrity present | NOT_READY | YES | `certificate_hash`, `certificate_integrity` missing |
| G4 | Required hard constraints present (`FordRomanQI`, `ThetaAudit`) | NOT_READY | YES | `hard_constraint_ford_roman_qi`, `hard_constraint_theta_audit` missing |
| G5 | Physical feasibility promotion gate | NOT_APPLICABLE | Policy-NA | Reduced-order policy scope excludes physical-feasibility promotion |
| G6 | Raw artifacts + evaluator signal completeness relation is satisfied | NOT_READY | YES | Persisted raw outputs but evaluator/provenance signals missing |
| G7 | Stability check over repeated runs passes where applicable | NOT_READY | YES | Repeated-run gate status evidence missing/insufficient |
| G8 | Replication parity over repeated constraints passes where applicable | NOT_READY | YES | Replicated wave-D hard-constraint payload evidence missing |

## Adjudication
- Blocking gates: `G0,G1,G2,G3,G4,G6,G7,G8`
- `G5` is `NOT_APPLICABLE` by reduced-order policy, which is explicitly documented and enforced in campaign logic.
- Therefore this run is **NOT_READY** in reduced-order admissibility terms.
