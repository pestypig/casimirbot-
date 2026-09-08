# Low-mass dipion decay slice for the neutrino-produced state

Exploratory calculation, September 7, 2026. The [two-body audit](casimir-dp-neutrino-two-body-survival-2026-09-07.md) left m_chi<=m_phi benchmarks stability-undetermined. This packet evaluates a specific off-shell decay contribution rather than treating that closed channel as stability.

## Interaction and approximation

Retain the same ychi chi-bar PL nu phi and equal up/down scalar coupling yq as in the shared production calculation. At leading order in the isospin-symmetric chiral expansion, replacing the quark-mass spurion by Mq-yq phi I gives a pion interaction B0 yq phi pi_a pi_a. The physical phi-pion-pion vertex is g=2B0 yq. This is an up/down scalar source, not the full Higgs source with strange and heavy-flavor gluon contributions.

Use a common pion mass 139.57039 MeV and B0=m_pi²/(mu+md)=2.85210743 GeV with the previously declared quark masses. This uses the same mass convention as production rather than silently importing the axion branch's independent B0 sensitivity input. Charged/neutral pion mass splitting is neglected.

For s equal to the squared dipion invariant mass, adding charged and neutral pairs (with the identical-particle factor for the latter) gives

`dGamma/ds = 3 ychi² yq² B0² (m_chi²-s)² sqrt(1-4m_pi²/s) / [256 pi³ m_chi³ (m_phi²-s)²]`.

This is also recovered from two-body phase-space factorization: Gamma(chi->nu phi*(s)) times sqrt(s) Gamma(phi*(s)->pions), divided by pi times the squared propagator denominator. The script verifies that representation independently with a different integration variable. Mediator widths are neglected away from a pole; all integrated slices lie below the mediator pole.

Only the interval 2m_pi<=sqrt(s)<=0.35, 0.45 or 0.5 GeV is integrated. These are diagnostic cut choices, not three uncertainty bounds. In particular, extending toward scalar pion rescattering features requires dispersive input. [Winkler's analysis](https://arxiv.org/abs/1809.01876) discusses the failure of simple chiral/partonic treatments around GeV masses and supplies a route through meson form factors. Its full Higgs-mixed scalar widths are not substituted for this nonuniversal source.

## Narrow-slice results

For sqrt(s)<=0.35 GeV, ychi=yq=0.02 m_phi/GeV, and incident E_nu=10 GeV with recoil 248 keV:

| Produced / mediator mass, GeV | LO partial width, GeV | Mean lab length inferred from this slice |
|---|---:|---:|
| 1 / 1 | 9.58801e-12 | 0.204769 mm |
| 1 / 10 | 7.71490e-12 | 0.254485 mm |
| 2 / 10 | 1.82300e-11 | 0.0530268 mm |

If this partial-width approximation is valid, omitted positive decay channels only shorten these lengths. However, the LO matrix element has unquantified hadronic corrections, so these numbers are **not error-qualified lower bounds on the physical width or upper bounds on the physical lifetime**. They are evidence that stable escape needs justification even when the two-body channel is closed. Actual detector path lengths, boosts, pion transport and selection efficiency remain uncomputed.

The partial width depends on (ychi yq)². Redistributing the couplings at fixed product therefore leaves it unchanged at this order, unlike the on-shell two-body width. Altering the production strength, masses or mediator structure is a different model trajectory and must be applied to both target predictions.

## Evidence and next step

The [script](casimir-dp-neutrino-dipion-slice-2026-09-07.py) and [nine-row output](casimir-dp-neutrino-dipion-slice-2026-09-07.json) pass four checks: phase-space factorization with independent integration variable, positive slice widths, fixed-product repartition and the chiral mass identity. Root/leaf validation passes. These checks establish arithmetic and convention consistency, not the accuracy of LO hadronic physics.

Next is the relevant scalar pion form factor with uncertainty and its use in the outgoing-state/cascade response. Neither open- nor closed-two-body branches now justify an unqualified stable-invisible final-state assumption. The raw joint scattering forecasts remain production diagnostics pending that response; no detector exclusion or shared-model admission is claimed.
