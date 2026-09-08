# Updated DUNE-site atmospheric flux comparison

Exploratory input comparison, September 7, 2026. This follows the [Honda Homestake archive](casimir-dp-neutrino-flux-intake-2026-09-07.md) and prepares the neutrino up-scattering rate calculation.

The [2026 primary paper](https://arxiv.org/html/2607.08310v1) links the [authors' data repository](https://github.com/JIECheng2021/atm_nu_flux_data). We pinned commit `f5a8bab508c6ad5874070f0f6b83409baa96d3d2`, reading the documented formats before parsing. The DUNE solar-minimum all-direction tables with and without muon propagation inside Earth are archived via the GitHub HTTPS contents API. Their original repository paths are `DUNE/solar-min_with-muon-in-earth/dune-ally-01-01-solmin.d` and `DUNE/solar-min_without-muon-in-earth/dune-ally-01-01-solmin.d`, stored locally as `dune-with.d` and `dune-without.d`. SHA256 values are enforced by the calculation. The source README is also archived.

These data contain 121 energy nodes from 0.01 to 10,000 GeV, with four species and the same per-area/per-time/per-steradian/per-GeV convention as the prior archive. DUNE and Homestake provide a geographically relevant comparison for LZ, but differences between releases are not assigned solely to one physical update. The local experiment's site remains unspecified.

Using the same log-log PCHIP integration and 4pi/10,000 unit conversion in each release:

| Lower incident energy | New integrated flux, cm^-2 s^-1 | New / Honda2014 |
|---|---:|---:|
| 1 GeV | 0.372345 | 1.02340 |
| 2.15847 GeV | 0.0944254 | 0.991734 |
| 8.26464 GeV | 0.00673985 | 0.965555 |
| 26.99082 GeV | 0.000608349 | 0.976770 |

The last three thresholds correspond to the preceding 248 keV free-nucleus screen. These flux ratios are not event-rate ratios or statistical uncertainties: cross sections weight energy, species and direction differently. Both integrations stop at 10 TeV, with no extrapolated tail or arbitrary few-GeV cutoff.

The two new variants agree exactly in every tabulated species at energies of at least 1 GeV. Thus the muon-propagation addition in these files does not change the flux range relevant to production of the benchmark 1–2 GeV state. The new-versus-old differences above those thresholds are modest and cannot justify a qualitative change without the actual interaction fold.

The [script](casimir-dp-neutrino-flux-update-2026-09-07.py) writes the [comparison and provenance JSON](casimir-dp-neutrino-flux-update-2026-09-07.json). Four checks pass: node counts, scenario grid equality, positive ordered data and nested flux integrals. Root/leaf validation passes. These checks establish numerical intake consistency, not a detector likelihood or a full flux uncertainty model.

Next is a flavor-explicit common rate model. A single produced state with a coupling vector is not automatically equivalent to a flavor-inclusive rate summed over unoscillated production fluxes. Specify the coupling/propagation matrix, or use an explicit degenerate final-state model whose inclusive coupling matrix is proportional to the identity. That choice must be applied to both xenon and carbon. The mediator mass must also be specified separately from the quoted coupling-to-mass ratio before using its finite-momentum propagator.
