# NHM2 Spherical Boson-Star v2 Equilibrated-MPFR Core Successor Attempt

Status: **closed; immutable authenticated `FAIL`; no retry authorized**

Program gate: **G1A — fresh versioned N=64 successor attempt**

Workstream: frozen-core numerical successor

Capability or component: additive primary and source-disjoint MPFR256,
row/column-equilibrated N=64 core solvers plus exact first-result receipt

Current maturity: the one authorized v2 result is persisted and
self-authenticated; the predecessor and v2 result are both immutable failures

Target maturity: achieved as one persisted typed `FAIL`, followed by a bounded
implementation-defect disposition

Required frozen inputs:

- the complete proposal in
  [`nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md`](./nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md);
- candidate, branch, initializer, spectral, and predecessor failure bindings
  named there;
- N=64 only;
- exact initial binary64 words and exact spectral binary64 words;
- unchanged equations, thresholds, Armijo schedule, projection, and first-fail
  precedence.

Required evidence:

1. Additive source files outside the frozen predecessor source closure.
2. Exact source, dependency, runtime, proposal, and input hashes before the
   first result.
3. Focused synthetic/hostile tests that do not execute the N=64 successor.
4. Primary and independently structured source-disjoint executions under the
   exact v2 policy.
5. Each execution's complete accepted-update/Armijo chronology, MPFR flags,
   raw norms, scaling spans, projected result, and cleanup state.
6. Exact canonical comparison-wire equality.
7. One bounded, immutable, content-addressed first-result receipt retaining all
   authority locks false.
8. Independent result audit plus math/WARP/Casimir validation.

Stop/fail criteria:

- any pre-run binding mismatch;
- any source-disjoint semantic mismatch;
- any forbidden MPFR flag, zero/nonfinite scale, or lifecycle failure;
- first Armijo exhaustion, maximum-update termination, raw convergence-gate
  failure, projection-gate failure, or comparison disagreement;
- any attempt to change the frozen v2 rules after observing a result.

Explicit non-goals:

- N=96, N=128, or N=256;
- alternate initializers, tolerances, line searches, trust regions, retries, or
  origin bases;
- six-payload materialization, continuation, proofs, candidate admission,
  output roots, either 68-file lane, replay authority, or any lamp;
- physical viability, propulsion, transport, launch, or empirical authority.

Downstream gate unlocked: a successful authenticated result permits a separate
G2 activation review. A failed result unlocks only a new bounded falsifier
review.

## Terminal result

The single authorized v2 execution is complete. Its content-addressed receipt
is
[`nhm2-spherical-boson-star-v2-core-successor-first-result-73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2.json`](./nhm2-spherical-boson-star-v2-core-successor-first-result-73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2.json),
with self-hash
`73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2`.
The pair decision is `FAIL` with
`source_disjoint_terminal_result_disagreement`: the primary exhausted Armijo,
while the source-disjoint replay passed the unchanged numerical gates. Replay
GO alone is not pair GO and grants no readiness or authority.

The bounded post-result audit is
[`nhm2-spherical-boson-star-v2-core-successor-v2-first-result-audit.md`](./nhm2-spherical-boson-star-v2-core-successor-v2-first-result-audit.md).
It proves that the primary factored-RHS solve interleaved pivot application with
forward substitution instead of applying the complete stored permutation
first. The result remains immutable `FAIL`; the defect may be addressed only by
a separately reviewed and authorized version.

## Authorization boundary

The active persisted goal explicitly requests implementation and authenticated
GO/NO-GO evidence. That authorization is consumed by the first v2 N=64 result.
There is no automatic retry.

## Additive implementation boundary

The successor lives under
`tools/nhm2-spherical-boson-star-v2-core-successor/`. It does not edit or import
through the predecessor's public module identities. It reads exact-pinned
predecessor source bytes only to construct the frozen N=64 input fixture.

The primary and comparison implementations may share the authenticated MPFR/GMP
runtime available on this workstation, but must remain source-disjoint. Any
successful receipt must therefore retain
`runtimeDisjointIndependentReplay=false` and the typed shared-runtime-lineage
blocker. Runtime-disjoint replay remains future evidence and is not inferred.

## Frozen implementation bytes before first result

| Role                   | SHA-256                                                            | Bytes  |
| ---------------------- | ------------------------------------------------------------------ | ------ |
| primary MPFR256 solver | `1204c9fe4983fd589cc6915d5579bc6e55fd7de05f6e4a4d0c86cd93c88e2bb2` | 30,594 |
| primary synthetic spec | `3a53e1b41c8fb739088b5c2663d2020acce8708e131c0e55788365f368217fdf` | 8,733  |
| source-disjoint replay | `0f366262608d9f593260a70ce0444af6ca23edaec6029c1e0d35d78ac48483bd` | 23,895 |
| replay synthetic spec  | `f7ccf857fa883a190a2a3d7a14f51c2ef473f5e121030a606f954f289c53a7cf` | 5,874  |
| one-shot result runner | `f81a5c7012abe4c213290eb5de6e0492d536c97c6ff76bc2575473277f4e40da` | 10,982 |
| runner synthetic spec  | `b8ddb2dc867ffe1c4e211f1a90fafa0969ac94f30a179a80af36135e9d3b509a` | 5,151  |

The primary synthetic/static suite is 9/9 PASS, the replay suite is 6/6 PASS,
and the one-shot receipt/decision suite is 7/7 PASS. None invokes either
zero-argument N=64 execution entry point.

The primary and replay sources are distinct and neither imports the other.
Primary uses row/column equilibration plus one partial-pivot LU factorization
and four factored solves. Replay precomputes the radial matrix and uses a
Gauss-Jordan inverse plus four inverse applications. Both retain three residual
refinement passes and the same preregistered comparison encoding.
