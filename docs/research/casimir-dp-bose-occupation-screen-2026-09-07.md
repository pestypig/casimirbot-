# Bose enhancement and the shared recoil population

Exploratory S1 screen, September 7, 2026. No measurable-overlap point admitted.

## Newly inspected primary lead

[Badurina and Zurek, equations 22–24](https://arxiv.org/html/2606.00237v1)
derive an occupation-dependent enhancement of elastic decoherence for bosons.
In their stated regime, the positive scattering integrand gains a factor
1 + f(p-q). The phase channel does not acquire that same factor. Their
finite-time treatment also distinguishes the long-memory regime from the
usual rate approximation. This provides a concrete lead to screen, rather
than a generic claim that quantum coherence amplifies every interaction.

## Independent conditional calculation

Choose one spin-zero species, density 0.3 GeV/cm³ and an untruncated Gaussian
velocity distribution with width v0 = 220 km/s. With occupation normalized by
n = integral d³p/(2 pi)³ f(p), its peak is

    f0 = 8 pi^(3/2) rho (hbar c)^3 / [m^4 (v0/c)^3].

Because 0 <= f(p-q) <= f0, any nonnegative rate kernel in the cited
approximation has a fractional Bose correction at most f0. This statement
does not require a constant cross section. It does require the specified
population and statistical kernel; it is not a nonperturbative theorem.

The free-Xe elastic central-energy screen (248 keV, maximum speed 776 km/s)
requires mass at least 77.8656 GeV. That speed is used only for the inherited
kinematic screen, not as a truncation of this illustrative Gaussian.

| Mass, GeV | Peak occupation | Width for f0 = 1 at fixed density, m/s |
| --- | --- | --- |
| 77.8656 | 7.0682e-39 | 4.2221e-8 |
| 100 | 2.5983e-39 | 3.0245e-8 |
| 1000 | 2.5983e-43 | 1.4038e-9 |

Thus Bose statistics cannot materially enhance the heavy, smooth-population
benchmark. The narrow widths in the last column are necessary peak-occupation
conditions in this Gaussian family, not proposed supplied populations. Even
unit peak occupation does not ensure occupied final states at the momentum
transfers resolving the branches. A cold stream, condensate, captured cloud,
or separate light species needs its own production, evolution and scattering
kernel. Its density cannot be fitted independently to rescue coherence.

## Disposition and checks

Do not spend a full xenon fit on a smooth-halo Bose-enhancement rescue. Retain
the open-system framework for a future explicit populated-state model and
for finite-time/readout checks. No change to the frozen apparatus or prior
component predictions follows, and no boundary-dependent residual is inferred.

The companion Python/JSON reproduce Gaussian normalization by independent
quadrature, m^-4 scaling and inversion of the unit-occupation width. They
compute no absolute scattering signal. The shared-model goal remains open.
