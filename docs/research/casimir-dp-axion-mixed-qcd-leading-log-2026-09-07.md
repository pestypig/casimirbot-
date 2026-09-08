# Selected leading-log QCD evolution of the mixed coefficient

September 7, 2026. Exploratory partial QCD resummation. The preceding electroweak matching closure was progress and supplies the source term used here. This is not a complete eta_tT calculation or an uncertainty band.

## Defined truncation

Between mu0=162.6 GeV and M, retain six active quarks, one-loop QCD running of alpha_s and the top Yukawa, the VLL homogeneous anomalous dimension, and the previously verified electroweak current-to-four-quark source. Hold the tree current coefficient fixed under this selected pure-QCD evolution. No running above M is included. The retained coefficients in derivatives with respect to log(mu) are

```
d alpha/d log(mu) = -7 alpha²/(2 pi),
d yt/d log(mu) = -8 alpha yt/(4 pi),
d C/d log(mu) = 4 alpha C/(4 pi) - 2 K(mu),
K(mu)/K(mu0) = [alpha(mu)/alpha(mu0)]^(8/7).
```

The VLL anomalous dimension 6-6/N=4 is given in [Buras, Misiak and Urban, equation 2.21](https://arxiv.org/pdf/hep-ph/0005183). The mass/Yukawa coefficient follows the [PDG quark-mass review, equations 60.2–60.4](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-quark-masses.pdf), converting its log(mu²) convention to log(mu). The current mixing and finite electroweak functions retain the source and conventions of the preceding packet.

Choose matching scales muH=M, muE=mu0. Put a=alpha(mu0), r=alpha(M)/a, and F=H1(x,mu0)+H2(x,mu0)=3.706058178. The analytic solution, normalized to K(mu0), is

```
hard = -(3/2) r^(10/7),
source = [4 pi/(3 a)] [1-r^(3/7)],
finite_EW = F.
```

The hard boundary includes the QCD-running top Yukawa and homogeneous evolution; the source is integrated continuously rather than multiplying the entire electroweak box by an arbitrary common factor. An independent ODE integration verifies the result. As a tends to zero, the source approaches 2 log(M/mu0), recovering the preceding electroweak expression.

## Results and interpretation

For the diagnostic input a=0.108 and M=2 TeV, alpha(M)=0.0829519184. The normalized hard, source and finite terms are -1.02891808, +4.14718157 and +3.70605818, respectively. Their total is 6.82432166 versus 7.22527670 without QCD running: ratio **0.94450662**, a 5.55% reduction. Inputs a=0.106 and 0.110 give ratios 0.94544 and 0.94358. This input range is chosen for sensitivity, not claimed to be an experimental confidence interval or total theoretical error.

At 5 and 20 TeV the central ratios are approximately 0.897 and 0.830. These mass variations diagnose logarithms and are not fixed-gu parameter fits. The cancellation between the negative hard term and positive source means that applying a simple homogeneous factor to the whole amplitude would give a different result.

The selected running does not supply the roughly 72% reduction of eta_tT required by the original yL=0.2 diagnostic. That comparison is qualitative: this ratio is **not** eta_tT and must not be multiplied into the previous eta=0.5765 without decomposing its already-included QCD effects. Low-energy evolution, matrix-element conventions, thresholds and finite QCD pieces must be combined consistently first.

Missing pieces include the mixed electroweak/QCD two-loop source, finite QCD matching at the high and electroweak scales, additional operator mixing, and a consistent flavor fit. Dressing the electroweak finite terms with selected running does not make them complete at QCD next-to-leading order. Arbitrary-scale cancellation demonstrated previously at electroweak order is not asserted at the newly retained partial QCD order. The light-pseudoscalar sector remains outside this subset.

## Decision and replay

Retain the smaller-yL family conditionally. Use this explicit evolution as a reference for a fuller coupled-operator treatment; do not assign a replacement eta or promote a model based on this subset. The frozen two-target baseline is unchanged.

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-mixed-qcd-leading-log-2026-09-07.py`. It authenticates and imports the previous matching definitions. Three checks pass: analytic solution against ODE integration, zero-QCD limit, and zero-evolution-interval limit. The sibling JSON contains nine sensitivity points. Root-leaf documentation validation is separate; no certificate or full model admission claim applies.
