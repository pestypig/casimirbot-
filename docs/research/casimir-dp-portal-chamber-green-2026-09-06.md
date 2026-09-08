# Matched chamber: static centered-source scalar Green function

Program gate: S1 — common-kernel definition and screening.
Workstream: Exploratory light-scalar propagation.
Capability or component: Static monopole propagator on nonlinear shell backgrounds.
Current maturity: Conditional centered-source Green function.
Target maturity: Reproducible interaction-potential diagnostic before branch-dependent scattering.
Required frozen inputs: Authenticated six nonlinear spherical-chamber backgrounds and matched couplings.
Required evidence: Source normalization, interface continuity, vacuum analytic limit and numerical refinement.
Stop/fail criteria: No vertex-only rate; no translated monopole substituted for an off-center source in a fixed chamber.
Explicit non-goals: Full scattering cross-section, finite-frequency response, decoherence prediction or hardware attribution.
Downstream gate unlocked: Off-center multipoles and branch-difference potential; S1 remains open.

## Finding

Propagation can partly compensate a suppressed scalar field, but it does not compensate the small vertices in the tested 250 micrometre cavity with a 1 millimetre wall. At 100 micrometres from its central source, the static Green function is 2.21076 times the vacuum Yukawa Green function. Multiplying by both local field-dependent vertices gives a potential only 0.00041970 of its vacuum counterpart. Thus neither the vacuum propagator nor the central field fraction alone predicts the interaction.

At the same source distance inside the 1 millimetre cavity with a 1 millimetre wall, the combined potential ratio is 0.989895. All cases retain the previously matched model parameters and differ only in the hypothetical chamber geometry. No chamber is identified with the physical apparatus.

## Fluctuation equation and normalization

Use the positive static background u(r) = phi(r)/phi_vac from the [nonlinear chamber packet](casimir-dp-portal-spherical-chamber-2026-09-06.md). In x = mu r/(hbar c), the static scalar fluctuation operator is

    H = -Laplacian_x + V(x),
    V(x) = s(x)/mu^2 - 1 + 3u(x)^2.

The centered point-source Green function can be written, in natural radial length units, as

    G(r,0) = h(x)/(4 pi r),
    -h'' + V(x) h = 0 for x > 0,
    h(0) = 1.

The last condition fixes the delta-function normalization through the short-distance 1/(4 pi r) singularity. At the far numerical boundary the fluctuation is fixed to zero, consistent with varying the source while keeping the background boundary value fixed. Match h and its x derivative across cavity/wall and wall/exterior interfaces. The source coefficient remains piecewise exact. Cubic splines interpolate each authenticated background separately within its material interval; they do not smooth the density jump.

In homogeneous vacuum V = 2. On a finite radial domain of size X with the same zero outer fluctuation boundary,

    h_vac(x) = sinh[sqrt(2)(X-x)] / sinh[sqrt(2) X].

The infinite-vacuum Yukawa reference used for reporting ratios is exp(-sqrt(2) x). These two references must be distinguished in verification: the solver is checked against the finite-domain analytic expression, while the displayed comparison asks how the interaction differs from the conventional vacuum potential. The outer-domain systematic of the full chamber propagator has not been independently swept in this packet; the previous background domain sweep is not a substitute for that test.

## Same-parameter interaction potential

For a weak, centered nuclear source with effective nucleon number B, the linearized static interaction with a dark-matter particle at r is

    Vchi(r) = -achi aN phi_vac^2 B u(0) u(r) G(r,0).

Relative to the same-coupling vacuum Yukawa potential,

    Vchi / Vchi_vac = u(0) u(r) h(x) exp(sqrt(2) x).

The sign shown is attractive for the positive matched vertex product. The ratio is not an amplitude already integrated over scattering states. The point-source approximation is used only at distances 1, 10 and 100 micrometres, all outside the frozen sphere of radius 0.2763 micrometres. Finite source structure and backreaction still need accounting in a complete scattering calculation.

| Cavity radius (micrometres) | Wall thickness (micrometres) | Potential/vacuum at 10 micrometres | Potential/vacuum at 100 micrometres |
|---:|---:|---:|---:|
| 50 | 100 | 0.566266 | 0.542884 |
| 50 | 1000 | 0.000191659 | 0.000224785 |
| 250 | 100 | 0.614046 | 0.749556 |
| 250 | 1000 | 0.000217142 | 0.000419701 |
| 1000 | 100 | 0.992722 | 0.996936 |
| 1000 | 1000 | 0.975950 | 0.989895 |

For a 50 micrometre cavity, the 100 micrometre sample is **inside its wall**. Those entries describe the scalar potential there; they are not a free-flight prediction for a detected particle. Passage through matter, shielding and the incident state population remain separate requirements. All values and solver diagnostics are retained in the [JSON results](casimir-dp-portal-chamber-green-2026-09-06.json).

## Why this is not yet a coherence rate

The chamber breaks translation invariance. Translating this centered radial potential to each superposition branch would incorrectly move the chamber background with the sphere. The required object is G(r,r_source) with the chamber held fixed, along with the source-position-dependent background vertex. Displacing the source excites angular multipoles; a monopole centered at the origin is only one part of that calculation.

The source displacement is small compared with the illustrative cavity radii, so a controlled displacement expansion is a useful next step. Its leading dipole Green function must include the l(l+1)/r^2 centrifugal term and the correct derivative of the point-source normalization. A resulting branch-difference potential can then enter a scattering/eikonal calculation with incident directions and speeds. Static propagation also needs a justified energy-transfer approximation before replacing the full frequency-dependent propagator.

A static background and a real static potential do not independently create irreversible coherence loss. The unobserved outgoing particle states and the accepted-shot definition determine that observable. The earlier heavy-contact xenon spectrum remains a separate calculated component, not evidence that the present light channel fits the LZ event.

## Verification and remaining scope

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-chamber-green-2026-09-06.py`. Four checks pass: finite-domain vacuum Green function; relative collocation residual below 1.1e-8; positive sampled Green functions; and tighter collocation tolerance on a suppressed cavity. Maximum vacuum relative error is 2.62e-9. Refinement changes sampled h by at most 1.54e-13 while holding the authenticated background interpolation fixed. These checks do not measure interpolation, far-boundary, geometry or physical-model uncertainty.

No frozen baseline or matched coupling was changed. The result supplies a static propagation component, not a full shared prediction model. S1 and the user goal remain active.
