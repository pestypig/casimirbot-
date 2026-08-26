Program gate: G2H-R1 — exact-layer fixture repair
Workstream: authenticated classical control branch
Capability or component: primary v2 fixture build
Current maturity: immutable build `FAIL`; no fixture or candidate execution
Target maturity: terminal build evidence and a separately versioned API-only repair
Required frozen inputs: v2 source SHA-256 `b0ed004c5cae55af02fa9d820f7907e8ff1a5af76242f983d0fb761397238166`
Required evidence: exact compiler diagnostic, absent fixture/candidate roots and zero authority
Stop/fail criteria: any fixture invocation, root creation, scientific change or v2 mutation
Explicit non-goals: candidate evaluation, proof result, retry of v2 or authority promotion
Downstream gate unlocked: G2H-R2 FLINT-API implementation repair only

# G2H-R1 v2 build failure

The frozen v2 source reached GCC 12.2.0 in the already byte-bound primary v1
Arb/FLINT/GMP/MPFR image and failed before linking. FLINT 2.9 declares
`fmpq_equal_si(fmpq_t, slong)`; the v2 source supplied three arguments while
attempting to express rational `1/5` identity. GCC terminated under `-Werror`.

No fixture executable identity or v2 image was produced by the failed full
recipe. No fixture ran, both candidate roots and the fresh fixture root remained
absent, candidate evaluations stayed zero and every authority lock stayed false.
The v2 source and prebuild record remain unchanged.

This failure changes no mathematical semantics. It identifies only a compile-
time FLINT API mismatch. Runtime authority and receipt semantics remain
unchanged.
