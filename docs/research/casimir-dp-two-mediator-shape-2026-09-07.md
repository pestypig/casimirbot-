# Two-mediator spectral-shape intake — 2026-09-07

Exploratory alternative lead; this does not retune or overwrite the frozen
single-mediator benchmark. No physically normalized, constrained two-mediator
model or detectable local signal is claimed.

## Trial amplitude and optimization

Use the same natural-xenon isotope and Helm inputs, m_chi=100 GeV and fixed
v=776 km/s, with the trial Born amplitude

`A_A(q) = Z_A F_A(q) [c1/(q^2+m1^2) + c2/(q^2+m2^2)]`.

The coefficients are real products of particle and ordinary-charge couplings;
opposite signs allow interference. A microscopic realization must specify both
mediators, electron/proton couplings, particle populations and relevant mixing.
They cannot be chosen independently for diamond and xenon.

For each mass pair, integrate two positive-semidefinite response matrices L,H
for recoil bands 5.4–200 and 200–269.9 keV. The minimum of (c^T L c)/(c^T H c)
is the lowest generalized eigenvalue. This optimizes the entire low-energy
band, rather than choosing a cancellation at one energy. It is an optimistic
shape screen over unrestricted real coefficients in a two-function Born span.
Overall normalization cancels; no flux, capture density or cross section is
fitted. Matrix normalization, eigenvalue recovery and semidefinite residual
checks pass.

## Results at selected mass pairs

| m1 | m2 | Optimized c2/c1 | Minimum low/high | m2-only low/high |
| --- | --- | --- | --- | --- |
| 1 keV | 30 MeV | -1.4662 | 9,598.8 | 62,835.6 |
| 1 keV | 100 MeV | -5.4386 | 1,750.2 | 7,424.5 |
| 1 keV | 1 GeV | -402.022 | 131.05 | 426.36 |
| 10 MeV | 1 GeV | -380.370 | 125.92 | 426.36 |

The full nine-pair grid is in the companion JSON. The optimized nodes lie at
momentum transfers about 44–50 MeV. The original 10-MeV single mediator gives
109,916.6 for these same integrated bands and speed. This comparison differs
from the narrower 5.4–10-keV low band used in recent single-scatter bounds.
Most improvement in the best pair comes from the heavy exchange; interference
reduces the remaining ratio by another factor of about 3.4. It does not remove
all low-energy scattering, and no allowed event budget is asserted here.

## Why this is a possible common-model lead

Two exchanges can weight the nuclear-recoil and low-momentum regimes differently
while retaining common underlying coefficients. The light exchange could remain
important in the local material response even when the heavy exchange dominates
high-energy xenon scattering. This is a mechanism to test, not an inferred
coherence enhancement. A cancellation in the xenon momentum range is not a
calculation of neutral diamond scattering.

The next test must normalize the couplings and integrate the diamond response
with the same summed amplitude, including the interference term. Check atomic
screening and Born validity before trusting a light-mediator enhancement:
reducing mediator mass can make repeated interactions within the potential
important even when individual coupling products look small. Preserve the
population-supply calculation and both mediator signs consistently. Force,
cosmological and laboratory constraints require the actual microscopic
completion, not this shape-only trial.

Stop this lead if its best constrained coefficients leave an incompatible
selected xenon spectrum, require unsupported particle supply, or eliminate
the measurable local effect. A lower raw ratio alone does not satisfy the goal.
The finite mass grid supplies no universal bound across all mediator masses
or interactions, and none of these rows is a detector fit or validated model.
