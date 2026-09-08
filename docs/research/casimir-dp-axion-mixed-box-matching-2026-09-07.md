# Mixed top–heavy electroweak matching closure

September 7, 2026. Exploratory leading dimension-six electroweak subset. The preceding pure-heavy overlap packet was progress; this packet closes the corresponding mixed top–heavy overlap, including finite terms and two scale cancellations. It does not complete QCD matching or admit the full model.

## Independent inputs

Use the hard singlet coefficient in [Crivellin et al., 2204.05962v2](https://arxiv.org/pdf/2204.05962), equations S.3.3–S.3.5, and the generic current-operator evolution/electroweak matching in [Bobeth et al., 1703.04753](https://arxiv.org/pdf/1703.04753), equations 36–38. The latter equations apply to generic SMEFT coefficients; they are not a transfer of a different VLQ representation's boundary conditions. The electroweak matching functions are gauge independent. Its discussion distinguishes these terms from higher-order QCD matching, which remains necessary here.

For the up-aligned singlet let B_sd=yL² lambda_u, Y_sd=yt² lambda_t, x=mt²/MW², and K=B_sd Y_sd/(64 pi² M²). Use the Hamiltonian coefficient of Q_LL=(sbar_L gamma_mu d_L)² and the tree input identity GF=1/(sqrt(2)v²). With high matching scale muH and electroweak scale muE, our reduction of the published expressions is

```
H_hard = -K [3/2+log(muH²/M²)],
H_evolution = 2K log(muH/muE),
H_finite = K [H1(x,muE)+H2(x,muE)],
H1 = log(muE/MW) -(x-7)/(4(x-1))
     -(x²-2x+4)log(x)/(2(x-1)²),
H2 = log(muE/MW) +(7x-25)/(4(x-1))
     -(x²-14x+4)log(x)/(2(x-1)²).
```

The additional flavor sum multiplying S0(x) in equation 36 vanishes for this alignment. In the down basis, C_Hq^(3) is proportional to the up-row projector Pu, while the top CKM matrix is Pt. Unitarity of the underlying V0 implies Pt Pu=Pu Pt=0. Retaining the full sum is essential; selecting only some internal flavor indices would produce a spurious residual. This is not an assumption that the mixed top-heavy amplitude vanishes.

The sum is independent of both muH and muE at this electroweak order:

```
H_sum = K [log(M²/MW²)+H1(x,MW)+H2(x,MW)-3/2].
H1(x,MW)+H2(x,MW)-3/2 = -4h(x)+3/(1-x),
h(x)=log(x)(1-2x+x²/4)/(1-x)².
```

This is precisely the finite function in the independently archived large-X expansion of S(x,X), not a term fitted to it. Thus the matching reproduces the leading mixed full-theory box after normalization and basis conversion. Adding it to that full box would double count.

## Numerical comparison

At yL=0.2, M=2 TeV, the imaginary Hamiltonian coefficient is 3.06258795e-15 GeV^-2 in this EFT expression and 3.05759250e-15 GeV^-2 in the exact mixed loop. The ratio full/EFT is 0.998368880, a difference of approximately 0.163%. Ratios at 5, 20 and 200 TeV are 0.999685062, 0.999977032 and 0.999999740. The comparison holds CKM and tree electroweak inputs fixed; it is not a new fit or a total uncertainty estimate.

The finite-mass expansion therefore does not supply the large suppression required to rescue the original kaon reference. Unlike the pure-heavy term, this mixed term carries the relevant CP phase. The algebraic sign is checked in the same convention as the archived box; observable signs still require the previously documented mixing/decay mapping.

## What remains

This is closure only for the leading yL² yt² electroweak contribution. QCD evolution and two-loop matching, the consistent CKM fit, smaller charm terms, and additional light-pseudoscalar interactions remain outside it. Scale cancellation at this order cannot be advertised as full QCD scale independence. The verified hard/evolution split now provides a concrete basis for QCD treatment rather than assigning the same correction to every component by analogy.

The shared xenon/local calculation and frozen apparatus are unchanged. No local signal or shared gravitational explanation is established.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-mixed-box-matching-2026-09-07.py`. It authenticates the archived loop script and imports definitions only. Checks cover independent variations of muH and muE (nine combinations per mass), the finite-function identity, the projector cancellation, and convergence to the full result. The sibling JSON records numerical evidence. Root-leaf documentation validation is separate from physics certification; no certificate claim applies.
