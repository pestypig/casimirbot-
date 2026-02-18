# TOE-064 Tier Promotion Rationale: Warp Viability Reduced-Order Counterexample Pack

Ticket: `TOE-064-warp-viability-reduced-order-counterexample-pack`.
Owner: `warp-mechanics`.

## Scope

This rationale documents why counterexample coverage is required before narrating reduced-order warp viability evidence as promotion-ready. The objective is to make demotion behavior deterministic and auditable whenever strict evidence or hard constraints are not satisfied.

## Promotion boundary

A warp viability result can only cross into certifiable narration when all strict prerequisites from the warp policy stack are present and consistent. Counterexamples intentionally demonstrate where this boundary must hold.

Required promotion boundary conditions:

1. Provenance class is measured/live (not proxy, inferred, or fallback).
2. Strict-mode parity signals are complete and internally consistent.
3. HARD constraints pass, including Ford-Roman and theta calibration requirements.
4. Viability status remains `ADMISSIBLE` through the oracle path.
5. Proof-pack parity includes deterministic first-fail IDs for negative cases.

If any condition above is broken, the claim must remain at most `reduced-order` and in several cases be demoted to `diagnostic`.

## Counterexample classes

The counterexample pack is structured around classes that frequently create over-claim risk:

- **Provenance degradation**: measured input replaced by proxy/fallback evidence.
- **Strict-signal incompleteness**: missing metric-derived theta, TS, QI, or contract markers.
- **Hard-constraint breach**: one or more HARD guards fail despite otherwise plausible telemetry.
- **Admissibility mismatch**: viable-looking metrics but non-`ADMISSIBLE` oracle status.
- **Parity drift**: proof-pack strict parity cannot produce deterministic first-fail semantics.

Each class maps to deterministic reason routing and must never silently promote.

## Falsifiability hooks

The rationale is falsifiable through explicit tests that force each counterexample class and assert claim-tier and reason stability. Any future promotion expansion must first provide new tests that prove the counterexample is no longer valid under the same guardrails.

## Maturity alignment

This ticket remains in reduced-order maturity. The policy is conservative: counterexamples are treated as first-class evidence that limits claims, rather than anomalies to suppress.
