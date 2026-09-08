# Fixed-chamber source displacement: scalar dipole response

Program gate: S1 — common scattering kernel definition.
Workstream: Exploratory matched scalar branch response.
Capability or component: First source-displacement derivative of the static propagator.
Current maturity: Conditional dipole Green function.
Target maturity: Correct branch-difference potential for subsequent scattering integration.
Required frozen inputs: Authenticated chamber backgrounds and monopole implementation; canonical separation unchanged.
Required evidence: Singular-source normalization, regular origin, material matching and analytic vacuum limit.
Stop/fail criteria: No translation of the chamber with the sphere; no finite-separation accuracy inferred from small cavity displacement alone.
Explicit non-goals: Finite-size scattering, full dynamic propagator, coherence rate or measured apparatus attribution.
Downstream gate unlocked: Branch-dependent scattering phase with finite-size and displacement-error controls; S1 remains open.

## Finding

The centered monopole cannot simply be shifted to represent two branches in a fixed chamber. In the hypothetical 250 micrometre cavity with a 1 millimetre wall, that shortcut overestimates the correct leading branch-potential coefficient by 13.82% at a source distance of 100 micrometres. At 10 micrometres the overestimate is 0.0929%. The error depends on geometry and sampling radius and is not a universal rate correction.

The corrected coefficient at 100 micrometres is 0.000245120 of its same-coupling vacuum value in that cavity. It is 0.979806 in the 1 millimetre cavity with a 1 millimetre wall. Those are static potential-derivative ratios, not observed contrast or scattering-rate ratios.

## Fixed source and chamber coordinates

Let G(r,a) be the Green function of the chamber's fixed spatial operator, with source position a. At a = 0, write the derivative along the z direction as

    partial G(r,a)/partial a_z at a=0 = cos(theta) j(x)/(4 pi r^2),
    x = mu r/(hbar c).

The derivative is a dipole (l = 1) because only the source is displaced. The corresponding homogeneous radial equation outside the point source is

    j'' - 2 j'/x - V(x) j = 0,
    V = s/mu^2 - 1 + 3u^2,
    j(0) = 1, j'(0) = 0.

The 1/(4 pi r^2) singularity fixes the unit source-derivative normalization. The condition at the far numerical boundary is j = 0, and j and its x derivative match at material interfaces. The solver represents the origin's singular coefficient explicitly; it does not replace the cavity center by an arbitrary inner cutoff.

In infinite homogeneous vacuum,

    j_vac(x) = (1 + sqrt(2) x) exp(-sqrt(2) x).

For verification on a finite outer radius X, combine the two solutions `(1+kx)exp(-kx)` and `(1-kx)exp(kx)`, k = sqrt(2), so that j(X)=0 and j(0)=1. This analytic finite-domain function is the numerical normalization check; the infinite-domain expression is the reporting reference.

## Leading branch potential

For symmetric source branches a = +/- d/2 about the cavity center, and a weak point nuclear source of charge B, reflection symmetry makes the derivative of the background source vertex u(a) vanish at the center. To first order in d,

    Delta V(r) = -achi aN phi_vac^2 B u(0) u(r)
                 * d cos(theta) j(x)/(4 pi r^2) + O(d^3).

Here d is a physical length in the same natural-length convention as r. The canonical branch separation remains 250 nm; the apparatus is not retuned. This derivative calculation does not itself establish the error of truncating the series at that finite separation. The error is controlled by displacement relative to the distance to the source and response variation scales, not just displacement divided by the cavity radius. Close trajectories also require the sphere's finite radius, 276.3 nm.

The derivative coefficient divided by its vacuum counterpart is `u(0)u(r)j/j_vac`. This supplies an input to the scattering calculation. It does not justify squaring a sampled ratio and calling it a decoherence-rate suppression.

## Quantifying the translated-monopole shortcut

The actual centered potential is proportional to u(0)u(r)h(x)/r, with h from the previous [monopole packet](casimir-dp-portal-chamber-green-2026-09-06.md). Translating that entire profile differentiates the observer-side field and the radial monopole as though the chamber moved too. Relative to the fixed-chamber dipole, its coefficient is

    [u(h-x h') - x u' h] / (u j).

| Cavity radius (micrometres) | Wall thickness (micrometres) | Correct coefficient/vacuum at 100 micrometres | Shifted-profile/correct coefficient |
|---:|---:|---:|---:|
| 50 | 100 | 0.559307 | 0.937318 |
| 50 | 1000 | 0.000200952 | 0.980315 |
| 250 | 1000 | 0.000245120 | 1.138240 |
| 1000 | 100 | 0.993906 | 1.000157 |
| 1000 | 1000 | 0.979806 | 1.000510 |

The [JSON results](casimir-dp-portal-chamber-dipole-2026-09-06.json) contain all six geometries and samples at 1, 10 and 100 micrometres. The 100 micrometre sample lies inside the wall for a 50 micrometre cavity; those rows do not assume unattenuated free flight through matter. The table is a propagation comparison, not a transport model.

## Verification and next calculation

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-chamber-dipole-2026-09-06.py`. Four checks pass: analytic finite-domain vacuum solution, regular source derivative at the origin, collocation residual below 1.1e-8 and tighter-tolerance agreement. Maximum vacuum relative error is 1.86e-10; refinement changes sampled j by at most 4.44e-13 on the tested suppressed cavity. Parent code and background data are hash authenticated, and parent output-producing loops are not rerun.

These checks hold the background interpolation and far boundary fixed. Their uncertainties, and errors from finite source radius and finite branch displacement, remain distinct from collocation error. The result is the leading static dipole response, not a proof of a complete full-frequency or off-center propagator.

Next integrate a branch-difference interaction along particle trajectories, controlling the near-source region rather than extending a point dipole through the sphere. Incident directions, speeds, shielding and accepted-shot definitions must remain explicit. The same matched parameters must continue to determine xenon and local responses. S1 and the overall goal remain open.
