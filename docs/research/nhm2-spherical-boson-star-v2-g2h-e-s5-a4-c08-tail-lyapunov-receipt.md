# G2H-E-S5 A4 C08-011b Tail-Lyapunov Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011b exact scalar Lyapunov, compact-box LMI and K1/K2 producer
Current maturity: candidate-neutral implemented and independently source/runtime-audited
Target maturity: mathematical early-tail kernel inside the still-incomplete C08-011 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; audited C08-011a chronology; complete C08-004 parameter margins; exact 13-entry onset schedule; 512-bit directed arithmetic; denominator `2^256`; fixed variables `u,h0,kappa,theta2`; fixed K exponent schedule `0..1024`
Required evidence: shifted-asymptotic Lyapunov construction; exact rational P/Pinv and positive pivots; EP extraction; sign-proved cleared denominator; no-subdivision multivariate Horner LMI; all three first and nine ordered-second operator matrices; first-passing K1/K2; corruption, determinism and protected-root guards
Stop/fail criteria: predecessor or tier mismatch, nonpositive margin, Lyapunov solve/rounding/symmetry/positivity failure, inverse mismatch, zero-containing LDL pivot, K touching or exhaustion, point sampling, subdivision, candidate ingress, protected-root creation or authority promotion
Explicit non-goals: selected-member evaluation; finite continuation; onset/history constants; scalar/metric growth witness; completing C08-011; C08-012+; handler; Rust/G3/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral C08-011 work at C08-011c append-only finite continuation and onset/history inputs only

Date: August 25, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_C08_011B_EARLY_TAIL_ONLY`

For each caller-supplied exact parameter box and frozen onset, the producer:

1. requires the C08-004 predecessor and recomputes the exact frozen `sigma0`
   tier from the complete box upper bound;
2. solves the 16-entry shifted-asymptotic Lyapunov equation exactly, rounds
   every symmetric entry to denominator `2^256`, rejects a rounding tie, and
   verifies strict exact rational LDL pivots;
3. computes the exact rational inverse, verifies `P*Pinv=I`, requires every
   inverse diagonal positive, and stores directed
   `EP=max_i sqrt(Pinv_ii)`;
4. substitutes `u=1/t`, clears the strictly positive common denominator
   `kappa^2*(1+2*kappa*u)`, expands the complete symmetric base LMI as exact
   four-variable rational polynomials, evaluates them by directed recursive
   Horner in the fixed order `u,h0,kappa,theta2`, and accepts only strict
   interval LDL pivots;
5. differentiates the exact quotient row algebraically for all three first and
   nine ordered-second parameter matrices, clears powers four and six of the
   common denominator, and independently selects the first `K=2^e` for
   `e=0..1024` whose every required matrix is strictly positive definite.

The selected witness retains the cleared-denominator enclosure, the base-LMI
pivots, all `3*4` K1 pivots, all `9*4` K2 pivots, both exponents and both exact
power-of-two K values. No subdivision or point sampling exists in this kernel.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_tail_lyapunov_v1.hpp` | `63d6f1b9353770b673f0e80e8af244a6f3e27917376c97b801748319282af473` |
| `mini_boson_star_primary_c08_tail_lyapunov_v1.cpp` | `a1bf7f1d7da7bc7cf960b7a8c2e2dec2a5d9ee660b7eeaf5d245a50a043ab9a0` |
| `mini_boson_star_primary_c08_tail_lyapunov_fixture_v1.cpp` | `fc5441be882eec2af8c473d1b54aa148d0d93eccf5d8fb406fd759c9c4a5cab5` |
| `Dockerfile.primary.mini-boson-c08-tail-lyapunov-fixture.v1` | `22852f79ccca7b5af0a8e124218390651162b0d95b887b742a6fb528bdace6bd` |
| `nhm2_g2h_e_s5_c08_tail_lyapunov_runtime_audit.py` | `a3c40b0813087b30fa324904c2554e79200516bc2160fe7d9db1bd6f327e1117` |
| fixture executable | `f9f39ad2d7043ce57baf7be3be858e032fa3bd9507f95534a1b30f420915b5f3` |

The final independent audit build produced local image ID
`sha256:073a7511ecf7efa8ba16f41dfb6c3d1c701e9ad3d9e848473cb26acae80b3aa5`
from the digest-pinned builder and runtime bases. It is fixture evidence only.

## Evidence

- Candidate-neutral primary/vacuum/non-point-box fixture: `23/23 PASS`,
  identical twice.
- Independent recursive source/runtime audit: `92/92 PASS`.
- C08-011a predecessor audit: `81/81 PASS`.
- Acknowledged-definition cross-language replay: `27/27 PASS`.
- Supplementary exact symbolic comparison of all four cleared universal scalar
  row numerators against `D*(-Pj/P2)`: `4/4 PASS`.
- The manufactured positive fixture selected `K1=2^3`, `K2=2^4`; these values
  certify only the manufactured box and carry no selected-member meaning.
- Fixtures reject missing predecessor, invalid onset, reversed box, missing
  input/output, nonpositive kappa, tier mismatch, nonpositive h0, missing
  vacuum eta and null result; they verify exact P/Pinv, all retained pivots,
  denominator evidence, non-point compact-box evaluation and determinism.
- Candidate evaluations, positive samples and selected-state reads: zero.
- Candidate roots, execution ledgers, token and authorization: absent.
- Scientific handler linked: false; every authority remains false.

## Current-head verification

- Repository math report and validation: `323/323 PASS`.
- Scientific dispatch audit: `8/8 PASS`, `0/19` primary-eligible handlers
  complete, zero execution and every authority false.
- Required WARP battery: `18/18` files and `179/179` tests PASS.
- Casimir adapter run `2512`: `PASS/GREEN`; `firstFail=null`;
  certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
  integrity true.
- Primary, independent, authorization and S5 execution roots remain absent;
  port 5050 was stopped after verification.

This verifies the repository checkpoint. It does not certify a selected-member
tail witness, link a scientific handler or promote any authority.

## Remaining boundary

C08-011b establishes only the early mathematical tail predicate on supplied
candidate-neutral boxes. It does not extend a finite ledger or construct an
onset/history, scalar-growth or metric-growth witness. C08-011c must next bind
the audited C08-006 through C08-010 append-only continuation and produce the
onset P-norm and weighted finite-history inputs. C08-011 remains incomplete.
