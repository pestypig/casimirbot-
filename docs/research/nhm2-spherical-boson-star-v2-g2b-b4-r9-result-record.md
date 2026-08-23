# NHM2 spherical-boson-star v2 G2B-B4-R9 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: single R8-backed equilibrated four-grid formulation proposal  
Current maturity: independently validated proposal `PASS`; candidate execution unauthorized  
Target maturity: one separately sealed implementation/preexecution packet  
Required frozen inputs: B4-R1/R3 initializer, B4-R4 through B4-R8 evidence, policy, sources and admitted runtime  
Required evidence: exact sole delta, stable prefix, scale-free convergence, source/input/output/receipt contracts, host/Linux tests  
Stop/fail criteria: any binding, uniqueness, endpoint, operator, convergence, chronology, output, authority or no-solve mismatch  
Explicit non-goals: candidate state, correction/Newton/continuation/Armijo execution, retry, retune, proof/lane/replay/lamp/physical authority  
Downstream gate unlocked: preparation of one B4-R10 implementation/preexecution packet; no execution

## Verdict

The proposal-preparation gate passes with decision:

```text
FORMULATION_PROPOSAL_FROZEN
SINGLE_B4_R10_IMPLEMENTATION_PREPARATION_SUPPORTED
CANDIDATE_EXECUTION_NOT_AUTHORIZED
```

The sole proposal preserves the `Et_t,Etheta_theta,KGbar` continuum equations,
direct binary64 `w`, raw Armijo merit, every existing threshold, all grids and
the independent-full-solve chronology. It changes only the linear correction
solve through deterministic power-of-two row/column equilibration and adds the
B4-R8 `q`/`delta` monitoring and refinement gate.

## Frozen numerical decision

The equilibrated correction is `(R J C)y=-Rr`, `Delta=C y`, with fresh exact
power-of-two scales at each raw Jacobian. Scaling never changes raw residual
thresholds or trial merit. The frequency domain remains strict `0<w<1`; all 25
existing Armijo exponents remain the only trials.

The prefix operator lifts exact binary64 Lobatto/source words to MPFR512,
solves the shifted-Chebyshev interpolation system with deterministic
Householder QR, evaluates analytic Chebyshev antiderivatives, and rounds only
the final prefix words. Origin/infinity charge and source words bind the
analytic regular/vacuum-tail class as positive zero.

Constraint acceptance contains no absolute rail. Four-grid target-stage
`q`/`delta` Linf and Clenshaw–Curtis L2 norms and all four adjacent-pair profile
error streams must strictly contract, permitting equality only at exact zero.
The unchanged field cross-grid gate runs first.

## Bound implementation evidence

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R9 proposal | 12,778 | `9aa7b356814c327cce5c5573241ee16ce67df8f968a973b762be88d79640f5c0` |
| Authority-neutral primitives and binding validator | 17,611 | `8d6a30b6448c063b8020d0b23b4a1e8c49e32ddd704ef46daeee38c3de1507a9` |
| Independent proposal tests | 4,068 | `634da937c4f10050d9020eb0567d4fea7a92a7ec46bb61eaf042d8f5752d69e0` |

Six tests pass identically on the host and admitted offline Linux image. They
rehash all 27 frozen inputs, prove the future output root absent, verify
equilibration equivalence, reproduce constant/quadratic integrals at
nonstandard nodes, exercise the threshold-free contraction rule, confirm the
sole manifest, and prove the proposal source has neither candidate-runner
imports nor filesystem-write surfaces.

Repository-wide verification is green:

| Gate | Result |
|---|---|
| Preservation and focused audit | 34/34 checks |
| Math registry | 318 entries; validation `OK` |
| Required WARP suite | 18/18 files; 179/179 tests |
| Casimir adapter | run 2444; verdict `PASS`; certificate `GREEN` |
| Certificate | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`; integrity `true` |

The already-running keyed adapter exposed the exact canonical repository path
as its runtime `cwd`; no foreign checkout or substitute server supplied the
certificate.

## Runtime and future output

The only proposed runtime remains image
`sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`
under offline CPython 3.12.11, gmpy2 2.2.1, GMP 6.3.0, MPFR 4.2.1, MPC 1.3.1
and glibc 2.36. The fresh future root is fixed as
`g2b-b4-r10-four-grid-v1` and remains absent.

B4-R10 must separately implement and byte-pin the executor, tests, checkpoint,
exact command/token and source-disjoint audit before any execution request.
Proposal `PASS` is not execution readiness.

## Mutation and authority record

No candidate state or B4-R4 endpoint was evaluated or materialized. No linear
correction, Newton update, continuation stage, Armijo trial, retry, retune,
output-root creation, candidate admission, or vacuum/proof duty occurred.
Execution, replay, lane, pair agreement, diagnostic lamp, Theory Graph, joint
geometry/state, physical, propulsion and transport authority remain false.
