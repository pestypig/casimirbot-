# Gravity-only focusing and the inclusive scattering bound

Exploratory collisionless identity, 2026-09-07. This does not solve Earth capture or the moving-laboratory halo distribution.

The inclusive Born charge-closure bound scales with the density-weighted inverse-speed moment I=integral d³v F(v)/v. For a stationary isotropic population at infinity in a static spherical, transparent gravitational potential, energy conservation gives v²=u²+v_escape². Liouville evolution gives F_local(v)=F_infinity(u) on unbound trajectories. Thus

    I_local = 4 pi integral_v_escape^infinity v F_infinity(sqrt(v²-v_escape²)) dv
            = 4 pi integral_0^infinity u F_infinity(u) du = I_infinity.

For an isotropic mono-speed shell, n_local=n_infinity*v/u, so n_local/v=n_infinity/u. Density enhancement cannot be inserted into the closure bound while holding speed fixed. The [collisionless focusing literature](https://arxiv.org/abs/astro-ph/0608390) provides the phase-space framework; this inverse-moment specialization follows directly from the substitution v dv=u du.

The script checks a 776 km/s mono-speed shell and independently integrates an isotropic Maxwell distribution with chosen scale 220 km/s. Diagnostic escape speeds 0, 11.2, 42.1 and 600 km/s leave the inverse moment invariant to numerical precision. The corresponding mono-shell density enhancements are 1, 1.00010415, 1.00147059 and 1.26405374. These speeds are illustrative choices, not a reconstructed potential at the apparatus.

This means gravity-only focusing does not improve the previous inclusive bound in this idealized setting. Actual energy-dependent recoil spectra can still change because their kinematic thresholds depend on speed. A moving laboratory, anisotropic streams, time-dependent or multi-body gravitational interactions, absorption, collisions and initially bound components require their own phase-space treatment; no universal claim of zero focusing effect is made. The [annual-modulation study](https://arxiv.org/abs/1308.1953) illustrates why realistic gravitational focusing can affect a detector signal.

A stationary conservative single-body potential does not turn a positive-energy incoming orbit into a bound orbit. A persistent captured or thermalized component therefore needs a specified energy-changing mechanism or different initial/dynamical conditions. The next population calculation should enforce source, capture, retention and spatial distribution together. Neither the small raw nuclear normalization nor an assumed local Maxwell distribution supplies those ingredients.

    python docs/research/casimir-dp-focusing-moment-2026-09-07.py

Research-only diagnostic and documentation, not a warp/GR implementation or physical viability certificate; no Casimir server verification applies.
