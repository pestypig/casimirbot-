Program gate: G2H-R2 — FLINT exact-identity API repair
Workstream: authenticated classical control branch
Capability or component: primary exact-rational-positive no-candidate fixture
Current maturity: v2 immutable build `FAIL`; no fixture or candidate execution
Target maturity: byte-bound v3 primary image and complete two-lane no-candidate fixtures
Required frozen inputs: G2G SHA-256 `30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d`, v1 image `ea6e417f...58bb`, v2 failure
Required evidence: canonical fmpq numerator/denominator check, v3 source/executable/image hashes, fresh root and independent audit
Stop/fail criteria: candidate path change, scientific/threshold change, v1/v2 mutation, same-root reuse or fixture failure
Explicit non-goals: candidate evaluation, proof result, G2H completion by fixture alone or authority promotion
Downstream gate unlocked: return to G2H proof implementation after independent fixture audit

# G2H-R2 FLINT API repair

The sole implementation change is to express the already frozen exact identity
using FLINT 2.9's canonical rational representation:

```text
fmpq_numref(exact) == 1 && fmpq_denref(exact) == 5
```

The 512-bit Arb enclosure must still be strictly positive and contain that exact
rational. Every other fixture, failure name, contract input, arithmetic lineage,
candidate guard, receipt field and authority lock is inherited unchanged.

The v3 image must derive from the byte-bound v1 primary image and add only the
v3 source and rebuilt executable. The independent pure-Rust image/executable are
reused without execution history. The only eligible output root is
`artifacts/research/nhm2/g2h-fixtures-v3`.

This packet changes implementation API usage only. It does not change
mathematical semantics, runtime authority or receipt semantics.
