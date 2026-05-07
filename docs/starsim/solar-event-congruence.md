# StarSim Solar Event Congruence

This layer does not change `stellar_spectral_viability`.
`M0_planck_atmosphere`, `M1_lattice_emissivity`, `M2_mechanoluminescent_pressure`, and `M3_coherence_angular` remain continuous spectral models.

## Continuous Spectrum Claim

`M1_lattice_emissivity` is a continuous spectral redistribution model.
It modifies the Planck-derived base spectrum with a normalized lattice kernel and then renormalizes the result to the same target flux.
It does not emit timestamped photons, does not sample photon counts, and does not add quantum packet energy.

Correct claim:

> StarSim compares a continuous Planck atmosphere against a lattice-modulated emissivity spectrum.

Incorrect claim:

> StarSim models Planck energy emitted in discrete quanta packets.

Packetized photons are handled after spectral prediction by `stellar_packet_measurement`.
That lane applies `E_gamma(lambda) = h c / lambda`, converts calibrated spectral flux into expected photon counts for an exposure and collecting area, and optionally samples Poisson counts.
It is a measurement simulation of an existing continuous spectrum, not a new radiation source.

## Mechanism Stack

| Layer | Role | Claim tier |
| --- | --- | --- |
| `stellar_spectral_viability` | Existing M0/M1/M2/M3 continuous spectral comparison | established code behavior |
| `stellar_packet_measurement` | Converts a continuous spectrum into photon-count packets | measurement simulation |
| `solar_event_congruence` | Checks whether flare, p-mode, magnetic, ribbon, sunquake, irradiance, and polarimetric observations agree | observational congruence |
| `collapse_residual_hypothesis` | Optional residual timing model after magnetic and p-mode nulls are computed | speculative diagnostic |

## Constraint Envelope

Every congruence report carries a `SolarConstraintEnvelope`.
The envelope summarizes four budgets: energy, timing, topology, and residual eligibility.
It is a physics passport for the run: if the magnetic floor, p-mode timing, applicable backreaction/topology checks, or energy closure are missing or failed, the residual budget records the blocked reasons and leaves the residual claim tier at `none`.

## Entropy And Aliasing

Each congruence metric also carries `entropy_diagnostics`.
The diagnostic names observational, model, provenance, and aliasing entropy separately, then converts their sum into `entropy_stretch_lambda = exp(delta_entropy)`.
The corresponding `entropy_penalty` is penalty-only: it can demote a metric's entropy-adjusted score, but it cannot boost a weak lane into a stronger claim.

`aliasing_nulls` lists ordinary mechanisms that can mimic the same residual under coarse evidence.
For the speculative residual lane, those nulls include reconnection, p-mode timing, ribbon blobs, photospheric backreaction, sunquake response, transition-region brightening, flare-memory proxy, and Faraday-path geometry.
If evidence is too coarse to distinguish them, StarSim reports aliasing pressure rather than promotion.

## Residual Gate

The collapse-like residual gate is blocked unless magnetic reconnection and p-mode diagnostics are computed, applicable photospheric backreaction and ribbon-kernel diagnostics are present when their data exist, and energy closure does not exceed the continuous-spectrum budget.
The residual is advisory-only; it cannot become a primary winner and cannot create source power.

`multifractal_flare_memory_proxy` is intentionally named as a proxy until it is backed by a WTMM, structure-function, or multifractal-spectrum implementation.
Faraday-path evidence remains advisory magnetic-geometry context and cannot unlock a residual by itself.

## Research Anchors

- DKIST/ViSP ribbon blobs: [Yadav et al., Multi-line Spectropolarimetric Observation of Flare Ribbon Fine Structures with ViSP/DKIST](https://arxiv.org/abs/2507.20070)
- High-entropy classical limit: [Carcassi, Landini, and Aidala, Classical mechanics as the high-entropy limit of quantum mechanics](https://arxiv.org/abs/2411.00972)
- Solar p-mode context: [Kosovichev, Solar Oscillations](https://ar5iv.labs.arxiv.org/html/1001.5283)
- Coronal five-minute oscillations: [Didkovsky et al., Solar Physics 2013](https://link.springer.com/article/10.1007/s11207-012-0186-3)
- Photospheric field backreaction: [Yadav and Kazachenko, high-cadence vector magnetogram flare statistics](https://arxiv.org/abs/2210.14264)
- Transition-region brightenings: [Bahauddin, Bradshaw, and Winebarger 2021](https://ui.adsabs.harvard.edu/abs/2021NatAs...5..237B/abstract)
- Flare X-ray multifractality: [McAteer et al. 2007](https://hesperia.gsfc.nasa.gov/collaborate/bdennis/Folders/Papers%20on%20Hesperia/McAteeretal_BurstyNature_ApJ_2007.pdf)
