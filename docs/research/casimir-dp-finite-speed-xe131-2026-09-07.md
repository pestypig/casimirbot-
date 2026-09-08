# Finite-speed Xe131 partial-wave screen — 2026-09-07

Exploratory S1 numerical scattering calculation. The fixed coupling and
Helm-consistent extended charge potential are unchanged. Attractive and
repulsive signs remain separate alternatives with common target couplings.
This packet is Xe131 only, not an isotope-averaged or detector-folded result.

## Method and verification scope

Solve u_l''=[l(l+1)/x^2 + g W(x) - k^2]u_l with x=m_med*r,
k=mu*v/m_med and g=sign*lambda. A Numerov recurrence propagates the regular
radial solution, rescaling amplitudes to avoid overflow. Matching to free
Riccati-Bessel functions yields phase shifts. The start uses a regular free
series; finite-start errors are tested by mesh refinement. The identical
free-potential numerical phase is subtracted to remove discretization offsets;
it tends to zero in the continuum and is not a physical phase adjustment.
A power-series ratio avoids underflow when initializing large angular momenta.

The amplitude is sum_l (2l+1) exp(i delta_l) sin(delta_l) P_l(cos theta)/k.
Angular integration uses 240-point Gauss-Legendre quadrature. Its total agrees
with the independent partial-wave sum to relative tolerance 1e-7. Cross-section
entries labeled `exact` in JSON are numerical partial-wave estimates in units
of m_med^-2, not mathematically exact values.

The initial coarse high-energy calculation failed the 1% refinement criterion.
The retained pair uses h=0.001/end=30 and h=0.0005/end=36, with an increased
partial-wave cutoff. Maximum retained high-band change is about 0.22%; low-band
changes are below 0.001%. Both signs recover Born scattering when the potential
strength is reduced to 1% of the benchmark: total ratio within 0.2% and high-band
ratio within 2%. These checks do not establish nuclear-parameter uncertainty
or replace an independent solver comparison.

## Finite-speed cross sections relative to Born

| Speed (km/s) | Sign | Total | 5.4–10 keV | 200–269.9 keV |
| --- | --- | --- | --- | --- |
| 100 | Attractive | 1.0478 | 1.1875 | Kinematically closed |
| 100 | Repulsive | 0.7863 | 0.7968 | Kinematically closed |
| 650 | Attractive | 1.0002 | 0.9962 | 0.6892 |
| 650 | Repulsive | 0.9953 | 1.0052 | 1.3334 |
| 776 | Attractive | 1.0001 | 0.9973 | 0.7829 |
| 776 | Repulsive | 0.9967 | 1.0038 | 1.2545 |

Each band is clipped at the Xe131 elastic endpoint. In particular, the
650-km/s high band does not imply that 248-keV recoil production is open.
The Born comparator uses the same finite charge form factor, masses, coupling
and speed as the partial-wave calculation.

## Consequence for the common-model calculation

The huge zero-energy attractive enhancement does not survive as a huge total
rate enhancement at these speeds. Nevertheless, total-rate agreement hides
substantial corrections in the high-recoil tail. A single total-cross-section
rescaling is therefore insufficient for updating xenon transport or spectra.
At the two sampled high speeds, sign-dependent changes are order tens of
percent, while the low band stays close to Born. This does not demonstrate an
orders-of-magnitude resolution of the earlier low/high imbalance.

Do not apply these six ratios globally to the saved isotope mixture or
transported distribution. Next extend the calculation over xenon isotopes and
speed, compare with an independent phase-shift solver, and propagate the
actual differential kernel. Overburden and local solid response require their
own consistent target calculations. Zero-energy resonances remain relevant
only where the velocity distribution actually samples them; no captured
population or measurable diamond signal is inferred here.

No accepted LZ counts, experimental exclusion, physical viability, certified
proof status or completed shared prediction model is claimed.
