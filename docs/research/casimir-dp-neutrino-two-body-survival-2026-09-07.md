# Outgoing-state two-body survival screen

Exploratory calculation, September 7, 2026. This audits a missing assumption in the [shared neutrino forecast](casimir-dp-neutrino-joint-2026-09-07.md): the produced state is not automatically stable or invisible.

## Width from the declared interaction

For a Dirac state with interaction y chi-bar PL nu phi+h.c. and m_chi>m_phi, the same vertex used in production allows chi -> nu phi. Neglecting neutrino mass, the spin-averaged amplitude squared is y²(m_chi²-m_phi²)/2. Two-body phase space gives

`Gamma_partial = y² m_chi/(32pi) (1-m_phi²/m_chi²)²`.

This is per outgoing Dirac flavor and its corresponding neutrino. There is no factor of three from the three orthogonal produced states, and no Majorana doubling. Total decay width can be larger if other channels exist. Hence the lifetime computed from this partial width is an upper bound for that parameter point, not proof that all channels have been included.

The mean laboratory flight distance is beta gamma hbar c/Gamma_partial. For a selected nuclear recoil T, the outgoing energy is E_nu-T. The survival probability for a prescribed straight path L is exp[-L/mean_length]; actual detector acceptance requires geometry and daughter transport.

## Consequential benchmark

At m_chi=2 GeV, m_phi=1 GeV and y=0.02:

- Partial width: 4.47623e-6 GeV.
- Proper decay length: 4.40833e-11 m.
- Mean flight at E_nu=10 GeV and T=248 keV: 2.15957e-10 m.
- Mean flight even at the tabulated 10 TeV endpoint: 2.20416e-7 m.

The 10 cm path used by the script is an illustrative length, not an inferred LZ event distance. It records log survival rather than rounding exponentially small probabilities into numerical artifacts. The particle decays promptly on detector scales for these couplings. This does **not** prove event rejection: the daughter mediator's decay, escape, deposited energy and timing remain uncomputed. The raw nuclear-recoil count must be labeled as production until those steps are modeled.

## Can coupling repartition preserve scattering but extend flight?

The production product is y yq=4e-4. Decreasing y at fixed product requires increasing yq. As a transparent perturbative-size diagnostic, impose |yq|<=sqrt(4pi); this is a chosen screen, not a rigorous theorem or experimental bound. The longest partial-width flight allowed by that screen is only 6.78450 micrometers at 10 GeV, or 6.92458 millimeters at 10 TeV.

A 10 cm mean flight would require yq about 430 at 10 GeV or 13.47 at 10 TeV, outside that screen. This calculation holds the production product and masses fixed; it does not exclude changes of masses, spectrum or interaction model. Moving near the two-body threshold suppresses this particular width but requires renewed spectral and off-shell-decay analysis.

For m_chi<=m_phi the script reports **two-body channel closed, stability undetermined**. It does not infer an infinite lifetime. Off-shell hadronic decays and other allowed channels must be evaluated. At GeV masses, a free-quark decay estimate alone is not a controlled replacement for the hadronic spectral function.

The [script](casimir-dp-neutrino-two-body-survival-2026-09-07.py) and [JSON](casimir-dp-neutrino-two-body-survival-2026-09-07.json) cover the scanned mass ordering and representative incident energies. Four checks pass: an independent explicit Dirac gamma-matrix trace reproduces the width, threshold closure, quadratic coupling scaling and preservation of the production product during repartition. Root/leaf validation passes. These are decay-calculation checks, not detector or model admission.

Next priority is the mediator decay/visible-cascade calculation for the open channel, and off-shell hadronic decay for the closed channel. Neither production counts near one nor failure of the source's simple spectral cuts supplies that detector classification. The LZ event remains unresolved and the shared-model goal stays open.
