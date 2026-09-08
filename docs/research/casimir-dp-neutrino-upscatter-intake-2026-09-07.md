# New competing lead: atmospheric-neutrino up-scattering

Exploratory intake, September 7, 2026. This is a new incident-population branch, not a replacement for the frozen apparatus or an established explanation of the LZ candidate.

## Primary-source intake

[Jeesun and Majumdar, 2609.04185v1](https://arxiv.org/html/2609.04185v1), proposes a scalar-mediated transition from an incident neutrino to a heavier particle, with quark couplings. The produced particle need not be dark matter. We therefore classify this as a competing nuclear-recoil explanation and potential coherence mechanism, not evidence for a common dark-matter population.

The paper fixes its 202–296 keV expectation to one event. Its Figure 2 caption uses a low-window requirement of 10^-3 times background, whereas equation 10 uses 10^-4. These choices do not supply an authenticated LZ likelihood or justify importing the plotted confidence label. Its upper recoil boundary also differs from the 269.9 keV boundary in our archived calculation. Its discussion of a few-GeV neutrino cutoff must be separated from a flux that merely decreases at higher energies. These source issues are retained as unresolved, not silently repaired by fitting.

## Independent exact kinematic screen

For a massless incident neutrino, stationary free nucleus of mass M, final particle mass m, and recoil T, energy-momentum conservation gives

`E_min(T) = (m²+2MT)/[2(sqrt(T²+2MT)-T)]`.

The absolute production threshold is `m+m²/(2M)`. Our independent implementation computes the recoil endpoints from the two-body center-of-mass invariant and checks that E_min maps back to an endpoint. The lower endpoint is rationalized to prevent subtractive cancellation at high incident energy.

| Produced mass | Incident energy needed for 248 keV in Xe131 | Same recoil in C12 |
|---|---:|---:|
| 1 GeV | 2.15847 GeV | 6.77572 GeV |
| 2 GeV | 8.26464 GeV | 26.99082 GeV |

At incident energy 10 GeV and produced mass 2 GeV, the minimum free-nucleus recoil is 167.705 keV in xenon and 1860.79 keV in carbon. This already predicts a substantially different target response without changing the mediator or incident spectrum. It does not mean the carbon process is kinematically forbidden: its total production threshold is only 2.17897 GeV, with the allowed recoil moving to a different range.

For increasing incident energy, the lower recoil endpoint behaves as `m^4/(8 M E_nu²)` and tends to zero. Thus a falling atmospheric flux is not an exact lower-recoil cutoff. A low-energy tail must be integrated with a real flux, nuclear response and detector acceptance. These conclusions are our kinematic calculations; no source normalization is accepted to obtain them.

The [script](casimir-dp-neutrino-upscatter-intake-2026-09-07.py) and [24-row JSON](casimir-dp-neutrino-upscatter-intake-2026-09-07.json) cover Xe131, C12 and C13 at two produced masses and four incident energies. Four checks pass: endpoint inversion, the massless elastic limit, the asymptotic low-recoil tail and threshold ordering. Endpoint energies far above nuclear binding scales are mathematical free-nucleus results, not a claim that coherent elastic nuclear scattering remains unsuppressed there.

## Joint-model next steps and priority

This lead escapes the heavy *halo-particle* incident-energy restriction by supplying relativistic neutrinos. It does not escape incident-flux accounting, shared coupling normalization, nuclear form-factor suppression, or boundary cancellation. The local coherence response must use the incident neutrino momentum and the unobserved outgoing massive state, including event loss; the earlier elastic dark-matter kernel cannot simply be relabeled.

Priority is a source-authenticated atmospheric flux with flavor, neutrino/antineutrino and site/angular conventions, followed by a common xenon/carbon rate calculation. Quark scalar conventions, mediator mass separately from coupling product, outgoing-particle lifetime and detector survival also need specification. Any constraints claimed by the paper require independent inspection. Keep both conflicting low-window cuts as sensitivity choices if they are examined; neither becomes a confidence criterion. The existing axion model remains a small-signal completion branch while this alternative undergoes screening.
