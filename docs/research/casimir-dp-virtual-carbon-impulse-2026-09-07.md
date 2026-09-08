# Virtual carbon: independent-nucleus recoil benchmark

Date: 2026-09-07. Exploratory impulse benchmark, not an inclusive solid response.

The preceding packet resolved the smooth-sphere coherent component. This calculation instead treats carbon nuclei as independent stationary scattering centers, retaining the same xenon-normalized 10 MeV mediator/gap virtual potential and its finite uniform nuclear charge profile. No coupling or incident-population retuning is performed.

For carbon nuclear reduced mass mu, q_max=2 mu v. Integrate sigma=integral_0^qmax dq q |W_C(q)| squared/(2 pi v squared), with the GeV-to-cm cross-section conversion. The result is 1.01262859e-40 cm2 per nucleus. At the frozen sphere atom count, density 0.003/cm3, speed 776 km/s and hold 0.25 s, the expected event count is 9.14646e-26. A generic branch distinguishability factor bounded by two gives D<=1.82930e-25 within this independent-scatterer benchmark. It is not a bound on all solid-state channels.

The free-carbon maximum recoil is 121.155 keV. Momentum quadratures with 96 and 192 nodes agree to 6.3e-15 relative. A separate check uses the sign-definite local effective potential: abs(W_C(q))<=abs(W_C(0)). It implies sigma<=mu squared |W_C(0)| squared/pi =2.95424e-40 cm2, consistent with the integral. This checks the normalization and an envelope within the model, not the finite-gap approximation or nuclear-charge uncertainty.

The low-q portion of the free-nucleus calculation is not a validated impulse response of a bound crystal. Nor may this whole interval be added to the preceding continuum integral: an actual dynamic structure factor must connect coherent and incoherent regimes without double counting. Electron terms, two-insertion target fluctuations and phonons remain absent. These limitations prevent an inclusive exclusion claim, but neither the resolved nuclear benchmark nor the smooth continuum component is remotely near the frozen theoretical DP comparator.

Decision: stop pursuing these nuclear channels as a measurable-overlap solution at this normalization. The next substantive test is an electronic/two-density response bound or calculation; it must use the same couplings and second-order kernel. If that also fails, demote this virtual benchmark rather than continue refining negligible nuclear contributions.

Matching Python/JSON authenticate the nuclear normalization, reuse its kernel definitions, and reproduce the recoil integral and envelope. No frozen apparatus, GR or certificate authority changed.
