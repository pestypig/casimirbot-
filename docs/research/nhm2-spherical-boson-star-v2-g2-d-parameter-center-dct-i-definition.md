# NHM2 Spherical Boson-Star v2 G2-D Parameter-Center DCT-I Definition

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition implementation

Capability or component: 33-node parameter-center DCT-I construction

Current maturity: exact authority-neutral definition; no node solves, residual
proof, parameter-center instances, or producer runtime exist

Target maturity: one directed degree-32 `nu,m,c` parameter center for every
frozen continuation cell

Required frozen inputs: final branch policy; core-tail packing proposal; tail
source assembler input v1; 33 authenticated point-solve observations per cell;
one separately proved weighted residual bound per coordinate

Required evidence: exact node chronology, algebraic cosine enclosures, directed
DCT-I replay, uniform residual provenance, canonical output wire, persistence,
and independent audit

Stop/fail criteria: missing/reordered node; changed degree or cell; a cosine or
normalization convention not defined here; residual inferred from samples;
retry, retune, or authority promotion

Explicit non-goals: running a point solve, proving a uniform tube, executing a
vacuum proof, admitting a candidate, lighting a lamp, or making physical,
propulsion, or transport claims

Downstream gate unlocked: calculation-only parameter-center producer followed
by authenticated 1,024-cell production

## Purpose and boundary

The packing proposal freezes 33 Chebyshev–Lobatto point solves and then names
one DCT-I, but it does not freeze the transform normalization, a reproducible
cosine construction, the directed accumulation order, or the provenance of the
degree-32 residual. Those choices are fixed here. This document does not claim
that any point solve or uniform remainder proof has run.

The output schema is the sealed tail input contract
[`nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1.ts`](../../shared/contracts/nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1.ts),
semantic SHA-256
`c90de09dacfb6ed7507dcc1a56f19b28a7bc4dcac4996c9da7066a47e178f9e7`
/ 10,136 canonical bytes. It derives `lambda` from `cellOrdinal` and accepts
only the ordered models `[nu,m,c]`.

## Frozen cells and nodes

Let `N=32`. For cell `r=0,...,1023`, freeze

```text
lambda_left  = r*2^-15
lambda_right = (r+1)*2^-15
lambda_mid   = (2*r+1)*2^-16
lambda(t)    = lambda_mid + 2^-16*t
t_j          = cos(j*pi/N), j=0,...,N.
```

The mathematical DCT ordinal is `j=0,...,32`. Physical lambda increases in the
opposite order, so persisted point-solve records are exactly

```text
physicalOrderOrdinal = 0,...,32
chebyshevNodeOrdinal = 32-physicalOrderOrdinal.
```

The first cell's physical-order record zero is supplied only by the separately
certified lambda-zero ground-state/tangent instance. In later cells it must be
the exact persisted right-face approximation of the preceding cell. Within a
cell, each later point solve may use only the preceding physical-order point as
a predictor. First failure stops construction without retry.

Each point-solve record supplies directed MPFR256 intervals for the three
scalar outputs in exact coordinate order

```text
[nu,m,c].
```

The DCT producer may not accept `lambda`, `s`, `k`, `w`, `sigma`, `d`, a tail
coefficient, or a source value as an independent input.

## Algebraic cosine table

No ambient `pi`, trigonometric library, decimal cosine table, or binary64
constant is part of this definition. Construct one directed MPFR256 interval
`q_1` enclosing `cos(pi/32)` by the positive half-angle chronology

```text
q_pi_over_2  = 0
q_pi_over_4  = sqrt((1+q_pi_over_2)/2)
q_pi_over_8  = sqrt((1+q_pi_over_4)/2)
q_pi_over_16 = sqrt((1+q_pi_over_8)/2)
q_pi_over_32 = sqrt((1+q_pi_over_16)/2).
```

Every addition, division by two, and square root is one MPFR256 directed
interval operation. Then construct `q_n=cos(n*pi/32)` for `n=0,...,32` in
strict increasing `n` order:

```text
q_0 = 1
q_1 = q_pi_over_32
q_(n+1) = 2*q_1*q_n-q_(n-1), n=1,...,31.
```

For one matrix entry, set `h=(j*k) mod 64` and use the exact symmetry map

```text
0 <= h <= 32 : C_jk = q_h
33 <= h <= 63: C_jk = q_(64-h)
```

with the signs already carried by the recurrence values. The implementation
must verify that `q_0` contains `1`, `q_16` contains `0`, `q_32` contains `-1`,
and that the independently constructed symmetry identities overlap. A failed
identity stops the producer. The recurrence order and precision may not be
changed after observing a result.

## Exact DCT-I normalization and order

Define endpoint weights

```text
gamma_j = 2 for j in {0,N}, otherwise 1.
```

For coordinate `x` in exact order `[nu,m,c]`, let `X_j` be its directed node
interval at mathematical ordinal `j`. The retained coefficients are exactly

```text
a_k = (2/(N*gamma_k))
      * sum_(j=0)^N (X_j*C_jk/gamma_j), k=0,...,N.
```

This convention represents

```text
P_x(t) = sum_(k=0)^N a_k*T_k(t)
```

without an additional primed endpoint convention. A constant node vector
therefore maps to `a_0=constant` and `a_1=...=a_32=0`.

The directed implementation order is literal:

1. coordinate order `[nu,m,c]`;
2. coefficient order `k=0,...,32`;
3. accumulator starts at exact positive zero;
4. node order `j=0,...,32` after the persisted-to-mathematical ordinal map;
5. multiply `X_j*C_jk`;
6. divide endpoint nodes by exact integer two when `j` is zero or 32;
7. add once to the directed accumulator;
8. multiply the completed sum by exact `1/16`;
9. divide by exact integer two when `k` is zero or 32.

No FFT, reassociation, pairwise summation, binary64 table, midpoint transform,
or post-transform widening substitute is equivalent under this v1 definition.
Each output is encoded as the tail input contract's canonical directed dyadic
interval.

## Residual provenance

The 33 samples determine only the finite interpolating center. They do not
prove a uniform analytic remainder. For each coordinate, the required
`residualNormUpper` is a distinct nonnegative RNDU MPFR256 dyadic bound on

```text
sum_(k=33)^infinity abs(a_k)*(17/16)^k
```

over the complete certified cell tube. It must be issued by the subsequent
uniform interval/radii proof and bound its source, approximation, cell,
coordinate, norm, and runtime. It may not be inferred from endpoint agreement,
the last retained coefficient, a sampled transform, cross-grid convergence,
or an observed decay fit.

Until that receipt exists, a calculation-only producer may emit the 33 DCT-I
coefficient intervals as diagnostics but must not emit a valid sealed tail
input wire. Supplying zero as the residual without a proof of exact degree at
most 32 is forbidden.

## Canonical producer chronology

For each cell in ordinal order:

```text
verify frozen definitions and source/runtime/preseal bindings
verify previous-face or lambda-zero predecessor identity
run or admit exactly 33 point-solve observations in physical lambda order
stop on the first failed or missing observation
map observations to mathematical j order
construct and verify the algebraic cosine table
compute nu, then m, then c DCT-I intervals in the literal order above
admit three separately proved residualNormUpper bindings
construct the unsigned tail-input canonical wire
compute its domain-plus-u64le-length self hash
persist exclusively, reopen, reparse, and rehash
retain every proof/candidate/replay/lamp/physical authority false
```

Cells may not run concurrently unless the implementation proves that the
predecessor-face dependency and first-failure ordering are unchanged. Under the
current definition the required production chronology is serial cell ordinal
order.

## Current disposition

This definition closes the DCT-I normalization, cosine, summation, and residual
provenance choices. It does not instantiate them. The next bounded component is
an authority-neutral calculation producer and exact oracle for the algebraic
cosine table and transform. Actual 1,024-cell production remains blocked by the
integrated point solver, lambda-zero instance, uniform residual proof,
authenticated runtime/preseal, and persistence issuer.
