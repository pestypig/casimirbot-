# Captured population: supply and fast-flux linkage

Exploratory conditional budget. This is not a solved spatial distribution, terrestrial exclusion or allowed parameter point. The shared measurable-in-both goal remains open.

[McKeen et al., section II](https://arxiv.org/html/2202.08840v2#S2) describes capture, evaporation, thermal and transient sinking populations. Its geometric capture expression provides the starting budget. We use its approximate Earth radius 6370 km, age 4.54 billion years and surface escape speed 11.2 km/s. We do not import its plotted densities or isoscalar cross-section assumptions into the dark-photon calculation.

## Derived envelope

Assume the same constant mono-speed incident source used for the xenon diagnostic, v=776 km/s, throughout the assumed age. Set capture probability to one and all losses to zero. With Earth-only gravitational focusing, define

`B = pi R^2 v t [1+(vesc/v)^2] = 1.41659e43 cm^3`.

Then N_captured <= n_source B. This is conditional on the source history and capture geometry; it is not a universal bound allowing arbitrary historical overdensities or other sources.

Let s=n_fast/n_source for the surviving unmodified fast component, and V_eff=N_captured/n_local for the actual spatial distribution. Thus

`n_local/n_fast <= B/(V_eff s)`.

This defines V_eff; it does not assume a literal sphere of that volume. For the earlier partial-channel requirements, V_eff*s must be at most 3.66518e15 cm^3 at 300 K or 9.06227e20 cm^3 at 5000 K. Both s and V_eff must come from the same interaction and transport history. Setting them independently to favorable values is not a prediction.

## Uniform-density diagnostic

Earth's volume gives a maximum average enhancement of 1.30839e16. For the illustrative source density 0.3 GeV/cm^3 divided by 100 GeV, the maximum average number density is 3.92516e13/cm^3. At the reference cross section, the local density required by the calculated partial channel exceeds this by 2.62810e7 at 300 K or 106.292 at 5000 K.

Therefore a homogeneous captured population cannot fulfill this benchmark's DP comparison even with perfect accumulation. This does not constrain a concentrated local population without a spatial calculation. A core concentration cannot simply be assigned to a near-surface apparatus. The apparatus location, chamber transfer and particle temperature also require specification by the physical transport model.

For a uniform population, matching the prior slow/fast ratio would require surviving fractions s<=3.38524e-12 or 8.37009e-7. Yet one raw high-window xenon count at the fixed reference cross section and stated source density requires s=8.89675e-5. These conditional requirements conflict for the uniform benchmark. Varying the cross section changes the absolute-count condition as well as capture and attenuation; this packet does not scan or exclude those variations.

The prior raw spectral excess remains an independent problem. Energy-changing scattering cannot be represented solely by s: a real transport calculation must retain the redistributed spectrum. Neither uniform density nor an unchanged surviving beam is asserted as the actual Earth solution.

## Reproduction and next decision

The companion script verifies the shared-coefficient hash and reproduces all algebraic numbers. No Monte Carlo transport has been run. Next calculate or bound stopping and the spatial distribution for the same proton-only finite-mediator interaction, rather than import large-density contours from another coupling model. Omitted diamond channels and detector response still prevent a full mechanism exclusion or measurable-overlap claim.
