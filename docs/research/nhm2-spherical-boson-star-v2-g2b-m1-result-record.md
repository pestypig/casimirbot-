# NHM2 Spherical Boson-Star v2 G2B-M1 Result Record

Program gate: G2B-M1 — MPFR256 global-center implementation review

Workstream: versioned classical-branch repair review

Capability or component: immutable result of the fixed MPFR256 one-shot

Current maturity: executed once; complete authenticated `CALCULATION_FAIL`

Target maturity: closed result selecting one bounded screen-consistency review

Required frozen inputs: execution checkpoint, proposal, engine, runner, specs,
immutable original center, and runtime pins named by the receipt

Required evidence: raw and self hashes; exact first failure; complete coarse and
fine chronologies; no retry; output collision lock; false authority

Stop/fail criteria: inferring absent center state, rerunning the command,
changing the rail or solver, or treating nonlinear convergence as proof

Explicit non-goals: a passing center; proof or candidate acceptance; lamp,
physical, propulsion, or transport authority

Downstream gate unlocked: G2B-M1-R1 midpoint-screen consistency diagnosis

Change class: immutable result evidence; no authority

## Exact result

The sole command completed in approximately 154 seconds and wrote:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
g2b-m1-mpfr256-global-center-v1.json
```

- raw SHA-256:
  `660993d0219629e8c296981fb17c0b09081c9c820ff0cd03937034ced468a582`
- raw size: 2,882 bytes
- unsigned canonical size: 2,799 bytes
- receipt/self SHA-256:
  `e2b1080103f2fe3b9d35e6c5f00bc4bf243b3d48409d649dbe3581c1191f105b`
- decision: `CALCULATION_FAIL`
- first failure: `g2b_m1_midpoint_replay_failed`
- stage: `fine_solution_screens`

An independent domain-plus-u64-length rehash exactly reproduced the receipt
self hash.

## Preserved positive numerical evidence

Both refinements completed independently from the immutable initializer and
passed matching convergence and cross-refinement before the later screen:

- coarse refinement: three full undamped Newton corrections, followed by a
  converged residual approximately `5.3544e-76`;
- fine refinement: three full undamped Newton corrections, followed by a
  converged residual approximately `3.5408e-76`;
- each chronology has four entries and every accepted damping denominator is
  1;
- failure occurred only after both chronologies and cross-refinement completed.

This is evidence that the fixed high-precision nonlinear construction is a
live lead. It is not a center receipt: the implementation correctly omitted
the large center state after the downstream screen failed.

## Independent screen-consistency counterexample

Without rerunning the candidate, the same frozen output mesh and binary64
midpoint evaluator were applied to the analytic quadratic `y(x)=x^2`, with
exact derivative `y'(x)=2x`. Cubic Hermite interpolation is algebraically exact
for a quadratic, yet the binary64 evaluator reported:

- maximum absolute second-derivative error:
  `1.342473687770962e-9`;
- intervals exceeding the frozen `1e-10` limit: 18 of 8,192;
- last-interval error: `8.544640550667282e-10` at width
  `1.1765395377949517e-6`.

Therefore the global binary64 midpoint screen can reject an algebraically exact
cubic-Hermite model solely from endpoint spacing and evaluation roundoff.
G2B-M1-R1 must decide whether deleting or replacing this screen is a narrow
inconsistency repair. It may not alter the MPFR solve, mesh, core rail, exact
point, or 128-mode classifier.
