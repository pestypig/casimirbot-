# NHM2 Spherical Boson-Star v2 G2B-M1 One-Shot Proposal

Program gate: G2B-M1 — MPFR256 global-center implementation review

Workstream: versioned classical-branch repair review

Capability or component: one-shot execution of the fixed MPFR256
multiple-shooting construction

Current maturity: engine implemented and focused analytic-Jacobian tests green;
no nonlinear successor solve executed

Target maturity: one immutable success or failure receipt from both independent
fixed refinements

Required frozen inputs: active review packet raw
`c9082bbde6ca210fc1ee4c13d35fa3d2dde6bc579767e933673660176e58cf76` /
9,327; engine raw
`85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de` /
32,381; focused engine spec raw
`0e5367640f8bfc62e114a03ee56e2f6f4765f922ab510933ed666a96c002c8cf` /
9,654; immutable v1 global center raw
`d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30` /
196,505; unchanged equations, boundary conditions, point, 128-mode codec, and
`1/10^10` rail

Required evidence: exact runner/spec bytes; focused suite; absent output;
runtime pins; coarse and fine solves independently initialized; full Newton
chronologies; complete first failure or all screens; exact encoded center;
exact-rational Hermite and projected residuals; exclusive durable receipt;
independent rehash and replay; false authority locks

Stop/fail criteria: any binding drift; existing output; engine/spec failure;
runtime/context failure; refinement using the other result; changed damping,
mesh, threshold, equation, projection, or rail; incomplete receipt; output
collision; any retry or authority promotion

Explicit non-goals: accepting the center as proof; rerunning after a failure;
changing the construction from observed data; later vacuum/no-fold/remainder or
branch duties; candidate, lamp, physical, propulsion, or transport authority

Downstream gate unlocked: either one separately reviewed G2B replacement-center
proposal or a terminal high-precision falsifier

Change class: one-shot exploratory diagnostic execution; no authority

## Frozen execution chronology

1. Verify proposal, engine, engine spec, original center, Python, gmpy2, MPFR,
   and GMP bytes.
2. Verify the fixed output is absent.
3. Construct both refinement initial vectors independently from the same
   immutable v1 center.
4. Execute coarse refinement ordinal 0 with four RK4 substeps per output
   interval. Persist its complete chronology in memory.
5. Reconstruct the initializer from the immutable v1 center. Execute fine
   refinement ordinal 1 with eight substeps per interval. It may not read the
   coarse result.
6. Apply the fixed matching, boundary, sign, convergence, Richardson, exact
   Hermite, exact 128-mode projection, and midpoint replay checks. The exact
   Hermite check is a center-admission screen; the 128-mode result is the frozen
   downstream representation classifier defined by the active packet.
7. Canonically encode either `CALCULATION_CENTER_ONLY` or `CALCULATION_FAIL`,
   self-hash it under a dedicated length-delimited domain, and write it once
   with exclusive create, flush, and fsync.
8. Stop. The command may never be rerun at the same or a different output after
   inspecting its result under this proposal.

## Failure completeness

Every exception is caught only at the one-shot boundary. The receipt must
preserve the first typed code, stage, refinement ordinal, Newton iteration when
available, all already-completed bounded chronologies, runtime binding, and
false authority locks. Large state arrays are included only on success; failure
uses bounded summaries. A failed screen therefore produces evidence rather
than recreating the G2B-A missing-receipt condition. A center that passes its
own exact Hermite margin is retained as a successful calculation even if the
frozen 128-mode classifier selects a subsequent codec/mode-count review.

## Fixed output and command

Output:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
g2b-m1-mpfr256-global-center-v1.json
```

The exact command is not authorized until the runner and its focused spec are
complete, hashed, and named in a separate pre-execution checkpoint.
