# Four-quark weak-scale matching diagnostic

Exploratory snapshot, September 7, 2026. Shared-scattering goal remains active; frozen apparatus and microscopic reference inputs are unchanged.

## Result

The added J and K four-quark terms shift the previous partial imaginary Hamiltonian coefficient by **-0.0262563%**, to **2.70686138892e-15 GeV^-2**. J contributes -4.99278760957e-21 and K contributes -7.05915646967e-19 GeV^-2. This is a selected weak-scale coefficient, not an epsilon_K prediction, allowed region, or common-model admission.

## Flavor treatment

The starting formula is Eq. 2.24, with loop functions in Eqs. 2.30–31, of [Endo, Kitahara and Ueda, v2](https://arxiv.org/pdf/1811.04961). The following projector completion is our derivation, rather than a formula quoted verbatim from that source.

In the down-doublet basis, the upper component is u'_a = sum_r V*_{ra} u_r. A barred upper-component index a and unbarred index b therefore project onto the top with V_ta V*_{tb}=Pt_ba. Consequently, the top-pair slots in the J bracket are contracted as

`Tij = sum_ab Pt_ba [C1_ijab + C1_abij - C3_ijab - C3_abij + 2 C3_ajib + 2 C3_ibaj]`.

The corresponding contribution is `-8 pref Pt_ij Tij J`, where pref=g2^2/(16 pi^2). Simply selecting index 3 in a down-basis tensor would select the bottom-associated doublet rather than perform this top projection. The crossed terms have their barred and unbarred top slots rotated in the same manner.

For Q=Cqq1+Cqq3, the external-leg contraction is

`Wij = sum_m [Pt_im (Q_mjij + Q_ijmj) + Pt_mj (Q_imij + Q_ijim)]`.

Its contribution is `2 pref Wij K`. All tensors and the projector use the same down-quark basis. The previous qu contribution is retained with a diagonal right-handed-up basis.

## Checks and reproducibility

The [script](casimir-dp-axion-qq-matching-2026-09-07.py) authenticates the preceding script and loads definitions without its output driver. The [JSON](casimir-dp-axion-qq-matching-2026-09-07.json) records both tolerances and four passing checks:

- J and K separately transform with the required squared external flavor phase under a nontrivial diagonal rephasing of every tensor and Pt.
- The explicit K logarithm cancels the local top-Yukawa external-leg running of the tree coefficient: the latter is -yt^2 Wij/(32 pi^2), while d(delta H_K)/d ln(mu)=2 pref Wij x/8. This tests that component only, not cancellation of every matching-scale dependence.
- Tightening integration rtol from 1e-7 to 1e-9 preserves the assembled selected coefficient within 1e-8 fractionally.

Rephasing covariance is necessary but does not independently prove every diagram, finite constant, or perturbative truncation. The top-projector derivation still merits comparison with an independent general-flavor matching implementation.

## Implication and next work

These additions are small at the frozen matching scale and do not by themselves remove the previously found flavor tension. Their isolated size is not a scale-independent uncertainty bound. The imposed QCD-only SM trajectory, restricted high-energy boundary and selected top matching remain approximations. Finite high-energy current/bosonic terms, light-mediator effects, consistent low-energy QCD and observable conversion remain outstanding.

Next, audit the omitted high-energy boundary terms by perturbative order and parameter size, and independently check the general-flavor matching before using this coefficient to update the shared xenon/coherence parameter screen. No effect on the local coherence prediction has been inferred from this kaon-only calculation.
