# NHM2 spherical-boson-star v2 G2H-E-S4-R1 state/grid definition audit

Program gate: G2H-E-S4-R1 — mini-boson-star proof-definition completeness review  
Workstream: authenticated classical and quantum control branch  
Capability or component: independent audit of the draft classical state/grid and cross-grid norm definition  
Current maturity: draft rejected before implementation  
Target maturity: bounded replacement definition after tail factorization and grid semantics are frozen  
Required frozen inputs: R2 contract `041c406c...ed12a`, draft state/grid contract, historical node-count terminology, absent candidate roots  
Required evidence: exact DCT counterexample, tail-regularity analysis, square-count replay, dependency-order audit  
Stop/fail criteria: ambiguous grid cardinality, polynomial-changing prolongation, norm/domain incompatibility, non-even origin representation, candidate evaluation, or authority promotion  
Explicit non-goals: candidate sampling, seed retuning, solver implementation, radii proof, G3, or any physical claim  
Downstream gate unlocked: a corrected additive state/grid replacement, not S4 implementation

## Disposition

The draft
`nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v1.json`
is **invalidated before implementation**.  This is a definition failure, not a
scientific result and not evidence against the selected boson-star member.

The square count, endpoint placement, interface location and exact-vacuum
fixture are internally consistent.  Four definition defects nevertheless make
the draft unsafe to seal.

## Blocking defects

### 1. `N` cardinality was invented rather than recovered

R2 freezes the ordered values `64,96,128,256` but does not say whether each is
a polynomial degree, a node count per patch, a total node count, or a core
count accompanied by a separately fixed tail order.  The draft silently chose
"degree on each of two patches," producing `N+1` nodes on each patch.  Earlier
repository contracts consistently call the corresponding spherical values
`nodeCount` or `radialNodeCount`.  Those older contracts do not automatically
govern the new R2 family, but they make the new interpretation non-obvious and
require an explicit additive decision with cost and approximation consequences.

### 2. Raw DCT-I zero-padding does not preserve the polynomial

The frozen DCT-I codec stores endpoint modes with a factor of two relative to
standard Chebyshev coefficients.  For example, on degree two the polynomial
`T_2` is stored as `[0,0,2]`, because the inverse applies one half to the final
coefficient.  Raw zero-padding to degree four gives `[0,0,2,0,0]`; mode two is
then an interior mode and reconstructs `2*T_2`.

Every grid comparison must first canonicalize each stored vector to standard
coefficients:

```text
c_0=a_0/2,
c_k=a_k for 0<k<N,
c_N=a_N/2.
```

Only the canonical `c` vectors may be zero-padded, subtracted and normed.

### 3. The proposed weighted tail norm has the wrong function space

The draft stores raw `sigma(q)` and `p(q)` on the infinity patch while also
using the exponential coefficient weight `(17/16)^k`.  A massive scalar tail
contains `exp(-kappa/q)` times powers and an analytic remainder.  Extended by
zero at `q=0`, the raw field is smooth and flat but is not real analytic there.
Consequently its Chebyshev coefficients do not belong to a fixed
exponentially weighted `l1` algebra for any weight greater than one.

R2 already requires a mass-plus-exponential tail with explicit remainder.  The
tail factorization therefore has to be frozen first.  The infinity-patch state
and weighted norm must act on analytic factored variables, while physical
`sigma,p` are reconstructed through a dependent directed enclosure.  The
draft incorrectly listed tail factorization as a later dependency.

### 4. “Even-origin-aware” was not realized

Generic Lobatto values for `b,s,sigma,p` plus derivative rows at `r=0` do not,
by themselves, define the even-origin-aware representation promised by R2.
The replacement must freeze either an even extension/basis, an `r^2`-analytic
coefficient representation, or an equivalent parity-constrained transform,
and must specify how `p`, which is odd, is represented.  This cannot remain an
informal property of origin rows.

## Required repair order

1. Freeze the exact massive-scalar and metric tail factorization, recurrence,
   analytic variables, endpoint limits and reconstruction map.
2. Freeze the meaning of each R2 grid integer and the per-patch cardinalities.
3. Freeze an explicit even/odd origin representation.
4. Rebuild the square residual packing around those representations.
5. Canonicalize DCT-I coefficients before prolongation and define norms on the
   analytic factored variables.
6. Replay manufactured origin, tail, DCT and square-count fixtures in two
   independent implementations before any proof producer is resumed.

No threshold, candidate identity, equation, continuation cell, candidate
radius, grid integer or authority bit changes through this return.

