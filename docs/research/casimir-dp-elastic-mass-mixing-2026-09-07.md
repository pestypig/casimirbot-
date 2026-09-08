# A derived elastic companion: two-state mass mixing

Exploratory structural calculation. Previous turn made progress by bounding the single exothermic light-mediator class. This packet checks a distinct elastic channel from the same dark current, without assigning an independent apparatus coupling.

## Primary lead and model boundary

[Not-so-inelastic Dark Matter, equations 7–10 and Appendix A](https://arxiv.org/html/2405.08081v2) supplies a concrete mass-mixing framework. Unequal Majorana terms generate diagonal axial couplings alongside the off-diagonal interaction; a further physical phase generalizes the model. Its published allowed regions and dark-photon target couplings are not directly applicable to our baryonic benchmarks. The dark-sector charge rotation is reusable, while the baryonic anomaly-canceling completion remains open.

## Independent matrix derivation

In a left-handed two-Weyl basis use mass matrix [[mL,mD],[mD,mR]] and charge matrix diag(1,-1). All entries are real for this audit. Define a=(mL-mR)/2 and D=sqrt(mD^2+a^2). On the branch with one negative signed eigenvalue and mL+mR=d>0, physical masses are D-d/2 and D+d/2. Rephase the negative eigenstate to obtain positive Majorana masses; this changes phases, not the coupling magnitudes below.

The rotated diagonal charge magnitude is |a|/D and the off-diagonal magnitude is mD/D. Their ratio is |a/mD|. Thus equal Majorana terms give zero diagonal gauge coupling at tree level, while unequal terms give a correlated companion. In four-component notation the diagonal Majorana vector current vanishes; the surviving diagonal current is axial. With a vector nuclear current its coherent low-velocity response is not the previously computed off-diagonal vector-vector response. No elastic rate is obtained by merely multiplying the old inelastic spectrum by the squared charge ratio.

For same-sign nonnegative mL,mR, |a|<=d/2. With the ground mass identified as m and D=m+d/2, the maximum ratio is d/sqrt(4D^2-d^2):

| Ground mass (GeV) | Maximum diagonal/off-diagonal gauge coupling |
|---|---|
| 10 | 1.64023e-4 |
| 15 | 7.56611e-5 |
| 40 | 1.25780e-5 |
| 100 | 2.75650e-6 |

The prior rate calculations used the common heavy mass at leading gap/m order; this exact mass assignment does not change their claimed approximation order. These are coupling bounds in a specified mass branch, not decoherence bounds.

## Why a small gap alone is insufficient

The companion script also constructs a deliberately different signed branch with a=0.1D, mL=d/2+a, mR=d/2-a, and mD=sqrt(D^2-a^2). Direct diagonalization preserves exactly the same two physical masses while giving |a/mD|=0.1005038. One Majorana mass is negative in this real convention, corresponding to a different relative phase after field redefinitions. This explicitly demonstrates why a small observed splitting alone cannot universally bound the diagonal coupling. It does not establish radiative stability, production, cosmological viability or a successful local signal for that alternative.

## Next calculation and acceptance requirement

A concrete same-sign pilot can use a=d/4 (mL=3d/4, mR=d/4), which fixes the companion coupling by the matrix rather than fitting it to coherence. Calculate its axial-dark/vector-target elastic kernel, including spin averaging and the low-momentum sphere form factor. The halo ground/excited fractions must remain tied to production/survival; they cannot be adjusted separately for the two experiments. Include dark Higgs exchange and loop elastic terms only with their own derived couplings and consistent order counting. The axial coupling’s smallness does not by itself settle the light-mediator/whole-object response, so the required calculation remains open.

Reproduce with `python docs/research/casimir-dp-elastic-mass-mixing-2026-09-07.py`. Checks authenticate frozen scattering inputs, independently diagonalize the mass matrix, rotate the charge matrix and verify its squared identity and analytic coupling ratio. The script produces no local prediction or model admission. Root-leaf documentation validation is separate; no GR/runtime/certificate changes.
