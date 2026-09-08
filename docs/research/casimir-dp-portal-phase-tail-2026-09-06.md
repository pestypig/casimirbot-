# Matched light portal: far-trajectory coherence contribution

Program gate: S1 — common-kernel definition and screening.
Workstream: Exploratory light-channel scattering integration.
Capability or component: Leading branch-dipole eikonal phase and impact-parameter integral.
Current maturity: Conditional mono-speed far-trajectory contribution.
Target maturity: Reproducible local scattering contribution with explicit near-region bound.
Required frozen inputs: Authenticated fixed-chamber dipole and matched parameters; canonical sphere mass, separation and hold.
Required evidence: Full phase dependence, integration refinement, analytic vacuum normalization and near-region accounting.
Stop/fail criteria: No point-source continuation through the sphere; no partial contribution labeled full apparatus prediction.
Explicit non-goals: Halo fit, near-trajectory solution, experimental admission, external-constraint clearance or full model validation.
Downstream gate unlocked: Finite-source/displacement and transport-controlled full local prediction; S1 remains open.

## Main result

This packet integrates the light-channel branch interaction, rather than reporting a potential at isolated radii. At the same illustrative particle parameters, the far-trajectory coherence exponent is 0.00968839 for a 1 millimetre cavity and 5.50696e-10 for a 250 micrometre cavity, each behind a 1 millimetre wall. These use transverse incidence and impact parameters above 1 micrometre. The larger result corresponds to 1-exp(-D) = approximately 0.964% loss of unconditioned contrast from the modeled far trajectories.

This is not a validated local signal. The effective quartic remains the explicitly illustrative 1e-24, with its previously documented threshold cancellation. The cavity geometry is hypothetical. Mono-speed unattenuated incidence, static propagation, straight paths and first-order branch displacement are assumptions. The finite sphere, full halo, transport, accepted-shot response, thermal and external constraints remain incomplete.

## Shared parameters and exposure

Use mass_chi = 1000 GeV, kappa = 99.3774 GeV at the inherited conditional Higgs ceiling, and the matched aN and achi. At mu = 0.001 eV and lambda_eff = 1e-24, alpha_vac = achi aN phi_vac^2/(4 pi) = 1.47090281748e-13. This is inherited from the previous illustrative light-sector point, not newly fitted to the DP comparator.

Use density_chi = 0.3 GeV/cm3 and mono-speed 776 km/s. The canonical hold is 0.25 s and separation is 250 nm. The sphere's effective nuclear charge is B = mass/u in the previously stated nucleon-density approximation. The heavy coefficient and its [xenon prediction](casimir-dp-portal-contact-spectrum-2026-09-06.md) remain unchanged: at 1 TeV that component predicts about 0.000228 raw events in 200–270 keV under its shifted-halo calculation. The local mono-speed result is not yet a common-halo joint fit, and the full light contribution in xenon remains uncomputed.

## Trajectory phase

Keep the chamber fixed and use the [dipole branch potential](casimir-dp-portal-chamber-dipole-2026-09-06.md). Along a straight line with impact parameter b, let beta be the angle between branch separation and particle velocity and phi the impact azimuth relative to the transverse separation. Spherical symmetry makes the longitudinal, odd-in-path contribution cancel. The leading phase difference has the form

    Delta phase = A(b) sin(beta) cos(phi),
    A(b) = [2 alpha_vac B / v] u(0) (d/b)
           integral_0^theta_max u(r) j(r) cos(theta) dtheta,
    r = b / cos(theta).

Integrals are split at material interfaces. The finite numerical outer boundary supplies theta_max. This calculation uses the same approximate static radial response along the entire line, including wall segments; it does not establish that incident particles traverse those segments without other interactions or deflection.

Azimuthal integration retains the full phase:

    D_far(beta) = flux * hold * 2 pi
                  integral_bcut^bmax b db [1-J0(A(b) sin(beta))].

For transverse incidence beta = pi/2. It is not automatically the maximum orientation once phases are large, because J0 oscillates. A valid orientation-independent envelope within this leading-dipole phase model uses

    1-J0(A sin(beta)) <= min(2, A^2/4).

The small-A series is used only to avoid numerical cancellation when evaluating the Bessel expression. Large phases are not replaced by a quadratic expansion. In the large cavity the maximum sampled A is 5.16 radians at bcut = 1 micrometre, so retaining the full phase matters.

## Close-trajectory accounting

Do not extend the point dipole through the sphere. Exclude incoming impact parameters b < bcut and bound that disk by normalized outgoing-state overlap:

    D_close <= 2 * flux * hold * pi bcut^2.

This allows maximal distinguishability for every close trajectory and is intentionally loose. It is a bound on that incoming channel set under the specified stationary flux, not an estimate of actual contrast loss, ejection or heating. The near and far sets partition the incoming impact plane, so the envelope can be added without overlapping the two sets. It is still conditional on the far-region model; finite-displacement and other physical errors are not included in the numerical upper sum.

| Cavity radius (micrometres) | bcut (micrometres) | D_far transverse | D_close ceiling | Conditional near+far envelope |
|---:|---:|---:|---:|---:|
| 250 | 1 | 5.50696e-10 | 0.000365681 | 0.000365682 |
| 250 | 2 | 4.80974e-10 | 0.00146273 | 0.00146273 |
| 250 | 5 | 3.88765e-10 | 0.00914203 | 0.00914204 |
| 1000 | 1 | 0.00968839 | 0.000365681 | 0.0108842 |
| 1000 | 2 | 0.00898695 | 0.00146273 | 0.0109066 |
| 1000 | 5 | 0.00714553 | 0.00914203 | 0.0163642 |

All walls in this table are 1000 micrometres thick at the 2900 kg/m3 benchmark. The [JSON file](casimir-dp-portal-phase-tail-2026-09-06.json) also retains the far orientation-independent envelope and maximum phase for every case. Changing bcut moves contributions into the deliberately loose near bound; it does not change the physical apparatus or prove convergence of a full result.

The first-order displacement expansion needs error control at finite d. For symmetric branches, higher odd derivatives begin at order d^3, but their coefficient has not been bounded. At bcut = 1 micrometre the half-separation/distance ratio is 0.125. The source radius is 0.2763 micrometres. These ratios motivate a finite-source and finite-displacement calculation; numerical convergence of the present integral does not remove these approximations.

## Checks and interpretation

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-phase-tail-2026-09-06.py`. Three checks pass: phase/impact quadrature refinement, the orientation envelope bounding the transverse result, and near-disk area scaling. Increasing the impact grid from 801 to 1601 points and angular quadrature from 120 to 200 nodes changes the tested far result by 1.72e-9 relatively, with the background held fixed.

An independent one-off analytic normalization check replaced the radial response by vacuum j = (1+k r) exp(-k r). Its line integral reproduces k K1(kb) to 1.34e-15 relative error at the tested point, recovering the derivative of the ordinary Yukawa eikonal phase. This check is distinct from the three assertions in the reproducible main script.

The contrast between the two cavities is a substantive prediction of this conditional interaction model. It neither proves the scalar point survives other experiments nor makes the LZ event evidence for the local mechanism. The frozen DP exponent of 0.0295115 is a theoretical comparator, not a measured target being fitted. Next replace the near region and leading displacement approximation with a controlled finite-sphere calculation, then average a common incident distribution and audit transport/constraints. S1 and the goal remain active.
