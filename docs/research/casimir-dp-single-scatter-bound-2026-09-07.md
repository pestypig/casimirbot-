# Exactly-one-scatter spectral bound — 2026-09-07

Exploratory S1 conditional analytic result, not certified math, experimental
validation, or an LZ exclusion. This tests whether rejecting multiple physical
collisions can by itself rescue the current elastic charge-coupled benchmark.

## Frozen model and specified geometry

Use the existing 100-GeV particle, 10-MeV mediator and coupling multiplier
495016.03748727636 relative to the reference cross section. Preserve the
isotope mixture and Helm charge response. Consider an infinite transverse,
homogeneous xenon slab of finite mass column X; this is not the actual LZ
volume. Incident speeds lie between 601.12135 and 776 km/s, and direction
cosines relative to the slab normal satisfy c >= c0. There are no electron,
inelastic, or other channels in this conditional kernel.

Count exactly one physical nuclear collision in the slab, with recoil in
L=[5.4,10] keV or H=[200,269.9] keV. This is more restrictive than merely
one reconstructed pulse and must not be identified with the LZ event class.

## Derivation

At fixed incident v, the thin-target contribution is X_n sigma_band(v)/c,
where X_n is the normal column of nuclei. The Helm differential kernel has
speed dependence 1/v^2 apart from the elastic endpoint. L is fully accessible
throughout the speed interval; the H integral can only lose support as speed
falls. Therefore sigma_L(v)/sigma_H(v) >= 70190.30473, the ratio at 776 km/s.
This statement is analytic within the stipulated kernel; a 20-speed numerical
check is supplementary evidence rather than its proof.

For a recoil in L, v_after >= 585.97933 km/s. Momentum conservation gives
sin(theta) <= sqrt(2 m_Xe,max E_L,max)/(m_chi v_after,min) = 0.25740524.
The momentum dot product is positive throughout the domain, fixing the acute
angle branch. Hence c_after >= c0 sqrt(1-sin(theta_max)^2)
- sqrt(1-c0^2) sin(theta_max). For c0=0.9 this lower bound is 0.75747285.

Use the all-energy point-nucleus total cross section as an upper bound on the
Helm total, since the stipulated normalized Helm form factor has |F|<=1.
Its total optical depth increases as speed decreases. If z is collision depth
as a fraction of the normal slab depth, the pre/post survival exponent is at
most z tau_point(v_min)/c0 + (1-z) tau_point(v_after,min)/c_after,min.
The maximum over z is the larger of these two coefficients, denoted B.
Thus P(exactly one L) >= exp(-B) X_n sigma_L(v)/c, while
P(exactly one H) <= X_n sigma_H(v)/c. Consequently

`P(exactly one L) >= exp(-B) * 70190.30473 * P(exactly one H)`.

This inequality also holds after integrating any nonnegative incident
population supported entirely within the specified speed/direction domain.
It does not determine the abundance of that subset in the full incident flux.

## Results

| Normal column (g/cm2) | Minimum incident cosine | No-other-collision factor lower bound | Single-L/single-H lower bound |
| --- | --- | --- | --- |
| 100 | 0.9 | 0.8204 | 57,581 |
| 300 | 0.9 | 0.5521 | 38,752 |
| 600 | 0.9 | 0.3048 | 21,395 |
| 300 | 1.0 | 0.6277 | 44,060 |

The script pins both upstream source receipts, checks kinematic bounds and
samples the cross-section ratio across the speed interval. These checks pass.
No Monte Carlo tail estimate is needed for this conditional inequality.

## Consequence for the shared-model search

Rejecting multiple physical nuclear collisions alone does not remove the
large low/high imbalance for this restricted incident population and slab.
That closes a specific possible explanation for suppressing the lower-energy
signal; it does not close every detector or particle-physics alternative.

Application to LZ requires actual geometry and incident angular distribution,
reconstructed single-scatter rules, energy response and relative efficiencies.
Unresolved multi-collision high-energy events are outside this denominator.
Other channels, invalid Born scattering, or different microscopic interactions
also require a new calculation. No arbitrary low-energy efficiency suppression
may be inserted to fit the high-energy event.

Next assess whether the relevant high-energy population satisfies the angular
restriction and authenticate the event-selection response, or test a genuinely
energy-selective interaction with the same local-coherence and population
requirements. The current elastic benchmark has not met the shared-model goal.
