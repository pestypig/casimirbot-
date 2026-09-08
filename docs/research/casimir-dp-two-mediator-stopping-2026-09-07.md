# Two-mediator stopping and supply screen — 2026-09-07

Exploratory S1 calculation with the same products normalized in the common
xenon/diamond packet. No extra coupling or capture fraction is fitted.

## Energy-loss moments

For y=q^2, the point-nucleus Born kernel is

`d sigma/dy = 4*pi*Z^2/v^2 * [sum_i alpha_i/(y+m_i^2)]^2`,

with the usual GeV^-2 to cm2 conversion. Integrate y from zero to 4 mu^2 v^2.
The first energy moment inserts E_R=y/(2m_A). Closed-form two-propagator
integrals include signed interference. Independent logarithmic quadrature
checks the first moment for Si28 and O16. The specified composition is one
Si28 plus two O16 with the previous mass-number column convention.

The incident particle has 335.0056 keV at 776 km/s. At a chosen integrated
path column 7e9 g/cm2:

| Mediator masses | Point-nucleus collision mean at initial speed | First-order mean energy loss (eV) |
| --- | --- | --- |
| 1 keV / 1 GeV | 71.087 | 0.03747 |
| 100 keV / 1 GeV | 0.007108 | 0.02120 |
| 10 MeV / 1 GeV | 6.21e-7 | 0.005713 |

For the first pair, the mean energy loss is about 1.12e-7 of initial kinetic
energy. The chosen path column is not authenticated Earth geology. Collision
means omit atomic screening and are not physical capture probabilities.
The smaller 4e5-g/cm2 diagnostic is also saved in JSON.

## Conservative rigid-elastic path-budget bound

For separately normalized nuclear and electron charge profiles,
|F_N-F_e|<=2. Thus a rigid-neutral elastic amplitude is bounded by twice the
point charge times the sum of absolute mediator amplitudes. While particle
kinetic energy remains above half its initial value, v>=v_initial/sqrt(2).
Use the initial maximum momentum endpoint and twice the initial inverse-v^2
prefactor. Together these bounds give an energy-loss drift at most eight times
the initial absolute-amplitude point-nucleus first moment, denoted S_abs.

Stop each history at first loss of half its initial kinetic energy or when its
accumulated path column reaches X. Positivity of energy transfers then yields

`P(lose at least K_initial/2 within X) <= min(1, 8*S_abs*X/(K_initial/2))`.

This is a conditional stopped-process expectation bound, not a claim that
all losses equal the mean. At X=7e9 g/cm2 it gives 2.84e-6, 2.06e-6 and
1.33e-6 for the three pairs. Losing half the energy is only a necessary early
step toward capture of this fast population, not sufficient capture.

The bound assumes stationary elastic targets, no acceleration or energy-gaining
collisions, and an imposed total path-column budget. The column is accumulated
along the trajectory, not inferred from vertical depth. It excludes electronic
or material excitations, collective response, different composition and longer
paths. It must not be advertised as a universal Earth-capture bound.

## Consequence for the joint prediction

The normalized rigid-elastic channel does not provide efficient slowing over
these specified path budgets. Its many forward collisions in the lightest
case cannot justify assigning the slow density required by the diamond screen.
The source-population problem therefore remains even after the improved xenon
spectral shape. A complete calculation must test additional physical energy-loss
channels and transport, then predict the local distribution rather than fit it.

Next assess whether inelastic electronic/material energy loss in this same
charge-coupled model can change the stopping budget. Preserve both mediator
products and screening. Do not reuse the old strong single-mediator attenuation
or infer thermal capture from the collision number. Detector selection and
external constraints remain additional, independent requirements.

Source hash, positive moments and analytic/quadrature checks pass. This is not
experimental validation, physical viability certification, an LZ exclusion or
a demonstrated measurable coherence signal.
