# IDM benchmark folded through a FIRE-2-calibrated local speed model

Date: September 24, 2026. Candidate-neutral halo-to-detector calculation; not an LZ likelihood and not evidence that the IDM benchmark is realized in nature.

## Why this is the next useful lead

Staudt et al. derive a local dark-matter speed distribution from twelve FIRE-2 Milky-Way-sized disk simulations as a function of the measured local circular speed. Their fitted Galactic-frame model is

`f_gal(v) proportional exp[-(v/v0)^2] / (1 + exp[-k(v_damp-v)])`,

with `k=0.0350`, and their Milky Way prediction gives `v0=257 +/- 8 km/s` and `v_damp=455 +/- 8 km/s`. It captures their finding that a simple Maxwellian overpredicts the high-speed tail. Their local density estimate is `0.42 +/- 0.06 GeV/cm^3`.

The inelastic IDM profile point previously screened requires `v_min=786.01 km/s` for a 248 keV Xe-131 recoil. Using the source paper's lab-boost magnitude `254 km/s`, the Galactic-frame speed must be at least `532.01 km/s` to contribute. I normalized the published analytic speed model and evaluated the boosted halo integral

`eta(v_min) = integral_{|u|>v_min} f_gal(|u+v_lab|) / |u| d^3u`

by direct angular and speed quadrature. This is the appropriate velocity factor for the benchmark's `d sigma/dE_R proportional 1/v^2` kernel.

## Result

The central FIRE-2 model gives `eta=5.6604e-8 (km/s)^-1`, or `0.7492` times the IDM paper's truncated-SHM value at the same `v_min`. Independent low/low and high/high corners of the paper's quoted `v0` and `v_damp` one-sigma intervals give ratios `0.450` and `1.215`. These are diagnostic corners, not a joint posterior. Multiplying by the ratio of the paper's density central values, `0.42/0.30`, gives a central conditional `rho*eta` ratio of `1.049`; this normalization exercise does not include detector response or the density uncertainties.

The formalism therefore does **not** close the benchmark. Its central halo integral is of the same order as the source SHM prediction. However, about `19.9%` of the calculated central `eta` comes from Galactic-frame speeds above `2.30 v0 = 591.1 km/s`, beyond the highest speed where Staudt et al. tabulate their galaxy-to-galaxy residual uncertainty. The minimum contributing speed, `532 km/s`, is already `2.07 v0`. The central answer is thus explicitly sensitive to extrapolating the analytic fit into a tail region without the paper's empirical uncertainty band.

## Interpretation and next gate

This is a stronger lead than translating Gaia stellar escape-speed fits directly into dark-matter support: it directly models simulated local dark-matter speeds and supplies a Milky Way mapping based on circular speed. It remains a simulation-calibrated prediction, not a direct measurement of the Milky Way's tail. A fixed boost magnitude is used, with no annual modulation, velocity anisotropy, streams, or common-convention fit across the IDM and astrophysical assumptions.

Next, obtain the authors' underlying speed-distribution data or reproduce a tail uncertainty envelope beyond `2.30 v0`; then evaluate a time-dependent Earth-frame boost and propagate the `rho`, velocity-shape, IDM fraction, xenon isotope response, LZ efficiency, and background likelihood together. Only after that should we test whether any candidate-neutral boson-star population supplies this particle component or a distinct local flux. The boson-star field itself is not identified with the 1080 GeV inelastic particle by this calculation.

The reproducible implementation is [the Python screen](casimir-dp-idm-staudt-fire2-halo-integral-2026-09-24.py), with numeric output in the adjacent JSON. The quadrature check changes `eta` by less than `7e-6` when reducing the grid from `1200x300` to `600x200`.

Sources: [Staudt et al., arXiv:2403.04122v3](https://arxiv.org/html/2403.04122); [IDM LZ profile benchmark, arXiv:2609.06571](https://arxiv.org/html/2609.06571).
