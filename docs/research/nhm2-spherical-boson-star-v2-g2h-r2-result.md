Program gate: G2H-R2 — FLINT exact-identity API repair
Workstream: authenticated classical control branch
Capability or component: two-lane no-candidate fixture closure
Current maturity: independently audited fixture `PASS`; no candidate execution
Target maturity: immutable repair result and return to parent G2H implementation
Required frozen inputs: binding SHA-256 `8f968fadfee4c36c2b4e15d7a4dbe899032b2f3121b5da821dd5d7e57d731dc2`
Required evidence: 14 receipt hashes, manifest self-hash, disjointness and authority audit
Stop/fail criteria: evidence mutation, candidate root creation, proof claim or authority promotion
Explicit non-goals: candidate evaluation, classical/quantum proof, G3, lanes, lamp or physical claims
Downstream gate unlocked: parent G2H proof implementation/preexecution only

# G2H-R2 result

The v2 source remains an immutable compile failure: FLINT 2.9's
`fmpq_equal_si` accepts an integer rather than numerator and denominator. The
versioned v3 source checks the canonical `fmpq` numerator `1` and denominator
`5`, then requires the 512-bit Arb enclosure to be strictly positive and contain
the exact rational.

The v3 primary source SHA-256 is
`0443079b4edce832a7b48fd2f509905a6b83cac19b91893b9c3cae9bc79b32c5`.
Its thin image is `sha256:1f1453fd28eaa9a2bf65d3d501a4324d6365bbc4cd3b4dab2a64f12ca4bc2142`;
the 16,920-byte executable is
`52d5fd20fef077ce5f9866e433f7159f2fab3296b08db177d68492b975819514`.
The independent scratch image/executable remain
`sha256:f2161397cc75b1362026107a8483f5ad21989a2871e815e09c42d6ba2bfa99be`
and `cd40bd4f70b8f49acba8578d0821a101bc07afff30d97c283d12d5fc74cf49ed`.

Preexecution passes 18/18 checks. The pure-Rust ELF has no interpreter, no
`DT_NEEDED` entries and no forbidden GMP/MPFR/FLINT/Arb/libm markers. Its
scratch payload layer is disjoint from every primary layer.

The exact one-shot synthetic fixture pair under binding digest
`8f968fadfee4c36c2b4e15d7a4dbe899032b2f3121b5da821dd5d7e57d731dc2`
passes 7/7 primary and 7/7 independent fixtures. The immutable manifest self-
hash is `979cad4d3bd59b5fd87adbff4b0a68cd206a43319ec3bbb8cc3a90f56c747c13`.
Producer-independent receipt audit passes 13/13.

Candidate evaluations remain zero. Both candidate evidence roots remain absent.
Candidate execution, admission, proof, geometry/state acceptance, lanes, lamp,
physical viability, propulsion and transport authority remain false. Fixture
success closes only G2H-R2 and returns control to the incomplete parent G2H
implementation gate.

This result changes implementation maturity only. Mathematical semantics,
runtime authority and receipt semantics are unchanged.
