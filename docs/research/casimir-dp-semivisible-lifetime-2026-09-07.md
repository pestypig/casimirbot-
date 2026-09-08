# Semivisible lifetime test at the strong product

Exploratory S1 variant, September 7, 2026. A tested light-sector example,
not an exclusion of all semivisible completions.

[Abdullahi et al.](https://arxiv.org/abs/2302.05410) show that visible daughter
decays can change missing-energy veto acceptance in multistate dark sectors.
Their GeV-scale phenomenology motivates a lifetime test; it does not supply
an allowed point for our 10 MeV mediator.

Define light Dirac fields eta1 and eta2 of masses 3 and 6 MeV, with vector
transition gD A_mu(eta1_bar gamma^mu eta2 + h.c.). The electron coupling is
epsilon e. Set the product to the heavy transport value 2.96223e-6. A full
gauge completion, light-species abundance and additional channels remain
unspecified. Both A -> eta1 eta2 and eta2 -> eta1 e+e- are kinematically open.

For the declared vector interaction, our spin-averaged tree calculation uses

    Gamma = alpha_eff²/(12 pi m2³) integral ds
      sqrt[(delta²-s)(Sigma²-s)] (delta²-s)(Sigma²+2s)
      * sqrt(1-4me²/s)(1+2me²/s)/(mA²-s)²,

where delta=m2-m1, Sigma=m2+m1, and 4me²<=s<=delta². The integrated electron
tensor is transverse; the result retains electron mass and the off-shell
propagator. It neglects additional channels and loop/width corrections.

The width is 5.65446e-18 GeV, giving proper decay length 34.90 m. For a
chosen 50 GeV parent, exact two-body kinematics gives daughter energy at
least 21.35 GeV, hence decay length at least 124.2 km. The probability of
decay within a chosen 10 m flight distance is at most 8.051e-5. Neither
the parent energy nor distance is asserted to be the full NA64 acceptance.

At fixed product, changing the split between epsilon and gD does not change
this tree width. The benchmark therefore does not automatically convert
an invisible search into a strongly vetoed semivisible topology. Another
mass spectrum or transition coupling would require a new shared matching,
decay and experimental-acceptance calculation.

Checks: the electron threshold closes correctly, finite electron mass
suppresses the width, and a separate heavy/small-gap massless test approaches
4 alpha_eff² delta^5/(15 pi mA^4), with ratio 0.998559. These checks support
the specified calculation, not a complete model or detector recast. The
script and JSON preserve the parent product hash and all diagnostic choices.
This example is deprioritized; no measurable shared model is established.
