# TOE-071 Comparative Evidence Pack

- **Ticket:** `TOE-071-warp-viability-promotion-replay-pack`
- **Lane:** `research` (`tier_promotion`)
- **Comparison axis:** promotion replay determinism + conservative downgrade taxonomy

## Cases

| Case | Setup | Expected replay outcome | Counterexample class |
|---|---|---|---|
| A: hard constraint regression | Strict mode enabled, measured signals present, but hard constraint fails | `tier=reduced-order`, `reason=hard_constraint_failed`, deterministic key stable | `hard_constraint_regression` |
| B: provenance deficit | Missing provenance metadata / proxy evidence | `tier=diagnostic`, `reason=insufficient_provenance` | `provenance_missing` |
| C: certified eligible parity | Strict mode enabled, measured provenance, all hard constraints pass, status admissible, all strict signals derived | `tier=certified`, `reason=eligible`, deterministic key unchanged across equivalent replays | `none` |

## Evidence hooks

The pack is validated by tests in `tests/warp-viability.spec.ts` that assert:

- Reason-coded promotion outcomes.
- Counterexample-class mapping for downgrade scenarios.
- Deterministic replay equality under repeated identical evaluation.

## Conservatism argument

Counterexamples force downgrade classes and set `conservative_downgrade=true` whenever tier is not certified. This blocks accidental promotion narratives when strict evidence is incomplete.
