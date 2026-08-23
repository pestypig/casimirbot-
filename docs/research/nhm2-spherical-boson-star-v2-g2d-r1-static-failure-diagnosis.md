Program gate: G2D-R1 — terminal primary-evaluator failure review
Workstream: authenticated classical control branch
Capability or component: static/source-only failure diagnosis and successor decision
Current maturity: immutable run cause unobserved; one unique hard source defect proven
Target maturity: closed diagnosis with receipt/inference separation and lawful successor
Required frozen inputs: G2D sources, manifests, receipts and occupied output root
Required evidence: exact symbolic reductions, runtime arithmetic contract and source parity
Stop/fail criteria: evaluator invocation, candidate sampling, root mutation or causal overclaim
Explicit non-goals: retry, corrected candidate run, admission, G3, lanes or physical claims
Downstream gate unlocked: G2E non-candidate interval/provenance infrastructure repair

# G2D-R1 static failure diagnosis

## Decision

```text
CLOSE_G2D_NO_PROOF_PRIMARY_DIRECTED_SQRT_CONTRACT_INVALID
```

The immutable G2D execution remains `FAIL`. The review does not convert it to a
candidate failure or a proof result, and it does not authorize another G2D run.

## Receipt-proven facts

- Preexecution binding persisted `PASS` against implementation manifest
  `21e20f53f33f7517322a1a9d3c2e4290e8cf000617efe445cbebf349bacf81e5`.
- The primary subprocess returned code `1`.
- The terminal receipt persisted `primary_evaluator_failed:1`.
- No duty receipt or independent lane exists.
- The primary directory is empty and the occupied root is unchanged.
- Candidate admission, classical proof and every downstream authority are false.
- Evaluator stdout/stderr and the internal exception were not persisted.

The exact runtime exception therefore remains unobserved.

## Static findings

The producer-independent static audit is
`tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2d_fluid_star_static_failure_diagnosis.py`,
SHA-256
`df94239495a68266e4c71fc84b71c5c3f7fe43c5998e6fc83ef4c34d1a77f788`.
It passes `8/8` without importing either evaluator, spawning a subprocess,
sampling a replay grid or writing to the output root.

It establishes:

1. Independent exact quotient-ring reduction makes all four interior and all
   four exterior residual formulas identically zero under
   `A^2=1-x^2/4` and `s^2=3/4`.
2. Static AST/source comparison binds those reductions to the frozen Python
   formulas and confirms that the C implementation encodes the same residuals.
3. The exact-certificate predicates are true and cannot explain exit code 1.
4. The persisted preflight plus source/orchestrator inspection excludes the
   source-hash, runtime-hash, token and initially empty lane gates as the
   strongest explanation.
5. The Python interval square-root implementation is not directed.

The last finding is exact. The primary calls `Decimal.sqrt()` once under a
floor context and once under a ceiling context. CPython 3.13 documents and
implements that operation using `ROUND_HALF_EVEN` regardless of those context
rounding modes. At precision 220 for exact input `3/4`, the alleged lower and
upper endpoints are identical. Squaring the alleged upper endpoint at precision
500 produces a value strictly below `3/4`, so it is not an upper enclosure.

The source contains no outward `next_minus`/`next_plus` correction. By contrast,
the native evaluator calls `mpfr_sqrt` with `MPFR_RNDD` and `MPFR_RNDU`.

## Causal classification

The unique demonstrated hard implementation defect is:

```text
PRIMARY_DECIMAL_SQRT_FALSE_DIRECTED_ENCLOSURE
```

It invalidates the primary interval proof contract and is strongly consistent
with a subsequent zero-enclosure failure. Because stderr was discarded, the
review does **not** claim that the receipt proves a specific failing residual,
grid node or exception string. Other evaluation-path failures cannot be
reconstructed without a prohibited rerun.

The mathematically supported distinction is therefore:

```text
analytic residual identities: exact static PASS
frozen primary interval implementation: static HARD DEFECT
immutable G2D execution: FAIL, internal exception unobserved
classical candidate proof: not established
```

## Successor decision

G2D and its occupied root are closed permanently. The next eligible gate is
G2E: a candidate-neutral interval-arithmetic and failure-provenance repair.
It may validate directed square-root primitives using non-candidate test vectors
and require durable bounded stdout/stderr digests before any future scientific
execution. It may not execute, resample or rename G2D.

After G2E closes, the program must select and preregister a genuinely fresh
proof identity before requesting any further one-shot execution. Reusing the
same candidate/root as a corrected retry remains forbidden.

## Authority boundary

Candidate admission, classical proof, geometry/state acceptance, SI, metric,
lane, replay, agreement, lamp, physical viability, propulsion and transport
authority remain false. G3 remains blocked.
