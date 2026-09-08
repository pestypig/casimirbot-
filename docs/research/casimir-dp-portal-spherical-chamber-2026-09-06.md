# Matched scalar portal: nonlinear spherical chamber backgrounds

Program gate: S1 — common-kernel definition and screening.
Workstream: Exploratory matched light-scalar response.
Capability or component: Nonlinear finite-shell cavity field.
Current maturity: Conditional numerical background solutions.
Target maturity: Reproducible geometry-sensitive input to a common scattering propagator.
Required frozen inputs: Authenticated matched matter coupling; no change to canonical sphere or plate inputs.
Required evidence: Interface matching, residual convergence, outer-boundary refinement and vacuum limit.
Stop/fail criteria: No hypothetical chamber attributed to hardware; no background field equated with a scattering rate.
Explicit non-goals: Full apparatus solution, detector fit, thermal history, global UV stability or experimental admission.
Downstream gate unlocked: Background-dependent fluctuation Green function; S1 remains open.

## Result

Chamber geometry can change the local light vertex much more strongly than the isolated small plates. At mu = 0.001 eV and the matched conditional Higgs-limited coupling, a hypothetical spherical cavity of radius 250 micrometres with a 1 millimetre thick, 2900 kg/m3 wall has a central field fraction 0.01408. Increasing the cavity radius to 1 millimetre while retaining that wall gives 0.98715. These backgrounds cannot share a vacuum-valued local vertex by assumption.

The canonical leading-design packet does not authenticate a chamber radius or wall thickness. A targeted search of the Casimir-DP configuration files did not find those keys. These calculations therefore expose chamber radius and thickness as parameters; they do not redefine the experiment. Supports, openings, non-spherical geometry, chamber material composition, exterior matter and the actual ambient scalar boundary condition remain unresolved.

## Equation and matching

The source is the [authenticated density packet](casimir-dp-portal-matched-density-2026-09-06.md): aN = 1.7905526448e-7 GeV^-1, using its nucleon-density approximation. Set mu = 0.001 eV and wall density 2900 kg/m3, giving s/mu^2 = 2.38347128. The cavity and exterior are empty in this model. Retain a positive quartic and the vacuum field at large radius. Source geometry and density screening also enter proposed scalar-force interferometers, although their force measurements are not coherence-loss observations. [Primary context](https://arxiv.org/abs/2511.09750v1).

With x = mu r/(hbar c), u = phi/phi_vac and w = x u,

    w'' = (s/mu^2 - 1) w + w^3/x^2.

The nonlinear term has its regular zero limit at x = 0. Divide the calculation into cavity, wall and exterior intervals. Each is represented on its own [0,1] coordinate, with its exact piecewise source coefficient; no density smoothing or interpolation through the material interface is used. Match w and its derivative with respect to x at both interfaces. Enforce w(0) = 0 and w(xmax) = xmax. The center field fraction is w'(0).

The exterior cutoff is eight dimensionless length units beyond the outer wall. Two cases are rerun with twelve units and a tenfold tighter collocation tolerance. These simultaneous refinements test the sensitivity to truncation and discretization, not uncertain physical boundary conditions.

## Predictions for the hypothetical shells

| Cavity radius (micrometres) | Wall thickness (micrometres) | Center phi/phi_vac | Inner wall phi/phi_vac |
|---:|---:|---:|---:|
| 50 | 100 | 0.750995 | 0.747484 |
| 50 | 1000 | 0.0136133 | 0.0134681 |
| 250 | 100 | 0.773904 | 0.686046 |
| 250 | 1000 | 0.0140790 | 0.0106041 |
| 1000 | 100 | 0.996126 | 0.714503 |
| 1000 | 1000 | 0.987146 | 0.340130 |

The [JSON output](casimir-dp-portal-spherical-chamber-2026-09-06.json) contains full radial profiles for all six cases. The small cavity still has a nonzero field through a finite wall because the exterior boundary selects a nonzero field. An abrupt phase transition from an infinite exterior medium must not be assigned to these finite-wall solutions.

## Analytic scale check

In the different limit of a restored medium extending to infinity around the cavity, linearize about zero field. The regular interior radial solution is w proportional to sin(mu r), and the decaying exterior has logarithmic derivative -k, where k = sqrt(s-mu^2). At the first zero-mode threshold,

    mu cot(mu a) = -k,
    a_critical = [pi - atan(mu/k)] / mu.

Restoring hbar c gives 480.884 micrometres at this benchmark. This explains why the 50 and 250 micrometre cavities can be strongly suppressed by thick walls, while a 1 millimetre cavity supports a large field. It is a threshold in the infinite-wall model, not an exact classification rule for a finite shell or arbitrary cavity geometry. The perfect Dirichlet limit would instead give pi hbar c/mu; finite matter penetration changes it.

Within the displayed scalar equation, a positive background also provides a useful fluctuation check. The static Hessian is H = -Laplacian + s/mu^2 - 1 + 3u^2 and satisfies Hu = 2u^3. For perturbations eta vanishing at the fixed outer boundary, integration by parts yields

    integral eta H eta = integral u^2 |gradient(eta/u)|^2 + 2 u^2 eta^2 >= 0.

Thus a positive exact solution is linearly stable within this scalar effective equation, including angular perturbations. This is not a claim of global vacuum selection, thermal preparation, UV stability or a certified proof. Numerical residuals and positivity were checked for the displayed solutions.

## Implication for the common interaction

The linear light-vertex product at a point is achi aN phi(r)^2. For the illustrative lambda_eff = 1e-24 used in the previous packet, the vacuum alpha product is 1.47090e-13. It is multiplied by u^2, approximately 0.0001982 at the center of the 250 micrometre cavity with a 1 millimetre wall, versus 0.97446 for the 1 millimetre cavity with that wall. These examples retain the same scalar parameters and matter coupling.

The vertex change is not itself a rate prediction. Small fluctuations propagate with the spatial operator H, whose effective mass and eigenmodes also change with u. Replacing that operator everywhere by its vacuum Yukawa mass can fail most seriously in the suppressed cavities. The next calculation must use this background-dependent propagator, then the sphere's response and branch histories, to obtain coherence loss. The heavy-contact xenon prediction remains the independently computed component; two-light-scalar channels and medium matching have not disappeared.

Optical switching without a scalar-source change still produces no static source modulation in this equation. Any boundary-dependent readout claim must identify an actual change in the scalar background or fluctuation response. The field's dependence on a chamber does not establish a gravitational origin for a xenon recoil.

## Verification

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-spherical-chamber-2026-09-06.py`. Four checks pass: zero source recovers the vacuum; ODE/interface residuals meet their tolerances; outer-domain and collocation refinement changes the tested center values by at most 4.88e-10 absolutely; thicker walls suppress the center for each tested radius. The maximum displayed relative collocation residual is below 9.7e-8. No measured chamber has been fitted, and no frozen input has been changed. S1 and the overall goal remain open.
