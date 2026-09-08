# Heavy-current boundary sensitivity

Exploratory research snapshot, September 7, 2026. The previous goal turn made progress by recording the selected four-quark weak-scale terms. This packet tests an omitted high-energy boundary contribution without changing the frozen apparatus or microscopic reference point.

## Finding

Including the pure-Higgs/messenger quartic current boundary changes the selected imaginary kaon coefficient by **-0.0817606%**, from 2.70686138892e-15 to **2.70464824199e-15 GeV^-2**. This exceeds the isolated qu and qq matching shifts just recorded, but remains small at this point. It is not a complete kaon observable, an uncertainty band, or evidence that every omitted effect is small.

## Boundary and order accounting

At mu=M, the U contributions in [Crivellin et al., v2, Eqs. S.3.7–S.3.8](https://arxiv.org/pdf/2204.05962) give, for the declared up-aligned, top-only approximation:

`delta Cphiq1 = -17 yL^4 Pu/(256 pi^2 M^2)`;

`delta Cphiq3 = +9 yL^4 Pu/(256 pi^2 M^2)`.

The mixed top-Yukawa contractions vanish by the orthogonality of Pu and Pt. This does not apply to arbitrary flavor alignment or to nonzero light up-quark Yukawa couplings. The sum of the corrections is -8 times the common factor; tree-level Cphiq1+Cphiq3=0 is not maintained by these terms alone.

Their relative changes to the individual tree currents are -0.107654% and -0.0569932%. Feeding a one-loop current boundary into one-loop flavor evolution/matching samples higher-order effects. It does not supply all contributions at that order. In particular, no separate double counting of the previously matched heavy box is introduced.

## Reproducibility and limitations

The [script](casimir-dp-axion-uv-current-sensitivity-2026-09-07.py) authenticates and loads preceding definitions only. It changes the initial currents in memory, recomputes the coupled response and selected weak-scale terms, and writes [results](casimir-dp-axion-uv-current-sensitivity-2026-09-07.json). Three checks pass: integration tolerance, top-alignment contraction and the current-sum identity. Archived inputs are unchanged. The root-leaf documentation check also passes; it is not physical validation.

No bosonic boundary terms, complete gauge corrections, light-pseudoscalar matching, two-loop finite flavor terms, or low-energy QCD observable conversion have been added. The source covers the pure-Higgs/messenger sector, not the additional light A interaction. The measured coefficient shift therefore cannot be used as a bound on those omissions.

## Next priority for the joint model

The coefficient evolution currently uses a prescribed QCD-only trajectory for the top Yukawa coupling while retaining top-Yukawa terms in the Wilson-coefficient equations. The omitted top self-interaction in that SM trajectory affects the source throughout the scale interval. Audit and integrate a consistent top/QCD trajectory next, with boundary values and perturbative order explicit; then compare the general-flavor matching independently. This is more informative than inferring a precision claim from the small isolated boundary shift.

The xenon/coherence prediction and earlier local-null conclusion are unchanged. No shared-model admission, revised flavor bound or experimental validation follows. Goal remains active.
