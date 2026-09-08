# Replenishment: kinematic screen and source floor

Exploratory necessary conditions. Previous turn made progress by calculating real-vector decay and the maximum lifetime allowed by a selected ordinary-matter coupling cap. This packet asks whether a replenished excited population can repair the scanned light-mediator model. It does not assume such a source exists.

## Cold halo cannot supply the excitation energy

Use the same hard Galactic escape speed 544 km/s and Earth-frame shift 250.2 km/s as the target calculation. Two ground-state halo particles have relative speed at most 1088 km/s; their center-of-mass kinetic energy is m vrel^2/4. Single excitation needs gap, double excitation needs 2gap. The single-excitation relative thresholds are 3007.28 km/s (40 GeV) and 1407.81 km/s (100 GeV), both above the cap. Double excitation is even less accessible. This conclusion holds independently of the self-scattering cross section for the stated velocity support.

For an initially stationary free ordinary target, the available relative energy is mu v^2/2 <= m v^2/2. Even the infinite-target-mass upper value at 794.2 km/s is below the gap for both pilots. Thus ordinary stationary-target upscattering cannot replenish them from this halo either. This does not cover cosmic rays, sufficiently hot targets, nuclear de-excitation, compact-object acceleration, or unbound dark matter. A source with a different velocity distribution requires a new xenon spectrum and transport calculation.

[Emken et al.](https://arxiv.org/abs/2112.06930) provide a concrete terrestrial-upscattering framework that predicts the excited density and velocity distribution. Its existence is a useful lead, but it does not bypass the above energy thresholds for our different MeV-gap benchmarks. Its XENON1T electron-recoil interpretation is not an LZ nuclear-recoil fit.

## Source strength cannot be reduced by rescaling the scattering coupling

At the generous gB cap 4pi, the previous packet gives tau(x)<=tau_ref/x, where x scales the squared coupling product relative to the xenon-normalized reference. To recover the selected xenon strength S=x f=1 requires f=1/x, hence x>=1. In a locally stationary population, the gross excitation source must balance decay: R>=n f/tau>=n/tau_ref, with n=rho/m. This necessary source floor is independent of x. Outflow or additional losses would increase the required production; inflow moves the production requirement upstream and needs explicit transport.

| Dark mass | Mediator | Minimum source (cm^-3 s^-1) | Gross gap-energy throughput (W/m^3) | Maximum halo decay length at reference |
|---|---|---|---|---|
| 40 GeV | 1 MeV | 3.696e-7 | 5.958e-14 | 1.612e10 m |
| 40 GeV | 1 keV | 268.0 | 4.321e-5 | 22.22 m |
| 40 GeV | 1 eV | 2.680e8 | 43.21 | 22.22 micrometres |
| 100 GeV | 1 keV | 12.94 | 1.143e-6 | 184.16 m |
| 100 GeV | 1 eV | 1.294e7 | 1.143 | 184.16 micrometres |

Lengths use the frozen maximum Earth-frame halo speed and the most favorable reference lifetime. Increasing x shortens them; they are not distances for relativistically boosted particles. The energy column is R*gap, a gross excitation energy turnover. It is NOT automatically deposited heat or a minimum external power: inverse absorption or recycling of emitted vectors could supply some excitations. Such a mechanism requires coupled vector/ground/excited distributions and cannot be inferred from this arithmetic.

These results reject cold-halo ground-ground and stationary-free-target replenishment for the two pilots. They do not establish an all-source no-go. A viable source would need its own rate, spatial distribution, energy supply or recycling, and resulting velocity spectrum while preserving the xenon normalization. In particular, microscopic decay lengths make a remotely prescribed slow halo population inappropriate for the eV mediator entries without a local transport solution.

Next priority: evaluate whether inverse-vector absorption can be sustained in a physically specified dark radiation bath, or move to a completion with stable-state local scattering and a separate, derived origin for xenon events. Do not claim either lead works before its production and target spectra are calculated.

Reproduce with `python docs/research/casimir-dp-replenishment-floor-2026-09-07.py`. Upstream hash is authenticated and the coupling-scaling cancellation is checked at four strengths. Kinematic tests use explicit energy conservation. Root-leaf validation is a documentation check, not an experimental certificate. No runtime/GR/certificate changes; no model admission.
