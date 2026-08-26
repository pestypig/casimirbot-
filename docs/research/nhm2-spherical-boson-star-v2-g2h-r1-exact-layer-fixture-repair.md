Program gate: G2H-R1 — exact-layer fixture repair
Workstream: authenticated classical control branch
Capability or component: primary exact-rational-positive no-candidate fixture
Current maturity: v1 immutable partial `FAIL`; unique layer-confusion defect identified
Target maturity: versioned v2 primary source/build and fresh exclusive fixture root
Required frozen inputs: v1 source/build/partial receipts and G2G digest 30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d
Required evidence: source-only repair, fresh hashes, v2 build binding and complete two-lane fixture run
Stop/fail criteria: candidate-path change, threshold change, v1 mutation, same-root retry or any new fixture failure
Explicit non-goals: candidate evaluation, proof implementation completion, proof result or authority promotion
Downstream gate unlocked: return to G2H proof implementation only after independent audit

# G2H-R1 exact-layer fixture repair

The sole permitted semantic change is to fixture `exact_rational_positive` in
the primary harness. Version 2 must prove exact numerator/denominator identity
in `fmpq`, convert that rational to an Arb enclosure at 512 bits, and require the
resulting ball to be strictly positive and contain the exact rational.

Every other fixture, contract digest, failure name, source/runtime lineage,
security restriction and authority field remains unchanged. Version 1 and its
partial output root remain immutable. Version 2 must use new source/build/image
identities and `artifacts/research/nhm2/g2h-fixtures-v2`.
