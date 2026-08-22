# NHM2 Spherical Boson-Star v2 G2-D Tail Analyticity Audit

Program gate: G2 — classical branch proof and terminal state

Workstream: exact proof-definition successor

Capability or component: audit of the proposed infinite tail-sector Taylor
space and selection of the smallest honest replacement boundary

Current maturity: exact read-only mathematical counter-audit; the physical
flat factors remain useful, but the same-space infinite Taylor realization is
rejected before implementation

Target maturity: one implementable finite-asymptotic-jet plus weighted-remainder
tail definition that can support a uniform contraction and directed join
enclosure

Required frozen inputs: the active G2 packet, the final branch-selection tail
policy, the authority-neutral boundary recurrence, the desingularized operator,
the packing proposal, `chi=17/16`, and the fixed core join at `y=64`

Required evidence: boundedness of the residual map on its declared Banach
space, compatibility with the frozen `C_0=1` and `z^9/(1-z)` remainder policy,
uniform parameter-tube bounds, and a deterministic no-retune falsifier

Stop/fail criteria: an unbounded derivative on the declared space; treating a
formal asymptotic series as convergent; an infinite Taylor sum with no positive
radius proof; a candidate-fitted split or norm; or any execution based on the
rejected representation

Explicit non-goals: changing the frozen physical tail, running a candidate,
issuing a proof receipt, terminal-state admission, downstream geometry/state,
either 68-file lane, a Theory Graph lamp, physical viability, propulsion, or
transport

Downstream gate unlocked: derivation of a weighted Volterra/remainder tail
successor; this audit authorizes no proof or branch execution

Change class: authority-neutral mathematical semantics and blocker correction

## Verdict

The physical factorization by the Schwarzschild tail and exponentially flat
scalar factor is retained. The additional claim that every sector belongs to
one `chi`-weighted Taylor algebra in `eta` is rejected.

The proposed residual operator is not bounded on that declared space, and the
frozen scalar tail coefficients are asymptotic rather than established as a
convergent Taylor series. A radii polynomial assembled on the rejected space
would therefore have no valid operator norm behind it.

This is a definition failure caught before candidate observation. It is not a
candidate `FAIL`.

## Exact same-space unboundedness witness

The rejected sector norm contains

```text
norm_chi(K) = sum_(n>=0) abs(K_n)*chi^n,
chi = 17/16.
```

The already-derived universal sector operator contains

```text
(eta^4/4096)*K''.
```

For

```text
K_N(eta) = chi^(-N)*eta^N,
```

the declared norm is exactly one, while

```text
norm_chi(eta^4*K_N'')
  = chi^2*N*(N-1).
```

This diverges with `N`. Hence the residual map is unbounded from the proposed
tail Taylor space to itself. The lower-order `eta^2*K'` and parameter
coefficients do not repair this defect. A same-space Newton/radii bound cannot
be defined by merely choosing a larger finite truncation.

## Frozen scalar recurrence is asymptotic

The branch policy solves `C_n` from the coefficient of `z^(n+1)` with exact
diagonal

```text
2*kappa^2*n.
```

The `L_sigma^2` term contributing the prior coefficient contains

```text
kappa^2*(sigma-n)*(sigma-n+1)*C_(n-1),
```

up to terms of lower polynomial order in `n` and decaying
metric-coefficient convolutions. Thus the formal recurrence has the rank-one
irregular-singular large-order structure

```text
C_n/C_(n-1) = -n/2 + O(1)
```

for a generic nonterminating tail. Rescaling from
`z=(kappa*x)^(-1)=eta/(64*k)` multiplies each ratio by the fixed factor
`1/(64*k)` but does not remove its unbounded growth. It therefore does not
produce a positive-radius Taylor series in `eta`.

An exact rational audit point inside the frozen algebraic tail domain was used
only as a representation falsifier:

```text
lambda = 1/32
w = 4/5
kappa = 3/5
k = kappa/lambda = 96/5 >= 1
M = 1
q = M*kappa/2 = 3/10 in (0,64)
sigma = -8/15
C_0 = 1.
```

The frozen exact recurrence was extended without changing its rows through
`C_100`. Every solved diagonal was exactly `2*kappa^2*n` and every reconstructed
KG coefficient vanished exactly. The canonical exact-rational `C_0,...,C_100`
wire has

```text
SHA-256 8fd044dbf1b46518b60e399b76e319177ed9eeef2f63a1613ff65e3da3511621
size    51,561 bytes.
```

The observed exact ratios agree with the displayed large-order mechanism. They
are audit evidence, not a candidate state, numerical fit, or proof receipt.

## What remains valid from the packing proposal

The following choices survive this audit:

- `eta=64/y` and the fixed join at `eta=1`;
- exact Schwarzschild algebraic tails `h_S,v0_S,v1_S`;
- the flat factors `B`, `E=B^2`, the amplitude normalization `d`, and
  `zeta=d^2*E` as algebraic bookkeeping;
- `C_0=1`, the exact finite scalar recurrence through `C_8`, and the non-emitted
  metric scratch `A_9/B_9` before `C_8`;
- the five independent joins plus derived `H_eta`/Bianchi check;
- the core finite/infinite audit and its square 25,509-record finite block; and
- the derived overlap gate `k_lower>=1`.

What does not survive is the infinite claim

```text
F_ell(eta,t_lambda)
  = sum_(n,j>=0) F_ell[n,j]*eta^n*T_j(t_lambda)
```

in the same `chi`-weighted radial Taylor norm, together with any convergence or
operator bound derived from it.

## Required replacement boundary

The smallest honest successor must use the already-frozen finite asymptotic jet
and prove the remainder as a function, not sum the full formal jet. Its required
physical form is

```text
h  = h_S  + E*R_H
v1 = v1_S + E*R_V1
u  = d*B*(P_8(z) + z^9*R_U),

P_8(z) = sum_(n=0)^8 C_n*z^n,
z = eta/(64*k).
```

`R_H,R_V1,R_U` are derived tail-proof functions, not Newton unknowns. Their
radial space must be a weighted function/Volterra space whose norm directly
controls value, first derivative, and second derivative at the core join. It
must incorporate the frozen envelopes generated by

```text
z^9/(1-z),
d/dz[z^9/(1-z)],
d^2/dz^2[z^9/(1-z)]
```

and the exact physical `x` derivative operators. Parameter dependence may
remain in the `chi`-weighted Chebyshev algebra only after the successor proves
the required complex-domain singularity separation uniformly on each cell.

The replacement must provide:

1. exact Volterra/Green kernels and boundary conditions at infinity;
2. a bounded weighted norm for all residual and derivative operations;
3. one deterministic center and no-retune finite representation, if a finite
   center is needed;
4. directed `Y,Z0,Z1,Z2` assembly evaluated on all frozen radii
   `2^-80,...,2^-8` in order;
5. strict existence and contraction inequalities exactly as frozen by the
   vacuum ABI;
6. uniform uniqueness and parameter analyticity on the complete cell tube;
7. directed enclosures for `H,V1,U,V1_eta,U_eta` and the derived `H_eta` check;
8. explicit failure when any weighted denominator, flat factor, or complex
   parameter singularity margin is nonpositive; and
9. no fallback to the rejected Taylor sectors, adaptive subdivision,
   truncation increase, or precision escalation after observing a result.

## Updated blocker

The replacement architecture is now recorded in
[`nhm2-spherical-boson-star-v2-g2-d-tail-volterra-remainder-proposal.md`](./nhm2-spherical-boson-star-v2-g2-d-tail-volterra-remainder-proposal.md).
It fixes the finite jet, exact scalar and metric half-line kernels, radial graph
norm, parameter algebra, no-retune center, frozen radii chronology, and join
extraction. Its remaining definition blocker is

```text
tailVolterraDirectedKernelConstantsAndYZAssemblyDefinition
```

That derivation must close before any proof implementation or candidate run.
