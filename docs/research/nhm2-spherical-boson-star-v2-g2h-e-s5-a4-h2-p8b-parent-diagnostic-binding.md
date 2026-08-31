Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8B parent diagnostic binding and bounded deterministic serialization
Current maturity: P8A selector observations independently audited; H2 parent does not yet retain or serialize them
Target maturity: optional observation-enabled H2 parent path with exact ordinary equivalence, fixed resource caps and independent audit
Required frozen inputs: P7 `H2_PARENT_FAIL`, P8/P8A decisions, exact P8A selector identities, 16-thread selector binding, 17-member dyadic schedule, width exponent `-180`, precision 512 and ordinal reduction
Required evidence: exact source hashes, digest-pinned offline build, ordinary/diagnostic parent Result and Arb-model equality, deterministic bounded record, corruption/cap rejection, regression fixtures, zero candidate activity and independent audit
Stop/fail criteria: ordinary-path drift, observation consulted by any decision, unbounded history, serialization ambiguity, changed arithmetic/threshold/schedule/reduction, long selector execution, candidate ingress, root/token/cloud creation, retry/retune or authority promotion
Explicit non-goals: observing P7 numerically, repairing H2, extending the U-panel ceiling, evaluating the frozen member, creating an execution proposal or authorization, linking P2/scientific handlers, beginning G3/SI/metric/lane work, or promoting any claim
Downstream gate unlocked: one separately versioned candidate-neutral P8C diagnostic-execution proposal; execution remains separately unauthorized

# H2-P8B parent diagnostic binding

Status date: August 28, 2026.

Status: **IMPLEMENTED / CANDIDATE-NEUTRAL FIXTURE PASS / EXECUTION NOT AUTHORIZED**.

This packet changes receipt semantics and optional parent runtime binding only.
It changes no mathematical semantics, ordinary parent entrypoint, candidate
identity, scientific authority or physical claim.

## Binding contract

The ordinary `initialize` and `extend` entrypoints still call the shared parent
implementation with no diagnostic sink. P8B adds separately named
`initialize_diagnostic` and `extend_diagnostic` entrypoints. When the optional
path is used, H2 calls the P8A selector entrypoint and then copies the resulting
observation record. The record is never read by model translation, validation,
publication, failure precedence or acceptance.

P8B retains exactly the most recent selector observation in the current parent
call. If the parent fails, this is the terminal selector. It therefore stores
at most the frozen 17 candidate records instead of an unbounded history over as
many as 65,537 ledger models.

## Persistence contract

`serialize_diagnostics` emits one whitespace-free deterministic JSON object
with fixed lexicographic key order. It performs no file I/O. It rejects:

- a missing record or zero/more-than-17 observations;
- candidate-index or panel-count chronology drift;
- incomplete first-failure or worst-ratio fields;
- selector verdict/detail inconsistencies;
- any observation string above 256 bytes; or
- any final record above 65,536 bytes.

The schema is
`nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1`. A future executor may persist
the exact returned bytes, but this packet creates no execution root.

## Exact implementation identities

| Member | SHA-256 |
| --- | --- |
| P8A selector header | `82d0a55982b426bbb16d42a340dd057d5753a78d0fb274ff47ec0748d166202f` |
| P8A selector source | `54dc4ed5009e9ad168c6de493f7f8c9bebaa0ecbf2f72bf577299522fe3900c5` |
| H2 header | `545fa45420d90a2ba359eef13a0d494faeca3d75176777d9f230af5b9546f24f` |
| H2 source | `7a17a6404fd66291e7460ebbdf62ecf090d4535de42ab96658335ca256c3858c` |
| P8B parent fixture | `20a0e0521b0d775020443ca4c450a1f7de406aab6a29b35c887994176681410d` |
| pinned Dockerfile | `ebb8e227c9c4130a4aaff087f445d8aad98d30c462e34b99a74c4e2285b22148` |
| fixture executable | `d3cf79e3ddd1658962adec6ddaba5d24583967bab004f2e3cd70bcd0dc9d70d6` |

The build retains the digest-pinned builder/runtime pair, C++20,
`-fno-fast-math`, `-fno-common`, warnings-as-errors and the frozen
Arb/FLINT/GMP/MPFR lineage.

## Fixture evidence

The bounded manufactured parent fixture executes one exact origin selector
that accepts the first width candidate. Ordinary and observation-enabled H2
contexts produce identical complete `Result` fields and identical published
Arb models. The diagnostic record contains one observation and serializes to
1,057 bytes. Two hardened offline runs pass 13/13 and emit byte-identical JSON.

The fixture also rejects an 18-observation record and null diagnostic ingress,
and confirms zero candidate evaluations, positive samples, roots, handler
linkage and authority promotion. It is not the long exhaustion workload and
does not observe P7.

The independent source/build/runtime audit passes `48/48` and produces receipt
SHA-256
`e4fa37c13e9cc97a773c20f7cd9aafbd4448a4f687d004d2671e17748d516ee7`.
The unchanged bounded P2 parent-adapter regression passes `11/11`.

An additional legacy H2 lifecycle regression was started but stopped after it
entered a sustained multi-refinement positive-panel calculation and exceeded
P8B's bounded-fixture intent. It created no output root or evidence claim and
did not evaluate the frozen candidate. This is a scope stop, not a numerical
PASS/FAIL and not a substitute for a separately proposed diagnostic run.

## Current-head verification

Math report and validation pass at 323 registered entries. The required
18-file WARP battery completes 174/179 under its default five-second per-test
limit; all five failures are wall-clock timeouts in the existing lattice and
pipeline integration suites. Without source changes, those affected suites
pass 5/5 and 16/16 under a 30-second allowance, establishing 179/179 assertion
agreement while retaining the default-timeout qualification.

Casimir adapter run 2571 is PASS/GREEN with certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. The certificate authenticates repository/gate integrity;
it does not convert P7 into a scientific pass or promote any authority.

## Eligibility boundary

The eligible successor is now frozen as the inert
[P8C diagnostic-execution proposal](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8c-diagnostic-execution-proposal.md)
at `7e8f28d7...a2ace`. It may not execute without separate exact authorization.

P7 remains immutable `H2_PARENT_FAIL`. P8B does not establish which mechanism
caused that failure. Candidate, proof, geometry/state, lane, lamp, physical,
propulsion and transport authority remain false.
