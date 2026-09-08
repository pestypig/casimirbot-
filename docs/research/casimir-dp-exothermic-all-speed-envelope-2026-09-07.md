# Exothermic rigid sphere: all-speed envelope

Date: 2026-09-07. Conditional reduced potential model; no full-material exclusion.

The preceding finite-size calculation used 798 km/s. A small result at that speed alone does not bound a slower population. Here the same bounded effective nuclear amplitude is transferred into a uniform rigid sphere, as an explicit additional modelling assumption. The inherited bound on that coefficient remains uniform for incident speeds below 798 km/s because the carbon relative kinetic energy remains below the virtual-state gap.

Let x=qR/hbar, X=2 mu_sphere v R/hbar, and a=d/R. The uniform-sphere form factor is F(x)=3 j1(x)/x. For any incident direction, the branch filter obeys 0 <= 1-cos(q dot d/hbar) <= min(a^2 x^2/2,2). Thus the recoil integral J obeys two elementary bounds:

- From |F|<=1 and the quadratic branch-filter bound: J(X)<=a^2 X^4/8.
- From |F|<=1 below x=1 and |F|<=6/x^2 above x=1: J(X)<=1+36=37.

The rate relative to the previous all-momenta constructive ceiling at vmax is J(X)/(X Xmax). The maximum of min(a^2 X^3/8,37/X) occurs at Xstar=(296/a^2)^(1/4). This bounds every speed, hence every normalized speed and direction distribution below vmax at the same total density. It does not require an isotropic halo and avoids a divergent inverse-speed approximation at zero speed.

The adjacent script evaluates this analytic envelope using the frozen geometry and the authenticated preceding coefficient. Its JSON contains the resulting bound for each population fraction. It checks the crossing lies in the physical speed interval and verifies representative points on both monotone branches.

This calculation closes the slow-population loophole only for the declared uniform rigid additive channel. It excludes neither lattice/inelastic material responses nor cross-nucleus microscopic virtual vertices. The constant nuclear coefficient is inherited as an assumption; deriving a microscopic solid coefficient is separate work. No measured sensitivity or successful joint model is claimed.
