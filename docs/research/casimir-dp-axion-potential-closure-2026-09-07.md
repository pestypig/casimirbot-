Program gate: S1 — axion scalar-potential matching.
Workstream: Model-specific prerequisites for loops.
Capability or component: Tree mass closure, trilinears and field-representation consistency.
Current maturity: Conditional minimal-potential derivation.
Target maturity: Renormalized model with specified symmetry-breaking coefficients.
Required frozen inputs: Axion benchmark and canonical apparatus unchanged.
Required evidence: Exact eigenmasses, Cartesian/polar on-shell agreement, allowed-operator inventory.
Stop/fail criteria: No minimal tree restriction represented as radiatively closed; no on-shell vertex inserted unchanged into off-shell loops.
Explicit non-goals: Full one-loop amplitude, global quantum vacuum proof or detector exclusion.
Downstream gate unlocked: Explicit symmetry-breaking matching prescription; S1 remains open.

# Closing the scalar potential before calculating loops

The [axion proposal](https://arxiv.org/html/2609.04186v1) specifies a complex scalar with a linear soft-breaking term, a radial/Higgs portal and an explicitly symmetry-breaking messenger coupling to its imaginary part. This packet supplies an explicit minimal tree scalar potential consistent with those ingredients. The added restrictions are diagnostic assumptions, not claims that the paper fixes every renormalized coupling.

Define Phi=(f+s+iA)/sqrt(2), H=(0,(v+h)/sqrt(2)), and

    V = -muH^2 HdagH + lambdaH (HdagH)^2
        -muPhi^2 PhidagPhi + lambdaPhi (PhidagPhi)^2
        +lambdaP (HdagH)(PhidagPhi) - mu3 (Phi+Phi*).

For this restricted tree potential, the tadpole equations imply

    ma^2 = sqrt(2) mu3/f,
    Mhh^2 = 2 lambdaH v^2,
    Mss^2 = 2 lambdaPhi f^2 + ma^2,
    Mhs^2 = lambdaP f v.

Keep physical scalar eigenmasses mh=125 GeV and mr=1 TeV, f=294 GeV, v=246.2 GeV and ma=1 GeV. Set h1=c h-s_theta s and h2=s_theta h+c s, where sin(2theta)=2 lambdaP f v/(mr^2-mh^2). This defines the quartics and quadratic terms from the physical tree masses exactly. The script records them for five portal choices. All quartics satisfy the stated tree boundedness test. This is not a quantum vacuum or renormalization-group stability proof.

## Vertices and field-representation test

Write the interaction as L=-g_1AA h1 A^2/2-g_2AA h2 A^2/2. Direct Cartesian expansion gives

    g_1AA = lambdaP v c - 2 lambdaPhi f sin(theta)
           = -sin(theta)(mh^2-ma^2)/f,
    g_2AA = lambdaP v sin(theta) + 2 lambdaPhi f c
           = c(mr^2-ma^2)/f.

The equalities use the mass-eigenvector identities. The two terms in the light-scalar coupling substantially cancel. Using lambdaP v by itself as the physical Higgs–axion coupling would therefore be wrong in this minimal potential.

In polar variables Phi=(f+rho)exp(ia/f)/sqrt(2), the kinetic term contains rho (partial a)^2/f, while the soft potential supplies -ma^2 rho a^2/(2f) in the Lagrangian. With both external axions on shell, their combined radial vertex has coefficient (p_parent^2-ma^2)/f. After scalar mixing this reproduces both Cartesian decay vertices. The numerical maximum discrepancy is 4.55e-13 GeV.

This is an on-shell check. It does not authorize replacing internal off-shell vertices with these reduced decay expressions. A loop calculation in polar variables must retain derivative vertices and nonlinear contact terms. In Cartesian variables the Yukawa interaction is linear in s and A; no separate a^2 chi-bar chi contact should be added there. Combining the Cartesian Yukawa with a polar contact would double count interactions. Both complete representations must give the same physical amplitude.

The exact two-eigenstate tree scalar coefficient also obeys

    C_chiN = (mchi/f)(fN mN/v) sin(theta)c(1/mh^2-1/mr^2)
           = lambdaP mchi fN mN/(mh^2 mr^2).

Consequently the previous scalar coefficient is exact within this physical-mass tree parametrization, even though its earlier derivation used small mixing. This does not remove hadronic matching or loop corrections.

## A quantitative diagnostic and its limit

At lambdaP=0.03, g_1AA=-0.11723 GeV, giving Gamma(h1->AA)=1.0935e-6 GeV. With an explicitly chosen 4.1 MeV SM width scaled by c^2, the branching fraction is 2.666e-4. This is a partial-width calculation, not an invisible-decay bound: the axion lifetime, decay products and experimental acceptance have not been established. At the benchmark lambdaPhi is approximately 5.7846. Its simple lambdaPhi/(16 pi^2) counting factor is approximately 0.0366, not a proof that every loop correction is small; combinatorial factors, logarithms and other couplings matter.

## Why this tree potential is not yet a closed loop model

The messenger coupling to A explicitly breaks the complex scalar's U(1). CP does not forbid A^2 HdagH, A^4 or symmetry-breaking scalar mass terms. A renormalized matching calculation must allow the corresponding counterterms or establish a further symmetry that forbids them. The minimal invariant quartics and one linear soft term alone are not a sufficient general counterterm specification for that messenger theory.

An explicit example is

    delta V = (kappaA/2) A^2 (HdagH-v^2/2).

This is a tadpole/mass-subtracted parametrization of an allowed portal and associated mass counterterm, not a claim that its coefficient is known. It leaves the stated tree scalar masses, mixing and ma unchanged at the vacuum, but shifts g_1AA by kappaA v c. Thus matching masses alone does not fix the trilinear needed in loops. At lambdaP=0.03 a coefficient kappaA=0.00047616 would cancel the minimal on-shell h1AA vertex. This value is only an identifiability example, not a tuned candidate, fitted coupling, radiative estimate or claim that other loop amplitudes then vanish.

This identifies the next substantive calculation: choose and state a boundary condition for all allowed symmetry-breaking coefficients at the messenger scale, derive threshold corrections and running, then calculate the low-energy amplitudes. A declared zero boundary condition is a model assumption; it is not supplied by the LZ event. Alternatively carry these coefficients as shared nuisance/model parameters and expose the prediction's dependence on them. No universal nonzero loop floor follows from the currently specified inputs alone.

## Replay and status

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-potential-closure-2026-09-07.py`. Four checks pass: physical eigenmasses, Cartesian/polar on-shell vertices, exact scalar coefficient identity and tree quartic boundedness. Adjacent JSON records the numerical family. These checks do not establish a complete loop prediction. The existing two-target tree packet remains conditional; no frozen apparatus or previous evidence snapshot is altered. The goal remains active.
