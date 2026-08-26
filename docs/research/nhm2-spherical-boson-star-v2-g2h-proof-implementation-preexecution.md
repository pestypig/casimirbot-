Program gate: G2H — Tolman-VII proof implementation/preexecution
Workstream: authenticated classical control branch
Capability or component: two source/runtime-disjoint proof executors and fail-closed preexecution harness
Current maturity: G2G definition frozen; no proof implementation or candidate execution authorized
Target maturity: two byte-bound unexecuted implementations with independently audited no-candidate evidence
Required frozen inputs: G2G contract SHA-256 30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d and its seven source digests
Required evidence: source/toolchain/container/executable bindings, disjointness audit, no-candidate fixtures, guarded chronology and absent candidate roots
Stop/fail criteria: contract drift, shared forbidden lineage, fixture failure, candidate-path invocation, root creation or authority promotion
Explicit non-goals: candidate proof execution, numerical result, retry/retune, G3, SI, lanes, lamp or physical claims
Downstream gate unlocked: a separately versioned G2H-E one-shot authorization decision only

# G2H Tolman-VII proof implementation/preexecution

## Purpose

Implement the frozen G2G proof plan without evaluating the Tolman-VII candidate.
This gate establishes executable identity, runtime independence, receipt
chronology and fail-closed behavior. It cannot establish any G2G duty.

## Frozen ingress

Only the G2G contract whose SHA-256 is
`30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d`
is eligible. All 12 classical duties, 6 quantum duties, exact formulas,
partitions, arithmetic rules, first-fail order, scientific inputs and future
roots are immutable. A mismatch terminates before build or fixture execution.

## Bounded implementation work

1. Write one C17 primary implementation using the frozen
   Arb/FLINT/GMP/MPFR arithmetic lineage.
2. Write one independently structured pure-Rust implementation with no GMP,
   MPFR, FLINT, Arb or C-math linkage.
3. Pin compiler, dependencies, container layers and eventual executable bytes by
   digest, and demonstrate that forbidden shared components are absent.
4. Implement a common record ABI only at the serialized contract boundary; do
   not share generated code, arithmetic kernels, tables or scientific routines.
5. Implement fail-closed ingress, ordered first-failure persistence and
   exclusive-root guards before any candidate-capable entry point.
6. Run only analytic/synthetic no-candidate fixtures that cannot instantiate the
   frozen Tolman-VII member. Include digest mutation, authority mutation,
   non-finite arithmetic, strict-sign touching-zero, chronology interruption and
   deliberate implementation-disagreement cases.
7. Independently replay the fixture receipts and confirm that both candidate
   roots remain absent.

## Closure evidence

G2H closes only if all of the following exist and independently rehash:

- primary and independent source manifests;
- compiler/dependency/container manifests proving runtime disjointness;
- executable digests obtained without invoking a candidate-capable path;
- complete no-candidate fixture receipts for both implementations;
- an independent receipt/chronology/disjointness audit;
- one frozen offline candidate command and token proposal that are inert until a
  separate G2H-E authorization record is issued;
- explicit false values for implementation execution, candidate admission,
  geometry/state acceptance and every downstream/physical authority.

The candidate-capable sources must also implement the theorem-assumption and
surface-regularity dispatch frozen in
[`nhm2-spherical-boson-star-v2-g2h-proof-program-architecture.md`](./nhm2-spherical-boson-star-v2-g2h-proof-program-architecture.md).
In particular, a finite Darmois junction check is not a substitute for the
smooth metric required by the static-Hadamard/RSET sources. The first disjoint
one-sided surface jet is a terminal `GLOBAL_STATIC_STATE_FAIL`; smoothing or a
surface boundary would be identity drift.

## Hard stop

Neither future root may be created in G2H:

```text
artifacts/research/nhm2/g2h/tolman-vii-primary-v1
artifacts/research/nhm2/g2h/tolman-vii-independent-v1
```

Building a binary is not proof execution. A fixture pass is not a candidate
pass. A contract seal is not proof evidence. G2H-E remains blocked until G2H is
closed, independently audited, and the user supplies the exact separately
versioned one-shot authorization.
