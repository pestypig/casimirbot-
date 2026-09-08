# Experimental-response refresh and exothermic lead

Exploratory snapshot, September 7, 2026. The preceding momentum calculation was progress; this packet returns to experimental qualification and records a new competing mechanism.

## Detector evidence

The [LZ abstract](https://arxiv.org/abs/2609.02823) links release DOI 10.17182/hepdata.182472.v1. This session's DOI fetch returned 404; a direct Python request to the HEPData record with format=json returned 403. No numerical release was authenticated. These access failures do not establish that no release exists.

[LZ supplemental Figure S2 and equation 3](https://arxiv.org/html/2609.02823v1) specify an energy-dependent efficiency and a simultaneous extended likelihood in S1c/log10(S2c) for science and veto samples. The stated 5.4 and 269.9 keV values are 50%-efficiency crossings, not hard true-energy acceptance boundaries. A response convolution must allow migration and tails beyond those diagnostic integration limits. The previous raw-window counts remain useful comparisons but are neither accepted yields nor strict bounds on accepted yields. Required inputs are the efficiency/response with uncertainty, signal and background densities, event coordinates, and correlated veto/rate nuisance treatment. No absent background is set to zero.

## New primary lead

[Dent and Newstead, September 4](https://arxiv.org/html/2609.04673v1), examine exothermic down-scattering. Their illustrative fit assumes zero background; its sideband interpretation extends an efficiency plateau. Those assumptions prevent importing its confidence region as the LZ likelihood. The lead requires an excited-state population and sufficiently long lifetime; electron-coupled decay channels are a concern at MeV splitting. It supplies a distinct energy source for both targets and merits an independent screen.

## Two-target calculation

The [script](casimir-dp-exothermic-lead-screen-2026-09-07.py) and [JSON](casimir-dp-exothermic-lead-screen-2026-09-07.json) set a diagnostic zero-speed xenon recoil at 248 keV and carry the same splitting to free carbon. With reduced mass mu, E0=mu |delta|/mA. At maximum speed v the nonrelativistic endpoints are `mu² (sqrt(v²+2|delta|/mu) +/- v)²/(2 mA)`. Substitution independently recovers vmin=v at both endpoints and vmin=0 at E0.

| Dark mass (GeV) | Released splitting (MeV) | Carbon12 E0 (MeV) |
|---|---|---|
| 10 | 3.2810 | 1.5495 |
| 15 | 2.2700 | 1.3009 |
| 40 | 1.0063 | 0.7865 |
| 100 | 0.5513 | 0.4959 |

These are leading nonrelativistic free-nucleus results, using a mean xenon mass, not an isotope-summed fit. Unlike the previously screened endothermic cases, carbon is kinematically open. Its recoils are energetic: a local calculation must track energy deposition, damage/loss and retained-event coherence rather than assuming soft coherent whole-object scattering. Kinematic access alone does not imply an appreciable rate.

Next specify one off-diagonal mediator/coupling and excited-state fraction, compute both target rates without one-event normalization, then test lifetime, transport and independent constraints. This lead joins the comparison; it does not replace the axion completion work or alter the frozen apparatus. Script checks and root-leaf validation pass. Goal remains active.
