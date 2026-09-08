# Defined invisible-decay escape screen

Exploratory S1 variant, September 7, 2026. No admitted replacement model.

Add one 1 MeV Dirac particle with the same unit dark charge as the heavy
100 GeV species. Keep the 10 MeV mediator and scale-3.9 product
alpha_eff=2.96223e-6. This is a new particle-content assumption; its relic
abundance and local response have not been supplied. The two allowed decay
channels in this variant are the light Dirac pair and the electron pair.

For each Dirac channel, the vector width is alpha_channel*mA/3 times
(1+2r²)sqrt(1-4r²), with r=m_fermion/mA. Here alpha_channel is alpha_D for
the dark pair and alpha_EM*epsilon² for the electron pair. Matching the
heavy scattering product imposes alpha_D=alpha_eff²/(alpha_EM*epsilon²).

Restrict this screen to alpha_D<=0.1 and epsilon<=0.01. Thus epsilon is
at least 1.09657e-4, and the maximum width/mass is 0.03331. This declared
narrow-width scope does not settle alpha_D>0.1.

The pinned DarkCast NA64_NA642019imj table represents the
[2019 NA64 missing-energy search](https://arxiv.org/abs/1906.00176).
Its metadata uses a 99% invisible branching fraction and unchanged
invisible-search efficiency. At 10 MeV the larger of linear and logarithmic
interpolation gives epsilon_limit=3.30236e-5. The inferred rate comparison is

    R = epsilon² BR_invisible / (epsilon_limit² * 0.99).

At epsilon=1.09657e-4, 0.001 and 0.01, the ratios are 11.14, 926.2 and
87320 respectively. Invisible branching spans approximately 1 to 0.9428.
Writing epsilon² BR = x*k/(k+x²), where x=epsilon² and k is fixed by the
product and phase-space factors, proves monotonic increase over this domain.
The endpoint therefore gives its minimum, rather than three points alone
claiming continuous coverage.

This is a conditional yield screen assuming prompt invisible decay, escape
of the daughters and unchanged missing-energy acceptance. No full finite-width
or efficiency recast was executed, and no new confidence level is assigned.
The older published contour suffices for this test; it is not presented as
the latest NA64 limit. A broader mediator, semivisible chain or different
light charge requires a new calculation.

Disposition: this simple narrow-width invisible completion is not a supported
escape from the laboratory constraint. It should not receive a new detailed
coherence or LZ fit on the basis of invisible branching alone. Script and
JSON preserve the coupling relation, width assumptions, contour/parent hashes
and pinned release. The measurable shared-model objective remains open.
