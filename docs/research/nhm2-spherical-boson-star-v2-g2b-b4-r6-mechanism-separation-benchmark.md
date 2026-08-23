# NHM2 spherical boson-star v2 G2B-B4-R6 mechanism-separation benchmark

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: no-solve coordinate/scaling/precision/discretization benchmark  
Current maturity: preregistered authority-neutral benchmark  
Target maturity: independently audited unique-mechanism decision or explicit no-unique stop  
Required frozen inputs: exact B4-R4 terminal state, B4-R5 receipt, N=64 grid, radial residual/Jacobian/system definitions and admitted MPFR runtime  
Required evidence: four coordinate-column diagnostics, deterministic equilibration, MPFR256 full reassembly comparison, Chebyshev and first-node localization, self hash and independent audit  
Stop/fail criteria: first binding, reconstruction, transform, MPFR, factor, spectral, persistence or audit mismatch  
Explicit non-goals: Newton/continuation/candidate solve, trial-state merit or acceptance, B4-R4 retry, result-dependent transform/threshold selection, proof/lane/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: preparation of at most one separately versioned successor proposal only after an exact unique-family decision

## Authority boundary and output

This packet changes no candidate mathematics or authority. It evaluates fixed
algebraic representations of the same immutable endpoint and does not update a
state. The producer may assemble matrices and factor them for condition proxies;
it may not invoke the Newton map, continuation, an Armijo trial, or any nonlinear
solve.

The sole output root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b4-r6-mechanism-separation-v1/
```

It must be absent before the one permitted offline invocation and may not be
deleted, reused or retried by this packet. Exactly one canonical JSON receipt is
written after all duties pass.

## Frozen coordinate benchmark

The endpoint state and binary64 square-system Jacobian are reconstructed exactly
as B4-R5. Only the final frequency column is transformed by the analytic chain
rule. Four coordinates are ordered and frozen:

| ID | Definition | `dw/dz` at the endpoint |
|---|---|---|
| `DIRECT_W` | `z=w` | `1` |
| `GAP_Q` | `z=1-w` | `-1` |
| `LOG_GAP_S` | `z=log(1-w)`, `w=1-exp(z)` | `-(1-w)` |
| `NU` | `z=(w^2-1)/2`, positive branch `w=sqrt(1+2z)` | `1/w` |

For each coordinate, multiply Jacobian column 192 by the listed derivative and
record matrix infinity norm, pivot growth, nonzero U-diagonal spread and the
column maximum. These are representation diagnostics only. No transformed
Newton direction or trial state is computed.

`COORDINATE_SEPARATION` triggers only if exactly one non-direct coordinate has
U-diagonal spread at most `2^-10` times `DIRECT_W`, and every other non-direct
coordinate has spread at least four times the winner. A sign-only change cannot
trigger because its absolute factor diagnostics must equal `DIRECT_W`.

## Frozen equilibration benchmark

For each of the four matrices apply exactly one deterministic power-of-two row
pass followed by one power-of-two column pass. For a nonzero maximum magnitude
`m = fraction * 2^exponent` from binary64 `frexp`, the scale is `2^-exponent`;
all-zero rows or columns receive scale `1`. Multiplication order is row scale
then column scale. Record factor diagnostics and scale ranges.

`SCALING_SEPARATION` triggers iff the equilibrated `DIRECT_W` U-diagonal spread
is at most `2^-10` times its unscaled spread, its pivot growth is below `2^20`,
and `COORDINATE_SEPARATION` is false.

## Frozen MPFR256 reconstruction

Using MPFR256 round-to-nearest with the admitted exponent bounds, reconstruct
from the exact binary64 state and grid bytes:

- all first and second compactified derivative dot products;
- all three solved point residuals and the unused constraint at nodes 1..62;
- all four analytic local Jacobian rows;
- all global chain-rule Jacobian entries and seven boundary rows.

No binary64 residual/Jacobian value may be imported into the MPFR calculation
except exact state/grid scalars. Round every MPFR result once to binary64 and
compare its word with the primary assembly. Persist mismatch counts, maximum
absolute differences, the first 16 mismatches by descending absolute difference
and SHA-256 digests of the rounded MPFR residual and Jacobian word streams.
Every dot product and displayed algebraic sum is evaluated left-to-right in
ascending node or written-term order, with MPFR rounding after each primitive
operation. Exponentials use the admitted MPFR implementation. Global Jacobian
rows are assembled in ascending field and column order.

`PRECISION_SEPARATION` triggers iff either maximum residual absolute difference
is at least `2^-40`, or maximum Jacobian absolute difference divided by the
binary64 matrix maximum is at least `2^-40`.

## Frozen discretization localization

Compute N=64 Chebyshev-Lobatto coefficients of `varphi` with the standard
endpoint-half-weight DCT-I formula in MPFR256 and round each coefficient once to
binary64. Record the coefficient word stream hash, total coefficient L2 norm,
high-tail (`k=32..63`) L2 norm, even/odd high-tail norms and largest tail mode.

Also record the ratio of the absolute unused constraint at node 1 to the median
absolute unused constraint over nodes 1..62, with the median defined as the
average of sorted ordinals 30 and 31.

`SPECTRAL_SEPARATION` triggers iff the high-tail/total coefficient L2 ratio is at
least `2^-10` and the nonzero even/odd high-tail norm ratio lies outside
`[2^-4,2^4]`. `FIRST_NODE_SEPARATION` triggers iff the node-1/median unused
constraint ratio is at least `2^4`. Either trigger constitutes the single
`DISCRETIZATION` family.

## Frozen terminal decision

The active mechanism families are:

- `COORDINATE` for `COORDINATE_SEPARATION`;
- `SCALING` for `SCALING_SEPARATION`;
- `PRECISION` for `PRECISION_SEPARATION`;
- `DISCRETIZATION` for either discretization trigger.

Decision mapping:

| Active families | Decision |
|---|---|
| exactly `COORDINATE` | `COORDINATE_SUCCESSOR_PROPOSAL_SUPPORTED` |
| exactly `SCALING` | `EQUILIBRATED_SUCCESSOR_PROPOSAL_SUPPORTED` |
| exactly `PRECISION` | `MPFR_SUCCESSOR_PROPOSAL_SUPPORTED` |
| exactly `DISCRETIZATION` | `DISCRETIZATION_SUCCESSOR_PROPOSAL_SUPPORTED` |
| two or more | `MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR` |
| none | `NO_MECHANISM_SEPARATED_STOP_FOR_REVIEW` |

No combined successor is permitted by this packet. A unique decision unlocks
only preparation of a proposal whose algorithms, thresholds and one-shot rule
must be separately sealed. It does not authorize that proposal or its execution.

## Receipt and locks

The receipt self-hash domain is:

```text
nhm2-spherical-boson-star-v2/g2b-b4-r6-mechanism-separation/v1\n
```

Every receipt states `candidateSolveInvoked=false`, `newtonInvoked=false`,
`continuationInvoked=false`, `armijoTrialEvaluated=false`,
`stateUpdateComputedOrPersisted=false`, `b4R4Retried=false`, `noRetune=true`,
`candidateAdmission=false`, `vacuumWorkUnlocked=false`, and all proof,
execution, replay, lane, agreement, lamp, Theory Graph, physical, propulsion and
transport authority false. Benchmark `PASS` certifies only faithful execution
of this decision procedure.
