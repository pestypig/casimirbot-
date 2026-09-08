# B-L fraction rescaling with xenon normalization preserved

Date: 2026-09-07. Exploratory conditional screen; no halo exclusion.

The previous turn produced a self-scattering kernel. This packet tests whether reducing local abundance relieves its transport consequences while preserving the original raw xenon event normalization.

Let f be density divided by the original 0.003/cm3, holding the velocity distribution fixed. Xenon Born rate is proportional to density times squared dark-SM products. Both products must therefore scale by f^-1/2 to preserve the spectrum and raw high-window rate. This is a conditional rescaling, not a refit or an assertion that all approximations remain valid at arbitrary f.

At fixed g_SM, dark alpha scales as 1/f. Using the light repulsive classical fit in [Tulin, Yu and Zurek, Appendix A equation 38](https://arxiv.org/html/1302.3898), beta scales as 1/f and the per-particle transport-rate ratio is

Gamma(f)/Gamma(1) = log[1+(f/beta0)^2] / {f log[1+beta0^-2]}.

This uses Gamma proportional to n sigma_T v at a fixed relative speed. It is not total energy transfer per volume or the gravitational effect on the whole halo.

For the 1 eV mediator, 100 GeV particle, g_SM=1e-11 and relative speed 200 km/s:

| Local density fraction | Product multiplier | Dark alpha | Transport-rate ratio |
|---|---:|---:|---:|
| 1 | 1 | 0.09147 | 1 |
| 0.5 | 1.4142 | 0.18294 | 1.8882 |
| 0.1 | 3.1623 | 0.91471 | 8.1434 |

The chosen dark-alpha <= 1 screen requires f >= 0.09147 for this SM coupling. Thus making this component arbitrarily rare is unavailable within this fixed-coupling perturbative branch. Larger g_SM could change that conclusion but must independently satisfy ordinary-matter constraints; 1e-11 is a trial, not an allowed value.

No local coherence forecast is assigned to these rescaled rows. In the eikonal model the phase also scales by f^-1/2, so the previous 0.10% loss cannot simply be inherited or multiplied by f. It requires a new phase integral. Likewise the heavy mediator's self-coupling, velocity averages, collective effects, identical-particle weighting and halo evolution are not included. Local fraction need not equal cosmological fraction. A minority component can have less gravitational impact even when its own relaxation increases; no population-wide exclusion follows from this calculation alone.

The next unresolved evidence remains the short-range laboratory/halo comparison. This result prevents using abundance reduction as an uncalculated rescue of the existing model. The matching Python authenticates frozen products, verifies constant raw-rate scaling and checks beta and coupling conditions; matching JSON preserves outputs. Documentation validation passed; no physical certificate claim is made.
