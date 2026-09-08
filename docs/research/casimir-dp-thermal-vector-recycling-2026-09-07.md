# Thermal inverse-vector recycling screen

Exploratory conditional result. Previous goal turn made progress by establishing excitation source requirements and cold-halo thresholds. Here the source is specified as an isotropic homogeneous thermal vector bath, with zero chemical potential, coupled to two equal-degeneracy dark states. No such bath is assumed to have been observed.

## Detailed balance and shared normalization

At leading order neglecting recoil shifts of the transition frequency, a vector mode occupation nV gives upward rate Gamma0*nV and downward rate Gamma0*(1+nV). The stationary excited fraction is f=nV/(1+2nV), with nV=1/(exp(gap/T)-1), hence f=1/(1+exp(gap/T)). Stimulated emission cannot be omitted. For the underlying balance framework see [the Einstein-coefficient treatment](https://www.nat.vu.nl/~wimu/Einst.html). Applying it to this dark transition is our conditional model calculation; finite recoil, polarization and line broadening need further treatment for a detailed transport solution.

If x scales the squared coupling product relative to the xenon benchmark, S=x f=1 requires x>2 and T=gap/log(x-1). The prior xenon fold fixes P=g12*gB at x=1. To give recycling its most favorable test, cap both physical couplings at 4pi, giving x_max=[(4pi)^2/P]^2. These deliberately generous caps are assumptions, not experimentally established limits or a guarantee of perturbative control. Stronger restrictions raise the minimum required temperature.

## Bath energy density

Use the exact massive Bose integral for one thermally occupied polarization:

rhoV=T^4/[2 pi^2 (hbar c)^3] integral_0^infinity dy y^2 sqrt(y^2+(mV/T)^2)/[exp(sqrt(y^2+(mV/T)^2))-1].

One polarization is conservative for energy accounting; three populated polarizations multiply the result by three. The vector mass is retained, rather than assuming the massless limit. The massless integral pi^4/15 provides an independent check.

| Dark mass | Mediators checked | Minimum T | One-polarization rhoV / frozen local DM density |
|---|---|---|---|
| 40 GeV | 1 keV and 1 eV | 18.181 keV | about 1.56e22 |
| 100 GeV | 1 keV and 1 eV | 9.905 keV | about 1.37e21 |

The corresponding squared-coupling scale caps are 1.09e24 and 1.48e24. Even this exceptionally favorable coupling range cannot make a thermal recycling bath a small perturbation of the frozen 0.3 GeV/cm^3 local halo. The comparison is an incompatibility with that background assumption, not a precision cosmological radiation exclusion. A bath of such density also demands its own dynamical/gravitational treatment, which the original scattering forecast lacks.

The narrow 1 MeV threshold case is not included in this thermal screen. Nor does the result rule out a nonthermal resonant spectrum, coherent pump, externally injected excited particles, or vector recycling out of equilibrium. A narrow spectrum can have a different total energy density for the same resonant occupation. It must, however, satisfy linewidth, Doppler/recoil redistribution, source/escape balance, and velocity-distribution constraints. These cannot be chosen independently of the decay/scattering couplings. The very large coupling-cap endpoint is allowed only to make a conservative screen; loss of weak-coupling or narrow-line validity would restrict it further rather than establish a viable bath.

Next use an explicit nonthermal line-transport model only if its source can be specified with the same microscopic parameters; otherwise prioritize another candidate completion rather than add a free radiation bath to fit the apparatus.

Reproduce with `python docs/research/casimir-dp-thermal-vector-recycling-2026-09-07.py`. It authenticates the decay input, checks absorption/emission balance, the xenon strength identity, the massless thermal integral and two integration cutoffs. Initial unsplit quadrature missed a small low-momentum feature at mV/T~0.055; explicit interval breakpoints resolve the cutoff disagreement. Root-leaf documentation validation is separate. No runtime/GR/certificate changes and no model admission.
