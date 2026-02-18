# TOE-059 Comparative Evidence Pack: Warp Viability Reduced-Order Promotion

Ticket: `TOE-059-warp-viability-reduced-order-verification-pack`.

## Evidence matrix

| Scenario | Provenance | Strict mode | HARD constraints | Status | Strict signal set | Expected tier | Expected reason |
|---|---|---:|---:|---|---:|---|---|
| Baseline strict metric-derived run | measured | on | pass | ADMISSIBLE | complete | certified | eligible |
| Measured but strict mode disabled | measured | off | pass | ADMISSIBLE | complete | reduced-order | strict_mode_disabled |
| Measured with strict signal gap | measured | on | pass | ADMISSIBLE | incomplete | reduced-order | strict_signal_missing |
| Measured with HARD fail | measured | on | fail | INADMISSIBLE | any | reduced-order | hard_constraint_failed |
| Non-measured/proxy fallback | proxy/inferred | any | any | any | any | diagnostic | insufficient_provenance |

## Comparative conclusion

The deterministic reason-tag contract separates promotion gating from low-level constraint pass/fail internals. This yields stable audit semantics while preserving conservative behavior:

- `certified` requires full strict evidence + admissible status.
- `reduced-order` is the upper bound when evidence is measured but incomplete.
- `diagnostic` remains the floor for non-measured provenance.

## Artifacts and checks

- Runtime implementation: `tools/warpViability.ts`
- Regression checks: `tests/warp-viability.spec.ts`, `tests/warp-metric-adapter.spec.ts`, `tests/proof-pack-strict-parity.spec.ts`
