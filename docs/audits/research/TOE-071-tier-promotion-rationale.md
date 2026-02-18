# TOE-071 Tier Promotion Rationale

- **Ticket:** `TOE-071-warp-viability-promotion-replay-pack`
- **Lane:** `research` (`tier_promotion`)
- **Scope:** `tools/warpViability.ts`, `tests/warp-viability.spec.ts`

## Objective

Define deterministic, replayable tier-promotion outcomes for warp viability and ensure every downgrade path is reason-coded to a conservative counterexample class.

## Deterministic promotion contract

Promotion remains based on strict-mode gating and measured provenance. The replay pack binds:

1. Inputs (`strict_mode`, hard-constraint status, metric-derived strict signals, provenance class).
2. Outcome (`tier`, reason code, conservative downgrade flag).
3. Counterexample class taxonomy (`provenance_missing`, `strict_disabled`, `hard_constraint_regression`, `status_regression`, `strict_signal_gap`, `none`).
4. A deterministic key assembled from the above fields for parity replay.

## Falsifiable boundaries

A candidate **must not** promote to certified when any of these hold:

- Non-measured provenance.
- Strict mode disabled.
- Any hard constraint failure.
- Non-`ADMISSIBLE` viability status.
- Missing strict metric signals (`theta`, `TS`, or `QI` derivation).

Each boundary maps to a deterministic reason and counterexample class, so replays can verify downgrade causality without heuristic interpretation.

## Maturity claim

This is a **reduced-order** policy hardening artifact: deterministic replay and taxonomy integrity improve auditability but do not imply new certified physics evidence.
