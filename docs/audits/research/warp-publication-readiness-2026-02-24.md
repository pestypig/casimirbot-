# Warp Publication Readiness Audit (2026-02-24)

## Scope
Publication-grade reduced-order reproducibility posture for full-solve campaign artifacts (waves A-D).

## Defensible now / Not defensible
| Topic | Status | Notes |
|---|---|---|
| Reduced-order gate reproducibility | Defensible now | Campaign outputs include deterministic cross-wave aggregation, first-fail maps, and checksumed publication bundle artifacts. |
| Fail-closed governance posture | Defensible now | Missing/unsupported signals force `NOT_READY`; timeout paths emit structured `wave_timeout` / `campaign_timeout` reasons. |
| Physical warp feasibility claim | Not defensible | HARD constraints and reduced-order outputs are not sufficient for physical feasibility promotion. |
| Certified full-fidelity convergence proof | Not defensible | Residual trend and replication metrics are provided but can remain `NOT_READY` when fidelity depth/signals are incomplete. |

## Remaining blockers to any feasibility claim
1. Hard constraint closure (`FordRomanQI`, `ThetaAudit`) must be `PASS` with complete provenance and integrity-bearing certificate chain.
2. Independent replication at higher fidelity must remain stable with bounded drift and repeatability beyond reduced-order surrogate level.
3. Cross-model/method consistency checks must transition from diagnostic to certified maturity with external reproducibility confirmation.

## Evidence completeness caveats
- Any missing required signal (`initial_solver_status`, `evaluation_gate_status`, hard constraints, certificate hash/integrity, provenance contract fields) forces mapped gates to `NOT_READY`.
- Gate-level missing-signal maps identify exactly why each affected gate cannot advance.

## Convergence/replication caveats
- Repeated-run gate agreement and constraint drift are reported quantitatively, but can only be promotable when repeated runs and complete payloads exist.
- Residual trend requires >=2 fidelity levels; otherwise explicit `NOT_READY` is retained.

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
