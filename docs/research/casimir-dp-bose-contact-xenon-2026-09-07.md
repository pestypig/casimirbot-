# Shared contact coefficient: xenon and stimulated coherence

Exploratory S1 normalization screen, September 7, 2026.

The preceding finite-time Bose envelope used an arbitrary reference
coefficient. Here the same nonrelativistic density interaction C n_target
n_chi gives a free-nucleus Born differential cross section

    d sigma/dE = mA A² C² F(q)² / (2 pi v²).

Its point-target integral is mu² A² C²/pi. This convention matches the
Hamiltonian used for the stimulated contribution, without equating C to an
unspecified relativistic coupling.

Use a declared unshifted isotropic Gaussian speed distribution with width
220 km/s, truncated at 776 km/s, and density 0.3 GeV/cm³. This is an
illustrative common population, not the LZ halo prescription. Xe is a
mean-A uniform sphere of radius 1.2 A^(1/3) fm, preserving the earlier simple
target approximation. The exposure is 2.84 tonne-year and true-energy
intervals are 5.4–200 and 200–269.9 keV, motivated by the
[LZ analysis](https://arxiv.org/html/2609.02823v1). No detector response or
efficiency is applied. These raw intervals are not reconstructed event bins.

| Mass, GeV | C for one raw high event, GeV^-2 | Raw low/high ratio | Stimulated D upper per raw high event |
| --- | --- | --- | --- |
| 77.8656 | 3.36783e-7 | 6.20072e6 | 4.97328e-31 |
| 100 | 9.36541e-8 | 4.52623e5 | 2.33177e-32 |
| 1000 | 1.53769e-8 | 1.99952e3 | 6.28594e-36 |

The last column divides the finite-time coefficient C² Q² T² n² by the
raw high-count coefficient. Normalizing to one event is only a way to show
the ratio; it is not a likelihood fit or a confidence limit. The upper
envelope is deliberately loose for this dilute population. No cold cloud
is substituted into the local calculation while retaining a different
population for the xenon normalization.

The ordinary term linear in occupation is not included in the coherence
column. Neither are a microscopic completion, external limits or transport.
Mean-isotope form factors can strongly affect high-energy rates, so these
ratios must not be promoted to official exclusions. Even within this toy
calculation, the ordinary contact spectrum is strongly weighted toward low
energies, and stimulated coherence offers no measurable-overlap motivation.

Disposition: deprioritize this contact-statistics rescue. A later dense-cloud
or long-range candidate must specify new physical inputs and recompute both
targets; it cannot inherit the xenon normalization unchanged. The active
goal still requires a complete measurable shared model.

The companion script/JSON record all assumptions and the preceding bound's
receipt hash. Gaussian normalization and independent speed-versus-energy
integration checks pass; the largest relative discrepancy is 2.14e-10.
These checks validate the stated numerical screen only.
