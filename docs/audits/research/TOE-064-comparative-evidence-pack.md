# TOE-064 Comparative Evidence Pack: Warp Viability Reduced-Order Counterexamples

Ticket: `TOE-064-warp-viability-reduced-order-counterexample-pack`.

## Comparative counterexample matrix

| Scenario | Counterexample class | Expected claim tier | Deterministic routing expectation | Guarded by tests |
|---|---|---|---|---|
| Live measured strict-complete admissible baseline | none (control) | certified | `eligible` | `tests/warp-viability.spec.ts` |
| Measured evidence with strict mode disabled | strict-signal incompleteness | reduced-order | `strict_mode_disabled` | `tests/warp-viability.spec.ts` |
| Measured evidence with missing strict parity signal | strict-signal incompleteness | reduced-order | `strict_signal_missing` | `tests/proof-pack-strict-parity.spec.ts` |
| Measured evidence with HARD-constraint failure | hard-constraint breach | reduced-order | `hard_constraint_failed` | `tests/warp-viability.spec.ts` |
| Non-measured / proxy fallback path | provenance degradation | diagnostic | `insufficient_provenance` | `tests/warp-metric-adapter.spec.ts` |
| Non-ADMISSIBLE oracle status with otherwise strong metrics | admissibility mismatch | reduced-order | `status_non_admissible` | `tests/warp-viability.spec.ts` |
| Strict proof pack cannot emit deterministic firstFail | parity drift | reduced-order or diagnostic (policy floor) | deterministic fail id required | `tests/proof-pack-strict-parity.spec.ts` |

## Evidence interpretation

The matrix demonstrates that counterexamples are not edge noise; they are explicit claim-tier boundaries. The reduced-order layer is intentionally conservative and only acts as an upper bound when measured evidence exists but strict certifiability is incomplete.

## Promotion safety conclusion

- Promotion safety is upheld only when control-path strict evidence is complete and admissible.
- Counterexamples force deterministic demotion behavior and prevent narrative overreach.
- Comparative parity checks ensure proof-pack semantics remain consistent across adapter and viability surfaces.

## Referenced runtime surfaces

- `tools/warpViability.ts`
- `tests/warp-viability.spec.ts`
- `tests/warp-metric-adapter.spec.ts`
- `tests/proof-pack-strict-parity.spec.ts`
