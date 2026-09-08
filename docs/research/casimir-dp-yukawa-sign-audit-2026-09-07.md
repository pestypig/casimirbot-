# Point-Yukawa sign audit — 2026-09-07

Exploratory S1 approximation check. The same coupling magnitude is used, without
retuning a resonance. The two potential signs are separate model alternatives;
they cannot be independently selected for xenon and diamond.

[ Xu and Farrar, arXiv:2101.00142v2](https://arxiv.org/abs/2101.00142v2)
identify sign-dependent nonperturbative DM–nucleus scattering and important
finite-nucleus effects. Their exclusion curves are not imported for our
charge-coupled model. This source motivates an independent numerical check.

For V=sign*Z*alpha_p*exp(-m_med*r)/r, the zero-energy radial equation in
x=m_med*r is u''=sign*lambda*exp(-x)*u/x, lambda=2*mu*Z*alpha_p/m_med.
The companion script solves the regular solution and extracts the scattering
length a*m_med=x-u/u'. The Born value is sign*lambda; the zero-energy total
cross-section ratio is (a*m_med/lambda)^2. It checks weak-coupling recovery
for both signs and convergence under endpoint/tolerance changes.

At the existing 3.9-times-strong-root coupling magnitude:

| Point target | lambda | Attractive sigma/Born at zero energy | Repulsive sigma/Born at zero energy |
| --- | --- | --- | --- |
| C12 | 0.03574 | 1.037 | 0.965 |
| O16 | 0.06148 | 1.065 | 0.942 |
| Si28 | 0.17158 | 1.199 | 0.850 |
| Xe131 | 1.75829 | 287.1 | 0.312 |

The attractive zero-energy s-wave pole is located numerically at lambda
1.67980777 in this point potential. Xenon's proximity explains the large
zero-energy diagnostic. Neither a pole nor a bound level establishes an
astrophysical population or a capture rate: formation requires an energy-loss
mechanism. No additional particle supply follows from this calculation.

These numbers must NOT multiply the existing LZ spectrum. Finite-speed partial
waves, finite charge distributions, and relevant screening are not included.
A zero-energy approximation does not describe the high-speed xenon recoil
sample. The carbon result is also not a diamond decoherence calculation.

The material consequence is a missing model specification and approximation
check: a Born cross section does not identify the attractive/repulsive choice,
and its shared magnitude alone is insufficient to predict slow nuclear
scattering near this regime. If an asymmetric particle population is invoked,
its charge sign relative to ordinary matter must be fixed consistently.
Treat both signs explicitly until an underlying model supplies that choice.

Next compute finite-speed, extended-charge partial waves before applying
nonperturbative corrections to detector transport or slow population dynamics.
Earlier large low-energy predictions remain results of their declared Born
kernel; this audit neither erases them nor establishes an allowed alternative.
No experimental exclusion, proof certification or shared measurable model is
claimed. Numerical checks passed; documentation validation is separate.
