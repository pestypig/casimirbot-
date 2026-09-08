Program gate: S1 — axion matching prerequisites.
Workstream: Higgs-background correction to neutral messenger loop.
Capability or component: CP-even two-point function and tadpole with exact fermion mixing at yu=0.
Current maturity: Evaluated neutral scalar subset.
Target maturity: Quantified background-truncation error in that subset.
Required frozen inputs: Existing scalar input scheme, messenger parameters and apparatus.
Required evidence: Coleman-Weinberg derivative checks, zero-background recovery and pole/tadpole conditions.
Stop/fail criteria: Do not extend a CP-even convergence result to CP-odd light-quark or gauge effects.
Explicit non-goals: Full amplitude, detector fit, physical vacuum proof or total-rate update.
Downstream gate unlocked: Background truncation is removed from this neutral CP-even contribution.

# Exact Higgs-background messenger loop

The [previous pole calculation](casimir-dp-axion-messenger-pole-subset-2026-09-07.md) neglected powers of the Higgs background inside the heavy-quark loop. This packet removes that approximation from the neutral CP-even two-point function and its tadpole at yu=0. It uses the messenger interaction specified in the [axion proposal](https://arxiv.org/html/2609.04186v1), while the loop derivation and comparison below are our calculation.

## Mass eigenstates and couplings

Set k=yL/sqrt(2), b=kv. At A=0 and yu=0 the fermion mass matrix in the (u,U) bases is [[0,b],[0,MU]]. Its eigenmasses are zero and mF=sqrt(MU^2+b^2). Only the left-handed states rotate. The Higgs fluctuation has heavy-light chiral coupling gHL=k MU/mF and heavy-heavy scalar coupling gHH=k b/mF.

At the frozen benchmark mF=2000.30304924 GeV and the left mixing sine is b/mF=0.01740633. MU remains the input mass parameter 2000 GeV and the subtraction scale; mF is its tree background eigenmass, not a separately adjusted input or a calculated pole mass.

Write t=mF^2, L=log(t/mu^2), A0=t(1-L), and the finite MS-bar functions

```
Bhl(p^2) = - integral_0^1 dx log[x(t-(1-x)p^2)/mu^2]
Bhh(p^2) = - integral_0^1 dx log[(t-x(1-x)p^2)/mu^2].
```

For inverse propagator p^2-m0^2+PiH, the sum is

`PiH(p^2) = -Nc/(8 pi^2) {gHL^2 [A0+(t-p^2)Bhl] + gHH^2 [2A0+(4t-p^2)Bhh]}`.

The first term includes both heavy-light chiral orientations; the second is the diagonal scalar Dirac loop. There is no light-light Higgs coupling at yu=0. Both are required: shifting the heavy mass alone would omit the diagonal loop and the changed off-diagonal coupling.

## Independent zero-momentum checks

The exact background potential for this sector is

`V1(w)=-Nc t(w)^2 [log(t(w)/mu^2)-3/2]/(16 pi^2)`, with `t(w)=MU^2+k^2 w^2`.

Numerical high-precision differentiation verifies `PiH(0)=-V1''(v)`. The tadpole satisfies

`T_h=V1'(v)=-Nc k^2 v t [log(t/mu^2)-1]/(4 pi^2)`.

Unlike the leading quadratic-background approximation, the full curvature and T_h/v are not equal. Their distinction must be retained in the input counterterms. The radial tadpole remains zero for this isolated messenger determinant.

## Updated finite input contribution

Use the same pole/mixing matrix construction as the prior packet with this PiH. If K denotes that finite interaction-basis mass matrix, the five CP-even potential counterterms are

```
delta lambdaH = [Khh+T_h/v]/(2 v^2)
delta muHS = Khs/v
delta muH2 = delta lambdaH v^2 + f delta muHS + T_h/v
delta mS2 = Kss
delta t = -f Kss - v^2 delta muHS/2.
```

Finite delta v and delta f remain zero for this isolated contribution. The result is not the full GF-based input conversion. At mu=MU, delta lambdaH=4.90605779e-5, delta muHS=0.00182439505 GeV, delta muH2=6082.78089 GeV^2, delta mS2=0.000165359012 GeV^2 and delta t=-55.3409576 GeV^3.

With tree external vertices held fixed, the scalar propagator-only amplitude correction at Q=0 changes from -1.73839208e-4 to -1.73598292e-4. The difference is +2.40916726e-7 of the tree amplitude, or a 0.1386% reduction in the magnitude of this loop correction. At Q=0.246 GeV the values differ negligibly at the displayed precision. This quantifies the background truncation for this component; it does not bound the remaining one-loop terms.

## Scope of the remaining calculation

The CP-odd sector must be handled separately. Rotating its coupling generates a light-light pseudoscalar coupling proportional to yR b/mF as well as the heavy-light coupling. A perturbative massless-quark loop at GeV and lower scales is not a substitute for hadronic matching. No CP-odd update is inferred from this calculation.

The remaining work includes fermion/vertex matching, electroweak input conversion and the other scalar and hard-gluon contributions in one consistent scheme. No total xenon or coherence rate is updated by adding this component alone. The frozen apparatus and prior evidence packets are unchanged.

The [script](casimir-dp-axion-broken-higgs-loop-2026-09-07.py) authenticates the previous output and produces an adjacent [JSON](casimir-dp-axion-broken-higgs-loop-2026-09-07.json). Four checks pass: zero-momentum curvature, the tadpole derivative, recovery of the archived leading loop when the background is set to zero only inside the loop, and all five CP-even input conditions. Setting that loop background to zero for the recovery test does not alter the external reference scalar masses or mixing. The goal remains active.
