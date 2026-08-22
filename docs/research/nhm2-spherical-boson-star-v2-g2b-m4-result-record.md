# NHM2 spherical-boson-star v2 G2B-M4 result record

Program gate: G2B-M4 — selected-center MPFR-native projection  
Workstream: lambda-zero proof-center recovery  
Capability or component: full selected refinement and fixed DCT-I ladder  
Current maturity: completed authenticated implementation failure  
Target maturity: immutable inconsistency record for sole versioned repair  
Required frozen inputs: M4 packet/source/spec and selected M3 receipt  
Required evidence: self-hash, exact replay, typed failure before mode output  
Stop/fail criteria: no M4 rerun or treating the failure as numerical evidence  
Explicit non-goals: threshold/mode changes, candidate/lamp/physical authority  
Downstream gate unlocked: G2B-M5 sole tail-power API repair

## Immutable result

- Raw SHA-256:
  `6eb6e99806d91c02bfad8b89edf538b41ca8763ffe94e01e1244225f9c7501ed`.
- Raw size: 6,232 bytes.
- Length-delimited self-hash:
  `4bdccd085bb8f3efa67e3fa2123686347974c6c7798828e040ddbfc566bdc930`.
- Independent self-hash recomputation: exact match; unsigned size 6,149 bytes.
- Decision: `MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED`.
- First failure: untyped `AttributeError` at `projection_ladder`.
- Selected M3 center replay: present and byte-exact.
- Projection records: null; no mode ordinal completed.
- Every authority lock: false.

## Audited inconsistency

The frozen projection profile calls `engine.gmpy2.pow(x / radius, sigma)` in
the asymptotic tail. The bound gmpy2 2.3.1 module has no `pow` attribute.
Its MPFR value type does implement `__pow__`, and the expression
`(x / radius) ** sigma` executes under the same active MPFR context.

The failure occurred on the first tail sample before coefficient construction,
so it contains no candidate-dependent mode or threshold information. Replacing
only the nonexistent module API with the equivalent MPFR exponent operator is
an audited implementation repair, not numerical retuning. M4 remains immutable
and must not be rerun.
