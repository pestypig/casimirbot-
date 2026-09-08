# Direction-independent scalar closure envelope

Exploratory calculation, September 7, 2026. This removes the rotational-averaging restriction from the [previous scalar closure screen](casimir-dp-axion-scalar-closure-bound-2026-09-07.md) for the specified shifted, truncated Maxwellian halo. It retains that screen's Born, scalar point-density contact envelope and nonnegative target energy-transfer assumptions. It does not establish a full UV or finite-temperature bound.

## Positive envelope construction

Let the laboratory velocity distribution be f(v_vector)=exp(-|v_vector+vE_vector|²/v0²)/Z inside the Galactic escape sphere, zero outside. Z is the usual truncated Maxwellian normalization. At each speed v, its directional maximum is

`F(v) = exp[-(v-vE)²/v0²]/Z` when `|v-vE|<=vesc`, and zero otherwise.

The inequality follows from |v_vector+vE_vector|>=|v-vE|. Thus f<=F pointwise for every direction. F is isotropic but deliberately **not normalized to one**. Dividing it by its integral would destroy its role as an upper bound.

The target's transition rate is a nonnegative linear functional of the incident distribution. Replacing f by F therefore bounds the rate for any fixed orientation of the crystal, without changing its Hamiltonian or averaging its states. Isotropic incidence then permits the angular integration used in the closure argument for arbitrary target-direction response. The norm bound holds separately at every momentum direction. Finally D<=2N bounds the absolute unconditioned coherence exponent; no directional coherence phase or actual sidereal modulation is inferred.

The multiplier relative to the preceding speed-averaged closure bound is

`B = [integral 4pi v³ F(v) dv] / <v>_physical`.

This is a conservative flux weighting, not a faster physical population. For example, a numerator exceeding the halo's maximum speed is possible because F is not a probability density.

## Numerical result

For the central tuple (v0,vesc,vE)=(238,544,250.2) km/s, integral F d³v=6.44004 and B=7.43132. The closure exponent at portal quartic 0.03 becomes **D<=3.36943e-15**, valid for any fixed crystal orientation within the stated model. That remains about 8.8e12 below the frozen DP exponent 0.0295115. Across the six existing halo sensitivity tuples, B ranges from 6.83663 to 8.21880; these are not statistical limits or an envelope for arbitrary streams/boosted populations.

Orientation-dependent scattering is physically relevant to decoherence searches; [Riedel and Yavin](https://arxiv.org/abs/1609.04145) discuss sidereal signatures for soft interactions. This calculation does not transfer their low-mass forecasts to the heavy axion benchmark. It establishes a conservative orientation screen for our specified kernel.

The [script](casimir-dp-axion-direction-envelope-2026-09-07.py) authenticates the parent closure results and writes [24 bounds and six halo records](casimir-dp-axion-direction-envelope-2026-09-07.json). Four checks pass: angular integration recovers the archived speed density (maximum absolute error 1.31e-18), sampled directional values satisfy the envelope, its normalization is retained, and the zero-wind limit becomes the normalized isotropic distribution. The analytic pointwise inequality, rather than the samples, justifies the bound. Root/leaf validation passes.

This resolves one limitation of the prior screen. Negative-energy thermal transitions, driven energy sources, validity of the scalar contact envelope at high momentum, omitted operators and full matching remain separate questions. A claim that crystal alignment alone restores a percent-level signal is incompatible with this kernel and halo; a different mechanism requires its own derivation. The shared-model goal remains open.
