Program gate: S1 — axion matching prerequisites.
Workstream: Messenger field normalization.
Capability or component: Leading heavy-light scalar two-point functions.
Current maturity: Conditional one-loop subset.
Target maturity: Explicit field-coordinate correction with amplitude consistency check.
Required frozen inputs: Archived scalar potential and messenger benchmark; apparatus unchanged.
Required evidence: Analytic derivative, potential mass-sign check and field-redefinition invariance.
Stop/fail criteria: Do not interpret scheme-dependent coefficients or coordinate changes as observable rate shifts.
Explicit non-goals: Full broken-vacuum matching, complete beta functions, fit or certification.
Downstream gate unlocked: Field terms can enter a future complete parameter and amplitude matching calculation.

# Messenger field normalization

The [potential-only calculation](casimir-dp-axion-potential-running-2026-09-07.md) left the kinetic terms unmatched. This packet derives the leading heavy-light messenger contribution in the symmetric, small-background limit, with yu=0, MU=2000 GeV, yL=0.20 and yR=0.0032. Electroweak mixing corrections in powers of yL v/MU are excluded. The interaction is taken from the [axion proposal](https://arxiv.org/html/2609.04186v1). The general need to match fields as well as potential coefficients is discussed by [Braathen, Goodsell and Slavich](https://link.springer.com/article/10.1140/epjc/s10052-019-7093-9); the coefficients below are our calculation, not coefficients imported from that paper.

## Two-point convention and result

Use inverse propagator s-m0^2+Pi(s), with s=p^2. For a real scalar coupled to the heavy-light fermion pair with strength y, the two chiral orientations give total numerator 4 k dot (k+p). The finite MS-bar functions below threshold are

`B0(s;MU^2,0) = - integral_0^1 dx log[x (MU^2-(1-x)s)/mu^2]`

`A0(MU^2) = MU^2 [1-log(MU^2/mu^2)]`

`Pi(s) = -Nc y^2 [A0+(MU^2-s) B0(s)]/(8 pi^2)`.

Here y=yR for A, y=yL/sqrt(2) for the real neutral Higgs background h, and Nc=3. With L=log(MU^2/mu^2), B0(0)=1-L and B0'(0)=1/(2 MU^2). Consequently

`delta Z = Pi'(0) = Nc y^2 (1/2-L)/(8 pi^2)`.

Pi(0) is minus the potential mass correction, consistent with the stated inverse-propagator convention. At mu=MU, delta ZA=1.94536673e-7 and delta ZH=3.79954439e-4. The corresponding Pi(0) values are -3.11258676 and -6079.27102 GeV^2. These are renormalized components, not pole-mass predictions. The radial field has no direct messenger contribution at this order; that does not mean its full wavefunction correction vanishes.

## Consequences for the parameter ledger

Canonical fields are Ac=sqrt(1+delta ZA) A and hc=sqrt(1+delta ZH) h. At first order, and relative to the invariant radial-sector coefficients, field normalization alone produces the following terms at the central lambdaP=0.03 benchmark:

| Component | Field-only contribution at mu=MU |
|---|---:|
| A-only Higgs portal, delta kappaA | -lambdaP delta ZA = -5.83610018e-9 |
| A^4 coefficient, delta lambdaA | -2 lambdaPhi delta ZA = -2.25063106e-6 |
| Higgs quartic, delta lambdaH | -2 lambdaH delta ZH = -9.79734889e-5 |
| Relative change of an A Yukawa | -delta ZA/2 = -9.72683363e-8 |

This is a component ledger, not a complete operator basis: mixed radial/A interactions, masses, vacuum values and other couplings also transform. The A-only portal entry differs from the potential threshold -3.11258676e-8 calculated earlier. In particular the tiny additive yR^4 potential term does not bound the effects of pre-existing quartics multiplied by wavefunction corrections. Individual entries depend on the scheme, scale and field convention.

No observable change follows from a field-coordinate change alone. For example, the two expressions

`g1 g2 / [(1+delta ZA) Q^2 + mraw^2]`

and

`[g1/sqrt(1+delta ZA)] [g2/sqrt(1+delta ZA)] / [Q^2 + mraw^2/(1+delta ZA)]`

are identical. Applying only the Yukawa correction to a previously fixed propagator would create a spurious rate change. A physical update requires a complete choice of renormalized inputs, then all relevant matching contributions in that same convention.

## Verification and next decision

The [script](casimir-dp-axion-field-threshold-2026-09-07.py) and [JSON](casimir-dp-axion-field-threshold-2026-09-07.json) pass three checks: numerical derivatives against delta Z for both fields at three scales; the mass-sign relation to the previous potential; and exchange-amplitude invariance at Q=0, 0.05, 0.246 and 1 GeV. These are consistency checks of this subset, not an independent validation of the entire microscopic model.

`npm run validate:physics:root-leaf` passes. This research-document calculation makes no Casimir certificate or physical-validation claim.

The next matching prerequisite is a declared physical-input and finite-counterterm prescription, including which independent A-only operators are fixed by assumptions rather than observables. Fermion and vertex corrections, broken-vacuum terms, and complete hard gluon matching remain open. Existing joint forecasts are unchanged. The goal and S1 remain active.
