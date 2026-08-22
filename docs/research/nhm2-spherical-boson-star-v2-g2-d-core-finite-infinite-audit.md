# NHM2 Spherical Boson-Star v2 G2-D Core Finite/Infinite Audit

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition successor

Capability or component: core Green-operator finite/infinite split, square
residual ordering, and injective proof preconditioner

Current maturity: exact authority-neutral mathematical preregistration; no
candidate or proof execution

Target maturity: one independently checkable core coefficient-space closure
that removes the core half of
`tailSynthesisMajorantAndCoreFiniteInfiniteSplitDefinition`

Required frozen inputs: the active G2 packet, the desingularized-operator
proposal, the core–tail packing proposal, spatial degree 255, parameter degree
32, `chi=17/16`, and the fixed regular Green operators in those documents

Required evidence: exact shifted-Chebyshev Hardy columns, a uniform omitted-mode
bound, a disjoint two-index tail partition, exact square ordering, and an
injective approximate-inverse rule that recovers the raw differential rows

Stop/fail criteria: a column bound that fails at any mode; an implicit-zero
tail; an overlapping or uncovered coefficient partition; a nonsquare residual
codec; a proof preconditioner with an unproved kernel; or any inference from a
preconditioned zero that can hide a nonzero raw residual

Explicit non-goals: tail-transseries convergence, a vacuum tube, a branch run,
a proof receipt, terminal-state admission, downstream geometry/state, either
68-file lane, a Theory Graph lamp, physical viability, propulsion, or transport

Downstream gate unlocked: the tail representation/majorant repair becomes the
sole remaining G2-D packing blocker; this audit alone authorizes no
implementation or execution

Change class: authority-neutral mathematical semantics and planning

## Decision boundary

This document closes only the core coefficient-space part of the active packing
proposal. It fixes the infinite-dimensional projections and proves conservative
operator bounds without observing a candidate. The sibling tail-analyticity
audit rejects the proposed same-space infinite Taylor sectors; the tail now
needs a weighted Volterra/remainder representation plus uniform uniqueness,
parameter-analyticity, and directed join enclosures.

No semantic seal, proof authority, candidate authority, or execution authority
is assigned here.

## Hardy factorization of the two fixed Green operators

Let `q=y^2/4096`, let `T_n` mean `T_n(2*q-1)`, and define the Hardy operator

```text
A[f](q) = integral_(t=0)^1 f(t*q) dt.
```

On a power monomial,

```text
A[q^r] = q^r/(r+1).
```

Therefore the two already-frozen regular Green quotients factor exactly as

```text
J_1[f]/q = 1024*A^2[f]
J_2[f]/q = 1024*A*H_(3/2)[f]

H_(3/2)[q^r] = q^r/(r+3/2)
H_(3/2) = A*(I + A/2)^(-1).
```

The last identity is coefficientwise exact because

```text
(1/(r+1))/(1 + 1/(2*(r+1))) = 1/(r+3/2).
```

This factorization is an oracle for the finite exact-power implementation in
the packing proposal. It does not replace that implementation or its independent
power-series comparison.

## Exact shifted-Chebyshev column of `A`

For `n>=2`, direct integration and exact division by `x+1`, where
`x=2*q-1`, give

```text
A[T_n]
  = sum_(j=1)^(n-2)
      2*j*(-1)^(n-j)/(n^2-1) * T_j
    - 2/(n+1) * T_(n-1)
    + 1/(n+1) * T_n.
```

The two exceptional columns are

```text
A[T_0] = T_0
A[T_1] = (-T_0 + T_1)/2.
```

An independent derivation uses

```text
(T_k(x)-(-1)^k)/(x+1)
  = (-1)^(k-1)*k*T_0
    + sum_(j=1)^(k-1) 2*(k-j)*(-1)^(k-1-j)*T_j
```

inside

```text
integral T_n(x) dx
  = T_(n+1)(x)/(2*(n+1)) - T_(n-1)(x)/(2*(n-1)).
```

Both routes must agree exactly before a proof run.

## Weighted column bounds at `chi=17/16`

Let `r=chi^(-1)=16/17` and use

```text
norm_chi(sum a_n*T_n) = sum abs(a_n)*chi^n.
```

For `n>=2`, the exact normalized column norm is

```text
w_n = norm_chi(A[T_n])/chi^n
    = 2/(n^2-1)*sum_(k=2)^(n-1) (n-k)*r^k
      + (2*r+1)/(n+1).
```

For `n>=33`, extending the positive geometric sum to infinity gives

```text
w_n
 <= 2*n/(n^2-1) * r^2/(1-r) + (2*r+1)/(n+1)
 <= 33/n,
```

and the exact slack in the last inequality is

```text
(49*n-561)/(17*n*(n-1)*(n+1)) >= 0.
```

The exact rational columns `n=0,...,32` must be checked separately. Their
maximum normalized norm is exactly one, at `n=0`. Hence

```text
operator_norm_chi(A) <= 1
norm_chi(A[T_n]) <= 33*chi^n/n, n>=1.
```

Using the exact absolute coefficients above once more,

```text
norm_chi(A^2[T_n])/chi^n
 <= 33*(
      2/(n^2-1)*sum_(k=1)^(n-1) r^k
      + 1/(n*(n+1)))
 <= 33*(32/(n^2-1) + 1/(n*(n+1)))
 <= 1089/n^2, n>=33.
```

The exact slack in the last unscaled bracket is

```text
33/n^2 - 32/(n^2-1) - 1/(n*(n+1))
  = (n-33)/(n^2*(n-1)*(n+1)) >= 0.
```

Since `operator_norm_chi(A)<=1`, the Neumann series gives

```text
operator_norm_chi((I+A/2)^(-1)) <= 2.
```

The frozen omitted-spatial-mode bounds are therefore

```text
norm_chi((J_1/q)[T_n]) <= 2^21*chi^n/n^2
norm_chi((J_2/q)[T_n]) <= 2^22*chi^n/n^2,
                                              n>=256.
```

The unreduced exact constants behind those power-of-two envelopes are

```text
1024*1089 = 1,115,136 < 2^21
2048*1089 = 2,230,272 < 2^22.
```

These are preregistered conservative envelopes, not fitted candidate values.
Failure of a directed implementation to lie inside them is a proof-definition
or implementation failure and stops the candidate.

## Exact two-index finite/infinite partition

For each of the three core function blocks, use four disjoint projections:

```text
P_00: 0<=n<=255 and 0<=j<=32
P_s:  n>=256     and 0<=j<=32
P_p:  0<=n<=255 and j>=33
P_sp: n>=256     and j>=33.
```

They are pairwise disjoint and sum to the identity. The overlap is `P_sp`; it
is never silently assigned to either one-dimensional tail. For each scalar
block use

```text
P_scalar_0: 0<=j<=32
P_scalar_p: j>=33.
```

Every tail receipt must carry fourteen independently hashed directed norm
records: three function-block spatial tails, three function-block parameter
tails, three function-block overlap tails, and five scalar parameter tails,
grouped in the fixed coordinate order below. A compact manifest may group
records, but it may not encode any omitted coefficient as an implicit zero.

The Green operators preserve `j` but may lower `n`. Consequently the exact
allowed projection routes are

```text
P_00 -> P_00
P_s  -> P_00 + P_s
P_p  -> P_p
P_sp -> P_p + P_sp.
```

All other Green projection routes are exact zero. Nonlinear convolution routes
must still be enclosed separately and must include spatial/parameter overflow
and the `P_sp` overlap.

## Square unknown/residual ordering

The global unknown family order is

```text
0 core_AH
1 core_AV1
2 core_AU
3 a
4 b
5 nu
6 m
7 c.
```

The global residual family order is

```text
0 core_AH - J_1[R_H]/q
1 core_AV1 - J_2[R_V1]/q
2 core_AU - J_2[R_U]/q
3 join_H
4 join_V1
5 join_U
6 join_V1_eta
7 join_U_eta.
```

Function residual families use `(j,n)` coefficient order and join families use
parameter mode `j`. Under `P_00` and `P_scalar_0`, this is the already-frozen

```text
3*33*256 + 5*33 = 25,509
```

unknown records and exactly 25,509 residual records. The same family ordering
is retained in every infinite-tail record. `H_eta` and the unused `G_x` row are
audit outputs and never extra square rows.

## Injective proof preconditioner

Let `P` be the finite projection over the 25,509 records and let `Q=I-P`, with
`Q` represented by the four disjoint function projections and scalar parameter
tails above. The proof preconditioner is fixed to

```text
calA = B_N*P + Q,
```

where `B_N` is a square directed finite matrix in the exact residual/unknown
ordering. Before any radii-polynomial calculation, the proof must establish

```text
norm(I_N - B_N*D_N) < 1
```

for the directed finite Jacobian enclosure `D_N`. This proves `B_N*D_N`
invertible and therefore proves the square matrix `B_N` injective. A point
estimate, an LU-success flag, or a floating determinant is not sufficient.

Because `Q` is the identity on every infinite partition, `calA` is injective.
Thus

```text
calA*F(x)=0  implies  F(x)=0.
```

No approximate-inverse kernel can hide a residual.

## Recovery of the uncancelled raw rows

For each core family write

```text
F_H   = core_AH  - J_1[R_H]/q
F_V1  = core_AV1 - J_2[R_V1]/q
F_U   = core_AU  - J_2[R_U]/q.
```

Multiplying by `q` and applying the corresponding frozen radial differential
operator gives exactly

```text
L_1[q*F_H]  = L_1[q*core_AH]  - R_H
L_2[q*F_V1] = L_2[q*core_AV1] - R_V1
L_2[q*F_U]  = L_2[q*core_AU]  - R_U.
```

Therefore `F=0` recovers all three solved differential rows. Residual replay
must then reconstruct the sibling proposal's original uncancelled exponential
term ledger and the unused `G_x` row. It may not certify only these rearranged
rows.

## Required exact audit vectors

Before any proof execution, two source-disjoint exact-arithmetic audits must
agree on:

1. every coefficient in the displayed `A[T_n]` formula for `n=0,...,512`;
2. the finite `n=0,...,32` operator-norm maximum of exactly one;
3. positivity of both symbolic slacks for their declared integer domains;
4. the exact constants `1,115,136` and `2,230,272` and their power-of-two
   envelopes;
5. coverage, disjointness, and route legality of `P_00,P_s,P_p,P_sp` at all
   four boundary pairs `(255,32),(256,32),(255,33),(256,33)`;
6. exact equality of finite unknown and residual counts and exact ordering;
7. a hostile singular `B_N` fixture that is rejected before radii bounds; and
8. exact raw-row recovery on symbolic polynomial fixtures.

All audit outputs remain diagnostic. Passing these vectors does not establish a
tail synthesis, a vacuum connection, a branch state, or any authority.

## Result and remaining blocker

The core finite/infinite definition is now explicit and has a deterministic
falsifier. The active packing proposal remains unsealed because the sibling
tail audit invalidates its same-space infinite Taylor realization. The derived
tail now requires a bounded weighted Volterra/remainder representation,
uniqueness and parameter analyticity, and directed enclosure of the five joins
plus the `H_eta` check.

The sole remaining packing blocker is therefore

```text
tailWeightedVolterraRemainderRepresentationAndDirectedJoinDefinition
```

This is a definition/proof blocker, not evidence that the frozen candidate
fails.
