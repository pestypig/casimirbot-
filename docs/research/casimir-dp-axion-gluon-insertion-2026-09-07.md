# Selected messenger-gluon insertions in the joint model

Exploratory research, September 7, 2026. This follows the [heavy threshold](casimir-dp-axion-heavy-gluon-threshold-2026-09-07.md) and preserves the [gluon bookkeeping](casimir-dp-axion-higgs-hadronic-ledger-2026-09-07.md). It is a leading EFT insertion calculation, not a complete two-loop matching result.

## Conventions and signs

Define OG=(alpha_s/pi) G². At leading order in the three-light-flavor scalar theory, its nucleon matrix element is -8 mN fTG/9 times the scalar nucleon bilinear. This follows from the trace-anomaly and heavy-flavor normalization in [Hoferichter et al., equations 3–5](https://arxiv.org/html/1708.02245v2). We use fTG=0.9, consistent with the illustrative LO decomposition of the archived total Higgs factor 0.3. This is an assumed scalar matrix element, not the PDF gluon momentum fraction.

The heavy threshold is L=Kaa a² OG+Kh h OG. For the Higgs term its nucleon projection has the usual negative Higgs-Yukawa sign and shifts the total Higgs factor by

`delta fN = (8/9) v Kh fTG = 2.01986917e-5`.

This additional messenger term is not a second copy of the three SM heavy flavors. At the same order it multiplies the tree scalar exchange. Products with already-loop-corrected vertices would be selected higher-order terms and are not included here.

For the two-pseudoscalar insertion, use the authenticated Dirac triangle integral I(Q). In the prior cubic convention L=-g_aa s a²/2, replacing the scalar source by the local gluon source means g_aa s=-2 Kaa OG. The corresponding effective Lagrangian coefficient is

`Cg = -Kaa g_chi² m_chi I(Q)/(8 pi²)`.

Projecting onto the nucleon and then converting to the archived potential convention gives `Caa_potential = +(8/9) mN fTG Cg`. Thus this contribution is negative, whereas the extra Higgs exchange is positive. No additional Dirac/Majorana factor or extra color multiplicity is inserted.

## Results at the frozen benchmark

At zero transfer, Cg=-3.12232e-17 GeV^-3, Caa_potential=-2.34549e-17 GeV^-2 and Ch_potential=1.45663e-14 GeV^-2. Their net change relative to the tree potential is +6.72206e-5. Values at Q=0.05 and 0.246 GeV are also recorded; the joint forecast below uses the same contact prescription as its parent so the comparison isolates these additions.

| Conditional central forecast | Before these insertions | With these insertions |
|---|---:|---:|
| Raw xenon count, 5.4–269.9 keV, 2.84 tonne-years | 1.37450164 | 1.37459954 |
| Independent-free-nucleus local exponent upper estimate | 2.17972302e-29 | 2.17999720e-29 |

The scalar rate keeps interference with the tree amplitude and drops squares/products of corrections. O6 is unchanged. These are partial-order forecasts, not a complete perturbative prediction or uncertainty band. Detector folding, full material response and boundary contrast are not supplied by these numbers.

## Matching boundary and remaining work

The previously calculated open up-quark box and the messenger local operators represent different retained EFT contributions. No full-theory gluon box has been added, so this assembly does not claim to have performed its subtraction. When that calculation is available, its hard coefficient must be extracted after subtracting EFT-reproduced pieces, including these insertions. The chosen contact integral extends loop momentum above the messenger scale; the remainder must be handled by hard matching and higher-dimension terms, not by declaring the integral an exact full-theory result.

The leading scalar trace projection here can be expressed below charm independently of the parent twist sector's prescribed four-flavor scale, because they are different operators. This does not resolve the parent twist matching ambiguity or provide higher-order scalar running. Restored up Yukawa, light-field normalization, hard contributions, finite heavy-mass corrections and renormalized model parameters remain open. The smallness of the calculated insertions does not bound these missing terms.

The [script](casimir-dp-axion-gluon-insertion-2026-09-07.py) authenticates its inputs and writes [the coefficients and paired forecasts](casimir-dp-axion-gluon-insertion-2026-09-07.json). Four checks pass: the standard single-heavy-flavor trace normalization, consistency of the extra Higgs fraction, insertion signs and recovery of the archived forecast. These checks do not independently establish the full two-loop sign or normalization. Physics root/leaf validation passes; no gate promotion or certificate claim.
