# Active-neutrino survival condition for the shared exothermic benchmark

Status: exploratory conditional calculation. Previous goal turn made progress by distinguishing a near-constant radiative normalization offset from ordinary rounding. This packet advances the separate missing-channel requirement; it neither repairs that offset nor changes frozen target inputs.

## Operator and normalization

Define L = sum_i Cnu_i J_dark^mu (nu_bar_i gamma_mu PL nu_i), with PL=(1-gamma5)/2 and the same off-diagonal vector dark current used by the nucleon contact Cb. Cnu_i is the coefficient of PL, not of (1-gamma5). Neutrino masses are negligible at the selected MeV splittings. At leading order in gap/mchi and for a constant contact,

Gamma_nunu = gap^5 sum_i |Cnu_i|^2 / (120 pi^3).

This is derived from the existing massless vector-pair width C^2 gap^5/(60 pi^3): the left-chiral symmetric trace is half the vector trace. The companion script explicitly checks the time-current Dirac trace at four distinct angles. The antisymmetric term cannot contract with the leading symmetric dark tensor. The vector-pair normalization is consistent with the dark-photon result in [the JSNS2 study, Appendix A](https://lss.fnal.gov/archive/2018/pub/fermilab-pub-18-148-a.pdf), after translating its couplings. The chiral generalization and population calculations here are our derivations, not a quoted neutrino constraint.

## Abundance and common strength

Hold coupling ratios r_i=Cnu_i/Cb fixed while varying x=sigma_p/(1e-45 cm^2). Let tau0=60 pi^3 hbar/(Cb_ref^2 gap^5). With no replenishment, fixed age t=4.35e17 s, and initial fraction f0, the present common rate multiplier is S=x f0 exp(-b x), where b=(t/tau0) sum_i |r_i|^2/2. For b>0 its maximum is f0/(e b). This optimizes the scattering/population tradeoff; simply increasing the cross section does not evade it. At zero coupling there is no neutrino-depletion ceiling. Additional independent decay widths can only reduce this ceiling for the stated history. Conversion, replenishment, evolving parameters and halo populations require a different abundance calculation.

For three equal active-flavor coefficients and the most permissive f0=1, recovering the selected reference S=1 requires:

| Dark mass (GeV) | Maximum coupling ratio per flavor |
|---|---|
| 10 | 1.28683e-5 |
| 15 | 3.32713e-5 |
| 40 | 2.64028e-4 |
| 100 | 1.20492e-3 |

For f0=1/2 multiply these limits by 1/sqrt(2). These are necessary conditions for the selected normalization, not confidence limits on LZ or a measured dark-matter cross section. Raw xenon reference counts remain unfolded predictions with unresolved detector likelihood. The selected normalization is not an LZ fit.

As a sensitivity test only, setting all r_i=alpha/(4 pi) yields maximum S=0.206723 at 40 GeV and 4.30534 at 100 GeV. Thus this hypothetical neutrino coupling would prevent the former from recovering the reference strength under this history; the latter is not rejected by this condition alone. The baryonic electron-loop benchmark does NOT imply these neutrino couplings. Photon mixing, hypercharge mixing and direct active-neutrino charges must be matched separately. If matching changes proton/neutron coefficients, the xenon and carbon responses must also be recalculated.

The same S multiplies both archived target rates under the fixed-shape assumptions. Neutrino survival cannot amplify the local coherence signal independently of xenon, and does not remove four-cell cancellation. Mediator matching and production/conversion evolution are the next missing requirements.

## Reproduction and scope

Run `python docs/research/casimir-dp-exothermic-neutrino-survival-2026-09-07.py`. Source SHA, chiral trace and an independent numerical maximization are checked. Research documentation validation also passes; none of these checks establishes physical viability or a completed model. No warp/GR runtime or certificate changes.
