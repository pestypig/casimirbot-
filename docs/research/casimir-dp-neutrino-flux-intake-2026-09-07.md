# Homestake atmospheric flux intake

Exploratory input acquisition, September 7, 2026. The [neutrino up-scattering lead](casimir-dp-neutrino-upscatter-intake-2026-09-07.md) now has reproducible site-relevant flux tables. No event-rate fit or local prediction has been inferred from these fluxes alone.

The [Honda publisher index](http://www-rccn.icrr.u-tokyo.ac.jp/mhonda/public/nflx2014/index.html) identifies Homestake annual-average, no-mountain tables for solar minimum and maximum. We retrieved both all-direction averages and the 20-zenith-bin solar-minimum table. The archived header specifies columns E_nu, nu_mu, antinu_mu, nu_e, antinu_e, with flux units m^-2 s^-1 sr^-1 GeV^-1. The numerical grid has 101 energies from 0.1 to 10,000 GeV.

The HTTPS endpoint failed certificate-name validation; retrieval succeeded through the publisher's HTTP endpoint without disabling certificate checks. [Archived files](casimir-dp-neutrino-flux-intake-2026-09-07/index.html) and the [JSON manifest](casimir-dp-neutrino-flux-intake-2026-09-07.json) pin retrieved bytes by SHA256. This gives reproducibility, not cryptographic publisher authentication. No digital signature is claimed.

The all-direction average remains per steradian. For an isotropic target total-rate fold, convert the species sum using 4pi/10,000 to cm^-2 s^-1 GeV^-1. No extra velocity factor belongs in a neutrino flux fold. Independently averaging the 20 equal-width zenith bins reproduces the published all-direction table to 4.511e-5 relative, consistent with rounded tabulated precision. A direction-sensitive coherence calculation must retain angular information.

Our log-energy/log-flux PCHIP integration, with quadrature split at every table knot, gives the following solar-minimum integrated four-species fluxes up to 10 TeV:

| Lower energy | Integrated flux, cm^-2 s^-1 |
|---|---:|
| 1 GeV | 0.363831 |
| 2.15847 GeV, Xe 248 keV threshold for m=1 GeV | 0.0952124 |
| 8.26464 GeV, Xe threshold for m=2 GeV | 0.00698028 |
| 26.99082 GeV, C12 threshold for m=2 GeV | 0.000622817 |

These integrals are incident flux, not scattering rates or a xenon/carbon rate ratio. Flux above 10 TeV is omitted, not assumed identically zero; its weighted contribution must be assessed in the event fold. There is no artificial few-GeV upper cutoff.

The four production columns do not supply an oscillated flavor-resolved density matrix or a tau-neutrino component at the detector. Summing them can serve a flavor-inclusive calculation only with an explicit interaction/propagation prescription that makes that sum appropriate. Equal verbal labels for couplings are insufficient if amplitudes interfere into the same final state. Otherwise retain oscillations, flavor weights, neutrino/antineutrino differences and any sterile-state losses. Homestake is a reasonable LZ-site input; the proposed local experiment's geographical site is still unspecified and must not silently inherit Homestake as a measured condition.

The [script](casimir-dp-neutrino-flux-intake-2026-09-07.py) checks hashes, positivity, grid order, solar-grid identity and angular-average consistency. All four reported checks and root/leaf validation pass. No complete interpolation uncertainty is assigned.

A separate [July 2026 calculation](https://arxiv.org/html/2607.08310v1) links a [public data repository](https://github.com/JIECheng2021/atm_nu_flux_data), including a DUNE-site calculation. That release is a next cross-check; its numbers have not been mixed with this archive. Next work is to pin its relevant tables, compare the GeV range and then fold a clearly specified common interaction into both targets.
