# Independent-carbon resonance ceiling

Exploratory S1 research, September 7, 2026. No frozen apparatus, runtime physics or maturity claims are changed.

Attractive nuclear potentials can exhibit resonances and violate Born target-scaling assumptions. The elastic s-wave cross section nevertheless satisfies sigma_0 <= 4 pi/(mu v)^2 in natural units. This ceiling follows from sin squared of the phase shift being at most one. [Xu and Farrar, equations 13 and 40](https://arxiv.org/abs/2101.00142).

Apply this only to independent carbon nuclei, a 776 km/s mono-speed population of density 0.3 GeV/cm^3, and the frozen sphere mass and hold. Since each scattering contribution to the real decoherence kernel is at most two, D <= 2 n v t N_C sigma_0. This does not assume Born scattering or require tuning a particular resonance. It generously saturates the cross section at the chosen speed and bounds the branch-resolution factor.

The accompanying Python/JSON authenticates the configuration and computes the minimum elastic incident mass capable of a 248 keV recoil on the mean-mass xenon surrogate: 77.87 GeV. At this mass the independent-carbon ceiling is about 1.78e-8. At 100 GeV it is about 1.31e-8; at 1 TeV, 1.08e-9. This threshold is illustrative, not a natural-isotope or energy-uncertainty likelihood boundary. The ceiling decreases with mass at fixed speed and density because it scales as (M+m_C)^2/M^3.

This is not an exclusion of resonant dark matter. Additional partial waves, collective lattice scattering, whole-body scattering, electronic channels, inelastic processes and different velocity populations lie outside this calculation. Slower particles change the unitarity ceiling and incident flux together; they require a shared population and transport model rather than borrowing the high-speed recoil normalization. A nominal upper bound is not a demonstrated sensitivity or actual signal.

Decision: tuning an independent-carbon s-wave resonance alone is not a persuasive route to an appreciable local signal in this high-speed benchmark. Any next resonance candidate must specify which omitted response provides the gain and derive xenon and material scattering from the same potential. Earlier zero-energy point-Yukawa results remain diagnostics, not multipliers for a finite-energy spectrum. The shared prediction-model goal remains open.
