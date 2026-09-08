# Occupied final states and finite hold time

Exploratory S1 screen, September 7, 2026. This extends the Bose occupation
screen without importing a cold population as an established physical input.

[The primary framework](https://arxiv.org/html/2606.00237v1), equations 19,
22–24 and the non-Markovian discussion, distinguishes finite-time response
from the long-time scattering-rate limit. Its enhancement involves occupied
final states, not just a large incident occupation.

For a Gaussian f(p)=f0 exp[-|p-pc|²/s²], integrating f(p)f(p-q) over p gives
a q-dependent factor exp[-q²/(2s²)]. This follows by completing the square
and holds for any common center pc. It is an occupied-pair overlap, before
energy, mediator and target weighting. Its normalized average branch filter
is 1-exp[-s²d²/(2 hbar²)], with consistent momentum-length units. Neither
that average nor the overlap is a decoherence rate or an upper bound on one.

At density 0.3 GeV/cm³, mass 100 GeV and Gaussian width chosen for peak
occupation one, s=1.00886e-5 eV/c. The frozen separation d=250 nm gives
hbar/d=0.789308 eV/c. The normalized overlap filter is 8.16847e-11; the
logarithm of the overlap ratio at hbar/d is -3.06055e9. Small transfers
remain possible; this calculation does not discard their integrated response.

For a zero-drift Gaussian the quoted correlation-time estimate
2 pi hbar/(m v0²) gives 4.06333e6 s, versus the frozen 0.25 s hold. A
Markovian extrapolation of the cold endpoint is therefore unjustified.
A stream moving relative to the apparatus adds a temporal scale and requires
its actual directional, finite-time kernel. The spatial overlap formula
alone cannot determine that time dependence.

Disposition: do not use peak occupation as a free multiplier on a previously
computed halo rate. Any continuation of this route must specify a supplied
cold distribution, use the finite-time kernel with actual branch histories,
and connect its fast component to xenon with the same interaction. No
absolute signal, supplied population, external exclusion or boundary residual
has been established here. The overall measurable-in-both goal remains open.

The companion Python checks the frozen configuration hash and independently
integrates the Gaussian branch filter. JSON includes 77.8656, 100 and
1000 GeV cases. These are analytic/numerical diagnostics only.
